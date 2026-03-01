import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const MAX_TEXT_CHARS = 4000;
const MAX_CODE_CHARS = 3000;
const MAX_QUESTION_CHARS = 2000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const sessions = new Map();
const apiKeys = new Map();

app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  })
);

function clampText(value, max) {
  if (!value) return "";
  if (value.length <= max) return value;
  return value.slice(0, max);
}

function cleanSessionStore() {
  const now = Date.now();
  for (const [key, value] of sessions.entries()) {
    if (now - value.updatedAt > SESSION_TTL_MS) {
      sessions.delete(key);
    }
  }
}

function splitIntoChunks(text, maxChunk) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxChunk));
    start += maxChunk;
  }
  return chunks;
}

async function callOllama(prompt, modelOverride) {
  const model = modelOverride || MODEL;
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Ollama request failed");
  }
  const data = await res.json();
  return data.response || "";
}

async function callOpenAI({ apiKey, prompt, model }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "OpenAI request failed");
  }
  const data = await res.json();
  return data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : "";
}

async function callGemini({ apiKey, prompt, model }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gemini request failed");
  }
  const data = await res.json();
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content
    ? data.candidates[0].content.parts
    : [];
  return Array.isArray(parts) ? parts.map((p) => p.text || "").join("") : "";
}

function setApiKey(userId, provider, apiKey) {
  const entry = apiKeys.get(userId) || {};
  entry[provider] = { key: apiKey, updatedAt: Date.now() };
  apiKeys.set(userId, entry);
}

function getApiKey(userId, provider) {
  const entry = apiKeys.get(userId);
  if (!entry || !entry[provider]) return null;
  return entry[provider].key;
}

async function summarizeLongText(text) {
  return clampText(text, MAX_TEXT_CHARS);
}

function buildPrompt({ page, question, mode, memory }) {
  const modeHint =
    mode === "deep"
      ? "Provide a deep conceptual explanation with assumptions, tradeoffs, and edge cases."
      : mode === "code"
      ? "Focus on code understanding, explain logic step-by-step, and annotate key lines."
      : "Explain like a scientist-teacher with structured clarity.";

  return `You are a scientist-teacher and problem solver.\n\n${modeHint}\n\nRules:\n- Explain in three tiers: beginner, intermediate, advanced.\n- Provide at least one concrete example.\n- Provide a short text-based diagram if relevant.\n- Suggest 2-3 related concepts.\n- Keep the response factual and grounded in the provided page context.\n\nPage title: ${page.title}\nPage url: ${page.url}\n\nPage text:\n${page.text}\n\nCode snippets:\n${page.codeBlocks}\n\nConversation memory:\n${memory}\n\nUser question: ${question}`;
}

app.post("/api/ask", async (req, res) => {
  try {
    cleanSessionStore();
    const { sessionId, question, mode, page, provider, model, userId } = req.body || {};
    if (!sessionId || !question || !page) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const sanitizedQuestion = clampText(String(question), MAX_QUESTION_CHARS);
    const text = clampText(String(page.text || ""), MAX_TEXT_CHARS * 2);
    const summarizedText = await summarizeLongText(text);

    const codeBlocks = Array.isArray(page.codeBlocks) ? page.codeBlocks : [];
    const combinedCode = clampText(
      codeBlocks.map((block) => block.content).join("\n\n"),
      MAX_CODE_CHARS
    );

    const memoryEntry = sessions.get(sessionId) || { messages: [], updatedAt: Date.now() };
    const recentMemory = memoryEntry.messages.slice(-6).join("\n");

    const prompt = buildPrompt({
      page: {
        title: String(page.title || ""),
        url: String(page.url || ""),
        text: summarizedText,
        codeBlocks: combinedCode
      },
      question: sanitizedQuestion,
      mode: String(mode || "explain"),
      memory: recentMemory
    });

    const selectedProvider = String(provider || "local");
    const selectedModel = String(model || "");
    let answer = "";

    if (selectedProvider === "local") {
      answer = await callOllama(prompt, selectedModel || MODEL);
    } else if (selectedProvider === "openai" || selectedProvider === "gemini") {
      if (!userId) {
        res.status(400).json({ error: "Missing userId for cloud provider" });
        return;
      }
      const apiKey = getApiKey(String(userId), selectedProvider);
      if (!apiKey) {
        res.status(400).json({ error: "API key not found for provider" });
        return;
      }
      if (selectedProvider === "openai") {
        answer = await callOpenAI({
          apiKey,
          prompt,
          model: selectedModel || "gpt-4o-mini"
        });
      }
      if (selectedProvider === "gemini") {
        answer = await callGemini({
          apiKey,
          prompt,
          model: selectedModel || "gemini-1.5-flash"
        });
      }
    } else {
      res.status(400).json({ error: "Unsupported provider" });
      return;
    }
    memoryEntry.messages.push(`User: ${sanitizedQuestion}`);
    memoryEntry.messages.push(`Assistant: ${answer}`);
    memoryEntry.updatedAt = Date.now();
    sessions.set(sessionId, memoryEntry);

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error && error.message ? error.message : "Server error" });
  }
});

app.get("/api/models", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) {
      const text = await response.text();
      res.status(500).json({ error: text || "Ollama tags failed" });
      return;
    }
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((m) => m.name) : [];
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: error && error.message ? error.message : "Model list failed" });
  }
});

app.post("/api/keys", (req, res) => {
  const { userId, provider, apiKey } = req.body || {};
  if (!userId || !provider || !apiKey) {
    res.status(400).json({ error: "Missing key fields" });
    return;
  }
  const normalized = String(provider);
  if (normalized !== "openai" && normalized !== "gemini") {
    res.status(400).json({ error: "Unsupported provider" });
    return;
  }
  setApiKey(String(userId), normalized, String(apiKey));
  res.json({ ok: true });
});

app.delete("/api/keys", (req, res) => {
  const { userId, provider } = req.body || {};
  if (!userId || !provider) {
    res.status(400).json({ error: "Missing key fields" });
    return;
  }
  const entry = apiKeys.get(String(userId)) || {};
  delete entry[String(provider)];
  apiKeys.set(String(userId), entry);
  res.json({ ok: true });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
