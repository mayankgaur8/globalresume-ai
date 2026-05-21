# UI/UX Improvement Skill

## Purpose

Improve screens so they feel modern, clean, mobile-friendly, consistent, and customer-attractive.

## When To Use

Use this skill when improving layout, visual polish, conversion, onboarding, dashboards, forms, empty states, skeletons, toasts, responsiveness, or accessibility.

## Rules

- Preserve existing design system and component patterns.
- Improve the real app screen, not a separate landing page unless requested.
- Use icons from the existing icon library when appropriate.
- Add practical loading, empty, success, and error states.
- Keep layouts responsive and text readable on mobile.
- Do not introduce visual clutter or unrelated redesigns.

## Step-By-Step Workflow

1. Understand the screen goal.
   - Identify target user, primary action, secondary actions, and failure states.
2. Inspect current components.
   - Reuse local UI components, spacing patterns, colors, cards, and typography.
3. Improve interaction states.
   - Loading spinners/skeletons, disabled states, toasts, validation, empty states.
4. Improve responsive layout.
   - Check mobile, tablet, and desktop constraints.
   - Prevent text overlap and unstable sizing.
5. Improve accessibility.
   - Labels, focus states, button names, contrast, keyboard navigation.
6. Validate visually and technically.

## Validation Checklist

- Primary workflow is obvious.
- Mobile layout works without overlap.
- Buttons and form controls have clear states.
- Empty states explain next action.
- Errors are visible and actionable.
- Success states confirm completion.
- Typography and spacing are consistent.
- Accessibility basics are covered.
- `npm run typecheck` passes.
- `npm run build` passes for broad UI changes.

## Example Commands

```bash
rg -n "Skeleton|toast|Loader2|empty|No .* yet" src/app src/components
npm run typecheck
npm run build
```
