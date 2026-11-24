# Lessons — diventa-socio

- Before committing, run `npm run build` (not only prettier or a selector count): a `~/` alias exists only for the folders in tsconfig `paths` (components, layouts, lib, pages, schema), so `src/styles` is imported by relative path.
- Run `npx prettier --write` on the touched files before the commit, not after, so the formatting lands in the same commit instead of a second "Format …" commit.
- When a check script fails on cases the task didn't touch, find the commit that changed the behaviour and confirm the intent in the guidelines before you align the expectations, and align them in a separate commit.
- Never import from `astro/runtime/...` to build a component inline: add a real `.astro` file, even an empty one, and ask to widen Files.
- Executors cannot run `dotenv -e .env` (auto mode denies it): plan live CDA checks as conductor checks against the running dev server, GET only.
- Run every grep and count in the task's Verified line before the first commit, so a check never needs a second, comment-only commit.
- When a page reuses another page's markup, check that each class is defined in a stylesheet the page itself loads (src/styles/form.css), not in the source page's private CSS.
- Under `wrangler dev`, `request.url` carries the first route's host (www.multimage.org) unless `--local-upstream localhost:8787` is passed: plan local Worker checks that depend on the hostname with that flag.
- Local `wrangler dev` needs `--compatibility-date` at or below the installed workerd's newest date, and its outbound fetches can be too slow for a 10 s siteverify timeout: test the insert path directly against local D1, and the full submit on production.
