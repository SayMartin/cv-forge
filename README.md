# CV Forge

A multi-user CV creation app. Each user maintains a library of CV content (experience, education, skills, projects, and other entries) and can compose multiple named CVs from that library — each with a selectable layout and colour theme — and export them as A4 PDFs via the browser's built-in print dialog.

## What it does

- **Sign up / sign in** — open registration via email + password or Google OAuth; email verification is required before signing in for the first time
- **Import from PDF** — upload an existing CV as a PDF; AI extracts and writes all content to your library automatically; entries that don't fit standard categories are saved as "Other"
- **Manage content** — edit your profiles, experience, education, skills, projects, and other entries in the `/content` library
- **Multiple profiles** — maintain several profiles (e.g. "Frontend Developer", "Senior Engineer") each with its own headline, bio, and contact details
- **Avatars** — maintain a separate avatar library (up to 5 images); select which avatar to use per CV, independently of the profile
- **Compose CVs** — create named CVs by selecting which library entries to include, which profile and avatar to use, which layout to apply, and an optional colour theme (custom sidebar + accent colours with live thumbnail preview)
- **Preview** — view an A4 browser preview of any CV before exporting
- **Export to PDF** — print an A4 PDF via the browser's print-to-PDF dialog; the selected colour theme is applied to the output
- **Account settings** — sign out or permanently delete your account and all associated data from `/settings`

## Stack

| Layer     | Technology                                                     |
| --------- | --------------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript                            |
| Styling   | Tailwind CSS                                                     |
| Database  | Self-hosted PostgreSQL via Prisma — all data                     |
| Storage   | MinIO (self-hosted S3-compatible object storage)                 |
| Auth      | Better Auth (email + password + Google OAuth)                    |
| Email     | Resend (`noreply@appfinningar.se`)                                |
| AI        | Google Gemini 2.5 Flash                                          |
| PDF       | Browser `window.print()`                                         |
| Hosting   | Self-hosted (Docker + Docker Compose, `cv-forge.appfinningar.se`) |
| Proxy     | Nginx Proxy Manager + Cloudflare Tunnel                           |

For a full technical breakdown see [ARCHITECTURE.md](ARCHITECTURE.md).

## Local development

### Prerequisites

