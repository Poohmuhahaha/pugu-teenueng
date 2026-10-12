# Pugu — Free Third-Party Stack

> Services with **permanent free tiers** that Pugu can use today (verified October 2026).
> ⚠️ Free tiers change without notice (PlanetScale removed its free DB in 2024, Oracle halved its free ARM VM in June 2026, Momento shut down Sept 2026). Never make a free tier a hard production dependency — always keep the upgrade path.

---

## 1. Hosting & Compute

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **Oracle Cloud Always Free** | 2 OCPU / 12 GB ARM VM + 200 GB block storage, forever | Capacity errors common; idle instances can be reclaimed; halved from 4/24 in June 2026 |
| **Cloudflare Pages** | Unlimited sites, unlimited bandwidth, 500 builds/mo | Static only (perfect for landing/docs) |
| **Cloudflare Workers** | 100k requests/day, cron triggers included | JS/WASM only — Rust needs `workers-rs` |
| **GitHub Pages** | Unlimited static hosting | Static only |
| **Render (free web service)** | 750 h/mo | Spins down after 15 min idle (cold starts); free Postgres **expires after 30 days** |
| **Netlify** | 100 GB bandwidth, 300 build min/mo | |
| **Deno Deploy** | ~1M requests/mo, 100k/day | JS/TS only |
| **Vercel Hobby** | Generous | ⚠️ **Non-commercial use only** — selling requires Pro ($20/mo) |
| ~~Fly.io / Railway / Koyeb~~ | No real free tier anymore | $5 trial credits at best |

**Best for Pugu:** Oracle Always Free VM runs the Rust API + web container at $0. Cloudflare Pages for landing/docs.

## 2. Database & Storage

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **Neon (Postgres)** | 1 GB/project, 100 projects, 100 CU-hours/mo, scale-to-zero, **60k auth MAU included** | Compute suspends when quota hit; permanent free plan |
| **Supabase** | 500 MB Postgres + Auth (50k MAU) + 1 GB storage + 5 GB egress | Projects **pause after 1 week idle** — dev only |
| **Turso (SQLite)** | 5 GB, 500M rows read / 10M written per month | libSQL fork of SQLite |
| **Cloudflare D1 (SQLite)** | 5 GB, 5M rows read/day, 100k written/day | Daily reset; pairs with Workers |
| **Cloudflare R2** | 10 GB storage, **zero egress fees** | S3-compatible |
| **Backblaze B2** | 10 GB storage, free egress up to 3× stored | S3-compatible |
| **Upstash Redis** | 256 MB, 500k commands/mo; QStash 1k messages/day | Great for rate limiting / queues |
| **Cloudflare KV** | 1 GB, 100k reads/day, 1k writes/day | Low write limit — config/read-heavy only |
| **MongoDB Atlas** | 512 MB (M0) | |
| **Redis Cloud** | 30 MB | Dev/test only |
| **PocketBase / SQLite self-host** | Unlimited (on your VM) | You run it |

**Best for Pugu:** Neon free when migrating off the JSON store; R2 for file uploads; Upstash for rate limiting.

## 3. Authentication

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **Clerk** | 50k MRU (raised Feb 2026), unlimited apps | MFA/SSO on Pro ($25); free lacks MFA |
| **Supabase Auth** | 50k MAU | Included with Supabase |
| **Neon Managed Better Auth** | 60k MAU | New; bundled with Neon |
| **WorkOS AuthKit** | Free to 1M MAU | SSO connections cost $125 each |
| **Firebase Auth** | ~50k MAU | Google lock-in |
| **Better Auth / Auth.js / Keycloak** | Free (OSS, self-host) | You maintain it |

**Best for Pugu:** keep the current custom auth (free) and harden it; Clerk free if you want hosted.

## 4. Email

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **Resend** | 3,000/mo (100/day), 3 domains | Modern API, great DX |
| **Brevo** | 300/day (~9k/mo) + transactional API + 100k contacts | Daily limit, no rollover |
| **MailerLite** | 1,000 subscribers, 12k emails/mo | Marketing focus |
| **Mailchimp** | 500 contacts, 1k sends/mo | |
| **Cloudflare Email Routing** | Free forwarding for your domain | Receive only, no sending |
| **Zoho Mail** | 5 users, 5 GB, custom domain | Webmail, not transactional API |
| **Amazon SES** | 3,000 messages/mo for first 12 months | Then $0.10/1k |

**Best for Pugu:** Brevo (300/day) for beta → Resend when volume grows.

## 5. Monitoring, Analytics & Replays

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **PostHog** | 1M events, 5k session replays, 100k errors, 1M flag requests — per month, forever | All-in-one; best free tier in category |
| **Sentry** | 5k errors/mo, 1 user | Team plan $26 |
| **Microsoft Clarity** | **Unlimited** session replays + heatmaps | Analytics only |
| **Cloudflare Web Analytics** | Unlimited, privacy-first | Basic metrics |
| **Grafana Cloud** | 10k metrics series, 50 GB logs, 50 GB traces | 14-day retention |
| **UptimeRobot** | 50 monitors, 5-min checks | Uptime only |
| **Better Stack** | 10 monitors, status page | |
| **Healthchecks.io** | 20 cron/background job checks | |
| **GlitchTip / Umami / Plausible (self-host)** | Unlimited (OSS) | You run them |
| **Axiom** | Generous log ingest (~500 GB/mo) | Check current limits |

**Best for Pugu:** PostHog (product analytics + errors + flags in one) + Clarity (replays) + UptimeRobot.

