# Pugu — Features List

> Status as of **October 2026** · Stack: Vue 3 + Rust (Axum) + HyperFormula
>
> Legend: ✅ Shipped · 🔶 Partial (works, needs hardening) · ⬜ Planned

---

## 1. Product Overview

Pugu is a workspace product: **wiki + database + spreadsheet + link graph** in one app.
Data is free-form (no rigid schema), everything lives in workspaces, and content types
(doc / spreadsheet) decide how entries are viewed and edited.

Core loop: create a content type → add entries → view them as a list, a spreadsheet,
or a graph → link entries together → see backlinks everywhere.

---

## 2. Core Platform

### 2.1 Auth & Accounts

| Status | Feature |
|--------|---------|
| ✅ | Email + password login (`pooh@questpage.app` seeded) |
| ✅ | Session cookie (`life_session`), logout, `GET /v1/me` |
| 🔶 | Single seeded account; no self-serve signup |
| ⬜ | Registration + email verification |
| ⬜ | Password reset / change |
| ⬜ | 2FA / passkeys |
| ⬜ | OAuth (Google, GitHub) |
| ⬜ | Session management (device list, revoke) |

### 2.2 Workspaces

| Status | Feature |
|--------|---------|
| ✅ | Multiple workspaces per user (e.g. "Pooh's Dashboard", "Huuk HQ") |
| ✅ | Workspace switcher in the topbar (`POST /v1/workspaces/{id}/switch`) |
| 🔶 | Workspace data isolation at the store level |
| ⬜ | Create / rename / delete workspace from UI |
| ⬜ | Members, invites, roles (Owner / Admin / Editor / Viewer) |
| ⬜ | Per-workspace usage limits & seats |

### 2.3 Content Model

| Status | Feature |
|--------|---------|
| ✅ | Content types with kinds: `doc`, `spreadsheet` (also `tasks`, `roadmap` seeded) |
| ✅ | Free-form entries: any JSON field, no fixed schema |
| ✅ | Column set = union of entry keys (insertion order preserved) |
| ✅ | Entry CRUD API + UI |
| ✅ | Entry titles editable inline (dialog `editable-title`) |
| ✅ | Backlinks/backrefs between entries (auto + rebuild endpoint) |
| ⬜ | Field types & validation (text, number, select, date, relation) |
| ⬜ | Views per type (table / board / calendar / gallery) |
| ⬜ | Templates (starter content-type packs) |

---

## 3. Spreadsheet (Sheets)

### 3.1 Data & Layout

| Status | Feature |
|--------|---------|
| ✅ | Google-Sheets-style grid: column letters A…Z…AA, row numbers |
| ✅ | Free-form columns (not bound to schema), grows as you type |
| ✅ | No special header row — row 1 is data |
| ✅ | Add row / add column at edges (`+` controls) |
| ✅ | Delete row via hover `×` on row number |
| ✅ | Filler rows/columns (min 26 columns, extends on demand) |
| ✅ | Thai / Unicode text fully supported |

### 3.2 Formula Engine

| Status | Feature |
|--------|---------|
| ✅ | **HyperFormula v3.4** (lazy-loaded, separate ~163 KB gzip chunk) |
| ✅ | Excel/Google-Sheets syntax: `=SUM(A1:A10)`, `=IF(...)`, `=VLOOKUP(...,FALSE)` |
| ✅ | 400+ built-in functions; dependency graph + automatic recalculation |
| ✅ | Errors: `#DIV/0!` `#VALUE!` `#NAME?` `#REF!` `#CYCLE!` `#N/A` `#NUM!` |
| ✅ | Custom `CONCAT` added (missing in HyperFormula) |
| ✅ | `TRUE`/`FALSE` literals (registered as named expressions) |
| ✅ | Fallback engine (`formula.ts`, ~45 functions, dependency-free) if HF unavailable |
| 🔶 | Dynamic arrays (`SORT`, `SEQUENCE`, `UNIQUE`) don't spill — first value only |
| 🔶 | `MODE` not supported by HyperFormula (fallback engine only) |
| ⬜ | Cell/range drag-fill, relative ref adjustment |
| ⬜ | Cross-sheet references |

### 3.3 Formula Bar

