# Dashboard Command — the QuestPage CLI

`life` is the official CLI for QuestPage. Authenticate once, then drive every API surface from your terminal — capture notes, browse quest boards, manage Workspace Seals, run searches.

> 💡 Install once, use it across every tavern you belong to.

## Install

```bash
# npm
npm install -g @questpage/cli

# bun
bun add -g @questpage/cli

# from source (in this repo)
cd apps/cli && npm install && npm run build && npm link
```

After installing, the `life` binary should be on your `PATH`:

```bash
life version
# → life 0.1.0
```

## First-time setup

Point the CLI at your QuestPage instance:

```bash
export LIFEOS_API_URL=https://api.your-instance.com   # default: http://localhost:3000
```

Then authenticate. Pick the flow that matches your context.

### Option A — paste a Workspace Seal

Best for machine accounts and CI runners.

1. Open the admin console → Workspace Seals → "New Seal". Copy the displayed `qs_…` value (you won't see it again).
2. Run:

```bash
life login
# API URL (http://localhost:3000): https://api.your-instance.com
# Workspace Seal: ••••••••••••••••••••••
# ✓ signed in as you@example.com (#1)
```

### Option B — device-code flow

Best for humans logging in on a workstation. Opens your browser, confirms a short code, and saves a session JWT.

```bash
life login --device
# → Open this URL in your browser: https://app.your-instance.com/auth/device?code=ABCD-1234
# → If asked, confirm this code: ABCD-1234
# → Waiting for approval (expires in 15 min)…
```

Click **Approve** in the browser and the CLI completes the exchange automatically.

> ⚠️ Sessions issued via device flow are pinned to a single tavern (the one active when you approved). Use `life ws use` to switch.

## Day-to-day commands

| Command | What it does |
|---------|--------------|
| `life status` | Show signed-in user, active tavern, and credential health |
| `life taverns` | List taverns you belong to |
| `life ws use <id\|slug>` | Switch active tavern (session auth only) |
| `life types` | List quest types in the active tavern |
| `life ls <type> [--page=N] [--size=N] [--fields=a,b]` | List entries |
| `life cat <type> <id> [--json]` | Show one entry |
| `life new <type>` | Create an entry interactively |
| `life capture "<text>" [--type=<slug>]` | Quick-capture, defaults to `notes` |
| `life search "<query>"` | Full-text search |
| `life keys [list\|new\|revoke <id>]` | Manage Workspace Seals |
| `life logout` | Clear stored credentials |
| `life version` | Print version |

Run `life` with no arguments for an interactive REPL.

## Interactive REPL

```bash
$ life

  ⬤  Dashboard Command
  QuestPage CLI · v0.1.0

life › status
  ✓ signed in as you@example.com (#1)
  tavern Your Dashboard (your-tavern, owner)
  memberships 1

life › capture "Refactor messenger birds"
  ✓ captured to notes #128

life › exit
```

Arguments accept double-quoted strings, so `capture "buy oat milk"` parses as a single argument.

## Configuration

State lives in `~/.questpage/config.json` (mode `0600` on POSIX so other local users can't read it):

```json
{
  "apiUrl": "https://api.your-instance.com",
  "auth": {
    "kind": "session",
    "token": "eyJhbGciOi…",
    "user": { "id": 1, "email": "you@example.com", "name": "You" },
    "issuedAt": "2026-06-01T12:34:56.000Z"
  }
}
```

Override:

| Variable | Default | Purpose |
|---|---|---|
| `LIFEOS_API_URL` | `http://localhost:3000` | API base URL used on first login |
| `NO_COLOR=1` | — | disable ANSI colours |
| `FORCE_COLOR=1` | — | force colours even when stdout isn't a TTY |

## Scripting

`life` is pipe-friendly: when stdout is not a TTY, colour codes are stripped and tables stay readable.

```bash
life ls notes --size=200 --fields=title,updatedAt | grep -i meeting
life cat notes 42 --json | jq .body
```

## Security notes

- The CLI never stores raw passwords or magic-link tokens.
- Workspace Seals are stored unencrypted at rest — treat `~/.questpage/config.json` like an `~/.ssh/` file.
- Device-code sessions show up under **Settings → Sessions** in the web app. Revoke any session there to invalidate the CLI immediately.
- Public endpoints are rate-limited per-IP. `life login` against a wrong password 11+ times in 15 min returns `429 Too many requests`.

## Source

CLI source: [`apps/cli/`](https://github.com/Poohmuhahaha/questpage/tree/main/apps/cli) · License: AGPL-3.0
