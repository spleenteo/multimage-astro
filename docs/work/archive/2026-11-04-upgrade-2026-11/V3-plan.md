---
work: upgrade-2026-11
slice: V3
step: plan
tests: essential
updated: 2026-11-05
---

# V3 plan — Patch/minor, Node 24, TypeScript 6

**Mandate**: [slices.md § V3](slices.md#v3--patchminor-node-24-typescript-6) · **Guidelines**: [development-guidelines.md](../../../development-guidelines.md), [dependencies.md](../../../guidelines/dependencies.md), [operations.md](../../../guidelines/operations.md) · **Lessons**: [lessons.md](lessons.md) · **Execution rules**: [executor.md](/Users/spleenteo/.claude/plugins/cache/flow/flow/facb0e621782/agents/executor.md)

**Summary**
1. Node 24: `.nvmrc` → `24`, `"engines": { "node": "24.x" }` in `package.json`; `.vercelignore` with `.env*`, `dist/`, `.astro/`, `.claude/`.
2. Patch/minor: explicit ranges for the In list, `datocms` held at `~4.0.29`, an `overrides` guard keeping `@datocms/cli-utils` below 4.2 (4.2 pulls `@datocms/cma-client-node` 6), swiper pinned at `12.1.4`, then `npm update` within ranges.
3. TypeScript 5.9.3 → 6.0.3; `tsconfig.json` drops the deprecated `baseUrl` (paths become `./…`).
4. `npm run format` with prettier 3.9, committed on its own.
5. Dev smoke on an own server (published routes, `/staff` 404, one draft read), `npm ls` clean; docs step (current state, dependencies, operations, README Node line, TODO, TS 7 decision status).

**Files**: .nvmrc, .vercelignore (new), package.json, package-lock.json, tsconfig.json, any file `npm run format` rewrites (outside `docs/`, `schema.ts`), docs/current-state.md, docs/guidelines/dependencies.md, docs/guidelines/operations.md, docs/TODO.md, docs/decisions-log/2026-11-04-defer-typescript-7.md, README.md

## The slice, decided here

- **Versions are the ones `npm view` / `npm outdated` gave on 2026-11-05**, not memory: astro 6.4.8, @astrojs/check 0.9.12, @astrojs/ts-plugin 1.10.12, @astrojs/vercel 10.0.8, @datocms/astro 0.6.16, @datocms/content-link 0.3.23, @datocms/cma-client 5.8.1, prettier 3.9.10, postcss 8.5.32, esbuild 0.28.2, autoprefixer 10.6.2, dotenv-cli 11.1.0, serialize-error 13.1.0, datocms 4.0.29 (latest 4.0.x), typescript 6.0.3. If `npm view <pkg> version` differs at run time, the executor takes the newer patch inside the same minor and says so.
- **`datocms` gets `~4.0.29`**: `^4.0.28` would let `npm update` take 4.2.0.
- **`overrides: { "@datocms/cli-utils": "<4.2.0" }`**: datocms 4.0.29 asks `@datocms/cli-utils ^4.0.25`; cli-utils 4.2.x needs `@datocms/cma-client-node ^6.1.0`, so a plain `npm update` would pull the CMA v6 family through the back door (moved to V5). 4.0.25/4.1.0 need `^5.4.15`. V5 removes the override (TODO line in T7).
- **swiper is pinned exact at `12.1.4`** before `npm update` (which would take 12.2.0): `dependencies.md` asks for a pinned swiper, and V6 owns swiper with a carousel check on the production bundle.
- `@datocms/cma-client` 5.8.1 and `@astrojs/vercel` 10.0.8 move inside their current major (mandate: `npm update` within ranges); `@datocms/cda-client` stays 0.2.10 (`^0.2` caps it).
- No peer errors are expected: @astrojs/check 0.9.12 peers `typescript ^5 || ^6`; `@datocms/cma-client-analysis` peers `typescript >=5`; the CLI keeps its own nested `typescript 5.7.2`; `@astrojs/vercel` 10.0.8 peers `astro ^6`. astro 6.4.8 needs Node >= 22.12 (local Node is 24.18).
- **TS 6 in `tsconfig.json`**: only `baseUrl` is deprecated here (`moduleResolution` comes from `astro/tsconfigs/base.json`, already `Bundler`). Without `baseUrl`, `paths` values must start with `./` (TS5090). Astro's alias plugin already falls back to `.` when `paths` has no `baseUrl` (`node_modules/astro/dist/vite-plugin-config-alias/index.js`), and no file imports bare `src/…`, so no import breaks. No `ignoreDeprecations`.
- **Vercel Node**: Vercel lets `engines.node` override the project's Node setting, so the build follows `24.x` from the next deploy (V4's preview; V3 deploys nothing). The dashboard setting lives outside the checkout: see Deviations.
- **The smoke runs on an own server**, not on 4321: the user's server keeps the old `node_modules` loaded in memory. `npx astro dev` (not `npm run dev`) so `sync-datocms` does not rewrite `schema.ts`.