| Status | Feature |
|--------|---------|
| ✅ | Name box: type `Z1` / `B2:D5` + Enter to jump or select a range |
| ✅ | `fx` input mirrors live typing in the cell (two-way sync) |
| ✅ | Enter commits, Esc cancels, clicking the bar mid-edit keeps editing |
| ✅ | Cell reference display (single cell or range) |

### 3.4 Formatting

| Status | Feature |
|--------|---------|
| ✅ | Per-cell format stored as `_fmt` per entry (server-persisted) |
| ✅ | Number formats: plain / currency / percent + decimal places |
| ✅ | Bold, italic, underline, strikethrough |
| ✅ | Font size, text color, background color |
| ✅ | Horizontal align, text wrap |
| ✅ | Format applies to full range selections |
| ⬜ | Borders, merged cells |
| ⬜ | Conditional formatting |
| ⬜ | Number format presets (date, duration, custom pattern) |

### 3.5 Navigation & Editing

| Status | Feature |
|--------|---------|
| ✅ | Click / arrows / Tab / Shift+Tab / Enter / Shift+Enter |
| ✅ | `Home` → column A, `Ctrl+Home` → A1 |
| ✅ | `F2` or double-click to edit; type to overwrite |
| ✅ | `Esc` cancel, `Delete`/`Backspace` clear range |
| ✅ | Range selection (drag or Shift+click), blue Sheets-style outline |
| ✅ | `Ctrl/Cmd+C` / `V` — TSV copy/paste |
| ✅ | View auto-scrolls to keep the active cell visible |
| ✅ | Vimium / keyboard-shortcut browser extensions suppressed while in grid |
| ⬜ | Undo / redo (toolbar buttons present but disabled) |
| ⬜ | Cut, paste special, fill down/right |
| ⬜ | Multi-sheet tabs persisted server-side (UI tabs exist) |

### 3.6 Sheet Chrome

| Status | Feature |
|--------|---------|
| ✅ | Menu bar: File / Edit / Insert / Format / Data / Tools / Help |
| ✅ | Toolbar: formats, colors, align, wrap, decimals, print, zoom 50–150% |
| ✅ | Sheet tabs at bottom + `+` new sheet |
| ✅ | Print stylesheet |
| ⬜ | Sort / filter views |
| ⬜ | Frozen rows/columns |
| ⬜ | Find & replace |
| ⬜ | CSV / Excel import & export |

---

## 4. Views

### 4.1 Entries (List)

| Status | Feature |
|--------|---------|
| ✅ | Entry list per content type, sortable table |
| ✅ | Filter by type via sidebar / query param |
| ✅ | Inline title editing, open entry detail |
| ⬜ | Full-text search |
| ⬜ | Saved views & filters |
| ⬜ | Bulk actions |

### 4.2 Graph — "Neural"

| Status | Feature |
|--------|---------|
| ✅ | Force-graph of entries, edges from resolved backlinks (directed) |
| ✅ | Full-viewport layout, framer-motion animation |
| ⬜ | Filter by type, depth control |
| ⬜ | Click node → open entry |
| ⬜ | Cluster/group by content type |

### 4.3 Lead Desk (Dashboard)

| Status | Feature |
|--------|---------|
| ✅ | KPI cards + recent entries + quick type navigation |
| 🔶 | Uses the first content type as its data source |
| ⬜ | Configurable widgets |
| ⬜ | Real "lead verification" workflow |

---

## 5. Backend & API

| Status | Feature |
|--------|---------|
| ✅ | Rust + Axum API, all routes under `/api` (nginx-proxied) |
| ✅ | REST: auth, workspaces, content types, entries, backrefs |
| ✅ | JSON store with atomic writes, key order preserved (`/data/pugu.json`) |
| ✅ | Seed on first run, Docker volume persistence |
| 🔶 | Single-file store — fine for MVP, not for concurrent multi-tenant scale |
| ⬜ | Postgres (or SQLite) migration + migrations tooling |
| ⬜ | API keys, rate limiting, audit log |
| ⬜ | Webhooks / outbound events |
| ⬜ | Public API + SDK |
| ⬜ | Realtime sync (WebSocket/SSE) for collaboration |
| ⬜ | File/image uploads + storage |

---

## 6. Component Library (Huuk)

