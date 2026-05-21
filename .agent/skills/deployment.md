# Deployment Skill

## Purpose

Prepare the app for Vercel or Azure deployment with correct environment variables, Prisma migrations, database connectivity, build commands, logs, and deployment diagnostics.

## When To Use

Use this skill before deploying, when a deployment fails, when production auth/database behavior differs from localhost, or when preparing release instructions.

## Rules

- Never print secrets.
- Confirm provider target: Vercel, Azure, or other.
- Validate build locally before changing deployment config.
- Ensure production uses migrations, not ad hoc schema pushes.
- Check route runtime for Prisma, bcrypt, PDF parsing, and other Node-only APIs.

## Step-By-Step Workflow

1. Inspect deployment target.
   - Identify platform, branch, build command, install command, output, and Node version.
2. Check environment variables.
   - `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, OAuth keys, Stripe keys, OpenAI key.
3. Validate Prisma.
   - Schema valid, client generated, migrations committed, production migration plan clear.
4. Validate build.
   - Run lint/typecheck/build locally.
5. Check runtime compatibility.
   - Node runtime for Prisma, bcryptjs, PDF parsing, webhooks, and file parsing.
6. Check health and logs.
   - `/api/health` and `/api/health/db`.
   - Production logs should identify DB/auth/build failures without secrets.
7. Produce deployment steps.

## Validation Checklist

- Production env vars are listed and documented.
- Prisma migrations are committed.
- Build command works locally.
- DB health endpoint works.
- Auth callback URL matches production domain.
- Webhook endpoints are configured.
- Node runtime is declared where needed.
- Production logs are actionable.
- Rollback plan exists.

## Example Commands

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npm run lint
npm run typecheck
npm run build
```
