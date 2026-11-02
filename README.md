# Corp Integrated Dashboard

A static Vite + React + TypeScript single-page app that shows endpoint security
posture: KPIs, OS and SLA breakdowns, a "Fix first" list, an explorer for
vulnerabilities, software, assets and automation runs, and per-endpoint asset
pages. Data is a bundled, fictional sample (organization Contoso) shaped like the
Action1 API; there is no backend.

## Local setup

Use Node.js 24 and run commands from the repository root.

```sh
npm ci            # install from package-lock.json
npm run dev       # Vite dev server at http://localhost:5173
npm run preview   # serve a production build
```

## Checks

Contract Master runs two registered checks on every task:

| Check | Command |
|---|---|
| `typecheck` | `npm ci --ignore-scripts && npm run typecheck` |
| `build` | `npm ci --ignore-scripts && npm run build` |

`npm run typecheck` runs `tsc -b` (strict). `npm run build` type-checks, then runs
`vite build` into `dist/`. No tests or linter are configured.

## Live data

The bundled fictional sample is the default. To read a live Action1 tenant, run
`npm run live`: it builds the app and starts a local Node bridge under `server/`.
The bridge listens only on `127.0.0.1` and uses `LIVE_BRIDGE_PORT` (default
`8787`). It serves the built `dist/` files and a single read-only endpoint,
`GET /api/live`; other methods are rejected.

The bridge launches the Action1 MCP gateway over stdio. Set:

- `ACTION1_MCP_COMMAND` (required): the command that starts the gateway. Use the
  wrapper script below.
- `ACTION1_MCP_ARGS` (optional): a JSON array of arguments for that command. The
  wrapper needs none.
- `ACTION1_ORGANIZATION_ID` (optional): the organization to read. Set it when the
  gateway can see more than one organization.
- `ACTION1_BASE_URL`: the Action1 API base for the tenant's region, forwarded to
  the gateway. Set it to `https://app.na-2.action1.com/api/3.0` for this tenant
  (NA-2); if unset the gateway falls back to `https://app.action1.com/api/3.0`,
  which does not accept NA-2 credentials, so live fetches fail with
  `Action1 request failed (HTTP 401)`.
- `ACTION1_ORGANIZATION_IDS` (optional): forwarded to the gateway when set;
  credentials are never forwarded by the bridge.

### 1Password wrapper

The bridge starts the gateway with a minimal environment (`HOME`, `LOGNAME`,
`PATH`, `SHELL`, `TERM`, `USER` and the two `ACTION1_*` settings above). It does
not pass `OP_SERVICE_ACCOUNT_TOKEN` through, so a wrapper reads the 1Password
service-account token from a file and runs the gateway under `op run`. Create it
once per machine, replacing the placeholders:

```sh
mkdir -p ~/.local/bin
cat > ~/.local/bin/action1-gateway <<'SH'
#!/bin/sh
set -eu
umask 077
token_file="$HOME/.config/op/sa-token"
[ -r "$token_file" ] || { echo "action1-gateway: cannot read $token_file" >&2; exit 1; }
OP_SERVICE_ACCOUNT_TOKEN="$(cat "$token_file")"
export OP_SERVICE_ACCOUNT_TOKEN
exec op run --environment "<environment-id>" -- \
  node "<path-to-action1-gateway>/src/server.mjs"
SH
chmod 700 ~/.local/bin/action1-gateway
chmod 600 ~/.config/op/sa-token
```

- `~/.config/op/sa-token` holds only the raw service-account token, owner-only.
  Never `source` it from a shell profile: that runs the token as a command and
  prints it in the error message.
- `<environment-id>` is the 1Password Environment that holds the Action1
  credentials; `<path-to-action1-gateway>` is the local Action1 MCP gateway
  checkout.
- `op` and `node` must be on the `PATH` the bridge inherits.

Then point the bridge at the wrapper by its absolute path:

```sh
export ACTION1_MCP_COMMAND="$HOME/.local/bin/action1-gateway"
export ACTION1_BASE_URL="https://app.na-2.action1.com/api/3.0"
unset ACTION1_MCP_ARGS
npm run live
```

The token lives only in the wrapper process and `op`; 1Password supplies the
Action1 secrets only to the gateway. The browser calls only `/api/live` and never
receives credentials, and tenant data is held only in memory.

Live mode currently fills the endpoint table; missing updates and automation runs
stay empty until the gateway exposes those records.

## Requesting work

Changes arrive through the
[Contract Master](https://github.com/d3hl/contract-master) workflow. To request
work, file a Linear issue that:

- is in the **Corp Integrated Dashboard** project;
- carries exactly one `repo:corp-integrated-dashboard` label;
- contains one complete `contract-master` block with `repo_id`
  (`d3-corp/corp-integrated-dashboard`), a full 40-character `base_commit`,
  `goal`, `allowed_scope`, `acceptance_criteria` and `required_checks`. See the
  [issue template](https://github.com/d3hl/contract-master/blob/main/docs/templates/issue.md).

Issues without a complete block, or filed in another project, are not queued.

Agents working in this repository must read [AGENTS.md](AGENTS.md) for the
workflow, commands, layout, conventions and boundaries.