| Status | Feature |
|--------|---------|
| ✅ | Shared Vue library used by the whole app (`components/huuk`) |
| ✅ | Shell: Sidebar, AppTopbar, NavList, SectionHeader, Panel, KpiCard |
| ✅ | Data: DataTable, QuestGraph, SheetGrid, FormulaBar, Toolbar, MenuBar |
| ✅ | Overlays: Dialog (expandable, editable title), ConfirmModal, DropdownMenu |
| ✅ | Forms: Button, Input, Select, Tabs, Badge, Spinner, EmptyState, AuthCard |
| ✅ | Design tokens + typography (`pugu.css`), consistent popup styling |
| 🔶 | Library has no standalone package/test harness |
| ⬜ | Dark mode |
| ⬜ | Accessibility pass (ARIA, focus traps, contrast) |
| ⬜ | Storybook / visual regression tests |

---

## 7. Ops & Deployment

| Status | Feature |
|--------|---------|
| ✅ | Docker Compose: `web` (nginx :3001) + `api` (:3000 → 8788) |
| ✅ | Multi-context Docker build (app + shared component library) |
| ✅ | Health endpoint, nginx `/api/` proxy |
| ⬜ | CI/CD (build, typecheck, deploy) |
| ⬜ | Automated tests in repo (unit + e2e) |
| ⬜ | Monitoring & error tracking (Sentry/PostHog) |
| ⬜ | Backups & restore procedure |
| ⬜ | Staging environment |
| ⬜ | TLS + custom domain |
| ⬜ | Mobile responsive / PWA |

---

## 8. Roadmap

### Phase 1 — Private MVP (1–2 months)

- [ ] Registration, email verification, password reset
- [ ] Workspace create/rename, invite by email, basic roles
- [ ] Repo test suite + CI (typecheck, unit, e2e smoke)
- [ ] Monitoring (PostHog/Sentry free tier) + backups
- [ ] Mobile responsive pass
- [ ] Fix known sheet gaps: undo/redo, sort/filter, CSV export

### Phase 2 — Public Beta + Billing (2–3 months)

- [ ] Stripe subscriptions (Free / Pro / Team), trial, invoices, limits enforcement
- [ ] Onboarding flow + landing page + docs site
- [ ] Transactional email (Resend): invites, notifications, receipts
- [ ] Import/export (CSV, Excel, JSON backup)
- [ ] Global search
- [ ] Security hardening: rate limiting, audit log, 2FA
- [ ] PDPA compliance (privacy policy, data export/delete)

### Phase 3 — v1.0 Production (2–3 months)

- [ ] Postgres migration, migrations tooling, connection pooling
- [ ] Realtime collaboration (presence, live cursors, conflict handling)
- [ ] Field types & validation, saved views (board/calendar/gallery)
- [ ] Public API keys + webhooks + SDK
- [ ] SSO (Google/Microsoft) for Team plans
- [ ] Performance budget + load testing
- [ ] Support workflow (help center, contact)

### Phase 4 — Growth (v2)

- [ ] AI features (assistant, auto-summarize, smart fill, natural-language queries)
- [ ] Templates marketplace (task packs, trackers, docs)
- [ ] Automations (rules: when X → do Y)
- [ ] Offline mode + sync
- [ ] i18n (TH/EN), date/number locales
- [ ] Desktop app (Tauri) / mobile apps

---

## 9. Known Gaps / Technical Debt

| Area | Issue |
|------|-------|
| Auth | One seeded user; sessions never expire |
| Store | Single JSON file, no migrations, no multi-process locking |
| Sheet | Undo/redo disabled; dynamic arrays don't spill; `MODE` unsupported |
| Tests | Verification scripts live outside the repo; no CI |
| Docs | README describes the old SvelteKit prototype, not the current Vue+Rust app |
| i18n | UI strings hard-coded English |
| Licensing | HyperFormula is GPLv3 — see below |

---

## 10. Licensing Notes

| Component | License | Implication |
|-----------|---------|-------------|
| Pugu core | AGPL-3.0 (per README) | Copyleft; SaaS users must be offered source |
| Vue / Rust / Axum / PrimeVue | MIT / Apache-2.0 | No cost |
| **HyperFormula** | **GPLv3 or commercial** | If Pugu is distributed (or ships JS to browsers) without AGPL-compatible licensing, either buy a commercial license (~$900–1,700/yr) or switch to an MIT engine (`hot-formula-parser`) |

> Decision required before public launch: commercial license, GPL/AGPL alignment, or engine swap.
