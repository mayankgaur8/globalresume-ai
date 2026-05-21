# Agent Skills

Reusable workflows for coding agents working on GlobalResumeAI.

## How To Use

Ask the agent to use a skill by name, then describe the task.

Examples:

```text
Use the Bug Fixing Skill to debug why signup fails.
Use the Production Readiness Skill to audit auth and database handling.
Use the UI/UX Improvement Skill to improve the dashboard empty states.
Use the Resume Builder Specialist Skill to improve PDF export accuracy.
Use the Deployment Skill to prepare this app for Vercel.
Use the Git Commit Skill to review, validate, commit, and push my changes.
```

## Available Skills

- [Bug Fixing Skill](skills/bug-fixing.md)
- [Production Readiness Skill](skills/production-readiness.md)
- [UI/UX Improvement Skill](skills/ui-ux-improvement.md)
- [Resume Builder Specialist Skill](skills/resume-builder-specialist.md)
- [Deployment Skill](skills/deployment.md)
- [Git Commit Skill](skills/git-commit.md)

## Recommended Use Order

1. Bug Fixing Skill for broken behavior.
2. Production Readiness Skill before launch.
3. Resume Builder Specialist Skill for core product quality.
4. UI/UX Improvement Skill for polish.
5. Deployment Skill before release.
6. Git Commit Skill after validation.

## Agent Rules

- Read the relevant skill before acting.
- Identify root cause before changing code.
- Prefer minimal, safe changes.
- Run the validation checklist from the skill.
- Do not commit or push without explicit user approval.
