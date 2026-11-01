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

- `ACTION1_MCP_COMMAND` (required): the gateway command, for example `node` or
  `op` for 1Password injection.
- `ACTION1_MCP_ARGS` (optional): a JSON array of arguments for that command.
- `ACTION1_ORGANIZATION_ID` (optional): the organization to read. Set it when the
  gateway can see more than one organization.
- `ACTION1_BASE_URL` and `ACTION1_ORGANIZATION_IDS` (optional): forwarded to the
  gateway when set. Credentials are never forwarded by the bridge.

A placeholder-only example that lets 1Password inject credentials into the
gateway process:

```sh
export ACTION1_MCP_COMMAND="op"
export ACTION1_MCP_ARGS='["run","--environment","<environment-id>","--","node","<path-to-action1-gateway>/src/server.mjs"]'
npm run live
```

This launches `op run --environment <environment-id> -- node
<path-to-action1-gateway>/src/server.mjs`, so 1Password supplies secrets only to
the gateway. The browser calls only `/api/live` and never receives credentials,
and tenant data is held only in memory.

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
