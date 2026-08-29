# CV Forge

**Live at [cv-forge.appfinningar.se](https://cv-forge.appfinningar.se)**

A multi-user CV builder. Each user keeps a library of CV content — experience, education, skills, projects — and composes multiple named CVs from it, each with its own layout, colour theme, and section order, exported as an A4 PDF.

Designed, built, and deployed solo: Next.js frontend, Postgres data model, Docker image built in CI, self-hosted behind a Cloudflare Tunnel.

<!-- SCREENSHOTS GO HERE — the most-read part of this file.
     Two images earn their place: the CV editor with a CV loaded, and an
     exported A4 page. Put them in docs/ and reference them as
     ![CV editor](docs/editor.png). Until they exist this comment renders as
     nothing, which is better than a broken image. -->

## What it does

- **Import from PDF** — upload an existing CV; Gemini extracts the content and writes it straight into your library
- **Content library** — manage profiles, experience, education, skills, projects, and a catch-all "other" category for certifications and awards
- **Multiple profiles** — several profiles (e.g. "Fullstack Developer", "Mobile Developer"), each with its own headline, bio, and contact details, selectable per CV
- **Compose CVs** — pick which entries to include, in which order, under which layout and colour theme; reorder by drag and drop
- **Skills arranged per CV** — the library holds plain skills; each CV decides its own categories, their order, which are shown, and which skills sit where. Two CVs can present the same set of skills completely differently
- **Chronological mode** — merge experience, education, and projects into a single date-sorted timeline instead of grouped sections
- **Paginated A4 output** — content blocks are measured and distributed across pages so entries are never split mid-block
- **Export to PDF** — A4 export via the browser print dialog, colour theme preserved
- **Auth** — email + password or Google OAuth, with email verification

## Stack

| Layer     | Technology                                                     |
| --------- | --------------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript                            |
| Styling   | Tailwind CSS                                                     |
| Database  | Self-hosted PostgreSQL via Prisma                                |
| Storage   | Cloudflare R2 (S3-compatible)                                    |
| Auth      | Better Auth (email + password + Google OAuth)                    |
| Email     | Resend                                                           |
| AI        | Google Gemini 2.5 Flash (PDF CV parsing)                         |
| Hosting   | Self-hosted, Docker Compose                                      |
| CI/CD     | GitHub Actions → GHCR → Watchtower, with automatic migrations    |
| Ingress   | Cloudflare Tunnel (no reverse proxy)                             |

## CV layouts

Six layouts, selectable per CV, each themeable with a custom sidebar and accent colour:

| ID         | Name     | Description                                                         |
| ---------- | -------- | ------------------------------------------------------------------- |
| `default`  | Classic  | Clean typography on a light grey background                         |
| `modern`   | Modern   | Dark sidebar with gold accents                                      |
| `teal`     | Teal     | Teal sidebar with rating boxes and rounded section headers          |
| `slate`    | Slate    | Dark slate sidebar, indigo accent, grouped skills with dot ratings  |
| `terminal` | Terminal | GitHub-dark palette, monospace, code-style tags, repo-card projects |
| `europass` | Europass | EU-standardised structure with a CEFR language table                |

The layout picker renders live thumbnails that reflect the currently selected theme colours.

## Deployment

Every push to `main` builds the image in GitHub Actions, applies pending Prisma migrations against production via a self-hosted runner, then publishes to GHCR — where Watchtower picks it up and restarts the app. Migrations run *before* the new image ships, so the schema is never behind the code that depends on it. No inbound access to the server is opened at any point.

## Local development

```bash
npm install
cp .env.example .env.local   # see the file for where each value comes from

# A throwaway Postgres for development
docker run -d --name cvforge-dev-db \
  -e POSTGRES_USER=cvforge -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=cvforge \
  -p 127.0.0.1:5432:5432 -v cvforge-dev-db-data:/var/lib/postgresql/data postgres:16

npm run migrate:deploy       # reads DATABASE_URL from .env.local
npm run dev
```

Point `DATABASE_URL` at that container. Development is separated from production in all three dependencies — its own Postgres, its own R2 bucket, and no mail at all: outside production the verification link prints to the console instead of being sent, so `RESEND_API_KEY` can be left blank. See [ARCHITECTURE.md](ARCHITECTURE.md) → Local development database.

## Documentation

[ARCHITECTURE.md](ARCHITECTURE.md) — data model, layout system, auth, deployment runbook, and the reasoning behind the setup.

## Licence

No open-source licence is granted. The source is published so it can be **read
and reviewed** — as a work sample and as a reference — not so it can be reused,
redistributed or deployed. All rights reserved.
