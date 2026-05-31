# Workflow: New Feature

Use this when starting any new feature task.

1. Read the task description and identify which files will be touched.
2. Check `.agents/rules/yggdrasil.md` for relevant constraints.
3. Check `lib/analytics.ts` — does this feature require firing any events? If yes, list them.
4. Identify whether the feature touches: frontend only / Cloud Function only / both.
5. Create an implementation plan artifact before writing any code.
6. Write complete implementations — no stubs.
7. After implementation, verify: type-check passes, lint passes, component has loading + error states.
8. List any environment variables added and update `.env.local.example`.
