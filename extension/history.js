const SITE_TABS = [
  { key: "gfg", label: "GeeksforGeeks" },
  { key: "w3schools", label: "W3Schools" },
  { key: "leetcode", label: "LeetCode" }
];

const shell = document.getElementById("history-shell");
const timelineTrack = document.getElementById("timeline-track");
const doubtList = document.getElementById("doubt-list");
const documentList = document.getElementById("document-list");
const siteButtons = Array.from(document.querySelectorAll(".site-tab"));
const leftToggle = document.getElementById("toggle-left");
const rightToggle = document.getElementById("toggle-right");
const rightToggleAlt = document.getElementById("toggle-right-alt");

let activeSite = SITE_TABS[0].key;
let activeDocKey = "";
let activeDoubtId = "";
let historyData = {};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
}

function formatClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDocKey(record) {
  return record.url || record.title || "Untitled";
}

function getDocLabel(record) {
  if (record.title && record.title.trim()) return record.title.trim();
  return "Untitled Document";
}

function buildHistory(records) {
  const grouped = {};
  SITE_TABS.forEach((site) => {
    grouped[site.key] = { documents: new Map(), records: [] };
  });

  records.forEach((record) => {
    const site = record.site;
    if (!grouped[site]) return;
    const docKey = getDocKey(record);
    const doc = grouped[site].documents.get(docKey) || {
      key: docKey,
      label: getDocLabel(record),
      url: record.url || "",
      records: []
    };
    doc.records.push(record);
    grouped[site].documents.set(docKey, doc);
    grouped[site].records.push(record);
  });

  SITE_TABS.forEach((site) => {
    grouped[site.key].records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    grouped[site.key].documents.forEach((doc) => {
      doc.records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
  });

  return grouped;
}

function setActiveSite(siteKey) {
  activeSite = siteKey;
  activeDoubtId = "";
  siteButtons.forEach((btn) => {
    const isActive = btn.dataset.site === siteKey;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });

  const docs = getDocsForSite();
  activeDocKey = docs.length ? docs[0].key : "";
  renderDocuments();
  renderTimeline();
  renderDoubts();
}

function getDocsForSite() {
  const siteData = historyData[activeSite];
  if (!siteData) return [];
  return Array.from(siteData.documents.values()).sort((a, b) => {
    const aTime = a.records[0] ? new Date(a.records[0].timestamp).getTime() : 0;
    const bTime = b.records[0] ? new Date(b.records[0].timestamp).getTime() : 0;
    return aTime - bTime;
  });
}

function renderDocuments() {
  documentList.innerHTML = "";
  const docs = getDocsForSite();
  if (docs.length === 0) {
    documentList.innerHTML = "<div class=\"empty-state\">No documents recorded yet.</div>";
    activeDocKey = "";
    return;
  }

  docs.forEach((doc) => {
    const tab = document.createElement("button");
    tab.className = "document-tab" + (doc.key === activeDocKey ? " active" : "");
    tab.type = "button";
    tab.innerHTML = `
      <div class="document-title">${escapeHtml(doc.label)}</div>
      <div class="document-meta">${doc.records.length} doubts</div>
    `;
    tab.addEventListener("click", () => {
      activeDocKey = doc.key;
      activeDoubtId = "";
      renderDocuments();
      renderTimeline();
      renderDoubts();
    });
    documentList.appendChild(tab);
  });
}

function renderTimeline() {
  timelineTrack.innerHTML = "";
  const records = getRecordsForActiveDoc();
  if (!records.length) {
    timelineTrack.innerHTML = "<div class=\"empty-state\">No doubts for this document.</div>";
    return;
  }

  records.forEach((record) => {
    const node = document.createElement("button");
    node.className = "timeline-node" + (record.id === activeDoubtId ? " active" : "");
    node.type = "button";
    const doubtTitle = record.question || record.summary || "Untitled doubt";
    node.title = doubtTitle;
    node.innerHTML = `
      <div class="timeline-title">${escapeHtml(doubtTitle)}</div>
      <div class="timeline-date">${escapeHtml(formatDate(record.timestamp))}</div>
      <div class="timeline-time">${escapeHtml(formatClock(record.timestamp))}</div>
    `;
    node.addEventListener("click", () => {
      focusDoubt(record.id);
    });
    timelineTrack.appendChild(node);
  });
}

function getRecordsForActiveDoc() {
  const siteData = historyData[activeSite];
  if (!siteData || !activeDocKey) return [];
  const doc = siteData.documents.get(activeDocKey);
  return doc ? doc.records : [];
}

function renderDoubts() {
  doubtList.innerHTML = "";
  const records = getRecordsForActiveDoc();
  if (!records.length) {
    doubtList.innerHTML = "<div class=\"empty-state\">No doubts saved yet.</div>";
    return;
  }

  records.forEach((record) => {
    const card = document.createElement("details");
    card.className = "doubt-card" + (record.id === activeDoubtId ? " active" : "");
    card.id = `doubt-${record.id}`;

    const summaryText = record.summary || record.question || "Untitled doubt";
    const docLabel = record.title && record.title.trim() ? record.title.trim() : "Untitled Document";

    card.innerHTML = `
      <summary>
        <div class="doubt-title">${renderInlineMarkdown(summaryText)}</div>
        <div class="doubt-meta">
          <span>${escapeHtml(formatDate(record.timestamp))}</span>
          <span>${escapeHtml(formatClock(record.timestamp))}</span>
          <span>${escapeHtml(docLabel)}</span>
        </div>
      </summary>
      <div class="doubt-answer">${renderMarkdown(record.answer || "No answer saved.")}</div>
    `;

    doubtList.appendChild(card);
  });

  if (activeDoubtId) {
    const target = document.getElementById(`doubt-${activeDoubtId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

function focusDoubt(recordId) {
  activeDoubtId = recordId;
  renderTimeline();
  renderDoubts();
}

function renderMarkdown(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCode = false;
  let codeBuffer = [];
  let listType = "";
  let listItems = [];

  const flushList = () => {
    if (!listItems.length) return;
    const itemsHtml = listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("");
    html += `<${listType}>${itemsHtml}</${listType}>`;
    listItems = [];
    listType = "";
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        const codeContent = escapeHtml(codeBuffer.join("\n"));
        html += `<pre><code>${codeContent}</code></pre>`;
        codeBuffer = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeBuffer.push(line);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      html += `<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`;
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(orderedMatch[1]);
      return;
    }

    const unorderedMatch = line.match(/^[-*+]\s+(.*)$/);
    if (unorderedMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(unorderedMatch[1]);
      return;
    }

    flushList();
    html += `<p>${renderInlineMarkdown(line)}</p>`;
  });

  if (inCode) {
    const codeContent = escapeHtml(codeBuffer.join("\n"));
    html += `<pre><code>${codeContent}</code></pre>`;
  }

  flushList();
  return html || "<p></p>";
}

function renderInlineMarkdown(text) {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toggleSidebar(side) {
  if (side === "left") {
    shell.classList.toggle("collapsed-left");
  } else {
    shell.classList.toggle("collapsed-right");
  }
}

async function init() {
  siteButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveSite(btn.dataset.site));
  });
  leftToggle.addEventListener("click", () => toggleSidebar("left"));
  rightToggle.addEventListener("click", () => toggleSidebar("right"));
  rightToggleAlt.addEventListener("click", () => toggleSidebar("right"));

  try {
    const response = await chrome.runtime.sendMessage({ type: "getSavedRecords" });
    const records = response && response.ok ? response.data || [] : [];
    historyData = buildHistory(records);
  } catch (error) {
    historyData = buildHistory([]);
  }

  const firstWithData = SITE_TABS.find((site) => historyData[site.key]?.records?.length > 0);
  setActiveSite(firstWithData ? firstWithData.key : SITE_TABS[0].key);
}

init();
