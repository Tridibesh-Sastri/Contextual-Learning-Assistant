![Typing banner](https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=3000&pause=800&color=6DE0FF&center=true&vCenter=true&width=700&lines=Contextual+Learning+Assistant;Futuristic+AI+Learning+Overlay;Chrome+Extension+%2B+Node.js+Proxy)

# Contextual Learning Assistant

*Minimal sci-fi learning overlay for the modern web, powered by local AI.*

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-MV3-0b1220?style=for-the-badge&logo=google-chrome&logoColor=6DE0FF) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-0b1220?style=for-the-badge) ![Node.js](https://img.shields.io/badge/Node.js-18+-0b1220?style=for-the-badge&logo=node.js&logoColor=6DE0FF) ![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-0b1220?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-0.1.0-0b1220?style=for-the-badge) ![License](https://img.shields.io/badge/License-TBD-0b1220?style=for-the-badge)

```
======================================  FUTURISTIC LEARNING OVERLAY   ======================================
```

## Hero Banner (Animated)

![Demo placeholder](https://placehold.co/860x420/0b1220/6de0ff?text=Demo+GIF+Placeholder)

## Project Overview (Premium Styled)

Contextual Learning Assistant is a Chrome extension plus a lightweight Node.js proxy that answers questions about the page you are learning from. It extracts live page context, sends it to a local AI model through a proxy, and renders an elegant in-page overlay with teacher-style responses.

## Features (Card Style Layout)

Feature

Description

🧠 **Context Extraction**

Pulls main text and code blocks from supported learning sites.

⚡ **Fast AI Replies**

Sends questions plus page context to a local model via the proxy.

🚀 **In-Page Overlay**

Minimal sci-fi UI that floats on the page without leaving your flow.

🔒 **Local-First**

Sessions are kept in memory on the server with no database.

## Architecture (Structured Visual Block)

```
Browser (Chrome MV3)	├─ Content Script: extract page context + render overlay	├─ Background Worker: settings, storage, server calls	└─ Storage: local or Google DriveNode Proxy (Express)	├─ /api/ask -> Ollama local model	└─ In-memory session context (no DB)
```

Note: The repository includes sidebar assets, but the current UI is the in-page overlay rendered by the content script.

## Installation Guide (Modern Panel Layout)

**Server Setup**

```bash
cd servercopy .env.example .envnpm installnpm run dev
```

Edit the example environment values in [server/.env.example](server/.env.example) as needed.

**Extension Setup**

1.  Open `chrome://extensions`
2.  Enable Developer mode
3.  Click **Load unpacked**
4.  Select the `extension` folder

## Configuration & Settings

Setting

Purpose

Default

Provider

Local or cloud model

local

Cloud vendor

OpenAI or Gemini

openai

Cloud model

Remote model name

gpt-4o-mini

Save chats

off, local, or drive

local

Transparency

Overlay opacity

0.90

For Google Drive storage, update the OAuth client ID in [extension/manifest.json](extension/manifest.json) and configure the Drive scope for your OAuth app.

## Project Structure

```
extension/   Chrome extension (content script, background worker, UI assets)server/      Node.js proxy server (Ollama)
```

## Troubleshooting

-   Overlay does not appear: confirm the site is supported and reload the tab.
-   Requests fail: ensure the server is running and reachable at [http://localhost:3000](http://localhost:3000).
-   No model response: verify Ollama is running and the model name matches the server env.

## Future Roadmap

-   Cloud-first deployment guide for the proxy
-   Optional persistent history storage
-   Expanded site support and extraction rules
-   Richer export options for learning history

## Footer with Futuristic Signature

```
// CLA :: contextual learning overlay// built for focused study and local-first AI
```