### Role
Act as an experienced Astro/TypeScript principal engineer.

### Task
Finalize a completed feature by running repo quality gates (docs inventory, tests, formatting), auto-fixing and committing changes, then merge the feature into `main` with a clear merge message.

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
  - Prefer conventional commits style for intermediary commits (feat/fix/chore/docs/build/etc.).

### Expected Output
- **Do not generate per-file or per-commit unified diffs.** Provide only a concise summary of changes and outcomes.
- Summarize issues found by `docs:inventory` and `test` with actionable fixes; auto-apply safe fixes where possible.
- Commit any files changed by the process:
  1) If the feature is complex and required critical decisions, create a decision-log as per `AGENTS.md`.
  2) First commit for auto-updates (docs/lists, formatting, lint fixes).
  3) If git-hooks (format/lint/prettier) introduce new changes, **amend** the prior commit.
- Report whether documentation was updated during feature development; if not, and inventory indicates gaps, **suggest a deep rewrite** of the relevant docs sections.
- After tests pass, **merge the feature into `main`** with a merge commit message exactly: Merge feature <feature-name>:
<reason> (Replace `<feature-name>` and `<reason>` accordingly.)
- Output should include:
- A concise report of checks run and their outcomes.
- The final merge commit message used.
- Any follow-ups (e.g., “consider deep rewrite of docs section”).

### Guidance for Codex
1. **Structured CoT**
 - **Plan**: detect current branch, compare against `origin/main`, run checks, interpret outputs, decide fixes, commit flow, then perform the merge into `main`.
 - **Code**: apply minimal, safe edits (docs/list updates, formatting, trivial lint fixes).
2. **Self-critique loop**: generate → review → improve once before final summary and merge.
3. **Clarifying questions** if inputs are missing (e.g., no `AGENTS.md`, missing scripts), but proceed with best-effort defaults.
4. Avoid generating diffs; include only summaries and commit IDs.
5. Never expose secrets; do not contact networks after setup.

### Merge Procedure (post-tests)
- Ensure all checks pass.
- Determine `<feature-name>` from the current branch (strip ticket IDs if needed) and derive `<reason>` from the feature goal.
- **Switch to `main`**: `git checkout main` and update: `git pull --ff-only`.
- **Merge the feature branch** (preserve a merge commit): `git merge --no-ff <feature-branch> -m "Merge feature <feature-name>:\n    <reason>"`.
- Output the merge commit SHA and message.