## Tasks

### T1 — Node 24
**What**: `.nvmrc` holds `24`. Add `"engines": { "node": "24.x" }` to `package.json` after `"version"`.
**Files**: .nvmrc, package.json
**Verified**: `cat .nvmrc` → `24`; `node -p "require('./package.json').engines.node"` → `24.x`; `node -v` starts `v24`; `npx prettier --check package.json` passes.
**Done**: the local build runs on Node 24 (Vercel's Node 24 build is first seen on V4's preview).
**Interfaces**: produces the `package.json` T2 edits next.

### T2 — Patch/minor upgrades · critical · depends on: T1
**What**: Add `"overrides": { "@datocms/cli-utils": "<4.2.0" }` to `package.json`. Then `npm install astro@^6.4.8 @astrojs/check@^0.9.12 @astrojs/vercel@^10.0.8 @datocms/astro@^0.6.16 @datocms/content-link@^0.3.23 @datocms/cma-client@^5.8.1 postcss@^8.5.32 autoprefixer@^10.6.2 serialize-error@^13.1.0`, `npm install --save-exact swiper@12.1.4`, `npm install -D @astrojs/ts-plugin@^1.10.12 prettier@^3.9.10 esbuild@^0.28.2 dotenv-cli@^11.1.0 datocms@~4.0.29`, then `npm update`. No `npm audit fix`.
**Files**: package.json, package-lock.json
**Verified**: `npm ls astro datocms swiper prettier typescript` shows 6.4.8, 4.0.29, 12.1.4, 3.9.10, 5.9.3; `npm ls @datocms/cma-client-node @datocms/cli-utils` shows only 5.x and < 4.2; `npm ls >/dev/null; echo $?` → `0`; `npm outdated` lists only the majors left to V4–V7, typescript, and `datocms` 4.2 (V5); `npx datocms --version` reports 4.0.29; `npm run check:revalidation-map` ends `15 payloads, 12 routes, 0 mismatches, fetch calls: 0`; `npx astro check` reports 0 errors; `npm run build` exits 0.
**Done**: every patch/minor in the In list is installed; nothing from the CMA v6 family is in the tree.
**Interfaces**: produces the lockfile T3 extends and prettier 3.9 for T4.

### T3 — TypeScript 6 · critical · depends on: T2
**What**: `npm install typescript@^6.0.3` (stays in `dependencies`). In `tsconfig.json`, remove `"baseUrl": "."` and prefix every `paths` value with `./` (`"./src/components/*"`, …, `"~/schema": ["./schema"]`). Any other TS 6 error `astro check` reports is fixed in `tsconfig.json` or the file it names, and listed in the report.
**Files**: package.json, package-lock.json, tsconfig.json
**Verified**: `npm ls typescript` shows 6.0.3 at the root and no `invalid`; `grep -n baseUrl tsconfig.json` prints nothing; `npx tsc -p tsconfig.json --noEmit 2>&1 | grep -E 'TS5(090|101|107)'` prints nothing; `npx astro check` reports 0 errors; `npm run check:revalidation-map` ends as in T2; `npm ls >/dev/null; echo $?` → `0`; `npm run build` exits 0.
**Done**: the type-check runs on TS 6 with no deprecated option.
**Interfaces**: produces the final versions T4, T6 and T7 rely on.

