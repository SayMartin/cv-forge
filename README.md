# CV Creator

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

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript          |
| Styling   | Tailwind CSS                                  |
| Database  | Neon (PostgreSQL) via Prisma — all data       |
| Storage   | Vercel Blob (avatar image uploads)            |
| Auth      | Better Auth (email + password + Google OAuth) |
| Email     | Resend (`noreply@mail.appfinningar.se`)        |
| AI        | Google Gemini 2.5 Flash                       |
| PDF       | Browser `window.print()`                      |
| Hosting   | Vercel (`cv-creator.appfinningar.se`)         |
| DNS       | Cloudflare                                    |

For a full technical breakdown see [ARCHITECTURE.md](ARCHITECTURE.md).

## Local development

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store (must be **public** access)
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

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://...          # Neon pooled connection string
DIRECT_URL=postgresql://...            # Neon direct connection string (for migrations)

BLOB_READ_WRITE_TOKEN=                 # Vercel Blob store token (public store)

GEMINI_API_KEY=                        # Google AI Studio

BETTER_AUTH_SECRET=                    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=                      # Google Cloud Console → OAuth 2.0 credentials
GOOGLE_CLIENT_SECRET=

RESEND_API_KEY=                        # Resend dashboard → API Keys
```

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

All content (profiles, avatars, experience, education, skills, projects, other) is managed in the `/content` library. Each tab lets you create, edit, and delete entries. All data is stored in Neon and scoped to the logged-in user.

The **Avatar** tab holds up to 5 images per user. It is separate from the profile — one avatar library is shared across all profiles. The CV editor lets you pick which image to use (or none); the chosen index is stored on the CV record and resolved to a URL at render time.

The **Other** tab is a catch-all for entries that don't fit standard categories — certifications, awards, publications, volunteer work, courses, etc. Each entry has a title, optional subtitle (issuer/organisation), date, description, and URL.

## Scripts

```bash
npm run dev              # start development server
npm run build            # production build
npm run migrate:dev      # create and apply a new migration (development)
npm run migrate:deploy   # apply pending migrations (production / Neon)
npm run prisma:generate  # regenerate Prisma client after schema changes
```

## Deployment

Deploy to Vercel. Set the environment variables listed above under **Project → Settings → Environment Variables**, with these production values:

- `BETTER_AUTH_URL` = `https://cv-creator.appfinningar.se`
- `BLOB_READ_WRITE_TOKEN` — from a **public** Vercel Blob store linked to the project
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — add `https://cv-creator.appfinningar.se` as an authorised origin and `https://cv-creator.appfinningar.se/api/auth/callback/google` as a redirect URI in Google Cloud Console
- `RESEND_API_KEY` — from Resend dashboard; requires a verified sending domain with DKIM + SPF records in DNS

Run migrations against your production database after each deploy that includes schema changes:

```bash
npm run migrate:deploy
```
