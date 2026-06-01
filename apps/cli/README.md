# Life Command

The official LifeOS CLI — `life`.

```bash
npm install -g @lifeos/cli
life
```

```
  ⬤  Life Command
  LifeOS CLI · v0.1.0

  type
    help     — list commands
    login    — authenticate (API key or device flow)
    status   — show current user + workspace
    exit     — quit

life ›
```

## Install

```bash
# npm
npm install -g @lifeos/cli

# bun
bun add -g @lifeos/cli

# deno (runs the TypeScript source directly)
deno install -A -g -n life --import-map=https://lifeos.app/deno-import-map.json \
  https://lifeos.app/cli/src/cli.ts
```

## Authenticate

Two flows. Pick whichever fits your context.

```bash
# API-key paste (machine accounts, CI):
life login

# Browser-confirmed device-code (recommended for humans):
life login --device
```

`life status` shows who you're signed in as and the active workspace.

## Common commands

```bash
life workspaces                   # what you can access
life ws use my-team               # switch active workspace

life types                        # list collections
life ls notes                     # list entries in "notes"
life cat notes 42                 # show one entry (--json for raw payload)
life new notes                    # interactive entry creation

life capture "Buy oat milk"       # quick capture into the "notes" collection
life capture "Read paper" --type=reading

life search "kubernetes"          # full-text across the workspace

life keys list
life keys new
life keys revoke 7

life version
life logout
```

Run `life` with no arguments for an interactive REPL.

## Config

Stored at `~/.lifeos/config.json` (mode 0600 on POSIX). The file holds the API
URL and either an API key or a session JWT.

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
