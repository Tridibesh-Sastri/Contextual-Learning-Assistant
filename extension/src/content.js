const DEFAULT_SETTINGS = {
  providerType: "local",
  localModel: "",
  cloudVendor: "openai",
  cloudModel: "gpt-4o-mini",
  storageTarget: "local",
  panelOpacity: 0.9
};

function getSiteKey() {
  const host = location.hostname;
  if (host.includes("geeksforgeeks.org")) return "gfg";
  if (host.includes("leetcode.com")) return "leetcode";
  if (host.includes("w3schools.com")) return "w3schools";
  return "generic";
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractCodeBlocks(root) {
  const blocks = [];
  const nodes = root.querySelectorAll("pre, code");
  nodes.forEach((node) => {
    const text = node.textContent || "";
    const cleaned = cleanText(text);
    if (cleaned.length > 0) {
      blocks.push({
        language: node.getAttribute("data-language") || node.className || "",
        content: cleaned
      });
    }
  });
  return blocks;
}

function extractMainContent() {
  const site = getSiteKey();
  let main = null;

  if (site === "gfg") {
    main = document.querySelector("article") || document.querySelector(".content") || document.querySelector("#main");
  } else if (site === "leetcode") {
    main = document.querySelector("div[data-track-load=description_content]") || document.querySelector(".content__u3I1");
  } else if (site === "w3schools") {
    main = document.querySelector("#main") || document.querySelector(".w3-main");
  }

  if (!main) {
    main = document.querySelector("main") || document.querySelector("article") || document.body;
  }

  const clone = main.cloneNode(true);
  const junkSelectors = [
    "nav",
    "header",
    "footer",
    "aside",
    ".ads",
    ".advertisement",
    "#ad",
    "[aria-hidden=true]",
    ".sidebar",
    ".toc",
    ".menu",
    ".newsletter",
    ".cookie",
    "script",
    "style"
  ];

  junkSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });

  const text = cleanText(clone.textContent || "");
  const codeBlocks = extractCodeBlocks(main);
  const title = document.title || "";

  return {
    site,
    title,
    url: location.href,
    text,
    codeBlocks
  };
}

