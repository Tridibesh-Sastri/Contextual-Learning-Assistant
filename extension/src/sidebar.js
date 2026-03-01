const chat = document.getElementById("chat");
const questionInput = document.getElementById("question");
const sendButton = document.getElementById("send");
const statusEl = document.getElementById("status");
const modeButtons = document.querySelectorAll(".mode");

let activeMode = "explain";

const CALLOUT_MAP = {
  note: { label: "Note", icon: "info" },
  tip: { label: "Tip", icon: "spark" },
  warning: { label: "Warning", icon: "alert" },
  definition: { label: "Definition", icon: "book" },
  example: { label: "Example", icon: "flask" },
  formula: { label: "Formula", icon: "sigma" }
};

const HEADING_ICON_MAP = [
  { match: /definition/i, icon: "book" },
  { match: /example/i, icon: "flask" },
  { match: /warning|caution|pitfall/i, icon: "alert" },
  { match: /formula|equation|math/i, icon: "sigma" },
  { match: /summary|recap|takeaways/i, icon: "summary" },
  { match: /steps|process|procedure/i, icon: "steps" }
];

function setStatus(text) {
  statusEl.textContent = text;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(text, index) {
  const slug = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `section-${index}`;
}

function hasMarkdownSignals(text) {
  return /(^|\n)\s*(#{1,3}\s+|```|>\s+|\*\s+|\+\s+|-\s+|\d+\.\s+|\|.+\|)/.test(text);
}

function normalizeInput(text) {
  return String(text || "").replace(/\r\n?/g, "\n").trim();
}

function autoStructurePlainText(text) {
  if (hasMarkdownSignals(text)) return text;
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  if (sentences.length <= 1) return text;
  const chunks = [];
  let buffer = [];
  sentences.forEach((sentence, index) => {
    buffer.push(sentence.trim());
    if ((index + 1) % 2 === 0) {
      chunks.push(buffer.join(" "));
      buffer = [];
    }
  });
  if (buffer.length) chunks.push(buffer.join(" "));
  return chunks.join("\n\n");
}

function splitLongParagraph(text) {
  if (text.length < 420) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const parts = [];
  let current = "";
  sentences.forEach((sentence) => {
    if ((current + sentence).length > 360 && current) {
      parts.push(current.trim());
      current = "";
    }
    current += `${sentence} `;
  });
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function isTableSeparator(line) {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  const cells = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

function parsePipeRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isKeyValueLine(line) {
  return /^\s*[^:]{2,}:\s*\S+/.test(line);
}

function tokenizeBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.replace(/```/, "").trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      continue;
    }

    if (line.trim().startsWith("$$")) {
      const mathLines = [];
      let current = line.trim().replace(/^\$\$/, "");
      if (current) mathLines.push(current);
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        const end = lines[i].trim().replace(/\$\$$/, "");
        if (end) mathLines.push(end);
      }
      i += 1;
      blocks.push({ type: "math", content: mathLines.join("\n") });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() });
      i += 1;
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join("\n") });
      continue;
    }

    const listMatch = line.match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[2]);
      const items = [];
      while (i < lines.length) {
        const match = lines[i].match(/^(\s*)([-+*]|\d+\.)\s+(.*)$/);
        if (!match) break;
        items.push(match[3].trim());
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = parsePipeRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parsePipeRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (isKeyValueLine(line)) {
      const rows = [];
      while (i < lines.length && isKeyValueLine(lines[i])) {
        const parts = lines[i].split(":");
        rows.push([parts.shift().trim(), parts.join(":").trim()]);
        i += 1;
      }
      blocks.push({ type: "table", header: ["Key", "Value"], rows });
      continue;
    }

    const paraLines = [];
    while (i < lines.length && lines[i].trim()) {
      if (/^(#{1,3})\s+/.test(lines[i])) break;
      if (lines[i].startsWith("```")) break;
      if (lines[i].trim().startsWith(">")) break;
      if (/^(\s*)([-+*]|\d+\.)\s+/.test(lines[i])) break;
      if (lines[i].includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) break;
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "paragraph", content: paraLines.join(" ") });
  }
  return blocks;
}

function renderMath(target, tex, displayMode) {
  const span = document.createElement(displayMode ? "div" : "span");
  span.className = displayMode ? "md-math-block" : "md-math-inline";
  span.setAttribute("data-tex", tex);
  if (window.katex && typeof window.katex.render === "function") {
    try {
      window.katex.render(tex, span, { displayMode: !!displayMode, throwOnError: false });
      target.appendChild(span);
      return;
    } catch (error) {
      // Fall back to plain text.
    }
  }
  span.textContent = displayMode ? tex : `$${tex}$`;
  target.appendChild(span);
}

function renderInline(target, text) {
  const segments = [];
  let buffer = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        if (buffer) segments.push({ type: "text", value: buffer });
        segments.push({ type: "code", value: text.slice(i + 1, end) });
        buffer = "";
        i = end + 1;
        continue;
      }
    }
    if (text[i] === "$" && text[i + 1] !== "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1) {
        if (buffer) segments.push({ type: "text", value: buffer });
        segments.push({ type: "math", value: text.slice(i + 1, end) });
        buffer = "";
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }
  if (buffer) segments.push({ type: "text", value: buffer });

  segments.forEach((segment) => {
    if (segment.type === "code") {
      const code = document.createElement("code");
      code.textContent = segment.value;
      target.appendChild(code);
      return;
    }
    if (segment.type === "math") {
      renderMath(target, segment.value, false);
      return;
    }
    const safe = escapeHtml(segment.value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
    const span = document.createElement("span");
    span.innerHTML = safe;
    target.appendChild(span);
  });
}

