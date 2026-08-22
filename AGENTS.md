<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working style

- **One step at a time.** Propose and implement one logical step, then stop and wait for confirmation before proceeding to the next.
- **Explain every decision.** Before writing any code for a step, state: (1) what you are about to do, (2) why this approach was chosen over alternatives, and (3) what tradeoffs or risks it carries. Keep explanations concise but complete enough for a developer to learn from them.
- **Ask before assuming.** If a step has two or more reasonable approaches, present the options with their tradeoffs and let the user decide.
- **Never commit or push.** The user does both. Leave finished work in the working tree, run `npx tsc --noEmit` and `npx eslint src`, and say which files changed and why — then stop. Do not ask for permission to commit as a matter of routine either; raise it only when there is a real reason the timing matters, such as work that should not sit half-finished across a deploy. A push to `main` *is* the production deploy, which is exactly why that call belongs to the person who can watch it land.

# Project reference

`ARCHITECTURE.md` documents the stack, data model, CV layout system, and deploy/migration pipeline. Read it before touching the Prisma schema, a layout, or the deploy path — don't re-derive the structure from the code.

Keep it current in the same change that makes a claim in it stale. The runbook is the thing people follow at 2am; a wrong one is worse than none.

# Secrets

**Agents must not read or write any `.env` file except `.env.example`.** `.env`, `.env.local`, and every other `.env*` are off limits — `.env.example` is the only one an agent may open, and the only one an agent may edit.

This is a rule about *access*, not about output, so it is not satisfied by reading a file and declining to print what is in it:

- It covers **any** way of getting at the contents, not just `Read` and `cat`. `node --env-file=.env.local`, `dotenv -e .env.local`, `grep` over the file, `source`, a script that opens it — all of these are reading it, and all are forbidden.
- It also covers **inferring** the values, such as printing a single field, a host name, or a `true/false` for whether a key is set.

What remains allowed: running ordinary project commands that load environment files internally as part of doing their job — `npm run dev`, `npm run build`, `npm run migrate:dev`, `docker compose up`. The distinction is that the agent never receives the values. Never add a step to such a command that echoes, logs, or otherwise surfaces them.

**The practical consequence: anything that needs real credentials is a command for the user to run, not for the agent.** Write the exact command out, explain what it will do, and ask for the output. This is the same arrangement as production access below, and for the same reason.

When a credential must change, say which variable in which file and where its value comes from — then stop. Document the shape in `.env.example`, which exists precisely so the real files never have to be opened.

# Environment

- **Production runs on a home server ("smurfserver") that no agent can reach.** No SSH, no `docker exec`, no `psql` against it. Anything that has to happen there is a command for the user to run.
- **Development runs against a local `cvforge-dev-db` container** holding a copy of production — see `ARCHITECTURE.md` → Local development database. `.env.local` points at it.
- **There is no staging. Pushing to `main` *is* the production migration**, applied automatically before the new image ships. A migration that moves or rewrites data must be rehearsed locally first; the rehearsal is in `ARCHITECTURE.md` → Migrations.
- **Quality gates run locally, not in CI.** CI neither lints nor tests, and there are no tests at all — `npx tsc --noEmit` and `npx eslint src` are the whole net. Note that neither catches a runtime break behind an `any` from `req.json()`.