- Node.js 20+
- A PostgreSQL database (any standard Postgres instance — self-hosted or managed)
- An S3-compatible storage bucket (MinIO, self-hosted, or any S3-compatible provider)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)
- A [Google Cloud Console](https://console.cloud.google.com/apis/credentials) OAuth 2.0 Client ID (for Google sign-in)
- A [Resend](https://resend.com) account with a verified sending domain

### 1. Clone and install

```bash
git clone <repo-url>
cd cv-cms
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

See `.env.example` for the full list of variables and comments on where each value comes from. For local development, point `DATABASE_URL` and `S3_*` at any Postgres and S3-compatible instance you have reachable (e.g. a local MinIO container run separately, or your self-hosted production instances).

For Google OAuth, register `http://localhost:3000` as an authorised origin and `http://localhost:3000/api/auth/callback/google` as a redirect URI in Google Cloud Console.

### 3. Run database migrations

```bash
npm run migrate:deploy
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key URLs

| URL              | Description                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `/`              | Landing page — hero, how-it-works steps, CTAs for new visitors                                   |
| `/sign-up`       | Create an account (email + password or Google)                                                   |
| `/sign-in`       | Sign in                                                                                          |
| `/content`       | Content library — manage profiles, avatars, experience, education, skills, projects, other       |
| `/cvs`           | Your CV list                                                                                     |
| `/cvs/[id]`      | CV editor — select entries, choose layout with live thumbnail, pick avatar, manage colour themes |
| `/cvs/[id]/view` | A4 preview + export to PDF                                                                       |
| `/import`        | Import a CV from a PDF file                                                                      |
| `/settings`      | Account settings — sign out, delete account                                                      |

## CV Layouts

Five layouts are available, selectable per CV:

| ID         | Name     | Description                                                         |
| ---------- | -------- | ------------------------------------------------------------------- |
| `default`  | Classic  | Clean typography on a light grey background                         |
| `modern`   | Modern   | Two-column dark sidebar with gold accents                           |
| `teal`     | Teal     | Teal sidebar with rating boxes and rounded section headers          |
| `slate`    | Slate    | Dark slate sidebar, indigo accent, grouped skills with dot ratings  |
| `terminal` | Terminal | GitHub-dark palette, monospace, code-style tags, repo-card projects |

Each layout supports an optional **colour theme** — a named set of sidebar and accent colours stored in the `cv_theme` table and shared across any CV that selects it. Changes to a theme propagate immediately to all CVs using it. The layout picker shows live `120×170 px` thumbnails reflecting the current theme colours.

### Adding a new CV layout

1. Create `src/components/cv-layouts/YourLayout.tsx` (web preview, Tailwind)
2. Add a thumbnail component `src/components/cv-layouts/thumbnails/YourThumb.tsx`
3. Add an entry to `CV_LAYOUTS` in `src/lib/cv-layouts.ts`
4. Register the layout and thumbnail in `src/components/cv-layouts/index.ts` and `thumbnails/index.tsx`

The new layout will appear immediately in the layout picker on every CV editor.

## Creating content

All content (profiles, avatars, experience, education, skills, projects, other) is managed in the `/content` library. Each tab lets you create, edit, and delete entries. All data is stored in PostgreSQL and scoped to the logged-in user.

The **Avatar** tab holds up to 5 images per user. It is separate from the profile — one avatar library is shared across all profiles. The CV editor lets you pick which image to use (or none); the chosen index is stored on the CV record and resolved to a URL at render time.

The **Other** tab is a catch-all for entries that don't fit standard categories — certifications, awards, publications, volunteer work, courses, etc. Each entry has a title, optional subtitle (issuer/organisation), date, description, and URL.

## Scripts

```bash
npm run dev              # start development server
npm run build            # production build
npm run migrate:dev      # create and apply a new migration (development)
npm run migrate:deploy   # apply pending migrations (production)
npm run prisma:generate  # regenerate Prisma client after schema changes
```

## Deployment (self-hosted, Docker + CI/CD)

The app is self-hosted via Docker Compose. It runs alongside other services on the same server, reusing an existing PostgreSQL container for the database and a MinIO container (defined in `docker-compose.yml`) for file storage.

The image is **not built on the server**. GitHub Actions (`.github/workflows/build-and-push.yml`) builds the Docker image on every push to `main` and pushes it to GitHub Container Registry (`ghcr.io/saymartin/cv-forge`). A [Watchtower](https://containrrr.dev/watchtower/) container on the server polls the registry every 60 seconds and automatically pulls + restarts the app when a new image is published — no SSH access from CI into the server is needed, since the server only makes outbound requests.

### 0. One-time server setup

The server needs registry credentials so both `docker compose pull` and Watchtower can pull the (private) image:

```bash
docker login ghcr.io -u SayMartin   # password: a GitHub PAT with `read:packages` scope
```

### 1. Environment file

Copy `.env.example` to `.env` on the server and fill in production values:

- `DATABASE_URL` / `DIRECT_URL` — point at the existing Postgres container's network alias, using a dedicated database + user created for this app (see step 2)
- `BETTER_AUTH_URL` = `https://cv-forge.appfinningar.se`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — add `https://cv-forge.appfinningar.se` as an authorised origin and `https://cv-forge.appfinningar.se/api/auth/callback/google` as a redirect URI in Google Cloud Console
- `RESEND_API_KEY` — from Resend dashboard; requires a verified sending domain with DKIM + SPF records in DNS
- `EMAIL_FROM` — sender address, must be on the verified Resend domain
- `S3_ENDPOINT` / `S3_PUBLIC_URL` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` — MinIO connection details (access key/secret should match `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` below)
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` — credentials for the MinIO container itself

### 2. Create the database

On the existing Postgres container:

```bash
docker exec -it <postgres-container-name> psql -U postgres -c \
  "CREATE DATABASE cvforge; CREATE USER cvforge WITH PASSWORD '...'; GRANT ALL PRIVILEGES ON DATABASE cvforge TO cvforge;"
```

### 3. Start

```bash
docker compose up -d
```

This pulls the latest published image and starts the app, MinIO, Watchtower, and a one-off `minio-init` job that creates the storage bucket with public read access. Watchtower then keeps `app` up to date automatically on every subsequent push to `main` — no manual pull/restart needed after the first run.

### 4. Run migrations

```bash
docker compose exec app npx prisma migrate deploy
```

Re-run this after any deploy that includes schema changes.

### 5. Reverse proxy

Add a Public Hostname for `cv-forge.appfinningar.se` in the Cloudflare Zero Trust dashboard, and a matching Proxy Host in Nginx Proxy Manager pointing at the `app` container's published port (`3005` by default — see `docker-compose.yml`). Repeat for the MinIO public hostname (`S3_PUBLIC_URL`) pointing at MinIO's published API port (`9000`).
