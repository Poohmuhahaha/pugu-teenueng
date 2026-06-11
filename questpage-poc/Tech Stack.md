# QuestPage: Tech Stack Statement

## 🚨 The Problem with the Current App
The current `questpage` application architecture (Deno Monorepo, Prisma, complex build steps) is fundamentally **over-engineered** for our core objective. It violates the core premise of QuestPage: **Fast, local-first responsiveness with minimal token waste and immediate iteration.**

## 🎯 The "Real Product" Philosophy
Based on the successful POC, the Real Product will strictly adhere to a **Zero-Build, High-Speed** philosophy. We are discarding the heavy monorepo in favor of raw simplicity. The code must be so simple that humans and AI Agents can iterate on it instantly without waiting for compilers.

## 🛠️ The Tech Stack (True to POC)

### 1. Frontend (Zero-Build UI)
- **HTML5 & Vanilla JavaScript:** No React, No SvelteKit, No Webpack/Vite. The browser reads the files directly.
- **Vanilla CSS:** We will map the tokens from `DESIGN.md` (Cal.com design: `#111111` primary, `Cal Sans` typography, 12px rounded cards) directly into a plain `style.css` file.
- **Why:** Immediate updates. You refresh the page, you see the changes. Zero compile time. True to the POC.

### 2. Backend (Micro-Server)
- **Node.js + Express:** The exact same lightweight server we used in the POC.
- **Real-time Engine:** **Server-Sent Events (SSE)**. We upgrade the 3-second `setInterval` to SSE to push new leads instantly without page reloads.

### 3. Database (Concurrent Storage)
- **SQLite (via `better-sqlite3`):** We upgrade `lowdb` (JSON) to SQLite to handle concurrent reads/writes safely when multiple agents hit the Webhook simultaneously.
- **No ORM (Raw SQL):** We avoid Prisma/Drizzle to keep the footprint absolutely minimal and execution speed maximum. 

### 4. Integration
- **Agent Webhooks:** Simple HTTP `POST` endpoints to receive leads, and asynchronous `fetch` calls to send Approval signals back to the Agent.
