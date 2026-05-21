# Production Readiness Skill

## Purpose

Review and harden the application like a senior architect before launch or major release.

## When To Use

Use this skill before production deployment, after large feature work, after auth/payment/database changes, or when preparing a launch checklist.

## Rules

- Audit first, then implement in priority order.
- Focus on real risk: auth, data loss, payments, security, reliability, observability, and UX failure states.
- Do not perform broad rewrites unless required.
- Prefer checklists with statuses: `pending`, `in progress`, `done`, `blocked`.
- Keep production behavior secure by default.

## Step-By-Step Workflow

1. Map critical user flows.
   - Signup, login, logout, onboarding, dashboard, resume create/edit/export, billing, admin.
2. Audit backend safety.
   - API validation, auth checks, authorization, rate limits, error responses, logging, runtime config, secrets.
3. Audit database safety.
   - Prisma schema, migrations, required fields, unique constraints, transactions, connection handling, seed data.
4. Audit frontend quality.
   - Loading states, empty states, mobile layouts, accessibility, error toasts, form validation.
5. Audit deployment readiness.
   - Env vars, build command, migrations, webhook config, production logs, health checks.
6. Implement missing items.
   - Fix critical blockers first.
   - Validate each completed item before moving on.
7. Produce final readiness report.

## Validation Checklist

- Auth protects private and admin routes.
- APIs validate payloads and return safe errors.
- Prisma migrations exist and are applied.
- DB health check exists.
- Rate limiting exists for auth/expensive endpoints.
- Logging is structured and does not leak secrets.
- Forms have loading/error/success states.
- Empty states are useful.
- Mobile layout works for core screens.
- Basic accessibility checks pass.
- SEO metadata exists for public pages.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Example Commands

```bash
rg -n "auth\\(|role|ADMIN|rateLimit|runtime|prisma" src
npx prisma validate
npx prisma migrate status
npm run lint
npm run typecheck
npm run build
```
