# Resume Builder Specialist Skill

## Purpose

Improve GlobalResumeAI as a multilingual resume builder with reliable templates, ATS guidance, imports, AI suggestions, PDF export, subscription gating, and admin controls.

## When To Use

Use this skill for resume templates, ATS scoring, uploaded resume parsing, AI resume content, PDF export, language support, paid template/language access, admin unlocks, and template previews.

## Rules

- Treat resume content as user-owned and sensitive.
- Do not make ATS claims that are misleading or impossible to verify.
- Preserve ATS-friendly formatting: readable text, sensible headings, no broken ordering.
- Ensure uploaded data maps into the correct template fields.
- Keep PDF output close to on-screen preview when possible.
- Respect subscription/admin gating.

## Step-By-Step Workflow

1. Trace the resume data model.
   - Inspect store types, Prisma resume models, parser output, builder UI, and export path.
2. Check template rendering.
   - Verify contact, summary, experience, education, skills, projects, certifications, languages, portfolio.
3. Check upload parsing.
   - Confirm imported sections normalize into expected fields.
   - Avoid overwriting user data without clear intent.
4. Check ATS scoring.
   - Identify scoring criteria.
   - Make recommendations factual and calibrated.
   - Avoid promising interview success or guaranteed ATS pass.
5. Check AI features.
   - Ensure prompts are safe, localized, and grounded in user resume data.
6. Check PDF export.
   - Validate fonts, page breaks, selectable text, spacing, and template fidelity.
7. Check gating/admin behavior.
   - Premium templates/languages should require access unless admin or purchased.

## Validation Checklist

- Uploaded resume fields populate the builder correctly.
- Templates render all supported sections.
- PDF export succeeds and is readable.
- ATS score explains limitations and does not overpromise.
- AI suggestions preserve facts and user intent.
- Multilingual labels and date formatting work.
- Premium gating is enforced server-side where needed.
- Admin access works without weakening user access rules.
- `npm run typecheck` passes.
- `npm run build` passes.

## Example Commands

```bash
rg -n "ATS|score|parse|mammoth|pdf|template|premium|language|subscription" src
npm run typecheck
npm run build
```
