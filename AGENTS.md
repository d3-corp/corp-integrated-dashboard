# AGENTS.md

## Project

Corp Integrated Dashboard: a static Vite + React + TypeScript single-page app that shows endpoint security posture (KPIs, OS and SLA breakdowns, a "Fix first" list, an explorer for vulnerabilities, software, assets and automation runs, and per-endpoint asset pages). Data is a bundled, fictional sample shaped like the Action1 API; there is no backend.

## Contract Master workflow

Automated work arrives through the Contract Master workflow. Before planning or editing, explicitly read the issue and latest HANDOFF from Linear (project Corp Integrated Dashboard), and the task's read-only Contract Master context bundle (verify its recorded source commit and digest) with the shared workflow, security and contract guidance inside it. Links alone do not load those files.

Claude investigates and plans; DeepSeek implements and tests; Codex independently verifies, reviews and merges. Send results to the coordinator. Only the manager writes Linear. Humans handle escalations. Follow the task's allowed scope, acceptance criteria and required checks; the registered checks are `typecheck` (`npm ci --ignore-scripts && npm run typecheck`) and `build` (`npm ci --ignore-scripts && npm run build`), offline apart from the npm registry and credential-free. Issues for this repository carry exactly one `repo:corp-integrated-dashboard` label.

## Commands

Use Node.js 24. Run commands from the repository root.

- Install: `npm ci` (uses `package-lock.json`).
- Dev server: `npm run dev` (Vite, `http://localhost:5173`).
- Type-check: `npm run typecheck` (`tsc -b`, strict, no unused locals or parameters).
- Build: `npm run build` (type-check, then `vite build` into `dist/`).
- Preview a build: `npm run preview`.
- Tests and lint: none configured; match existing file style and run `git diff --check`.

Documentation-only changes need a content review and `git diff --check`. Code changes need `typecheck` and `build` to pass.

## Layout

- `index.html`, `src/main.tsx`: page shell and React root.
- `src/App.tsx`: routes — `/` dashboard, `/assets/:hostname` asset detail, anything else falls back to the dashboard.
- `src/pages/`: `Dashboard.tsx` (header, KPIs, insights, explorer) and `AssetPage.tsx` (device, hardware, network and policy runs for one endpoint).
- `src/components/`: `Overview.tsx` (KPI grid and insights), `Explorer.tsx` (tabbed explorer; active tab kept in `?tab=`), `Tables.tsx` (assets, software, vulnerabilities and runs tables), `ui.tsx` (tones, pills, panels and grid primitives).
- `src/data/raw.ts`: compact raw tuples (endpoints, missing updates, policy runs); column order is documented above each array.
- `src/data/snapshot.ts`: typed shapes, mapping from raw tuples, risk ordering and lookup helpers.
- `src/styles.css`: all styling.

## Conventions

- TypeScript strict mode; React function components with named exports (`App` is the default export).
- Two-space indentation, double quotes, semicolons, trailing commas.
- Keep data shaping in `src/data/snapshot.ts`; components read typed data, not raw tuples.
- Unknown values stay unknown (shown as `—`); never invent metrics.
- Use concise imperative commit subjects. PRs explain behavior changes, link the Linear issue, and list validation results.

## Boundaries

Always:
- Read a file before editing it and keep changes within the requested task.
- Keep `src/data/raw.ts` fictional (organization Contoso, made-up hostnames, users, IPs and serials).

Ask first unless already authorized by the task:
- Adding dependencies, changing routes, or adding a backend, API calls or CI configuration.
- Deleting files.

Never:
- Commit real tenant data: hostnames, user names, IP addresses, serial numbers or organization names from a live Action1 (or other) tenant. This repository is public.
- Read plaintext `.env` files or expose secret values; never commit credentials.
- Push directly to `main`, force-push, or rewrite history.
- Hand-edit `package-lock.json`; change it through npm when a dependency change is authorized.