function createOverlay() {
  if (document.getElementById("cla-host")) return;

  const host = document.createElement("div");
  host.id = "cla-host";
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
      }
      .cla-root {
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        position: fixed;
        right: 22px;
        bottom: 24px;
        z-index: 2147483647;
      }
      .cla-fab {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: radial-gradient(circle at 30% 20%, rgba(160, 190, 255, 0.35), rgba(30, 40, 70, 0.85));
        color: transparent;
        display: grid;
        place-items: center;
        cursor: pointer;
        box-shadow:
          0 14px 40px rgba(0, 0, 0, 0.45),
          0 0 0 1px rgba(120, 190, 255, 0.25),
          inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(8px);
        animation: cla-float 10s ease-in-out infinite;
      }
      .cla-fab svg {
        width: 32px;
        height: 32px;
        filter: drop-shadow(0 0 6px rgba(120, 200, 255, 0.45));
        opacity: 0.9;
        animation: cla-pulse 10s ease-in-out infinite;
      }
      .cla-fab:hover {
        transform: translateY(-2px) rotateX(6deg) rotateY(-6deg);
        box-shadow:
          0 18px 55px rgba(0, 0, 0, 0.45),
          0 0 12px rgba(120, 190, 255, 0.35);
      }
      .cla-fab:active {
        animation: cla-vortex 420ms ease both;
      }
      .cla-fab-label {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @keyframes cla-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }
      @keyframes cla-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      @keyframes cla-vortex {
        0% { transform: scale(1) rotate(0deg); }
        70% { transform: scale(0.92) rotate(180deg); }
        100% { transform: scale(0.2) rotate(360deg); opacity: 0.2; }
      }
      .cla-panel {
        width: 380px;
        height: 560px;
        min-width: 300px;
        min-height: 420px;
        max-width: 520px;
        max-height: 720px;
        margin-bottom: 12px;
        border-radius: 18px;
        --cla-panel-opacity: 0.9;
        position: relative;
        background:
          radial-gradient(120% 120% at 12% 12%, rgba(120, 190, 255, 0.08), transparent 55%),
          radial-gradient(120% 120% at 90% 10%, rgba(160, 120, 255, 0.06), transparent 55%),
          linear-gradient(
            165deg,
            rgba(10, 16, 26, var(--cla-panel-opacity)),
            rgba(14, 22, 34, var(--cla-panel-opacity))
          );
        border: 1px solid rgba(120, 170, 255, 0.12);
        box-shadow:
          0 22px 60px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.03) inset;
        backdrop-filter: blur(16px) saturate(130%);
        display: none;
        flex-direction: column;
        overflow: hidden;
        resize: both;
        box-sizing: border-box;
      }
      .cla-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08)),
          url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.08'/></svg>");
        mix-blend-mode: soft-light;
        pointer-events: none;
      }
      .cla-panel:hover {
        cursor: nwse-resize;
      }
      .cla-panel.open {
        display: flex;
        animation: cla-genie 420ms cubic-bezier(0.18, 0.9, 0.22, 1.08) both;
        transform-origin: bottom right;
      }
      .cla-panel > * {
        position: relative;
        z-index: 1;
      }
      .cla-ambient {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        opacity: 0.35;
        pointer-events: none;
      }
      .cla-resize-handle {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 16px;
        height: 16px;
        border-right: 2px solid rgba(120, 190, 255, 0.35);
        border-bottom: 2px solid rgba(160, 120, 255, 0.35);
        border-radius: 2px;
        pointer-events: none;
      }
      @keyframes cla-genie {
        0% { opacity: 0; transform: translateY(18px) scaleY(0.15) scaleX(0.75); filter: blur(2px); }
        60% { opacity: 1; transform: translateY(0) scaleY(1.02) scaleX(1.01); filter: blur(0); }
        100% { opacity: 1; transform: translateY(0) scaleY(1) scaleX(1); }
      }
      .cla-header {
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #f2f6f8;
      }
      .cla-title {
        font-size: 15px;
        font-weight: 700;
      }
      .cla-subtitle {
        font-size: 11px;
        color: rgba(242, 246, 248, 0.6);
      }
      .cla-close {
        background: transparent;
        border: none;
        color: rgba(242, 246, 248, 0.7);
        font-size: 16px;
        cursor: pointer;
      }
      .cla-chat {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        color: #e5ecef;
        line-height: 1.55;
      }
      .cla-message {
        background: rgba(20, 28, 38, 0.8);
        border-radius: 12px;
        padding: 10px 12px;
        margin-bottom: 10px;
        line-height: 1.55;
        font-size: 12.5px;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
      }
      .cla-message.user {
        background: rgba(14, 22, 32, 0.85);
        border-left: 3px solid rgba(120, 190, 255, 0.35);
      }
      .cla-message.assistant {
        background: linear-gradient(180deg, rgba(110, 190, 255, 0.1), rgba(255, 255, 255, 0.03));
        border-left: 3px solid rgba(160, 120, 255, 0.35);
      }
      .cla-controls {
        padding: 12px 14px 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(12, 22, 24, var(--cla-panel-opacity));
      }
      .cla-modes {
        display: flex;
        gap: 6px;
        margin-bottom: 10px;
        padding: 4px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.03);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
      }
      .cla-mode {
        border: 0;
        background: transparent;
        color: rgba(220, 232, 255, 0.75);
        padding: 5px 10px;
        border-radius: 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background 220ms ease, color 220ms ease, box-shadow 220ms ease;
      }
      .cla-mode.active {
        background: rgba(120, 190, 255, 0.14);
        color: rgba(235, 248, 255, 0.95);
        font-weight: 600;
        box-shadow: 0 0 0 1px rgba(120, 190, 255, 0.2);
      }
      .cla-input-row {
        display: flex;
        gap: 8px;
      }
      .cla-input {
        flex: 1;
        resize: none;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 10px;
        background: rgba(10, 16, 22, 0.9);
        color: #f0f4f6;
        font-size: 12px;
      }
      .cla-send {
        background: linear-gradient(135deg, rgba(110, 190, 255, 0.35), rgba(160, 120, 255, 0.28));
        border: none;
        border-radius: 12px;
        padding: 0 14px;
        font-weight: 700;
        color: #eaf2ff;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
      }
      .cla-status {
        margin-top: 8px;
        font-size: 11px;
        color: rgba(231, 238, 241, 0.65);
      }
      .cla-settings-toggle {
        background: transparent;
        border: none;
        color: rgba(242, 246, 248, 0.75);
        font-size: 12px;
        cursor: pointer;
      }
      .cla-settings {
        border-top: 1px dashed rgba(255, 255, 255, 0.1);
        padding: 10px 0 0;
        margin-top: 10px;
        display: none;
      }
      .cla-settings.open {
        display: block;
      }
      .cla-field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 8px;
        font-size: 11px;
        color: rgba(233, 240, 243, 0.7);
      }
      .cla-field select,
      .cla-field input {
        background: rgba(12, 19, 22, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #eef4f6;
        border-radius: 10px;
        padding: 6px 8px;
        font-size: 12px;
      }
      .cla-range-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .cla-range-value {
        min-width: 34px;
        text-align: right;
        color: rgba(233, 240, 243, 0.7);
        font-size: 11px;
      }
      .cla-save {
        width: 100%;
        border: none;
        padding: 8px 10px;
        border-radius: 10px;
        background: #64d4c8;
        color: #0b1c1b;
        font-weight: 700;
        cursor: pointer;
      }
      .md-root {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 12px;
      }
      .md-heading {
        font-family: "Fraunces", "Times New Roman", serif;
        font-weight: 600;
        letter-spacing: 0.2px;
        color: #f7f4ee;
      }
      .md-heading-1 {
        font-size: 16px;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .md-heading-2 {
        font-size: 14px;
      }
      .md-heading-3 {
        font-size: 12px;
      }
      .md-heading[data-icon="book"]::before {
        content: "[DEF] ";
      }
      .md-heading[data-icon="flask"]::before {
        content: "[EX] ";
      }
      .md-heading[data-icon="alert"]::before {
        content: "[!] ";
      }
      .md-heading[data-icon="sigma"]::before {
        content: "[SIG] ";
      }
      .md-heading[data-icon="summary"]::before {
        content: "[SUM] ";
      }
      .md-heading[data-icon="steps"]::before {
        content: "[STEPS] ";
      }
      .md-section {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 8px 10px 10px;
        background: rgba(19, 34, 38, 0.9);
      }
      .md-section-summary {
        cursor: pointer;
        list-style: none;
      }
      .md-section-summary::-webkit-details-marker {
        display: none;
      }
      .md-section-summary::after {
        content: "\\25BE";
        float: right;
        opacity: 0.6;
      }
      .md-section[open] .md-section-summary::after {
        transform: rotate(180deg);
      }
      .md-toc {
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(245, 230, 199, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .md-toc-title {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(240, 244, 246, 0.6);
        margin-bottom: 6px;
      }
      .md-toc ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .md-toc-item {
        margin: 3px 0;
      }
      .md-toc-item a {
        color: #f0f4f6;
        text-decoration: none;
      }
      .md-toc-item.level-3 {
        margin-left: 10px;
        font-size: 11px;
      }
      .md-summary {
        border-radius: 12px;
        padding: 8px 10px;
        background: rgba(255, 215, 128, 0.08);
        border: 1px solid rgba(246, 183, 60, 0.25);
      }
      .md-summary-title {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #f2b94b;
      }
      .md-summary-body {
        margin-top: 4px;
      }
      .md-root p {
        margin: 0;
        line-height: 1.55;
        color: #e3ecef;
      }
      .md-root blockquote {
        margin: 0;
        padding: 6px 10px;
        border-left: 3px solid #7cb6ff;
        background: rgba(124, 182, 255, 0.08);
        border-radius: 8px;
      }
      .md-list {
        margin: 0;
        padding-left: 16px;
      }
      .md-list li {
        margin: 3px 0;
      }
      .md-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        background: rgba(8, 16, 18, 0.6);
        border-radius: 10px;
        overflow: hidden;
      }
      .md-table th,
      .md-table td {
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 5px 6px;
        text-align: left;
      }
      .md-table th {
        background: rgba(255, 255, 255, 0.05);
        font-weight: 600;
      }
      .md-code {
        background: rgba(7, 14, 16, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 10px;
        border-radius: 10px;
        overflow-x: auto;
      }
      .md-code code {
        font-family: "JetBrains Mono", "Cascadia Code", monospace;
        font-size: 11px;
        color: #f4f7f8;
      }
      .tok-keyword {
        color: #f2b94b;
        font-weight: 600;
      }
      .tok-string {
        color: #8fe6c7;
      }
      .tok-number {
        color: #7cb6ff;
      }
      .md-callout {
        border-radius: 12px;
        padding: 8px 10px;
        background: rgba(124, 182, 255, 0.1);
        border: 1px solid rgba(124, 182, 255, 0.2);
      }
      .md-callout.warning {
        background: rgba(240, 127, 79, 0.12);
        border-color: rgba(240, 127, 79, 0.4);
      }
      .md-callout.definition {
        background: rgba(111, 210, 155, 0.12);
        border-color: rgba(111, 210, 155, 0.4);
      }
      .md-callout-title {
        font-size: 11px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .md-callout[data-icon="info"] .md-callout-title::before {
        content: "[INFO] ";
      }
      .md-callout[data-icon="spark"] .md-callout-title::before {
        content: "[TIP] ";
      }
      .md-callout[data-icon="alert"] .md-callout-title::before {
        content: "[WARN] ";
      }
      .md-callout[data-icon="book"] .md-callout-title::before {
        content: "[DEF] ";
      }
      .md-callout[data-icon="flask"] .md-callout-title::before {
        content: "[EX] ";
      }
      .md-callout[data-icon="sigma"] .md-callout-title::before {
        content: "[SIG] ";
      }
      .md-math-inline {
        font-family: "STIX Two Math", "Cambria Math", serif;
        background: rgba(255, 255, 255, 0.08);
        padding: 0 4px;
        border-radius: 6px;
      }
      .md-math-block {
        font-family: "STIX Two Math", "Cambria Math", serif;
        background: rgba(255, 255, 255, 0.06);
        padding: 8px 10px;
        border-radius: 10px;
        overflow-x: auto;
      }
    </style>
    <div class="cla-root">
      <section class="cla-panel" id="cla-panel">
        <canvas class="cla-ambient" id="cla-ambient" aria-hidden="true"></canvas>
        <div class="cla-header">
          <div>
            <div class="cla-title">Learning Assistant</div>
            <div class="cla-subtitle">Ask about this page</div>
          </div>
          <div>
            <button class="cla-settings-toggle" id="cla-settings-toggle">Settings</button>
            <button class="cla-close" id="cla-close">x</button>
          </div>
        </div>
        <div class="cla-chat" id="cla-chat"></div>
        <div class="cla-controls">
          <div class="cla-modes">
            <button class="cla-mode active" data-mode="explain">Explain</button>
            <button class="cla-mode" data-mode="deep">Deep Dive</button>
            <button class="cla-mode" data-mode="code">Code Mode</button>
          </div>
          <div class="cla-input-row">
            <textarea class="cla-input" id="cla-question" rows="2" placeholder="Ask a doubt, request an example, or explain a concept..."></textarea>
            <button class="cla-send" id="cla-send">Send</button>
          </div>
          <div class="cla-status" id="cla-status"></div>
          <div class="cla-settings" id="cla-settings">
            <div class="cla-field">
              <label>Provider</label>
              <select id="cla-provider">
                <option value="local">Local</option>
                <option value="cloud">Cloud</option>
              </select>
            </div>
            <div class="cla-field" id="cla-local-model-field">
              <label>Local model</label>
              <select id="cla-local-model"></select>
            </div>
            <div class="cla-field" id="cla-cloud-vendor-field">
              <label>Cloud vendor</label>
              <select id="cla-cloud-vendor">
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            <div class="cla-field" id="cla-cloud-model-field">
              <label>Cloud model</label>
              <input id="cla-cloud-model" placeholder="gpt-4o-mini" />
            </div>
            <div class="cla-field" id="cla-cloud-key-field">
              <label>API key</label>
              <input id="cla-cloud-key" type="password" placeholder="Paste your API key" />
            </div>
            <div class="cla-field">
              <label>Save chats</label>
              <select id="cla-storage">
                <option value="off">Off</option>
                <option value="local">Local</option>
                <option value="drive">Google Drive</option>
              </select>
            </div>
            <div class="cla-field">
              <label>Export history</label>
              <button class="cla-save" id="cla-export">Export CSV</button>
            </div>
            <div class="cla-field">
              <label>Transparency</label>
              <div class="cla-range-row">
                <input id="cla-opacity" type="range" min="0.6" max="1" step="0.05" />
                <span class="cla-range-value" id="cla-opacity-value">0.90</span>
              </div>
            </div>
            <button class="cla-save" id="cla-save">Save settings</button>
          </div>
        </div>
      </section>
      <span class="cla-resize-handle" aria-hidden="true"></span>
      <button class="cla-fab" id="cla-fab" aria-label="Open guide">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <path d="M20 18c-6 2-10 8-10 14 0 5 2 10 6 13m28-27c6 2 10 8 10 14 0 5-2 10-6 13" stroke="rgba(150,220,255,0.9)" stroke-width="2" stroke-linecap="round" />
          <path d="M22 20c-4 3-6 8-6 12 0 5 2 9 5 12m24-24c4 3 6 8 6 12 0 5-2 9-5 12" stroke="rgba(190,150,255,0.7)" stroke-width="2" stroke-linecap="round" />
          <circle cx="32" cy="32" r="10" stroke="rgba(170,210,255,0.9)" stroke-width="2" />
          <path d="M32 22v20M22 32h20" stroke="rgba(120,200,255,0.6)" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span class="cla-fab-label">Guider</span>
      </button>
    </div>
  `;

  document.documentElement.appendChild(host);

  const panel = shadow.getElementById("cla-panel");
  const fab = shadow.getElementById("cla-fab");
  const close = shadow.getElementById("cla-close");
  const settingsToggle = shadow.getElementById("cla-settings-toggle");
  const settingsPanel = shadow.getElementById("cla-settings");
  const chat = shadow.getElementById("cla-chat");
  const questionInput = shadow.getElementById("cla-question");
  const sendButton = shadow.getElementById("cla-send");
  const statusEl = shadow.getElementById("cla-status");
  const modeButtons = Array.from(shadow.querySelectorAll(".cla-mode"));
  const providerSelect = shadow.getElementById("cla-provider");
  const localModelSelect = shadow.getElementById("cla-local-model");
  const cloudVendorSelect = shadow.getElementById("cla-cloud-vendor");
  const cloudModelInput = shadow.getElementById("cla-cloud-model");
  const cloudKeyInput = shadow.getElementById("cla-cloud-key");
  const storageSelect = shadow.getElementById("cla-storage");
  const opacitySlider = shadow.getElementById("cla-opacity");
  const opacityValue = shadow.getElementById("cla-opacity-value");
  const saveSettingsButton = shadow.getElementById("cla-save");
  const exportButton = shadow.getElementById("cla-export");
  const localModelField = shadow.getElementById("cla-local-model-field");
  const cloudVendorField = shadow.getElementById("cla-cloud-vendor-field");
  const cloudModelField = shadow.getElementById("cla-cloud-model-field");
  const cloudKeyField = shadow.getElementById("cla-cloud-key-field");

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
    statusEl.textContent = text || "";
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
    div.className = `cla-message ${role}`;
    if (role === "assistant") {
      div.appendChild(renderRichMessage(content));
    } else {
      div.textContent = content;
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function toggleProviderFields() {
    const isLocal = providerSelect.value === "local";
    localModelField.style.display = isLocal ? "flex" : "none";
    cloudVendorField.style.display = isLocal ? "none" : "flex";
    cloudModelField.style.display = isLocal ? "none" : "flex";
    cloudKeyField.style.display = isLocal ? "none" : "flex";
  }

  function setModels(models) {
    localModelSelect.innerHTML = "";
    if (!models || models.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No local models";
      localModelSelect.appendChild(opt);
      return;
    }
    models.forEach((model) => {
      const opt = document.createElement("option");
      opt.value = model;
      opt.textContent = model;
      localModelSelect.appendChild(opt);
    });
  }

  async function loadSettings() {
    const response = await chrome.runtime.sendMessage({ type: "getSettings" });
    const data = response && response.ok ? response.data : DEFAULT_SETTINGS;
    providerSelect.value = data.providerType || "local";
    cloudVendorSelect.value = data.cloudVendor || "openai";
    cloudModelInput.value = data.cloudModel || "gpt-4o-mini";
    storageSelect.value = data.storageTarget || "local";
    const opacity = typeof data.panelOpacity === "number" ? data.panelOpacity : DEFAULT_SETTINGS.panelOpacity;
    opacitySlider.value = String(opacity);
    opacityValue.textContent = opacity.toFixed(2);
    panel.style.setProperty("--cla-panel-opacity", String(opacity));
    toggleProviderFields();

    const modelsResponse = await chrome.runtime.sendMessage({ type: "getModels" });
    if (modelsResponse && modelsResponse.ok) {
      setModels(modelsResponse.data.models);
      if (data.localModel) {
        localModelSelect.value = data.localModel;
      } else if (modelsResponse.data.models && modelsResponse.data.models.length > 0) {
        localModelSelect.value = modelsResponse.data.models[0];
      }
    }
  }

  async function saveSettings() {
    const settings = {
      providerType: providerSelect.value,
      localModel: localModelSelect.value,
      cloudVendor: cloudVendorSelect.value,
      cloudModel: cloudModelInput.value.trim() || "gpt-4o-mini",
      storageTarget: storageSelect.value,
      panelOpacity: Number(opacitySlider.value)
    };

    await chrome.runtime.sendMessage({ type: "saveSettings", settings });

    if (settings.providerType === "cloud" && cloudKeyInput.value.trim()) {
      await chrome.runtime.sendMessage({
        type: "saveApiKey",
        provider: settings.cloudVendor,
        apiKey: cloudKeyInput.value.trim()
      });
      cloudKeyInput.value = "";
    }

    setStatus("Settings saved.");
    setTimeout(() => setStatus(""), 1500);
  }

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

  fab.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  close.addEventListener("click", () => {
    panel.classList.remove("open");
  });

  settingsToggle.addEventListener("click", () => {
    settingsPanel.classList.toggle("open");
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      modeButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeMode = btn.dataset.mode || "explain";
    });
  });

  providerSelect.addEventListener("change", () => {
    toggleProviderFields();
  });

  opacitySlider.addEventListener("input", () => {
    const value = Number(opacitySlider.value);
    opacityValue.textContent = value.toFixed(2);
    panel.style.setProperty("--cla-panel-opacity", String(value));
  });

  sendButton.addEventListener("click", sendQuestion);
  questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  });
  exportButton.addEventListener("click", async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: "getSavedRecords" });
      if (!response || !response.ok) {
        setStatus(response && response.error ? response.error : "No history");
        return;
      }
      const records = response.data || [];
      if (records.length === 0) {
        setStatus("No history to export");
        return;
      }
      const headers = ["timestamp", "site", "title", "url", "question", "summary", "answer"];
      const lines = [headers.join(",")];
      records.forEach((record) => {
        const row = headers.map((key) => {
          const value = String(record[key] || "").replace(/"/g, '""');
          return `"${value}"`;
        });
        lines.push(row.join(","));
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `learning-assistant-history-${new Date().toISOString()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Exported CSV.");
      setTimeout(() => setStatus(""), 1500);
    } catch (error) {
      setStatus("Export failed");
    }
  });
  saveSettingsButton.addEventListener("click", saveSettings);

  loadSettings();
  initAmbientThree(shadow);
}

async function initAmbientThree(shadow) {
  const canvas = shadow.getElementById("cla-ambient");
  if (!canvas) return;

  try {
    const threeUrl = chrome.runtime.getURL("vendor/three.module.js");
    const THREE = await import(threeUrl);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const points = new THREE.BufferGeometry();
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 3.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    points.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x7bbcff,
      size: 0.015,
      transparent: true,
      opacity: 0.5
    });

    const cloud = new THREE.Points(points, material);
    scene.add(cloud);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };
    resize();
    new ResizeObserver(resize).observe(canvas);

    let t = 0;
    const tick = () => {
      t += 0.0015;
      cloud.rotation.y = t * 0.25;
      cloud.rotation.x = t * 0.12;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();
  } catch (error) {
    console.warn("[CLA] Three.js ambient layer skipped:", error);
  }
}

function initOverlay() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createOverlay);
  } else {
    createOverlay();
  }
}

initOverlay();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "extractPageContent") {
    try {
      const data = extractMainContent();
      sendResponse({ ok: true, data });
    } catch (error) {
      sendResponse({ ok: false, error: error && error.message ? error.message : "Extraction failed" });
    }
  }
  return true;
});
