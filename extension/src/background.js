const API_BASE_URL = "http://localhost:3000";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SETTINGS = {
  providerType: "local",
  localModel: "",
  cloudVendor: "openai",
  cloudModel: "gpt-4o-mini",
  storageTarget: "local",
  panelOpacity: 0.9
};

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

function isSupportedUrl(url) {
  if (!url) return false;
  return (
    url.startsWith("https://www.geeksforgeeks.org/") ||
    url.startsWith("https://leetcode.com/") ||
    url.startsWith("https://www.w3schools.com/")
  );
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["src/content.js"]
  });
}

async function getOrCreateSession() {
  const stored = await chrome.storage.local.get(["sessionId", "sessionCreatedAt"]);
  const now = Date.now();
  const createdAt = stored.sessionCreatedAt || 0;
  if (stored.sessionId && now - createdAt < SESSION_TTL_MS) {
    return stored.sessionId;
  }
  const sessionId = crypto.randomUUID();
  await chrome.storage.local.set({ sessionId, sessionCreatedAt: now });
  return sessionId;
}

async function getOrCreateUserId() {
  const stored = await chrome.storage.local.get(["userId"]);
  if (stored.userId) return stored.userId;
  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ userId });
  return userId;
}

async function getSettings() {
  const stored = await chrome.storage.local.get(["aiSettings"]);
  return { ...DEFAULT_SETTINGS, ...(stored.aiSettings || {}) };
}

async function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  await chrome.storage.local.set({ aiSettings: merged });
  return merged;
}

async function requestPageContent() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return { ok: false, error: "No active tab" };
  if (!isSupportedUrl(tab.url)) {
    return { ok: false, error: "Unsupported page. Open a GFG, LeetCode, or W3Schools article." };
  }
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "extractPageContent" });
    if (!response || !response.ok) {
      return { ok: false, error: response && response.error ? response.error : "No content response" };
    }
    return response;
  } catch (error) {
    try {
      await ensureContentScript(tab.id);
      const retry = await chrome.tabs.sendMessage(tab.id, { type: "extractPageContent" });
      if (!retry || !retry.ok) {
        return { ok: false, error: retry && retry.error ? retry.error : "No content response" };
      }
      return retry;
    } catch (injectError) {
      return { ok: false, error: "Content script not ready" };
    }
  }
}

async function askBackend(payload) {
  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Backend error");
  }
  return res.json();
}

async function fetchModels() {
  const res = await fetch(`${API_BASE_URL}/api/models`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Model list failed");
  }
  return res.json();
}

async function saveApiKeyToBackend(userId, provider, apiKey) {
  const res = await fetch(`${API_BASE_URL}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, provider, apiKey })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Key storage failed");
  }
  return res.json();
}

function summarizeAnswer(answer) {
  const text = (answer || "").replace(/\s+/g, " ").trim();
  if (text.length <= 240) return text;
  return `${text.slice(0, 237)}...`;
}

function buildRecord({ page, question, answer }) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    site: page.site || "",
    title: page.title || "",
    url: page.url || "",
    summary: summarizeAnswer(answer),
    question: question || "",
    answer: answer || ""
  };
}

async function saveRecordLocal(record) {
  const stored = await chrome.storage.local.get(["savedRecords"]);
  const list = Array.isArray(stored.savedRecords) ? stored.savedRecords : [];
  list.unshift(record);
  await chrome.storage.local.set({ savedRecords: list.slice(0, 200) });
}

async function getSavedRecords() {
  const stored = await chrome.storage.local.get(["savedRecords"]);
  return Array.isArray(stored.savedRecords) ? stored.savedRecords : [];
}

function getAuthToken(interactive) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(new Error(chrome.runtime.lastError ? chrome.runtime.lastError.message : "No auth token"));
        return;
      }
      resolve(token);
    });
  });
}

function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

async function saveRecordDrive(record) {
  const token = await getAuthToken(true);
  const boundary = `cla-${Date.now()}`;
  const metadata = {
    name: `learning-assistant-${record.timestamp}.json`,
    mimeType: "application/json"
  };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(record) +
    `\r\n--${boundary}--`;

  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });

  if (res.status === 401) {
    await removeCachedToken(token);
    throw new Error("Drive auth expired");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Drive upload failed");
  }
}

async function maybeSaveRecord(storageTarget, record) {
  if (storageTarget === "local") {
    await saveRecordLocal(record);
  }
  if (storageTarget === "drive") {
    await saveRecordDrive(record);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === "getPageContent") {
    requestPageContent().then(sendResponse);
    return true;
  }

  if (message.type === "getSettings") {
    (async () => {
      const settings = await getSettings();
      sendResponse({ ok: true, data: settings });
    })();
    return true;
  }

  if (message.type === "saveSettings") {
    (async () => {
      const settings = await saveSettings(message.settings);
      sendResponse({ ok: true, data: settings });
    })();
    return true;
  }

  if (message.type === "getModels") {
    (async () => {
      try {
        const data = await fetchModels();
        sendResponse({ ok: true, data });
      } catch (error) {
        sendResponse({ ok: false, error: error && error.message ? error.message : "Model fetch failed" });
      }
    })();
    return true;
  }

  if (message.type === "getSavedRecords") {
    (async () => {
      const records = await getSavedRecords();
      sendResponse({ ok: true, data: records });
    })();
    return true;
  }

  if (message.type === "openHistory") {
    (async () => {
      const url = chrome.runtime.getURL("history.html");
      await chrome.tabs.create({ url });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === "saveApiKey") {
    (async () => {
      try {
        const userId = await getOrCreateUserId();
        await saveApiKeyToBackend(userId, message.provider, message.apiKey);
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error && error.message ? error.message : "Key storage failed" });
      }
    })();
    return true;
  }

  if (message.type === "askQuestion") {
    (async () => {
      const sessionId = await getOrCreateSession();
      const userId = await getOrCreateUserId();
      const settings = await getSettings();
      const pageResponse = await requestPageContent();
      if (!pageResponse.ok) {
        sendResponse({ ok: false, error: pageResponse.error || "Unable to read page" });
        return;
      }

      const provider = settings.providerType === "cloud" ? settings.cloudVendor : "local";
      const model = settings.providerType === "cloud" ? settings.cloudModel : settings.localModel;

      const payload = {
        sessionId,
        userId,
        provider,
        model,
        question: message.question || "",
        mode: message.mode || "explain",
        page: pageResponse.data
      };
      try {
        const result = await askBackend(payload);
        sendResponse({ ok: true, data: result });

        if (settings.storageTarget && settings.storageTarget !== "off") {
          const record = buildRecord({ page: pageResponse.data, question: message.question, answer: result.answer });
          await maybeSaveRecord(settings.storageTarget, record);
        }
      } catch (error) {
        sendResponse({ ok: false, error: error && error.message ? error.message : "Request failed" });
      }
    })();
    return true;
  }
});
