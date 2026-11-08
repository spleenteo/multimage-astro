
- A visual diff loop needs a stop rule set with the user before it starts (e.g. at most two fix rounds, then accept or park): with a pixel and computed-style compare, every round finds a smaller difference of the same family.
- A fix round on a visual diff re-runs only the pages and checks the fix touched; the full capture runs once at the end.
- Tailwind 4 `text-*` sets `line-height: var(--tw-leading, …)`: a parent's `leading-*` or a module that sets only `font-size` changes line heights; pin the v3 line heights as fixed values in `@theme` before the first diff.
- `@reference` modules emit no theme variables: use `@theme static` with `theme(static)`, and check the built CSS for `var(--x)` with no `--x:` definition.
- A probe that opens the draft-mode enable URL must run under `npx dotenv -e .env`: without SECRET_API_TOKEN the session never starts and staff pages give 401, which looks like a regression.