### T4 — Prettier 3.9 reformat · depends on: T3
**What**: `npm run format`. Commit only what it changed, staged by path, as `Reformat with prettier 3.9`. If it changes nothing, no commit; the report says so.
**Files**: any file `npm run format` rewrites (outside `docs/`, `schema.ts`)
**Verified**: `git diff --stat` before staging lists only files prettier rewrote; a second `npm run format` leaves `git status --porcelain` unchanged; `npx prettier --check --ignore-path .prettierignore .` passes; `npx astro check` reports 0 errors.
**Done**: the lint gate passes on prettier 3.9.

### T5 — `.vercelignore`
**What**: Create `.vercelignore` with a comment line, `.env*`, `dist/`, `.astro/` and `.claude/`, so `vercel deploy` never uploads local env files or local build/tool folders (the Vercel CLI does not read `.gitignore`). `datocms.config.json` is not excluded: the remote build may read it.
**Files**: .vercelignore
**Verified**: `grep -cx '\.env\*' .vercelignore` → `1`; `grep -cxE 'dist/|\.astro/|\.claude/' .vercelignore` → `3`; `git check-ignore -q .vercelignore; echo $?` → `1` (not ignored).
**Done**: CLI deploys from V4 on leave `.env` and `.env.example` behind.

### T6 — Dev smoke and dependency tree (conductor) · critical · depends on: T4, T5
**What**: Pick a free port (`export PORT=4333`; `lsof -nP -iTCP:$PORT -sTCP:LISTEN` empty; 4321 and 4329 are not ours, check others with `lsof` before use). Start `npx astro dev --port $PORT` in the background with the normal `.env` (GET only, no overrides needed). Take slugs from the HTML: `BOOK` = first `href="/libri/<slug>"` on `/libri` that is not `pagina|archivio|ebooks|highlights|schede`; `AUTHOR` from `/autori`; `POST` from `/magazine`; export them. GET with `curl -s -o /dev/null -w '%{http_code} %{url}\n'`: `/`, `/libri`, `/libri/$BOOK`, `/autori/$AUTHOR`, `/magazine/$POST`, `/staff`. Draft read: `npx dotenv -e .env -- sh -c 'curl -s -b "" -L -o /dev/null -w "%{http_code} %{num_redirects}\n" "http://localhost:$PORT/api/draft-mode/enable?token=$SECRET_API_TOKEN&url=/libri/$BOOK"'`, then the same with `-o -` piped to `grep -c 'Modalità editor'`, then the same with `url=/staff`. Never print `%{url_effective}` (a 401 would echo the token). Stop the server (`lsof -nP -iTCP:$PORT -sTCP:LISTEN -t` → `kill`), then `git diff --quiet -- schema.ts || git checkout -- schema.ts`. Results go in the ledger.
**Files**: none (results in V3-ledger.md)
**Verified**: the five published routes → `200`; `/staff` → `404`; draft read → `200 1` and a badge count ≥ 1; `/staff` with session → `200 1`; the dev log has no `ERROR` line and no 5xx; afterwards `lsof -nP -iTCP:$PORT -sTCP:LISTEN` and `git status --porcelain schema.ts` print nothing.
**Done**: the upgraded stack renders published and draft content and still gates `/staff`.

