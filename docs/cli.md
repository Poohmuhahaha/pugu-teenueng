# Life Command — the LifeOS CLI

`life` is the official CLI for LifeOS. Authenticate once, then drive every API surface from your terminal — capture notes, browse collections, manage API keys, run searches.

> 💡 Install once, use it across every workspace you belong to.

## Install

```bash
# npm
npm install -g @lifeos/cli

# bun
bun add -g @lifeos/cli

# from source (in this repo)
cd apps/cli && npm install && npm run build && npm link
```

After installing, the `life` binary should be on your `PATH`:

```bash
life version
# → life 0.1.0
```

## First-time setup

Point the CLI at your LifeOS instance:

```bash
export LIFEOS_API_URL=https://api.your-instance.com   # default: http://localhost:3000
```

Then authenticate. Pick the flow that matches your context.

### Option A — paste an API key

Best for machine accounts and CI runners.

1. Open the admin console → API Keys → "New key". Copy the displayed `lk_…` value (you won't see it again).
2. Run:

```bash
life login
# API URL (http://localhost:3000): https://api.your-instance.com
# API key: ••••••••••••••••••••••
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

> ⚠️ Sessions issued via device flow are pinned to a single workspace (the one active when you approved). Use `life ws use` to switch.

## Day-to-day commands

| Command | What it does |
|---------|--------------|
| `life status` | Show signed-in user, workspace, and credential health |
| `life workspaces` | List workspaces you belong to |
| `life ws use <id\|slug>` | Switch active workspace (session auth only) |
| `life types` | List content types in the active workspace |
| `life ls <type> [--page=N] [--size=N] [--fields=a,b]` | List entries |
| `life cat <type> <id> [--json]` | Show one entry |
| `life new <type>` | Create an entry interactively |
| `life capture "<text>" [--type=<slug>]` | Quick-capture, defaults to `notes` |
| `life search "<query>"` | Full-text search |
| `life keys [list\|new\|revoke <id>]` | Manage API keys |
| `life logout` | Clear stored credentials |
| `life version` | Print version |

Run `life` with no arguments for an interactive REPL.

## Interactive REPL

```bash
$ life

  ⬤  Life Command
  LifeOS CLI · v0.1.0

life › status
  ✓ signed in as you@example.com (#1)
  workspace Your Workspace (your-workspace, owner)
  memberships 1

life › capture "Refactor billing webhooks"
  ✓ captured to notes #128

life › exit
```

Arguments accept double-quoted strings, so `capture "buy oat milk"` parses as a single argument.

## Configuration

State lives in `~/.lifeos/config.json` (mode `0600` on POSIX so other local users can't read it):

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
- API keys are stored unencrypted at rest — treat `~/.lifeos/config.json` like an `~/.ssh/` file.
- Device-code sessions show up under **Settings → Sessions** in the web app. Revoke any session there to invalidate the CLI immediately.
- Public endpoints are rate-limited per-IP. `life login` against a wrong password 11+ times in 15 min returns `429 Too many requests`.

## Source

CLI source: [`apps/cli/`](https://github.com/Poohmuhahaha/lifeos/tree/main/apps/cli) · License: AGPL-3.0
