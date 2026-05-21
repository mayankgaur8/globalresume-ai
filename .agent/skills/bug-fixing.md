# Bug Fixing Skill

## Purpose

Debug and fix application failures from terminal output, browser console logs, build logs, API responses, screenshots, and user reports.

## When To Use

Use this skill when something is broken, flaky, slow, failing validation, failing build, failing auth, throwing runtime errors, or showing a vague UI message.

## Rules

- Reproduce or inspect the actual failure before changing code.
- Trace the complete path: UI, API route/server action, auth/session, Prisma, database, external service.
- Prefer the smallest safe fix that matches existing project patterns.
- Do not hide failures with broad catches unless logs and safe user-facing errors are added.
- Do not revert unrelated user changes.
- Keep secrets out of logs and responses.

## Step-By-Step Workflow

1. Capture the failure.
   - Read terminal logs, browser console output, server logs, network response, and stack trace.
   - If a screenshot is provided, identify the visible failure and likely route/component.
2. Locate the code path.
   - Search with `rg` for exact error text, route path, component text, function name, and API URL.
   - Identify frontend caller, backend handler, database calls, and shared helpers.
3. Identify root cause.
   - Determine the exact failing file, line, request, query, env var, or runtime mismatch.
   - Separate symptoms from causes.
4. Patch safely.
   - Fix the root issue.
   - Add structured logging only where useful.
   - Add safe user-facing errors when the UI previously showed generic failures.
5. Validate.
   - Run focused tests or direct API requests.
   - Run typecheck/build/tests appropriate to the change.
6. Explain.
   - Summarize root cause, changed files, validation, and any remaining risk.

## Validation Checklist

- Failure reproduced or clearly traced.
- Exact failing line or operation identified.
- Fix is minimal and scoped.
- User-facing message is safe and useful.
- Server logs include enough context without secrets.
- `npm run typecheck` passes.
- `npm run build` passes for app-level changes.
- Relevant API/browser flow tested.

## Example Commands

```bash
rg -n "Registration failed|SIGNUP|DATABASE_UNAVAILABLE" src
npm run typecheck
npm run build
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password123!"}'
```