### T7 — Docs step · depends on: T4
**What**: `current-state.md` § Dependencies: Core line with the versions from `npm ls --depth=0` (Astro 6.4.8, TypeScript 6.0.3, `@astrojs/vercel` 10.0.8, `@datocms/astro` 0.6.16, `@datocms/cma-client` 5.8.1, `@datocms/content-link` 0.3.23, `datocms` CLI 4.0.29 held on 4.0.x until V5) plus "Node 24.x"; Tooling line Prettier 3.9, dotenv-cli 11.1; Known debt (`current-state.md:116`): replace only the clause 'Tailwind 4 e TypeScript 6 deliberatamente non aggiornati' with "Tailwind 4 not yet; TypeScript 7 deferred (decisions-log/2026-11-04-defer-typescript-7.md)", keeping every other item on the line (GA UA snippet, `experimental.svgo`, `path-to-regexp` ReDoS). `dependencies.md`: Node 24.x (`.nvmrc`, `engines`); TypeScript 6; the `datocms` CLI on `~4.0.x` plus the `@datocms/cli-utils` override and why; swiper risk note says it is pinned at 12.1.4. `operations.md` § Deployments: Vercel builds on Node 24.x from `engines` (overrides the project setting), `.nvmrc` for local, `.vercelignore` keeps `.env*` out of CLI uploads. `README.md` lines 7-8: Node.js 24.x (`nvm use` reads `.nvmrc`), npm bundled with Node 24. `TODO.md`: UP-node stays open as `[Status: wip]` with the note "repo side done in V3; Vercel Node setting pending (user), checked at V4 entry"; new open **UP-ts7** (TS 7 when @astrojs/check supports it, link to the decision) and **UP-cli-utils-override** (remove the override in V5); a completed V3 line. Decision file: a status-log line "2026-11-05 — TypeScript 6.0.3 applied in V3" (status stays open).
**Files**: docs/current-state.md, docs/guidelines/dependencies.md, docs/guidelines/operations.md, README.md, docs/TODO.md, docs/decisions-log/2026-11-04-defer-typescript-7.md
**Verified**: `grep -nE 'Astro 6\.3\.3|TypeScript 5\.9|4\.0\.27|TypeScript 6 deliberatamente' docs/current-state.md` prints nothing; `grep -n 'Node.js 20' README.md` prints nothing; `grep -cE 'UP-ts7|UP-cli-utils-override' docs/TODO.md` → 2; `grep -n 'UP-node.*Status: wip' docs/TODO.md` prints one line; `grep -c '24.x' docs/guidelines/operations.md` ≥ 1; `npm run docs:inventory` exits 0; `npx prettier --check README.md` passes; for the five docs files, `npx prettier --ignore-path /dev/null --check` passes on those that passed before T7's edits (today `docs/current-state.md` and `docs/guidelines/dependencies.md`), and on the three that already fail (`operations.md`, `TODO.md`, the TS 7 decision) the edited passages introduce no new prettier difference (compare `npx prettier --ignore-path /dev/null <file> | diff - <file>` before and after: no new hunks in edited lines); never reformat whole files.
**Done**: no doc describes the runtime or versions as before V3.

## Order

T1 and T5 run side by side (separate files). T2 after T1, T3 after T2, T4 after T3. T7 runs after T4 (it edits `README.md`, which prettier formats). T6 runs last, after T4 and T5, on the conductor.

## Deviations from the mandate

- A bare `npm update` would pull `@datocms/cli-utils` 4.2 and with it `@datocms/cma-client-node` 6, against "CLI stays on 4.0.x". An `overrides` entry keeps cli-utils < 4.2 until V5.
- swiper is pinned exact at 12.1.4. `npm update` would have taken 12.2.0, `dependencies.md` asks for a pin, and V6 owns swiper.
- `README.md` (Node line only), `operations.md` (UP-node acceptance) and the TS 7 decision's status log are edited beyond the named docs, because each one describes the runtime V3 changes.
- **User action, outside the checkout**: set the Vercel project's Node.js Version to 24.x (Project Settings → Build and Deployment). `engines` already wins at build time, but the setting is UP-node's acceptance and V4's entry condition. V3 makes no deploy, so the change first shows on V4's preview.
