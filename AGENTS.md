<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working style

- **One step at a time.** Propose and implement one logical step, then stop and wait for confirmation before proceeding to the next.
- **Explain every decision.** Before writing any code for a step, state: (1) what you are about to do, (2) why this approach was chosen over alternatives, and (3) what tradeoffs or risks it carries. Keep explanations concise but complete enough for a developer to learn from them.
- **Ask before assuming.** If a step has two or more reasonable approaches, present the options with their tradeoffs and let the user decide.

# Project reference

`ARCHITECTURE.md` documents the stack, data model, CV layout system, and deploy/migration pipeline. Read it before touching the Prisma schema, a layout, or the deploy path — don't re-derive the structure from the code.

Keep it current in the same change that makes a claim in it stale. The runbook is the thing people follow at 2am; a wrong one is worse than none.

# Environment

- **Production runs on a home server ("smurfserver") that no agent can reach.** No SSH, no `docker exec`, no `psql` against it. Anything that has to happen there is a command for the user to run.
- **Development runs against a local `cvforge-dev-db` container** holding a copy of production — see `ARCHITECTURE.md` → Local development database. `.env.local` points at it.
- **There is no staging. Pushing to `main` *is* the production migration**, applied automatically before the new image ships. A migration that moves or rewrites data must be rehearsed locally first; the rehearsal is in `ARCHITECTURE.md` → Migrations.
- **Quality gates run locally, not in CI.** CI neither lints nor tests, and there are no tests at all — `npx tsc --noEmit` and `npx eslint src` are the whole net. Note that neither catches a runtime break behind an `any` from `req.json()`.