## 6. CI/CD & DevOps

| Service | Free tier | Caveats |
|---------|-----------|---------|
| **GitHub Actions** | 2,000 min/mo private, **unlimited public**, 500 MB artifacts, 10 GB cache | Self-hosted runners unmetered |
| **GitLab CI** | 400 compute min/mo, container registry, 5 users | |
| **CircleCI** | 30k credits (~6k min), 30 concurrent jobs | |
| **Dependabot / Renovate** | Free | Dependency updates |
| **Codecov** | Free for open source | |
| **Cloudflare Tunnel** | Free | Expose local/self-hosted services without opening ports |
| **Let's Encrypt** | Free TLS | Auto via Caddy/nginx |
| **Docker Hub** | 1 private repo, rate-limited pulls | Use GHCR free for public images |

**Best for Pugu:** GitHub Actions (typecheck + build + deploy on push) with self-hosted runner on the Oracle VM if minutes run out.

## 7. Payments

| Service | Free tier | Fees |
|---------|-----------|------|
| **Stripe** | No monthly fee — pay per transaction | TH: 3.65% + ฿10 domestic; 4.75% + ฿10 + 2% intl; PromptPay 1.65% |
| **Paddle** | No monthly fee | ~5% + 50¢, acts as merchant of record (handles global VAT) |
| **LemonSqueezy** | No monthly fee | ~5% + 50¢, merchant of record — easiest for solo devs pre-company |
| **PayPal** | No monthly fee | TH: 3.90% + ฿11 |

**Best for Pugu:** Stripe for THB/local; LemonSqueezy or Paddle if selling internationally before registering a company.

## 8. Design & Assets

| Service | Free tier |
|---------|-----------|
| **Figma** | 3 files, unlimited drafts |
| **Penpot / Excalidraw** | Free OSS |
| **Google Fonts / Fontsource** | Free fonts |
| **Lucide / Heroicons / PrimeIcons** | MIT icon sets |
| **unDraw / Pexels / Unsplash** | Free illustrations & photos |
| **DiceBear** | Free avatars |
| **Canva** | Free tier (limited) |

## 9. AI APIs (for future Pugu features)

| Service | Free tier |
|---------|-----------|
| **Google AI Studio (Gemini)** | Free API tier, rate-limited |
| **Groq** | Free tier for open models (fast) |
| **Cloudflare Workers AI** | 10k neurons/day |
| **GitHub Models** | Free tier for several models |
| **OpenRouter** | Selection of free models |
| **Hugging Face Inference** | Free monthly credits |
| **Ollama (local)** | Free, runs on your machine/VM |
| **Mistral La Plateforme** | Free experimental tier |

## 10. Communication, Support & Misc

| Need | Free options |
|------|--------------|
| Community chat | Discord, GitHub Discussions |
| Live chat support | Chatwoot (self-host), Crisp (2 seats), Tawk.to |
| Scheduling | Cal.com (self-host) |
| Forms / surveys | Tally (unlimited), Formbricks |
| Feature flags | PostHog, Flagsmith (50k req/mo), Unleash |
| Status page | Better Stack, Instatus, GitHub Pages |
| Cron jobs | cron-job.org, GitHub Actions cron, Cloudflare Workers cron |
| DNS / CDN / WAF | Cloudflare Free |
| Docs site | Astro Starlight, VitePress, Docusaurus (OSS) |
| API mocking | Mockoon, MSW |

---

## Recommended $0 Production Setup for Pugu

| Layer | Choice | Cost |
|-------|--------|------|
| Server (Rust API + web) | Oracle Always Free ARM VM (2 OCPU/12 GB) | $0 |
| DNS/CDN/TLS | Cloudflare Free | $0 |
| Landing + docs | Cloudflare Pages | $0 |
| DB (when migrating) | Neon free (1 GB) or Supabase free | $0 |
| Files | Cloudflare R2 (10 GB) | $0 |
| Email | Brevo (300/day) | $0 |
| Analytics + errors + flags | PostHog free + Clarity | $0 |
| Uptime | UptimeRobot (50 monitors) | $0 |
| CI/CD | GitHub Actions (2,000 min) | $0 |
| Payments | Stripe (per-transaction only) | 3.65% + ฿10 |
| Domain | Cloudflare Registrar `.com` | ~$10.46/yr |
| **Total** | | **~$11/year + payment fees** |

**Realistic upgrade path** (when users arrive): Hetzner CX23 (~€5.5/mo) for reliability → Neon/Supabase paid or self-hosted Postgres (~$25/mo) → Resend Pro ($20/mo) → HyperFormula commercial license (~$900–1,700/yr) if staying closed-source.

---

## ⚠️ Watch-outs

1. **Free ≠ production-ready**: most free tiers have no SLA, no backups, no support. Add backups (restic → R2/B2, free) from day one.
2. **Idle policies kill free tiers**: Supabase pauses after 7 days idle; Render free Postgres dies after 30 days; Oracle reclaims idle VMs.
3. **Vercel Hobby is non-commercial** — don't ship a paid product on it.
4. **Free-tier rug-pulls are normal** (PlanetScale, Momento, Fly.io). Prefer vendors where the free tier is core to their business (Cloudflare, Neon, Supabase, PostHog).
5. **Account limits**: many free tiers are 1 account per person — don't rely on creating multiple accounts.
6. **GPL/licensing is separate from pricing** — a free library (e.g. HyperFormula GPLv3) can still force licensing decisions.
