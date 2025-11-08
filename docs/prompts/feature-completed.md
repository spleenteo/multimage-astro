### Role
Act as an experienced Astro/TypeScript principal engineer.

### Task
Finalize a completed feature by running repo quality gates (docs inventory, tests, formatting), auto-fixing and committing changes, and then creating a final, well-written feature commit message.

### Context
- Repository scope: whole project (Astro web app).
- Relevant files / functions:
  - `AGENTS.md` – defines rules that govern documentation & agents.
  - `docs/` (especially `docs/list-*`) – documentation lists to keep in sync.
  - Project npm scripts:
    - `npm run docs:inventory` – inventories docs and signals when `docs/list-*` needs updates.
    - `npm run test` – runs format/lint/full build checks.
- Known constraints:
  - No external network calls after **Setup Script**.
  - Use git safely; avoid destructive history rewrites unless explicitly requested.
  - Prefer conventional commits style for messages (feat/fix/chore/docs/build/etc.).

### Expected Output
- Provide a **unified diff patch** for any code or docs edits you make, or indicate “no changes”.
- Summarize any issues found by `docs:inventory` and `test` with clear, actionable fixes; auto-apply safe fixes where possible.
- Commit any files changed by the process:
  1) if the feature is complex and required some critical decision, create a decision-log as per instructions in AGENTS.md
  2) First commit for auto-updates (docs/lists, formatting, lint fixes).
  3) if new changes appear after git-hooks from format/lint/prettier, **amend** the prior commit.
- Propose and create a final **feature commit** with a high-quality description (scope, motivation, user impact, notable implementation details), suitable for merging the branch into `main`.
- Add/adjust unit or e2e tests if straightforward; include them in the diffs.
- Output should include:
  - A concise report of checks run and their outcomes.
  - A final commit message body (multi-line) you used.
  - Next-step suggestions (e.g., “consider deep rewrite of docs section”) when indicated by signals.

### Guidance for Codex
1. **Structured CoT**
   - **Plan**: detect current branch, compare against `origin/main`, run checks, interpret outputs, decide fixes, commit flow, craft final commit.
   - **Code**: apply minimal, safe edits (docs/list updates, formatting, trivial lint fixes).
2. **Self-critique loop**: generate → review → improve once before producing final diff & commits.
3. **Clarifying questions** if inputs are missing (e.g., no `AGENTS.md`, missing scripts), but proceed with best-effort defaults.
4. Keep changes ≤ 500 new lines (otherwise stop and report).
5. Never expose secrets; do not contact networks after setup.
