# Dashboard Command

The official QuestPage CLI — `life`.

```bash
npm install -g @questpage/cli
life
```

```
  ⬤  Dashboard Command
  QuestPage CLI · v0.1.0

  type
  	help     — list commands
  	login    — authenticate (Workspace Seal or device flow)
  	status   — show current user + tavern
  	exit     — quit

life ›
```

## Install

```bash
# npm
npm install -g @questpage/cli

# bun
bun add -g @questpage/cli

# deno (runs the TypeScript source directly)
deno install -A -g -n life --import-map=https://questpage.app/deno-import-map.json \
  https://questpage.app/cli/src/cli.ts
```

## Authenticate

Two flows. Pick whichever fits your context.

```bash
# API-key paste (machine accounts, CI):
life login

# Browser-confirmed device-code (recommended for humans):
life login --device
```

`life status` shows who you're signed in as and the active tavern.

## Common commands

```bash
life workspaces                   # what you can access (taverns)
life ws use my-tavern             # switch active tavern

life types                        # list quest types
life ls notes                     # list entries in "notes"
life cat notes 42                 # show one entry (--json for raw payload)
life new notes                    # interactive entry creation

life capture "Buy oat milk"       # quick capture into the "notes" quest board
life capture "Read paper" --type=reading

life search "kubernetes"          # full-text across the tavern

life keys list                    # list Workspace Seals
life keys new                     # request a new Workspace Seal
life keys revoke 7

life version
life logout
```

Run `life` with no arguments for an interactive REPL.

## Config

Stored at `~/.questpage/config.json` (mode 0600 on POSIX). The file holds the API
URL and either a Workspace Seal or a session JWT.

Environment overrides:

| Variable | Default | Purpose |
|---|---|---|
| `LIFEOS_API_URL` | `http://localhost:3000` | API base URL for first-time login |
| `NO_COLOR=1` | — | disable ANSI colours |
| `FORCE_COLOR=1` | — | enable ANSI colours even when stdout isn't a TTY |

## Build from source

```bash
cd apps/cli
npm install
npm run build
node ./bin/life.js help
```

License: AGPL-3.0