function pickHeadingIcon(text) {
  const match = HEADING_ICON_MAP.find((entry) => entry.match.test(text));
  return match ? match.icon : "";
}

function buildSummaryBox(text) {
  const summary = document.createElement("div");
  summary.className = "md-summary";
  const title = document.createElement("div");
  title.className = "md-summary-title";
  title.textContent = "Summary";
  const body = document.createElement("div");
  body.className = "md-summary-body";
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const summaryText = sentences.slice(0, 2).join(" ").trim();
  renderInline(body, summaryText);
  summary.appendChild(title);
  summary.appendChild(body);
  return summary;
}

function buildToc(headings) {
  const toc = document.createElement("nav");
  toc.className = "md-toc";
  const title = document.createElement("div");
  title.className = "md-toc-title";
  title.textContent = "On this answer";
  const list = document.createElement("ul");
  headings.forEach((heading) => {
    const item = document.createElement("li");
    item.className = `md-toc-item level-${heading.level}`;
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.text;
    item.appendChild(link);
    list.appendChild(item);
  });
  toc.appendChild(title);
  toc.appendChild(list);
  return toc;
}

function renderBlocks(root, blocks) {
  const headings = [];
  let currentContainer = root;
  let headingIndex = 0;

  blocks.forEach((block) => {
    if (block.type === "heading") {
      headingIndex += 1;
      const id = slugify(block.text, headingIndex);
      const icon = pickHeadingIcon(block.text);
      const label = icon ? ` ${block.text}` : block.text;
      headings.push({ id, level: block.level, text: block.text });

      if (block.level >= 2) {
        const section = document.createElement("details");
        section.className = `md-section level-${block.level}`;
        section.open = true;
        const summary = document.createElement("summary");
        summary.className = "md-section-summary";
        const span = document.createElement("span");
        span.className = `md-heading md-heading-${block.level}`;
        span.id = id;
        span.textContent = label;
        if (icon) {
          span.setAttribute("data-icon", icon);
        }
        summary.appendChild(span);
        section.appendChild(summary);
        root.appendChild(section);
        currentContainer = section;
      } else {
        const heading = document.createElement("h2");
        heading.className = `md-heading md-heading-${block.level}`;
        heading.id = id;
        heading.textContent = label;
        if (icon) {
          heading.setAttribute("data-icon", icon);
        }
        root.appendChild(heading);
        currentContainer = root;
      }
      return;
    }

    if (block.type === "paragraph") {
      const parts = splitLongParagraph(block.content);
      parts.forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        const calloutMatch = trimmed.match(/^(Note|Tip|Warning|Definition|Example|Formula):\s*(.*)$/i);
        if (calloutMatch) {
          const type = calloutMatch[1].toLowerCase();
          const meta = CALLOUT_MAP[type] || CALLOUT_MAP.note;
          const callout = document.createElement("div");
          callout.className = `md-callout ${type}`;
          callout.setAttribute("data-icon", meta.icon);
          const title = document.createElement("div");
          title.className = "md-callout-title";
          title.textContent = meta.label;
          const body = document.createElement("div");
          body.className = "md-callout-body";
          renderInline(body, calloutMatch[2]);
          callout.appendChild(title);
          callout.appendChild(body);
          currentContainer.appendChild(callout);
        } else {
          const p = document.createElement("p");
          renderInline(p, trimmed);
          currentContainer.appendChild(p);
        }
      });
      return;
    }

    if (block.type === "blockquote") {
      const quote = document.createElement("blockquote");
      renderInline(quote, block.content);
      currentContainer.appendChild(quote);
      return;
    }

    if (block.type === "list") {
      const list = document.createElement(block.ordered ? "ol" : "ul");
      list.className = "md-list";
      block.items.forEach((item) => {
        const li = document.createElement("li");
        renderInline(li, item);
        list.appendChild(li);
      });
      currentContainer.appendChild(list);
      return;
    }

    if (block.type === "table") {
      const table = document.createElement("table");
      table.className = "md-table";
      if (block.header && block.header.length) {
        const thead = document.createElement("thead");
        const row = document.createElement("tr");
        block.header.forEach((cell) => {
          const th = document.createElement("th");
          renderInline(th, cell);
          row.appendChild(th);
        });
        thead.appendChild(row);
        table.appendChild(thead);
      }
      const tbody = document.createElement("tbody");
      block.rows.forEach((rowCells) => {
        const row = document.createElement("tr");
        rowCells.forEach((cell) => {
          const td = document.createElement("td");
          renderInline(td, cell);
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      currentContainer.appendChild(table);
      return;
    }

    if (block.type === "code") {
      const pre = document.createElement("pre");
      pre.className = "md-code";
      const code = document.createElement("code");
      const language = block.language || "";
      code.className = language ? `language-${language}` : "";
      code.innerHTML = highlightCode(block.content, language);
      pre.appendChild(code);
      currentContainer.appendChild(pre);
      return;
    }

    if (block.type === "math") {
      renderMath(currentContainer, block.content, true);
    }
  });

  return headings;
}

function highlightCode(code, language) {
  const escaped = escapeHtml(code);
  const lang = (language || "").toLowerCase();
  if (!lang) return escaped;
  const keywordSets = {
    js: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "new", "await", "async"],
    javascript: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "new", "await", "async"],
    ts: ["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "new", "await", "async", "interface", "type"],
    python: ["def", "return", "if", "else", "elif", "for", "while", "class", "import", "from", "as", "await", "async"],
    java: ["class", "public", "private", "protected", "static", "void", "return", "if", "else", "for", "while", "new"]
  };
  const keywords = keywordSets[lang] || [];
  let highlighted = escaped;
  if (keywords.length) {
    const pattern = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    highlighted = highlighted.replace(pattern, '<span class="tok-keyword">$1</span>');
  }
  highlighted = highlighted.replace(/("[^"]*"|'[^']*')/g, '<span class="tok-string">$1</span>');
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="tok-number">$1</span>');
  return highlighted;
}

function renderRichMessage(raw) {
  const normalized = normalizeInput(raw);
  const enhanced = autoStructurePlainText(normalized);
  const container = document.createElement("div");
  container.className = "md-root";

  if (enhanced.length > 800) {
    container.appendChild(buildSummaryBox(enhanced));
  }

  const blocks = tokenizeBlocks(enhanced);
  const headings = renderBlocks(container, blocks);
  if (headings.length >= 2) {
    container.insertBefore(buildToc(headings), container.firstChild);
  }
  return container;
}

function addMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  if (role === "assistant") {
    div.appendChild(renderRichMessage(content));
  } else {
    div.textContent = content;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMode = btn.dataset.mode || "explain";
  });
});

async function sendQuestion() {
  const text = questionInput.value.trim();
  if (!text) return;
  questionInput.value = "";
  addMessage("user", text);
  setStatus("Thinking...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "askQuestion",
      question: text,
      mode: activeMode
    });

    if (!response || !response.ok) {
      addMessage("assistant", response && response.error ? response.error : "No response");
      setStatus("");
      return;
    }

    addMessage("assistant", response.data && response.data.answer ? response.data.answer : "No answer");
    setStatus("");
  } catch (error) {
    addMessage("assistant", "Request failed. Is the backend running?");
    setStatus("");
  }
}

sendButton.addEventListener("click", sendQuestion);
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendQuestion();
  }
});
