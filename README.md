# CV Forge

**Live at [cv-forge.appfinningar.se](https://cv-forge.appfinningar.se)**

A multi-user CV builder. Each user keeps a library of CV content — experience, education, skills, projects — and composes multiple named CVs from it, each with its own layout, colour theme, and section order, exported as an A4 PDF.

Designed, built, and deployed solo: Next.js frontend, Postgres data model, Docker image built in CI, self-hosted behind a Cloudflare Tunnel.

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

## Running it

The repository is published to be read rather than deployed (see **Licence**), and
in practice it cannot be run by anyone else without a Gemini key, a Resend key on
a verified domain, an R2 bucket with its own scoped token, and a Google OAuth
client. What follows is here to document the environment contract — what the app
actually depends on, and how development is kept apart from production — not as
an invitation to stand up a copy.

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

## Some decisions, and why

The parts of this codebase worth reading are the ones where the obvious approach
was wrong. Each links into the section that explains it properly.

- **Migrations apply before the new image ships, not after.** A schema change once
  reached production hours after the code that depended on it, and the app spent
  that window returning `ColumnNotFound` on every page. The pipeline is now
  ordered so that cannot recur, and it fails closed if the migration step cannot
  run at all — [Deployment model](ARCHITECTURE.md#deployment-model)
- **API errors travel as codes, not sentences.** A Route Handler cannot read
  `next/root-params`, so it has no way of knowing what language the page that
  called it is rendering in. The route sends a code; the client, which does know,
  turns it into words — [API errors](ARCHITECTURE.md#api-errors-travel-as-codes-not-sentences)
- **A CV's language is not the app's language.** A Swedish speaker applying abroad
  keeps a Swedish interface and exports an English CV. Two separate axes, two
  separate stores, and the CV renderer is deliberately forbidden from reading the
  request's locale — [The CV's language](ARCHITECTURE.md#the-cvs-language-is-not-the-apps-language)
- **The skill library is dumb; the CV decides.** A skill row knows its name and
  nothing else. Category, order and visibility are per-CV, so two CVs can present
  the same skills completely differently — [Skills](ARCHITECTURE.md#skills--the-library-is-dumb-the-cv-decides)
- **Page breaks are measured, not guessed.** Content is rendered off-screen,
  measured, and distributed into A4 pages so an entry is never split across a
  boundary. It is also why changing a CV's language can change where the breaks
  fall — [CV layout system](ARCHITECTURE.md#cv-layout-system)

## Documentation

[ARCHITECTURE.md](ARCHITECTURE.md) — data model, layout system, auth, deployment
runbook, and the reasoning behind the setup. It is the longer half of this
project and the part that documents *why*, including the decisions that were
later found to be wrong and corrected.

## Licence

No open-source licence is granted. The source is published so it can be **read
and reviewed** — as a work sample and as a reference — not so it can be reused,
redistributed or deployed. All rights reserved.
