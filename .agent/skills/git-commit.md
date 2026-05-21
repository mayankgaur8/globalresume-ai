# Git Commit Skill

## Purpose

Review local changes, validate them, create a meaningful commit, and optionally push to GitHub after confirming everything works.

## When To Use

Use this skill when the user asks to commit, push, publish, checkpoint, create a PR, or prepare a clean git history.

## Rules

- Always inspect `git status` and the diff before staging.
- Never stage unrelated changes silently.
- Do not commit `.env` or secrets.
- Run relevant validation before committing.
- Ask before pushing unless the user explicitly requested push.
- Use clear commit messages with type/scope when helpful.

## Step-By-Step Workflow

1. Inspect state.
   - Run `git status -sb`.
   - Review `git diff --stat` and relevant file diffs.
2. Confirm scope.
   - If unrelated changes exist, ask which files belong in the commit.
3. Validate.
   - Run the relevant checks for the changed surface.
   - Prefer `npm run lint`, `npm run typecheck`, and `npm run build` for app changes.
4. Stage intentionally.
   - Use explicit file paths for mixed worktrees.
   - Use `git add .` only when the whole worktree is in scope.
5. Commit.
   - Use a concise message describing the user-visible or technical outcome.
6. Push if requested.
   - Push the current branch to the configured remote.
   - Report commit hash and remote branch.

## Validation Checklist

- Worktree reviewed.
- No secrets staged.
- Diff matches requested scope.
- Validation commands run and results recorded.
- Commit message is meaningful.
- Push completed only when requested.
- Final status is clean or explained.

## Example Commands

```bash
git status -sb
git diff --stat
git diff
npm run lint
npm run typecheck
npm run build
git add <files>
git commit -m "fix: describe the outcome"
git push origin main
```
