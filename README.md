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
