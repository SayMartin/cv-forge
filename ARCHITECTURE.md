# Architecture — CV Forge

> Multi-user CV creation app built on Next.js, self-hosted PostgreSQL, Docker, Cloudflare R2, and Resend.

---

## Stack

| Layer     | Technology                                  | Purpose                                                    |
| --------- | ------------------------------------------- | ---------------------------------------------------------- |
| Framework | Next.js (App Router) + TypeScript           | Frontend + API routes                                      |
| Styling   | Tailwind CSS                                | UI                                                         |
| Database  | Self-hosted PostgreSQL via Prisma ORM       | All app data: users, sessions, CVs, themes, all content    |
| Storage   | Cloudflare R2 (S3-compatible)               | Avatar image uploads                                       |
| Auth      | Better Auth — email + password + Google OAuth | Authentication + role-based access                       |
| Email     | Resend (`noreply@appfinningar.se`)           | Transactional email — email verification on sign-up        |
| Hosting   | Self-hosted (Docker Compose on a home server, "smurfserver") | Deploy                                    |
| CI/CD     | GitHub Actions (build + push to GHCR) + a self-hosted runner on the server (auto-migrate) + Watchtower (auto-pull) | Build offloaded from the server; zero-touch deploy *and* migration on push to `main` |
| Routing   | Cloudflare Tunnel (direct to host ports)    | Public ingress + TLS termination, no reverse proxy          |
| DNS       | Cloudflare                                  | DNS + CDN for `appfinningar.se`                            |
| AI        | Google Gemini 2.5 Flash (via Vercel AI SDK) | PDF CV parsing + structured extraction                     |
| PDF       | Browser `window.print()`                    | Client-side A4 PDF via print-to-PDF dialog                 |
| Drag & drop | `@dnd-kit`                                | Section order + entry reordering in the CV editor          |

---

## System Diagram

```
                    ┌────────────┐
                    │ Cloudflare │  DNS + Tunnel (TLS termination)
                    └─────┬──────┘
                          │ cv-forge.appfinningar.se → smurfserver:3005
                          │ files.appfinningar.se → R2 Custom Domain
                          ▼
┌────────────────────────────────────────────┐
│  smurfserver (Docker Compose)               │
│  ┌────────────┐   ┌──────────────────────┐ │
│  │  app        │──▶│  Postgres (existing,  │ │
│  │  (Next.js)  │   │  shared container)    │ │
│  └─────┬──────┘   └──────────────────────┘ │
│        │           ┌──────────────────────┐ │
│        │           │  Watchtower           │ │
│        │           │  (polls GHCR, auto-   │ │
│        │           │   updates `app`)      │ │
│        │           └──────────────────────┘ │
└────────┼─────────────────────────────────────┘
         │
    ┌────┼──────────────┬──────────────┐
    ▼           ▼              ▼              ▼
┌──────────┐  ┌────────────┐  ┌──────────────┐  ┌────────┐
│ Cloudflare│  │  Google    │  │ GitHub       │  │ Resend │
│    R2     │  │  Gemini    │  │ Actions/GHCR │  │ (Email)│
│ (avatars) │  │ (PDF→Prisma)│  │ (CI/CD)      │  │        │
└──────────┘  └────────────┘  └──────────────┘  └────────┘
```

### Data ownership

Everything lives in a **self-hosted PostgreSQL** instance via Prisma. There is no external CMS.

- **PostgreSQL** (self-hosted, shared with other services on the same server, own database `cvforge`) — all data: users, sessions, CV compositions (`cv`), colour themes (`cv_theme`), profiles, avatars, experience, education, skills, projects, other entries
- **Cloudflare R2** — avatar image files (public URLs stored in the `avatar` table). Bucket exposes a public Custom Domain (`files.appfinningar.se`).

### Deployment model

The app is **not built on the server**. `.github/workflows/build-and-push.yml` runs three sequential jobs on every push to `main`: `build-migrator` (builds + pushes the `:migrator` tag to GHCR) → `migrate` (applies pending Prisma migrations against production) → `build-app` (builds + pushes `:latest`/`:sha`). A Watchtower container on the server polls the registry (every 60s) and auto-pulls + restarts `app` when a new image appears.

The `migrate` job runs on a **self-hosted GitHub Actions runner installed directly on the server**, rather than a GitHub-hosted runner over SSH — this lets it reach the `postgres_default` docker network directly with no inbound access (SSH or otherwise) opened to the server; the runner only makes outbound polling requests to GitHub, same trust model as Watchtower. Building `build-app` *after* `migrate` (rather than in parallel) is deliberate: it guarantees the schema is always migrated before Watchtower can deploy code that depends on it, closing a gap that caused a production outage on 2026-07-26 (a schema-dependent code change shipped via Watchtower while the corresponding migration was never applied, since migrations were a manual, easy-to-forget step at the time).

The same build/push steps can also be run manually from a dev machine via `npm run docker:build`, `docker:build:migrator`, and `docker:push` (see `package.json`) — the GitHub Actions workflow is a convenience automation of these same commands, not the only path to a deployable image.

---

## Authentication & Roles

- Provider: **[Better Auth](https://better-auth.com)** — stable, framework-agnostic auth library
- Strategies: **email + password** and **Google OAuth** (`socialProviders.google`), both via the Better Auth core; `admin()` plugin adds role management
- **Email verification required** — the account is inactive until the link is clicked. Better Auth's own auto-send on sign-up is disabled (`emailVerification.sendOnSignUp: false`) because it swallows send failures; instead, `sign-up/page.tsx` explicitly calls `authClient.sendVerificationEmail(...)` right after account creation and surfaces a real error to the user if Resend fails (invalid recipient, misconfigured API key, etc.) instead of always showing a false "check your email" success state
- Session storage: self-hosted PostgreSQL via `better-auth/adapters/prisma`
- Cookie name: `better-auth.session_token`
- Sign-up at `/sign-up` (open registration) — email+password form or "Continue with Google" button; new accounts receive `role: "user"` automatically
- Google OAuth redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google` — must be registered in Google Cloud Console
- Two roles stored on the `user` table (added by admin plugin):

| Role    | Access                                   |
| ------- | ---------------------------------------- |
| `user`  | Full CV management + content library     |
| `admin` | All of the above + user management       |

- **Better Auth schema** uses lowercase table names (`user`, `session`, `account`, `verification`) with camelCase column names. The admin plugin adds `role`, `banned`, `banReason`, `banExpires` to `user` and `impersonatedBy` to `session`.
- **`account.issuer`** (Better Auth ≥ 1.7) identifies which authority established the account, and is **matched during sign-in** — both the credential path (`providerId === 'credential' && issuer === 'local:credential' && accountId === user.id`) and the OAuth path (`findAccountByKey({ issuer, accountId })`). A wrong value does not raise an error; it fails login as `INVALID_EMAIL_OR_PASSWORD`, so any change touching this column risks a silent lockout. Providers that declare no issuer of their own get a synthetic one from `@better-auth/core/db`: `local:<providerId>` for local providers and `local:oauth:<providerId>` for OAuth. The built-in Google provider sets no `accountIssuer`, so its rows are `local:oauth:google` — **not** `https://accounts.google.com`.
- The column is deliberately **nullable** even though Better Auth always writes it. Migrations are applied before the new image ships, so a rollback to the previous image runs 1.6 code that omits the field entirely; under `NOT NULL` that breaks account creation at precisely the moment rolling back is the goal. Tighten it in a follow-up migration once the version has proven itself.

---

## Project Structure

```
cv-cms/
├── src/
│   ├── proxy.ts                                     ← locale routing (Next 16's renamed middleware); redirects bare paths to /sv or /en
│   ├── i18n/
│   │   ├── config.ts                                ← LOCALES, DEFAULT_LOCALE, Locale, isLocale(), LOCALE_COOKIE
│   │   ├── routing.ts                               ← localeHref() / stripLocale() / swapLocale(); pure, used on both sides
│   │   ├── negotiate.ts                             ← pickLocale(Accept-Language); hand-rolled, no deps (proxy runs per request)
│   │   ├── useLocale.ts                             ← "use client" — active locale, derived from usePathname()
│   │   ├── server.ts                                ← getLocale() / localePath() / getDictionary() via next/root-params (Server Components only)
│   │   ├── format.tsx                               ← format() for "{name}" placeholders; <RichText> for the node-valued version
│   │   ├── DictionaryProvider.tsx                   ← "use client" — context + useDictionary(); mounted in the root layout
│   │   └── dictionaries/
│   │       ├── index.ts                             ← dictionaryFor(locale); Record<Locale, Dictionary>
│   │       ├── en/                                  ← the reference dictionary; its shape IS the contract
│   │       │   ├── index.ts                         ← composes the slices and exports `type Dictionary`
│   │       │   └── common.ts, nav.ts, footer.ts, landing.ts
│   │       └── sv/                                  ← same file list; each slice annotated Dictionary["<slice>"]
│   ├── app/
│   │   ├── not-found.tsx                            ← the 404 for notFound(); sits OUTSIDE [lang] because nothing inside it works — see Internationalisation
│   │   ├── [lang]/                                  ← every page lives under /sv or /en; `lang` is a root param
│   │   │   ├── layout.tsx                           ← root layout: <html lang>, fonts, metadata, DictionaryProvider
│   │   │   ├── (auth)/
│   │   │   │   ├── layout.tsx                      ← metadata: robots noindex for the whole group
│   │   │   │   ├── PasswordField.tsx               ← shared eye-toggle password input component
│   │   │   │   ├── GoogleSignInButton.tsx          ← shared "Continue with Google" OAuth button
│   │   │   │   ├── sign-in/
│   │   │   │   │   ├── layout.tsx                  ← metadata: title "Sign In"
│   │   │   │   │   └── page.tsx                    ← Google button + email/password form, reads ?callbackUrl
│   │   │   │   └── sign-up/
│   │   │   │       ├── layout.tsx                  ← metadata: title "Sign Up"
│   │   │   │       └── page.tsx                    ← Google button + email + password + confirm; instant account creation
│   │   │   ├── (main)/                              ← route group with shared nav layout
│   │   │   │   ├── layout.tsx                       ← reads session; renders BotanicalBackground + NavBar; footer with support email
│   │   │   │   ├── NavBar.tsx                       ← client nav; logo + wordmark + LanguageToggle; desktop inline / mobile hamburger
│   │   │   │   ├── SignOutButton.tsx                ← client sign-out; variant="nav"|"page"
│   │   │   │   ├── page.tsx                         ← landing page: hero + how-it-works (4 steps) + CTA (visitors only)
│   │   │   │   ├── import/
│   │   │   │   │   ├── layout.tsx                   ← metadata: title "Import CV"
│   │   │   │   │   └── page.tsx                     ← PDF CV import UI
│   │   │   │   ├── content/
│   │   │   │   │   ├── page.tsx                     ← tabbed content library (auth-gated)
│   │   │   │   │   ├── ContentTabs.tsx              ← client tab switcher; open tab lives in ?tab=, carries ?from= back to a CV
│   │   │   │   │   ├── AvatarsTab.tsx               ← upload / remove avatar images (POST/PATCH /api/avatars); max 5, 5 MB, JPEG/PNG/WebP
│   │   │   │   │   ├── ProfilesTab.tsx
│   │   │   │   │   ├── ExperienceTab.tsx
│   │   │   │   │   ├── EducationTab.tsx
│   │   │   │   │   ├── SkillsTab.tsx                ← flat alphabetical skill library; delete lives inside the edit card
│   │   │   │   │   ├── SkillCategoryManager.tsx     ← create/rename/reorder/delete categories (max 8; the language one is locked)
│   │   │   │   │   ├── ProjectsTab.tsx
│   │   │   │   │   └── OtherTab.tsx
│   │   │   │   ├── privacy/
│   │   │   │   │   └── page.tsx                     ← privacy policy; not auth-gated, linked from footer + sign-up
│   │   │   │   ├── settings/
│   │   │   │   │   ├── page.tsx                     ← account card (email, sign-out, delete account)
│   │   │   │   │   └── DeleteAccountSection.tsx     ← client: email-confirm dialog → DELETE /api/user
│   │   │   │   └── cvs/
│   │   │   │       ├── page.tsx                     ← CV list + create (auth-gated)
│   │   │   │       ├── CreateCvForm.tsx             ← "New CV" client form
│   │   │   │       ├── DuplicateCvButton.tsx
│   │   │   │       └── [cvId]/
│   │   │   │           ├── page.tsx                 ← CV editor page (server); renders CvEditShell
│   │   │   │           ├── CvEditShell.tsx          ← client wrapper: builds the breadcrumb + Preview link and passes them to CvEditor as header slots; holds live CV name and the dirty flag
│   │   │   │           ├── CvSwitcher.tsx           ← select dropdown to switch between CVs
│   │   │   │           ├── CvEditor.tsx             ← layout picker + theme picker + profile radio + avatar picker + entry checkboxes + section order + cover letter; sticky header carrying the trail, Revert/Save and Preview; maxLength on all text inputs; calls onNameChange on successful save
│   │   │   │           ├── SectionOrderEditor.tsx   ← drag-and-drop section reorder (dnd-kit)
│   │   │   │           ├── SortableEntryList.tsx    ← drag-and-drop entry list with checkboxes
│   │   │   │           ├── CvSkillsEditor.tsx       ← per-CV skill grouping: reorder categories, drag skills between them, show/hide
│   │   │   │           ├── UnsavedChangesGuard.tsx  ← beforeunload + capture-phase link interception while the editor is dirty
│   │   │   │           └── view/
│   │   │   │               ├── page.tsx             ← A4 CV preview (server)
│   │   │   │               ├── CvScaleWrapper.tsx   ← client wrapper: scales CV to fit viewport (transform: scale)
│   │   │   │               ├── ViewToolbar.tsx      ← sticky client toolbar: `← Back to <CV name>` | layout badge + PDF
│   │   │   │               └── ExportButton.tsx     ← "Save as PDF" client button (calls window.print())
│   │   └── api/
│   │       ├── auth/[...all]/route.ts               ← Better Auth catch-all handler
│   │       ├── cv-import/route.ts                   ← PDF → Gemini → Prisma write (all content types)
│   │       ├── profiles/route.ts                    ← POST: create Profile
│   │       ├── profiles/[id]/route.ts               ← PATCH + DELETE profile by id
│   │       ├── cvs/route.ts                         ← GET (list) + POST (create) CVs
│   │       ├── cvs/[cvId]/route.ts                  ← GET + PATCH + DELETE CV
│   │       ├── cvs/[cvId]/duplicate/route.ts        ← POST: copy CV with all selections intact; name prefixed "Copy of …"
│   │       ├── themes/route.ts                      ← GET (list) + POST (create) CvThemes
│   │       ├── themes/[themeId]/route.ts             ← PATCH + DELETE CvTheme
│   │       ├── avatars/route.ts                     ← GET (list) + POST (upload to R2 + save URL to Postgres) + PATCH (remove one image)
│   │       ├── content/
│   │       │   ├── experience/route.ts + [id]/route.ts
│   │       │   ├── education/route.ts + [id]/route.ts
│   │       │   ├── skills/route.ts + [id]/route.ts  ← DELETE also strips the id from every CV's skillIds and skillGroups
│   │       │   ├── skill-categories/route.ts + [id]/route.ts
│   │       │   ├── projects/route.ts + [id]/route.ts
│   │       │   └── other/route.ts + [id]/route.ts
│   │       └── user/route.ts                        ← DELETE: prisma.user.delete() → cascades all content
│   │   ├── globals.css                              ← these four stay at the app root, NOT under [lang]:
│   │   ├── icon.svg                                    they are metadata/asset file conventions, need no
│   │   ├── robots.ts                                   root layout above them, and are origin-scoped —
│   │   └── sitemap.ts                                  /sv/robots.txt would be meaningless
│   ├── components/
│   │   ├── LocaleLink.tsx                           ← the app's ONLY internal link; wraps next/link with the locale prefix
│   │   ├── LanguageToggle.tsx                       ← flag + SV/EN in the navbar; plain <a>, so switching is a full page load
│   │   ├── ActionChip.tsx                           ← shared small secondary action (Edit / Delete / All / My Content →); tone="accent"|"danger"|"danger-strong"; Link when href is given
│   │   ├── Breadcrumbs.tsx                          ← Breadcrumbs / CrumbLink / CrumbCurrent; used by the CV editor
│   │   ├── BackToCvLink.tsx                         ← `← Back to <CV name>`; shared by My Content and the preview toolbar
│   │   ├── Logo.tsx                                 ← inline SVG logo (page + leaf motif); uses currentColor; matches app icon
│   │   ├── BotanicalBackground.tsx                  ← fixed full-viewport SVG; two vine clusters; 0.3 opacity; print:hidden
│   │   └── cv-layouts/
│   │       ├── index.ts                             ← getLayoutComponent() registry
│   │       ├── DefaultLayout.tsx
│   │       ├── ModernLayout.tsx
│   │       ├── TealSidebarLayout.tsx
│   │       ├── SlateLayout.tsx
│   │       ├── TerminalLayout.tsx
│   │       ├── EuropassLayout.tsx
│   │       ├── pagination/
│   │       │   ├── Paginated.tsx                    ← measures blocks, distributes them across A4 pages
│   │       │   └── types.ts                         ← PageBlock type shared by all layouts
│   │       └── thumbnails/
│   │           ├── index.tsx
│   │           ├── LayoutThumb.tsx                  ← the registration point (switch on layoutId)
│   │           ├── DefaultThumb.tsx
│   │           ├── ModernThumb.tsx
│   │           ├── TealThumb.tsx
│   │           ├── SlateThumb.tsx
│   │           ├── TerminalThumb.tsx
│   │           └── EuropassThumb.tsx
│   └── lib/
│       ├── auth.ts                                  ← exported `auth` singleton (Better Auth)
│       ├── auth-client.ts                           ← createAuthClient ("use client" only)
│       ├── color-utils.ts                           ← HSL color math: darkenColor, lightenColor, getContrastColor, hexToRgba, mixColors, sidebarGradient
│       ├── cv-content-types.ts                      ← shared CvContent / section types
│       ├── cv-layouts.ts                            ← CV_LAYOUTS registry + getLayoutMeta()
│       ├── cv-theme.ts                              ← CvTheme type { id, name, sidebarColor, accentColor }
│       ├── prisma.ts                                ← global Prisma singleton (PrismaPg adapter)
│       └── r2.ts                                   ← S3-compatible client (Cloudflare R2, via @aws-sdk/client-s3): blobPut, blobDelete
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── prisma.config.ts
```

---

## Profiles

Each user can have **multiple profiles** (e.g. "Frontend Developer", "Senior Engineer"). Profiles are distinguished by the required `profileName` field and are selected per-CV via a radio button in the CV editor.

**Profile Prisma model fields:**

- `profileName` — required; display label in the CV editor radio list
- `name` — the person's actual full name
- `headline`, `bio`, `email`, `phone`, `location` — standard contact/intro fields
- `linkedin`, `github`, `website`, `portfolio` — social/link fields (stored flat, not nested)
- `userId` — FK → `user.id`, CASCADE delete

Profiles are created via `POST /api/profiles` or managed directly in the `/content` tab.

### Avatars

Avatars are stored in **Postgres** (one `avatar` row per user) with image files in **Cloudflare R2** (public bucket, via a Custom Domain). They are decoupled from profiles — the same avatar library applies to all profiles, and layouts may render an avatar at any position (or not at all).

**`avatar` Prisma model fields:**

| Column      | Type            | Notes                                    |
| ----------- | --------------- | ---------------------------------------- |
| `id`        | `TEXT` (cuid)   | Primary key                              |
| `userId`    | `TEXT` (unique) | FK → `user.id`, CASCADE delete           |
| `images`    | `TEXT[]`        | Up to 5 R2 public URLs                   |
| `createdAt` | `TIMESTAMP`     |                                          |
| `updatedAt` | `TIMESTAMP`     |                                          |

Upload constraints: max 5 images, 5 MB each, JPEG / PNG / WebP only. Managed via `GET/POST/PATCH /api/avatars`.

The CV editor (`/content` → Avatars tab) shows the user's avatar images as clickable thumbnails. The selected index (`avatarIndex`) is stored on the `cv` record. The view page resolves the index to a URL by fetching the `avatar` row and indexing into `images[]`, then passes it as `CvContent.avatarUrl` — layouts always receive a plain `string | null`, never the index.

> **The R2 bucket must have public access enabled** (via a Custom Domain, `files.appfinningar.se`) and `next.config.ts`'s `images.remotePatterns` must include that hostname — this is derived at **Docker build time** from the `S3_PUBLIC_URL` build argument, not read at runtime, so the build must be given that value (see `.github/workflows/build-and-push.yml`).

### Two buckets, and why addressing style matters

Storage is split per environment: `cv-forge-bucket-eu` in production, `cv-forge-dev-bucket` in development, each with its own API token scoped to that one bucket. Both are created with **EU jurisdiction**, which keeps uploaded photos stored inside the EU and means the S3 endpoint carries a `.eu.` segment (`https://<account-id>.eu.r2.cloudflarestorage.com`). A jurisdictional bucket is invisible to the plain endpoint, which fails as though the bucket did not exist.

`src/lib/r2.ts` uses the SDK's default **virtual-hosted** addressing, and must keep doing so. With `forcePathStyle: true` the bucket travels in the path, and R2 does not reject a request naming a bucket the token has no rights to — it writes the object, treating the whole path as the key. A mismatch between `S3_BUCKET` and the token's bucket therefore lands data in the *token's* bucket under a key like `other-bucket-name/avatars/…`, silently and with a success response. This is not hypothetical: it put stray objects in the production bucket on 2026-08-22. Virtual-hosted addressing puts the bucket in the hostname, where the same mistake fails loudly.

The app uses `PutObject`, `DeleteObject`, and — for account deletion — `ListObjectsV2` and `DeleteObjects`. All four are covered by an **`Object Read & Write`** token. Neither token needs `Admin Read & Write`, which would also grant the right to create and delete buckets; the app has no business with either.

`scripts/verify-r2-config.mts` checks a configuration against all of this; run it after changing a bucket, token, or endpoint.

---

## Multi-user & CV Compositions

### All content in Postgres

Every content model (`Profile`, `Experience`, `Education`, `Skill`, `Project`, `Other`, `Avatar`) has a `userId` FK → `user.id` with `onDelete: Cascade`. Querying is simple Prisma `findMany({ where: { userId } })` — no GROQ, no external CMS.

### CV compositions (`cv` table)

A **CV** is a named, versioned selection of the user's content entries plus a chosen layout and avatar.

| Column          | Type          | Notes                                                |
| --------------- | ------------- | ---------------------------------------------------- |
| `id`            | `TEXT` (cuid) | Primary key                                          |
| `name`          | `TEXT`        | User-chosen, e.g. "Backend Engineer 2026"; max 100 chars |
| `userId`        | `TEXT`        | FK → `user.id`, CASCADE delete                       |
| `layoutId`      | `TEXT`        | Default `"default"` — key into `CV_LAYOUTS` registry |
| `themeId`       | `TEXT?`       | FK → `cv_theme.id`, SET NULL on theme delete         |
| `profileId`     | `TEXT?`       | Prisma `id` of selected Profile row                  |
| `avatarIndex`   | `INT?`        | Index into `avatar.images[]`; `null` = no avatar     |
| `experienceIds` | `TEXT[]`      | Prisma `id` values of selected Experience rows       |
| `educationIds`  | `TEXT[]`      | Prisma `id` values of selected Education rows        |
| `skillIds`      | `TEXT[]`      | Prisma `id` values of selected Skill rows            |
| `skillGroups`   | `JSONB?`      | This CV's skill arrangement — see below              |
| `projectIds`    | `TEXT[]`      | Prisma `id` values of selected Project rows          |
| `otherIds`      | `TEXT[]`      | Prisma `id` values of selected Other rows            |
| `sectionOrder`  | `TEXT[]`      | Section display order in the CV renderer             |
| `targetRole`    | `TEXT?`       | "Tailored for" label — shown in CV list only; max 100 chars |
| `coverLetter`   | `TEXT?`       | Printed as a separate page before the CV; max 5000 chars |

### Skills — the library is dumb, the CV decides

A skill row carries only what is true about the skill everywhere: its name, an optional 1–5 level, and an optional CEFR level. It has **no category and no sort order**. Those are per-CV decisions, so they live on the CV.

Categories are user-defined, up to eight, in `skill_category`:

| Column   | Type          | Notes                                                              |
| -------- | ------------- | ------------------------------------------------------------------ |
| `id`     | `TEXT` (cuid) | Primary key                                                        |
| `userId` | `TEXT`        | FK → `user.id`, CASCADE delete                                     |
| `name`   | `TEXT`        | Unique per user                                                    |
| `kind`   | `TEXT`        | `"normal"`, or `"language"` for the one Europass needs             |
| `order`  | `INT`         | Order in the management UI — *not* the order on any CV             |

`kind` exists so that the **role** of a category survives a rename. Europass renders a CEFR table, and the layouts find that group with `kind === "language"` rather than by matching a heading, which free-text names would make unreliable. The language category cannot be renamed or deleted; every other one can.

`cv.skillGroups` holds the arrangement, ordered:

```jsonc
[
  { "categoryId": "skc_…", "skillIds": ["cm…", "cm…"] },
  { "categoryId": "skc_…", "skillIds": ["cm…"], "hidden": true }
]
```

Two CVs can therefore lay out the same library completely differently — different categories, different order, different visibility — which is the entire point of keeping the content dumb.

**The invariant:** a skill may only be selected if it is placed in a group. `PATCH /api/cvs/[cvId]` enforces this on every write by intersecting `skillIds` with the ids present in `skillGroups`, so an unplaced skill cannot be smuggled onto a CV by a client that skips the UI.

Three kinds of leftovers are dropped when the view page resolves the groups, rather than in each of the six layouts: hidden groups, unselected skills, and categories that have since been deleted. Emptied groups go too — a heading with nothing under it is noise in a printed CV.

Nothing at the database level links a CV to a skill (`skillIds` is a scalar array, `skillGroups` is JSON), so no cascade reaches them. `DELETE /api/content/skills/[id]` therefore rewrites the affected CVs and deletes the skill in one transaction. Category deletion takes the opposite approach — it **refuses** with 409 while any CV still lays out skills under it, because losing a category loses a whole grouping, while losing a skill loses one chip.

### Avatar resolution

The view page fetches the user's `avatar` row via `prisma.avatar.findUnique({ where: { userId } })`. It resolves `avatarIndex` to an R2 URL:

```ts
const avatarUrl =
  cv.avatarIndex !== null && avatarDoc?.images?.[cv.avatarIndex]
    ? avatarDoc.images[cv.avatarIndex]
    : null;

const content: CvContent = { profile, avatarUrl, experiences, ... };
```

Layouts receive `content.avatarUrl: string | null` — a plain URL or `null`. They never see the index or the avatar row.

### Color themes (`cv_theme` table)

A **CvTheme** is a named, user-owned set of two colors that can be applied to any of the user's CVs.

| Column         | Type          | Notes                                                   |
| -------------- | ------------- | ------------------------------------------------------- |
| `id`           | `TEXT` (cuid) | Primary key                                             |
| `userId`       | `TEXT`        | FK → `user.id`, CASCADE delete                          |
| `name`         | `TEXT`        | User-chosen display name; max 50 chars                  |
| `sidebarColor` | `TEXT`        | Hex color for the sidebar background; default `#2d2d2d` |
| `accentColor`  | `TEXT`        | Hex color for accent elements; default `#c9a84c`        |
| `createdAt`    | `TIMESTAMP`   |                                                         |
| `updatedAt`    | `TIMESTAMP`   |                                                         |

Themes are user-scoped and reusable: multiple CVs can reference the same theme. When a theme is deleted, any CVs using it have their `themeId` set to `null` (CASCADE `SetNull`).

**Derived colors** — layouts compute further color variants at render time from the two stored values. They are never stored in the database:

- `darkenColor(sidebarColor, 0.09)` → header band background, avatar outline
- `lightenColor(sidebarColor, 0.09)` → highlight tint
- `getContrastColor(sidebarColor)` → auto `#ffffff` or `#1a1a1a` (W3C luminance, threshold 0.18)
- `hexToRgba(sidebarColor, α)` → translucent tint for skill tags, light background strips
- `mixColors(hex1, hex2, t)` → RGB linear interpolation between two hex colours
- `sidebarGradient(base)` → 10-stop ease-in-out CSS gradient string

All six helpers live in `src/lib/color-utils.ts`.

### CV layout system

Layouts are defined in code, not the database. Adding a new layout:

1. Create `src/components/cv-layouts/YourLayout.tsx` (web, Tailwind)
2. Add an entry to `CV_LAYOUTS` in `src/lib/cv-layouts.ts`
3. Register the component in `src/components/cv-layouts/index.ts`
4. Create `src/components/cv-layouts/thumbnails/YourThumb.tsx` and add a `case` for it in `thumbnails/LayoutThumb.tsx`

> `thumbnails/index.tsx` is **not** a registration point — it only re-exports `LayoutThumb` (plus three unused named thumbs). `LayoutThumb.tsx` imports each thumb directly, so nothing needs adding to the barrel.

Each layout receives a `CvContent` object and an optional `theme?: CvTheme`. When no theme is provided the layout falls back to its built-in default colors. The layout decides independently where (or whether) to render the avatar.

**Sub-component pattern** — themed sub-components are defined at **module level** and receive all theme-derived colors via a `colors` prop bag. This avoids the React v19 "components created during render" error.

**Two-row page break pattern** (all layouts):

- Row 1: `height: "297mm"` + `overflow-hidden` — contains page-1 content
- Page break band: `print:hidden h-7 bg-gray-200` — visual "Page 2" separator on screen only
- Row 2: `minHeight: "297mm"` + `print:break-before-page` — contains page-2 content

Currently available layouts:

| id         | Name     | Default sidebar / accent      | Description                                                                                                                                                          |
| ---------- | -------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default`  | Classic  | n/a                           | Two-row; clean white card on light grey background                                                                                                                   |
| `modern`   | Modern   | `#2d2d2d` / `#c9a84c`         | Two-row; dark sidebar + gold accents                                                                                                                                 |
| `teal`     | Teal     | `#2d7d8a` / n/a               | Two-row; teal sidebar + rating boxes                                                                                                                                 |
| `slate`    | Slate    | `#1e293b` / `#6366f1`         | Two-column; dark slate sidebar; grouped skills with dot ratings; `Company · Role` inline; IT/dev-focused                                                             |
| `terminal` | Terminal | `#0f172a` / `#3fb950`         | Two-column; GitHub-dark palette; monospace; code-style skill tags; repo-card projects; IT/dev-focused                                                                |
| `europass` | Europass | `#003399` (sidebar-derived accent) | EU-standardised structure; personal details block, CEFR language table, dated timeline sections; multi-page                                                     |

**Thumbnail components** — each layout has a matching `*Thumb.tsx` in `src/components/cv-layouts/thumbnails/`. Fixed `120×170px` pure-div blueprints; accept `sidebarColor?`, `accentColor?`, `selected?`; derive the same color variants as the full layouts for live preview.

### User flows

**CV management:**

- `GET /cvs` — list all user's CVs
- `GET /cvs/[cvId]` — editor: rename, pick layout and colour theme, select profile + avatar, select + reorder entries, arrange skills into categories; warns before leaving with unsaved changes; CvSwitcher label updates on successful save
- `GET /cvs/[cvId]/view` — A4 preview with "Save as PDF" button

**PDF export flow:**

1. User clicks "Save as PDF" on the view page
2. `ExportButton` temporarily sets `document.title` to the CV name, calls `window.print()`, then restores the original title
3. Browser print dialog opens; user selects "Save as PDF" — the document title becomes the default filename
4. Nav bar, footer, and in-page toolbar are all `print:hidden`; background colours preserved via `print-color-adjust: exact` in `globals.css`

---

## Account Management

Accessible at `/settings`.

- **Sign out** — `SignOutButton` (variant `"page"`) calls `authClient.signOut()` and redirects to `/`
- **Delete account** — `DeleteAccountSection` presents a confirmation dialog that requires the user to type their email, then calls `DELETE /api/user`:
  1. **Admin guard** — returns `403` if `session.user.role === "admin"`
  2. `purgeUserSideEffects(userId)` (`src/lib/user-deletion.ts`) — everything the cascade cannot reach, **before** the user row goes
  3. `prisma.user.delete({ where: { id } })` — all content models have `onDelete: Cascade`, so this single delete removes every **database** row: sessions, accounts, CVs, themes, profiles, avatars, experience, education, skills, projects, other
  4. Client calls `authClient.signOut()` and redirects to `/`

### What the cascade cannot reach

Two things sit outside it, and both are personal data:

- **Avatar image files in R2.** The `avatar` row cascades; the files it names do not. The bucket is public via a Custom Domain, so a face photo left behind stays retrievable at `files.appfinningar.se/avatars/<userId>/<ts>.<ext>` indefinitely.
- **`verification` rows.** The model has no `userId` and no FK, so no cascade reaches it. Note that under Better Auth 1.7 email verification is **stateless** — the token is a signed JWT and no row is written. The only rows carrying a user id are password-reset ones, which store it in `value`; OAuth state rows carry no user reference at all. (An earlier version of this document claimed these rows were keyed by email address. They are not.)

`purgeUserSideEffects` handles both. Ordering matters in two directions: it runs **before** `user.delete()`, because the `avatar` row is what names the files and it cascades away with the user; and it **throws rather than swallowing** a storage failure, so the route can return `502` and leave the account intact for a retry. Best-effort deletion here is what produced an orphaned photo in the first place.

Files are deleted **by prefix** (`avatars/<userId>/`), not by the URLs stored in `avatar.images`. The database is not a complete record of what the bucket holds: `POST /api/avatars` calls `blobPut` before `prisma.avatar.upsert`, so a failing upsert returns 500 with the object already stored and no row naming it. Deleting only what the database knows about would leave precisely that file behind — and for erasure, "narrow but reachable" still counts. `ListObjectsV2` and `DeleteObjects` are both covered by an `Object Read & Write` token, so this costs no extra permission.

The same function is wired to `databaseHooks.user.delete.before` in `src/lib/auth.ts`. The app's own path calls Prisma directly and never reaches Better Auth, but the `admin()` plugin exposes `/api/auth/admin/remove-user`, which would otherwise skip the cleanup entirely. The hook returns `false` on failure, which aborts the delete. The function is idempotent, so both paths running it is harmless.

Rows that merely **expire** are a separate concern from rows belonging to a deleted user, and are handled by `scripts/purge-expired.sh` — see **Retention** below.

---

## PDF CV Importer

Any authenticated user can import a PDF CV at `/import`.

**Flow:**

1. User uploads a PDF
2. `POST /api/cv-import`:
   - Checks size (10 MB) and **page count** (10) — see below
   - Sends the **PDF itself**, as a file, to Google Gemini 2.5 Flash via the Vercel AI SDK with a structured extraction prompt + Zod schema. The document is not converted to text first; Gemini reads the PDF
   - Writes all extracted documents to Postgres via Prisma, tagging each with `userId`

**Prisma models created:** `Profile` (a new row named `"Imported"`), `Experience`, `Education`, `Skill`, `Project`, `Other` — all created, none updated. Uses `other` as fallback category for ambiguous entries (certifications, awards, publications, etc.).

> Importing twice adds a second `"Imported"` profile and a fresh copy of every other entry. Nothing is deduplicated or updated in place.

### Cost controls

Google bills PDF pages as tokens (~258 each), so an import costs on the order of öre — but the endpoint is reachable by any signed-up user, and registration is open.

- **Page cap of 10.** Counted locally with `pdf-parse` (`new PDFParse({ data }).getInfo().total`) **before** anything is sent to Google, so a rejected file costs nothing. Ten admits senior CVs, Europass printouts and some academic ones while still stopping the 200-page document, which is the only single request able to get expensive. A PDF that cannot be parsed is rejected rather than passed through — a file we cannot inspect must not bypass the cap.
- **Usage logging.** Every successful import logs `userId`, page count and Gemini's `inputTokens` / `outputTokens`. This exists so the quota below gets a number from measurement rather than from a price list.
- **No per-user quota yet.** This is the one that actually bounds spending, because cost is driven by volume rather than by any single call. It needs a counter table and therefore a migration, and is deliberately left until the usage log says what the limit should be.

`pdf-parse` must stay in `serverExternalPackages` (`next.config.ts`): it pulls in pdf.js, which resolves its worker by path at runtime and breaks when bundled.

---

## Internationalisation

The app ships Swedish and English. The locale is a **URL segment** (`/sv/…`, `/en/…`), so every page
lives under `src/app/[lang]/`. Two things follow from that and are easy to trip over.

**`next typegen` is now part of the quality gate.** `next/root-params` types are generated by
`next dev`, `next build`, or `next typegen`. Running `tsc --noEmit` on a clean checkout fails to
resolve the `lang` export until one of those has run, so the full gate is:

```bash
npx next typegen && npx tsc --noEmit && npx eslint src
```

**Every internal link goes through `LocaleLink`.** A bare `href="/cvs"` drops the visitor out of
their language. `ActionChip`, `CrumbLink` and `BackToCvLink` all render `LocaleLink` internally, so
their callers keep passing un-prefixed hrefs. Two checks enforce it — as close to a test as this repo
gets. Both should print nothing but the one expected line:

```bash
# 1. Only LocaleLink may import next/link.
grep -rln 'from "next/link"' src/app src/components        # expect: only LocaleLink.tsx

# 2. Given (1), the only remaining way to emit an un-prefixed internal link is a raw <a>.
#    Multiline-aware, because JSX routinely puts href= on its own line.
perl -0777 -ne 'while (/<a\b[^>]*?href=\{?"\/[^"]*"/gs) { print "$ARGV: $&\n" }' \
  $(git ls-files '*.tsx' | grep -E '^src/(app|components)/')   # expect: no output
```

Do **not** use a plain `grep -rn 'href="/'` for check 2 — it flags every correct `LocaleLink` and
`NavLink` too, so it is noise rather than a signal.

Two files deliberately sit outside this rule, and both compute their href rather than writing a
literal, so neither check flags them: `LanguageToggle.tsx` (its whole job is to *change* the locale)
and `app/not-found.tsx` (it renders outside the locale tree, so there is no segment for
`useLocale()` to read).

For imperative navigation there is no component, so use the helpers directly: `localeHref(locale, …)`
with `useLocale()` in Client Components, and `await localePath(…)` (which reads `next/root-params`)
in Server Components — chiefly for `redirect()` targets.

### Where the locale is decided

`src/proxy.ts` — Next 16's rename of `middleware.ts`, and it sits at `src/`, level with `app/`. It
runs before rendering, may be deployed to a CDN, and **cannot reach Postgres**, which is the
constraint the whole design bends around. Its precedence, in order:

1. **The URL already names a locale** → serve it; correct the cookie if it disagrees.
2. **Bare path + valid cookie** → `307` to the cookie's locale. The hot path: no parsing, no session.
3. **Bare path + no cookie** → negotiate `Accept-Language`, `307`, and set the cookie so negotiation
   runs once per browser rather than on every bare link.
4. **Nothing matched** → `en`.

Rule 1 is why a shared link works: **the URL always wins.** `/en/cvs/<id>` opens in English even for
an account set to Swedish. Anything else makes sent links unreliable.

Two details that are invisible in development and would bite in production:

- **`307`, never `308`.** A permanent redirect on `/` pins `/ → /en` in intermediate caches and in
  Google's index, which is wrong when the target legitimately varies by header and cookie.
- **`Vary: Accept-Language, Cookie`** on the redirect. Cloudflare fronts this origin and does not
  cache HTML by default, but a Cache Rule added later would otherwise serve one visitor's locale
  redirect to everyone.

`Accept-Language` parsing is ~20 hand-rolled lines rather than `negotiator` +
`@formatjs/intl-localematcher`. Those libraries resolve BCP-47 against locale sets with regional
variants; ours is `["sv", "en"]` with none, so the whole decision is a q-value sort plus a
primary-subtag compare. The two cases the parser must get right — and which naive versions miss — are
`sv-SE,sv;q=0.9,en;q=0.8 → sv` (match the primary subtag) and `* → null` (the wildcard is not a
preference and must fall through to the default).

### The dictionaries

Strings live in `src/i18n/dictionaries/`, as **`.ts` modules, not `.json`**. JSON gives a
structurally-inferred shape rather than a checked one, and cannot express the plural-form pairs later
steps need with a type both locales must satisfy.

**English is the reference; its shape is the contract.** Two rules make a translation gap a
compile error, and both are easy to undo by accident:

1. **Never write `as const` in `en/index.ts`.** It would make every value a string *literal* type, so
   `Dictionary["nav"]["myCvs"]` would be the type `"My CVs"` — and the Swedish file could only
   satisfy it by containing the English text. Plain inference widens values to `string`, which is the
   point: the *keys* are the contract, the words are not.
2. **Annotate each Swedish slice in its own file**, `export const nav: Dictionary["nav"] = {…}`, not
   just the composed object in `sv/index.ts`. Annotating only the root reports "property missing" on
   a four-property literal in `sv/index.ts`, while the fix belongs three directories away. Per-slice
   annotation puts the error in `sv/nav.ts`. `sv/index.ts` adds a `satisfies Dictionary` to catch the
   remaining case: a slice added to `en/index.ts` but never imported into `sv`.

Both directions are covered — a missing key is `TS2741`, a stale one is `TS2353` from excess-property
checking. That matters more here than in most projects: `tsc` and `eslint` are the entire safety net.

**Anything that varies is a `{placeholder}`, never two keys glued together in JSX.** A sentence split
into `…Before` and `…After` locks both languages into one word order and one punctuation pattern, and
Swedish obliges neither — the landing page's data paragraph reads "…from Settings and every piece…"
in English but "…under Inställningar, så…" in Swedish, and that comma has nowhere to live in a fixed
`After` fragment. `format()` handles string values; `<RichText>` handles node values (a link, a
`<strong>`), so the translation decides where the markup falls.

**Two ways in, depending on which side of the boundary you are on:**

| | Server Components | Client Components |
|---|---|---|
| How | `await getDictionary()` from `@/i18n/server` | `useDictionary()` from `@/i18n/DictionaryProvider` |
| Locale from | `next/root-params` | the URL, via `useLocale()` |

`DictionaryProvider` is mounted once in `app/[lang]/layout.tsx`. Its `children` arrive from a Server
Component, so wrapping the tree in a client provider does not drag any of it across the boundary —
only the dictionary itself is serialised. A context rather than props because 32 components here are
`"use client"` and the string-heavy ones are the worst candidates for drilling: `CvEditor` already
takes 27 props. `useDictionary()` **throws** when no provider is above it; a silent English fallback
renders a plausible-looking page and is the bug nobody reports.

The whole dictionary lands in every page's Flight payload. That is cheap now and grows with each
translated area. If it stops being cheap, move the provider down into the route-group layouts and
hand each one only its slices — the `useDictionary()` call sites do not change.

Never import `@/i18n/dictionaries` from a Client Component: it would pull **both** languages into
the browser bundle. Importing the `Dictionary` *type* is fine — type imports are erased.

### The language toggle

`src/components/LanguageToggle.tsx`, in the navbar immediately right of the wordmark. Three decisions
worth keeping:

- **Flag *and* language code.** A flag is a country, not a language: the Swedish flag leaves out
  Finland-Swedish speakers and a Union Flag standing for "English" is a claim nobody needs to defend.
  The code identifies the choice; the flag makes it findable by someone who cannot yet read the page.
- **Links with `aria-current="true"`, not buttons with `aria-pressed`.** Each locale of a page is a
  real, shareable URL, and these mark which variant is showing — not a pressed state.
- **A plain `<a>`, so switching is a full page load.** This is the one sanctioned exception to
  "internal links go through `LocaleLink`" — `LocaleLink` builds an href for the *current* locale,
  which is precisely what must not happen here. `next/link` would work, but the Next docs state that
  layouts do not re-render on navigation and `<html lang>` is set by the root layout: a client-side
  switch risks leaving the document declaring the old language while showing the new one, which is
  invisible on screen and wrong for every screen reader. A document request also guarantees
  `proxy.ts` sees it and rewrites the cookie. The cost is one page load on a rare, deliberate action.

It combines `usePathname()` with `useSearchParams()`, because the query string carries real state —
`/content?tab=skills&from=<id>` has to survive the switch.

**The auth pages have no navbar, so they have no toggle.** A visitor who follows a shared
`/en/sign-in` cannot switch there. Deferred deliberately: the auth group renders no chrome at all, so
placing a control in it is a design decision, and it belongs with the step that translates those
pages.

### The 404: it must live outside `[lang]`

`src/app/not-found.tsx`, **not** `src/app/[lang]/not-found.tsx`. This was verified by experiment, and
the obvious placement is the wrong one:

> A `not-found.tsx` anywhere inside the locale tree — at `[lang]/` or at `[lang]/(main)/` — is
> **never rendered**. An explicit `notFound()` call falls straight through to Next's built-in page.
> Only the app-root position works when the root layout lives under a top-level dynamic segment.

Being outside the root layout has three consequences, each handled inside the file rather than
inherited: Next wraps it in a bare `<html><body>` of its own, so **`globals.css` and the font are
imported directly** (without them it renders unstyled black-on-white); `next/root-params` is
unavailable, so **the locale comes from the `cvforge_locale` cookie** — which is exactly what that
cookie exists for; and `<html lang>` cannot be reached, so `lang` is set on the page's `<main>`.

**The cost, and how to reverse it:** the not-found boundary is part of every route's tree, so calling
`cookies()` there makes **every** route dynamic. Before this, `generateStaticParams` prerendered the
four `(auth)` pages per locale (`● /sv/sign-in`, …); now nothing is prerendered and the build shows
`ƒ` throughout. That was judged the better trade — those four are `noindex` forms that render in
~40ms, while an English 404 shown to a Swedish user is text somebody actually reads. Replacing the
`cookies()` read with `DEFAULT_LOCALE` restores the eight prerendered pages in one line, at the price
of an English-only 404.

Still **not** covered: a URL matching no route at all (`/sv/nonsense`) gets Next's built-in page.
Fixing that needs `experimental.globalNotFound` plus an `app/global-not-found.tsx` that re-imports the
stylesheet and fonts and cannot read the locale (it bypasses rendering). Not worth an experimental
flag on a repo that deploys straight to production.

---

## Build

```bash
next build
```

No pre-build manifest step (Sanity manifest generation removed).

---

## Key Implementation Notes

### Page titles (metadata)

Every page exports `metadata` (static) or `generateMetadata` (dynamic). The root layout sets `title.template: "%s | CV Forge"` and `default: "CV Forge"`. Dynamic pages (`/cvs/[cvId]`, `/cvs/[cvId]/view`) run a lightweight `prisma.cV.findUnique` in `generateMetadata`; Next.js deduplicates it with the render query.

### Search indexing

The public surface is two pages, now in two languages: `/{sv,en}` and `/{sv,en}/privacy`. Everything else either redirects a logged-out visitor to `/sign-in` or is an auth page.

> **Not yet updated for locales.** `robots.ts` and `sitemap.ts` still list the bare `/` and `/privacy`
> paths, which now only exist as `307` redirects, and no `hreflang` / `x-default` cluster is emitted
> yet. That is a deliberate later step, not an oversight — see the plan's SEO step. Until then the
> two indexed URLs redirect rather than 404, so nothing is broken, only suboptimal.

| File | Role |
| ---- | ---- |
| `src/lib/site.ts` | `SITE_URL` — the canonical origin |
| `src/app/robots.ts` | `Disallow` for `/api/` and the session-gated routes; points at the sitemap |
| `src/app/sitemap.ts` | `/` and `/privacy`, nothing else |
| `src/app/[lang]/(auth)/layout.tsx` | `robots: { index: false, follow: true }` for the whole auth group |

Two things here are load-bearing and easy to undo by accident:

- **`SITE_URL` is hardcoded, not read from `BETTER_AUTH_URL`.** `robots.ts` and `sitemap.ts` render at *build* time, and the Docker build is not given the environment file — an env lookup would bake `undefined` into the production sitemap. Same class of trap as `S3_PUBLIC_URL` (see Avatars).
- **The auth routes are `noindex`, not `Disallow`.** The two mechanisms conflict: a crawler blocked from fetching a page never reads the `noindex` on it. Blocking is for `/api/`, which should never be fetched; `noindex` is for pages that may be fetched but must not be listed.

The root layout also sets `metadataBase` (required for absolute Open Graph URLs) and Open Graph / Twitter tags. There is no OG *image* yet, so shared links render as text only.

**The live `robots.txt` is not the file this repo produces.** Cloudflare's **AI Crawl Control** prepends a managed block to it at the edge, so what a crawler actually fetches is:

```
# BEGIN Cloudflare Managed content
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
User-agent: GPTBot / ClaudeBot / Google-Extended / CCBot / …  → Disallow: /
# END Cloudflare Managed Content
                        ← everything below is `src/app/robots.ts`
User-Agent: *
Allow: /
…
```

Harmless for search — `search=yes` permits indexing, and `Google-Extended` is Google's AI-training crawler, not `Googlebot`. Worth knowing for two reasons: the file has two `User-agent: *` groups (the robots standard merges groups with the same agent, so both apply), and toggling AI Crawl Control changes the production `robots.txt` with no commit in this repo.

> **Discovery is not a code problem.** Google finds a site through links from pages it already knows, or through a Search Console submission. `appfinningar.se` links to neither subdomain, so nothing in this repo can make the app discoverable on its own — an inbound link from the apex domain and a Search Console property (DNS-TXT verification on `appfinningar.se` covers every subdomain at once) are manual steps.

### Scrollbar gutter

`scrollbar-gutter: stable` on `:root` in `globals.css` prevents a ~15 px horizontal shift when navigating between short and long pages.

### Prisma — global singleton

```ts
// lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;
```

### Better Auth — simple module-level export

```ts
// src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((origin): origin is string => Boolean(origin)),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: false, // auto-send on signup is swallowed by Better Auth; sent explicitly from the client instead
    sendVerificationEmail: async ({ user, url }) => {
      // sends via Resend from EMAIL_FROM (default: noreply@appfinningar.se)
      // throws on failure (missing key / Resend error) so callers can surface it
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [admin()],
});
```

- **Why `sendOnSignUp: false`** — Better Auth's built-in auto-send during `signUp.email` runs through `runInBackgroundOrAwait`, which always catches and only logs errors, so a thrown error there never reaches the client. The dedicated `POST /api/auth/send-verification-email` endpoint (exposed as `authClient.sendVerificationEmail`) does *not* swallow errors — it rethrows them to the caller. Calling that endpoint explicitly from `sign-up/page.tsx` after account creation is what lets the frontend show a real failure message instead of a false success screen.
- **No mail is sent outside production.** When `NODE_ENV !== "production"`, both `sendVerificationEmail` and `sendResetPassword` print the link to the server console and return before touching Resend. `.env.local` carries live Resend credentials, so without this every test sign-up delivered a real message from the production sender. To verify a local account, copy the link from the terminal running `npm run dev`; `RESEND_API_KEY` can be left blank there.
- `trustedOrigins` — the production `BETTER_AUTH_URL` plus localhost ports, so both deployed sign-in and local dev sign-in pass Better Auth's CSRF origin check

- Client-side helpers live in `src/lib/auth-client.ts` — only import from `"use client"` files
- The catch-all route `src/app/api/auth/[...all]/route.ts` must set `export const dynamic = "force-dynamic"`

### Navigation — `(main)` route group

All main app pages live under `src/app/[lang]/(main)/`. This group has its own `layout.tsx` that reads the session server-side and renders `<NavBar>`. The `(auth)/` group sits beside it under the same `[lang]` segment and receives no nav bar.

`NavBar` is a `"use client"` component. On desktop (`≥ sm`) all links are rendered inline. On mobile (`< sm`) a hamburger button opens a full-width drawer with the user name, nav links, and sign-out.

Both rows share one `NavLink`, which marks the current section from `usePathname()` and sets `aria-current="page"`. Matching is a prefix (`pathname === href || pathname.startsWith(href + "/")`) so **My CVs** stays marked while editing or previewing a CV — `/cvs/<id>` and `/cvs/<id>/view` are that section, not separate destinations.

`NavLink` compares **`stripLocale(usePathname())`** against its un-prefixed `href`, and renders a `LocaleLink` so the prefix is added on the way out. Both halves matter: `usePathname()` returns `/sv/cvs` while the hrefs in this file are written `/cvs`, so comparing them raw silently marks nothing as active — every link in the bar loses its marker, with no error anywhere.

The marker is a bar in `--cl-nav-muted` olive — underneath the link on desktop, to its left in the drawer — plus white text and `font-medium`. Two colours that look like the obvious choice are not: `--cl-accent` (`#2d5a1b`) is *darker* than the nav itself (`#1b2f0e`) and vanishes against it, and colour alone cannot carry the state either, since links are already cream going white on hover. Inactive links keep a transparent border of the same width so nothing shifts, and the drawer's non-link rows carry a matching `pl-3` so the name and Sign out do not hang to the left of the list.

### CV edit page — CvEditShell

`CvEditShell` is a thin client wrapper around `CvSwitcher` + `CvEditor`. It holds `liveName` state (initialised from the current CV's name) and patches it into the `cvs` array passed to `CvSwitcher` whenever `CvEditor` reports a successful save via `onNameChange`. This keeps the dropdown label in sync without a page reload.

The page has no heading of its own; the breadcrumb is the heading. `My CVs / [switcher]` — the switcher **is** the CV segment, because a bare `<select>` reads as a control rather than as a title, and having both would mean two elements competing to say where you are.

### Sticky editor header

The trail and Save share one pinned bar at the top of the form. The form is long — layout, theme, profile, avatar, six entry lists, section order, cover letter — and Save used to be reachable only by scrolling to the bottom, which is why the same button was also duplicated into the "Colour theme" section header. The pin removes the reason for both copies; the bottom row now holds only "Delete CV".

The bar is rendered by `CvEditor`, not by `CvEditShell`, even though the trail and the Preview link belong to the shell. Save and Revert read `saving` / `isDirty` / `saved` / `error` and call `handleSave` / `handleRevert`, all of which sit on the fifteen-odd pieces of form state `CvEditor` owns. So the shell passes its two nodes *down* as `headerTrail` and `headerLink` slots rather than the state being lifted *up* to meet them — two props instead of a rewrite, and no portal or ref indirection that would leave the bar empty on first paint.

**The page has two widths, and `CvEditor` owns both.** The bar is chrome and matches `NavBar` and the footer exactly: a full-bleed band with a `max-w-5xl mx-auto px-6` container, so the trail lands under the logo and Preview under Sign out. The form is an editing surface and stays at `max-w-4xl px-4`, as on My Content. `CvEditor` therefore returns a fragment of two siblings — the band, then the column — and `page.tsx` renders `CvEditShell` directly into `main` with no wrapper of its own. Going full-bleed from *inside* the `max-w-4xl` column would have needed `w-screen` or `calc(-50vw + 50%)`, both of which count the scrollbar and produce horizontal overflow; hoisting the column one level down was the way to avoid the hack entirely.

`main` carries `pb-12` but no top padding — the bar has to sit flush under the nav — and the form column carries the `pt-8` that replaces it.

Details that are load-bearing:

- `z-30` clears the `zIndex: 10` that `SortableEntryList` and `SectionOrderEditor` give a row while it is being dragged, so a dragged row passes under the bar. dnd-kit's `DragOverlay` portals to `body` and stays above it, which is correct.
- The background is opaque `--cl-bg`, not a tint — page content scrolls underneath.
- The row is `flex-wrap`; on a phone the three controls drop to a second line rather than crushing the switcher.
- A save error renders *under* the row, in the same `max-w-5xl px-6` container. It is whatever length the API makes it, and beside the buttons it would squeeze them.

### Unsaved changes

`CvEditor` reports its dirty flag up through `onDirtyChange`, and `CvEditShell` arms `useUnsavedChangesWarning`. Two nets are needed:

- `beforeunload` — reloads, closing the tab, links out of the app
- a **capture-phase** `click` listener on `document` — Next's client router never fires `beforeunload`, so an in-app link would swap the page out silently. Capture is the only point at which the navigation can still be stopped.

Listening on `document` rather than wrapping individual links means the global nav is covered too, without `NavBar` having to know anything about the CV editor. Modified clicks (⌘/ctrl/middle) are let through — they open a new tab, so this page stays put.

`CvSwitcher` navigates via `router.push` from a `<select>`, not through an anchor, so the listener never sees it; it takes an `onBeforeSwitch` callback instead. Cancelling a switch re-renders nothing, so the select's value is restored by hand or it would sit showing a CV that was never opened.

**Not covered:** the browser's back button. App Router offers no way to cancel a `popstate`, and the only known workaround is pushing decoy history entries, which breaks the back button for real.

### Editor ↔ My Content

A CV section picks entries from the library but cannot edit their wording, so each of the seven library-backed sections carries a `My Content →` link. It names the tab and carries the CV: `/content?tab=experience&from=<cvId>`. The content page opens that tab and shows a `← Back to <CV name>` link straight back, which survives switching tabs.

`from` is resolved with `findFirst({ where: { id, userId } })` — an id in a URL is whatever the visitor typed, and without the owner filter it would be a way to read other people's CV names.

### CV view page — responsive scaling

`CvScaleWrapper` measures the container width via `ResizeObserver` and applies `transform: scale(s)` + `transformOrigin: top left` so the fixed-width `210mm` CV fits the viewport. On print (`print:transform-none`) scaling is removed and the browser renders at full A4 size.

`ViewToolbar` carries a `← Back to <CV name>` link to the editor, plus the layout badge and the PDF button. It shares the `max-w-5xl mx-auto px-6` container with the nav bar and the footer so the bands line up.

It is `sticky top-0 z-30` with the same full-bleed opaque band as the editor's header — a preview is several A4 pages tall, and both the way out and "Save as PDF" were otherwise reachable only by scrolling back to the top. The band is a consequence of the pin, not decoration: content scrolls underneath, so the background has to be opaque. Sticky survives `CvScaleWrapper`'s `overflow-hidden` because that wrapper is the toolbar's *sibling*, not its ancestor, leaving the document as the scroll container. `print:hidden` sits on the outermost element, so none of it reaches the PDF.

`max-w-5xl mx-auto px-6` is the **page band** — nav bar, footer, preview toolbar, and the back link on My Content all use it, so the way back starts at the logo's left edge wherever it appears. A page's content column is a separate, narrower container and is *not* meant to line up with it: putting the back link inside that column instead is what pushed it far right of every other top-level element.

### Small secondary actions — ActionChip

Every "Edit", "Delete", "All / None", "Duplicate" and "My Content →" in the app is one `ActionChip`. They were previously bare `text-xs` labels in `--cl-muted` (or `text-red-400`), repeated inline at a dozen call sites.

The chip has a border, `text-sm`, and a hover that **fills** rather than only recolouring the label. Colour alone was not carrying "this is a target": in a section header these controls compete with a semibold heading and a rule, and in a list row they sit at the end of a line of content. It is the same finding as NavBar's active marker — a colour step on its own is both too small to notice and indistinguishable from a hover.

Three tones. `accent` and `danger` both start from the same neutral `--cl-border`: a list of twenty entries whose Delete chips were red at rest would read as a list of warnings, so a repeated `danger` earns its red on hover rather than at a glance.

`danger-strong` is the opposite case — a page's **single** destructive action, where there is no repetition to mute and being found is the point. It carries red in the frame as well as the label. One per page; the CV editor's "Delete CV" is the only user today.

It renders a `<Link>` when `href` is passed and a `<button>` otherwise. That matters where one of each sits side by side — the CV editor's section headers pair the `My Content →` link with the `All/None` button, and they must not drift apart.

`onClick` is typed `(e: MouseEvent) => void` rather than `() => void`, because `DuplicateCvButton` reads the event.

**`selected`** turns a chip into a toggle: a filled accent fill plus `aria-pressed`. Its unselected half is the ordinary `accent` tone, *not* a muted one — greying an unchosen option makes it look disabled, which is what the avatar picker's "None" button suffered from before it moved onto this component. Filled rather than outlined for the chosen state because it sits beside 48px avatar photos, where an outline alone did not register as a state.

The theme picker's cards are a **different** control — `px-3 py-2 rounded-lg` with colour swatches — and stay hand-rolled. They share the same muted-when-unselected weakness if that ever needs the same treatment.

**Not** an ActionChip: the sign-in page's "Forgot password?", which is prose inside a form rather than an action on a row, and the primary buttons (Save, Save as PDF, Preview), which have their own weight.

### Type scale

Nothing in the **UI** is set below `text-sm` (14px) — that is the floor, and it is currently absolute: `src/app` contains no `text-xs` and no arbitrary size under 14px. Above the floor: `text-base` for section headings, `text-lg`+ for page headings. The secondary/primary distinction is carried by `--cl-muted` and font weight, not by size — captions, badges, eyebrow headings and body text are all 14px and differ by colour, weight, letter-spacing and case.

Check it with:

```bash
grep -rnE 'text-xs|text-\[([0-9]|1[0-3])px\]' src/app src/components --exclude-dir=cv-layouts
```

(one hit is expected — a prose mention of `text-xs` in `ActionChip.tsx`'s header comment.)

This floor does **not** apply to `src/components/cv-layouts/`. Those are A4 documents, not interface: `text-xs` and smaller there is document typography, and `Paginated.tsx` measures rendered block heights to decide page breaks — changing a font size changes every measurement and moves the page breaks on existing CVs.

### Content column widths

Two widths, chosen by what the page holds rather than for uniformity:

| Width | Pages | Why |
| ----- | ----- | --- |
| `max-w-3xl` (768px) | `/settings`, `/import` | Single-purpose utility pages: one card, or one form. 4xl left them looking like a thin strip in a wide field, but `max-w-lg`/`max-w-md` made them half the width of every other page. |
| `max-w-4xl` (896px) | `/`, `/cvs`, `/content`, `/cvs/[cvId]` | The working pages plus the marketing page's section frames. |

A `/profiles` route existed until 2026-08-22 and was removed. It was absent from `NavBar`, nothing linked to it, its list items linked to `/content?tab=profiles` ("Edit in Content →"), and its create form still redirected to **Sanity Studio** (`NEXT_PUBLIC_STUDIO_URL`, `data._id`) from before the move to Prisma — so creating a profile there navigated to `/studio/structure/profile;undefined`. Profiles are managed by the Profiles tab in `/content`, which is that page's default tab and does the full create/update/delete against the same `/api/profiles`.

Widening the frame is not the same as widening the text. On `/` the containers are 4xl so the sections line up with the rest of the app, but every run of prose still carries its own measure: the hero paragraph keeps `max-w-lg`, the "Your data" paragraph keeps `max-w-2xl`, and the four "How it works" steps became a `sm:grid-cols-2` grid rather than four longer paragraphs. A body paragraph at 864px runs to roughly 110 characters a line, which is well past comfortable — when a wider container would only stretch text, spend the width on columns instead.

Padding sits on the column (`max-w-* mx-auto px-4`), never on the `<main>` around it, so the gutter travels with the column and two pages using the same width get the same usable pixels.

Not `max-w-5xl` for the editing surfaces even though it would line up with the band: two-column fields at that width are ~480px each, which is a lot of input for `Phone`. Going wider means going to three or four columns at the same time, which is a layout pass rather than a width change.

**Every multi-column grid needs a responsive prefix.** Ten form grids were `grid-cols-2`/`grid-cols-3` unconditionally, which on a 375px phone left 165px and 106px per field — a native date input does not fit in 106px, and the layout picker's fixed 120px thumbnail overflowed its cell outright. The rule is `grid-cols-1 sm:grid-cols-N` for fields, and `grid-cols-2 sm:grid-cols-3` for the layout picker, whose cells have a hard minimum of about 138px (120px thumbnail + `p-2` + border).

That link is the **same `BackToCvLink` component My Content uses**, and deliberately so: both pages are detours out of an edit in progress rather than places in a hierarchy, so both offer one way back rather than a trail. The preview previously carried `My CVs / <CV name> / Preview`; the top-level segment was dropped because the global nav already reaches `/cvs`, and the trailing `Preview` segment only named the page the user was already looking at. Change the wording in one place and both pages follow — which is the point.

### Migrations

```bash
# Apply in development
npm run migrate:dev
```

> **There is no staging step. Pushing to `main` *is* the production migration.** The `migrate` job runs automatically against the live database before the new image ships, so a migration cannot be "tried in CI first" — by the time the pipeline has built anything, production has already been altered.
>
> For a structural, additive migration that is fine. For one that **moves or rewrites data**, test it first against a restored copy. The migration files are plain SQL, so this needs no image build and no push.
>
> Test **locally**, against the dev container described below, rather than in a second database on the server — a rehearsal that runs on the production host is one typo away from being the real thing.
>
> ```bash
> # On the server: dump production
> docker exec postgres-postgres-1 pg_dump -U cvforge -d cvforge -Fc > ~/cvforge.dump
> #   then copy it over: scp martin@<server>:~/cvforge.dump .
>
> # Locally: restore into the dev container, then run the migration by hand
> docker exec -i cvforge-dev-db pg_restore -U cvforge -d cvforge \
>   --no-owner --no-privileges --clean --if-exists < cvforge.dump
> docker exec -i cvforge-dev-db psql -U cvforge -d cvforge -v ON_ERROR_STOP=1 -1 \
>   < prisma/migrations/<timestamp>_<name>/migration.sql
> ```
>
> `-v ON_ERROR_STOP=1 -1` runs the whole file in one transaction that rolls back on the first error, so a half-applied migration cannot be mistaken for a passing one. Inspect the result, then push. `_prisma_migrations` is not updated by this — deliberately, since the copy is a throwaway.
>
> Two things that cost time the first time round: `docker cp` and shell redirection both fail on files in `~/Downloads`, because macOS withholds that folder from the calling process — keep the dump somewhere else. And the dump carries password hashes and OAuth tokens, so delete it once restored.

### Local development database

`npm run dev` reads `DATABASE_URL` from `.env.local`, which points at a throwaway Postgres container holding a copy of production:

```bash
docker run -d --name cvforge-dev-db \
  -e POSTGRES_USER=cvforge -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=cvforge \
  -p 127.0.0.1:5432:5432 -v cvforge-dev-db-data:/var/lib/postgresql/data \
  --restart unless-stopped postgres:16
```

Bound to `127.0.0.1`, not `0.0.0.0` — a published port with a weak password has no business being reachable from the rest of the network. `docker rm -f cvforge-dev-db && docker volume rm cvforge-dev-db-data` removes it entirely.

Note that `S3_BUCKET` in `.env.local` is the **production** avatar bucket: local development reads the real images, and anything uploaded lands among them. `RESEND_API_KEY` is live too, so verification emails are really sent.

`migrate:dev` uses `dotenv-cli` to load `DATABASE_URL` from `.env.local`. In production, migrations are **not** run via the `migrate:deploy` npm script (which also assumes `.env.local`, absent in containers) — instead the `migrate` job in `.github/workflows/build-and-push.yml` runs them automatically on every push to `main`, from the separate `:migrator` Docker image (which has a full `node_modules` including the Prisma CLI, unlike the minimal `app` runtime image), executed on a self-hosted runner on the server. See `README.md` → Deployment → step 4 for the runner setup and the equivalent manual command.

---

## Environment Variables

See `.env.example` for the authoritative, commented list. Summary:

### `.env.local` (development)

```
DATABASE_URL=postgresql://...          # any reachable Postgres instance
DIRECT_URL=postgresql://...            # same, used by the Prisma CLI for migrations
GEMINI_API_KEY=                        # Google AI Studio — free tier
BETTER_AUTH_SECRET=                    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=                      # Google Cloud Console → OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=                  # Google Cloud Console → OAuth 2.0 Client Secret
RESEND_API_KEY=                        # Resend dashboard → API Keys
EMAIL_FROM=CV Forge <noreply@appfinningar.se>
S3_ENDPOINT=                           # R2 S3 API endpoint (R2 dashboard → bucket → Settings)
S3_PUBLIC_URL=                         # R2 bucket's public Custom Domain
S3_BUCKET=
S3_ACCESS_KEY_ID=                      # R2 API Token
S3_SECRET_ACCESS_KEY=                  # R2 API Token
```

### Production (server `.env`, consumed by `docker-compose.yml`)

| Variable               | Source                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`         | Existing self-hosted Postgres container → dedicated `cvforge` database/user |
| `DIRECT_URL`           | Same as `DATABASE_URL` (no separate pooler in this setup)   |
| `BETTER_AUTH_SECRET`   | `openssl rand -base64 32`                                    |
| `BETTER_AUTH_URL`      | `https://cv-forge.appfinningar.se`                            |
| `GEMINI_API_KEY`       | aistudio.google.com (free)                                   |
| `GOOGLE_CLIENT_ID`     | Google Cloud Console → OAuth 2.0 credentials                 |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 credentials                 |
| `RESEND_API_KEY`       | Resend dashboard → API Keys (must have "Full access" or be scoped to a **verified** domain — a key tied to an unverified domain fails with a 400 at send time) |
| `EMAIL_FROM`           | Must be on a Resend-verified domain (SPF/DKIM added in Cloudflare DNS) |
| `S3_ENDPOINT`          | R2 → API → Manage API tokens; the post-creation screen shows it alongside the keys. **Both buckets use EU jurisdiction**, so the endpoint carries a `.eu.` segment (`https://<account-id>.eu.r2.cloudflarestorage.com`) — a jurisdictional bucket is invisible to the plain endpoint, which fails as though the bucket did not exist |
| `S3_PUBLIC_URL`        | R2 bucket → Settings → Custom Domain (`files.appfinningar.se`) |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | R2 API Token (Object Read & Write, scoped to the bucket). `cv-forge-bucket-eu` in production, `cv-forge-dev-bucket` in development — each with its own token, scoped to that one bucket. The Access Key ID and Secret appear **only** on the screen shown immediately after the token is created; there is no way to view the secret later, so a lost one means issuing a new token |

**Important:** `S3_PUBLIC_URL` is also needed at **Docker build time** (not just runtime) — `next.config.ts` derives `images.remotePatterns` from it during `next build`, and that config is baked into the built image. It's passed as a `--build-arg` in `.github/workflows/build-and-push.yml`, hardcoded to the production value. If this argument is missing, avatar images silently fall back to a placeholder (Next.js Image blocks the unrecognised hostname) even though upload succeeds.

---

## Deployment runbook (self-hosted)

One-time setup steps for bringing the app up on a new server. Day-to-day deploys need none of this — a push to `main` migrates and ships on its own (see **Deployment model** above).

Reaching the server: `ssh martin@192.168.50.131` (hostname `smurfserver`; `smurfserver.local` resolves over mDNS on the same network). LAN only — Cloudflare Tunnel means no inbound access is opened from the internet, so this works from home and nowhere else. The checkout lives at `~/cv-forge`, which is both the git working copy and the directory `docker compose` runs from.

### 0. Registry credentials

The server needs them so both `docker compose pull` and Watchtower can pull the private image:

```bash
docker login ghcr.io -u SayMartin   # password: a GitHub PAT with `read:packages` scope
```

### 1. Environment file

Copy `.env.example` to `.env` on the server and fill in production values — see **Environment Variables** above for where each one comes from. `DATABASE_URL`/`DIRECT_URL` point at the existing Postgres container's network alias, using the dedicated database and user created in step 2.

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

Pulls the latest published image and starts `app` and Watchtower. Watchtower keeps `app` up to date on every subsequent push to `main` — no manual pull or restart after the first run.

### 4. Register the self-hosted runner

The `migrate` job needs a self-hosted GitHub Actions runner on the server so it can reach the `postgres_default` network directly:

1. On GitHub: repo → **Settings → Actions → Runners → New self-hosted runner** (Linux), and follow the commands shown there (they include a one-time registration token). Install it in its own directory (e.g. `~/actions-runner`, separate from the `cv-forge` checkout).
2. Install as a systemd service so it survives reboots: `sudo ./svc.sh install && sudo ./svc.sh start`.
3. Give the runner's user docker access: `sudo usermod -aG docker <user>`.

Once registered and idle, every push to `main` runs `build-migrator` → `migrate` → `build-app`, in that order.

For a one-off manual migration (troubleshooting), the runtime image is intentionally minimal and has no Prisma CLI — use the `:migrator` image instead:

```bash
docker pull ghcr.io/saymartin/cv-forge:migrator
docker run --rm --env-file .env --network postgres_default \
  ghcr.io/saymartin/cv-forge:migrator npx prisma migrate deploy
```

### 5. Backups

`scripts/backup.sh` dumps the `cvforge` database, encrypts it, and uploads it to a **separate, private** R2 bucket. Copy `scripts/backup.env.example` to `scripts/backup.env` on the server and fill it in (that filename is gitignored), then schedule it:

```bash
sudo apt install age
crontab -e
# 03:15 nightly
15 3 * * * /home/USER/cv-forge/scripts/backup.sh >> /home/USER/backups/backup.log 2>&1
```

### Retention

`scripts/purge-expired.sh` removes `verification` and `session` rows past their `expiresAt`. Neither table is reachable by a cascade and Better Auth never revisits them, so without this they accumulate indefinitely — expired password-reset rows carrying a user id, and dead sessions carrying a token and a user id. Both are personal data with no reason to be kept, which makes this a retention measure rather than housekeeping.

Expiry is the only criterion, and a row past `expiresAt` is already refused by the application, so nothing a user can observe changes. It reads `backup.env` for `PG_CONTAINER` / `PG_USER` / `PG_DB` rather than introducing a second config file, and runs `psql` inside the existing Postgres container — nothing is installed on the host.

```bash
crontab -e
# 03:45 nightly, half an hour after the backup so the two never overlap
45 3 * * * /home/USER/cv-forge/scripts/purge-expired.sh >> /home/USER/backups/purge.log 2>&1
```

Deletion of a *user* is a different path and does not wait for this job: `purgeUserSideEffects` removes that user's rows immediately — see **Account Management**.

Three properties this arrangement depends on, none of which are cosmetic:

- **The backup bucket is not the avatars bucket.** The avatars bucket is public via a Custom Domain, so anything in it is retrievable by anyone who knows the key. The backup bucket must be private, with no Custom Domain, and its API token scoped to it alone — which also stops the nightly job from being able to delete users' avatar images.
- **Encryption is public-key (`age`), not a passphrase.** The server holds only the public recipient key: it can write backups but cannot read them back. Keep the private key off the server, in a password manager. Putting it on the server discards the property entirely.
- **Remote retention is an R2 lifecycle rule**, set on the bucket in the Cloudflare dashboard, not logic in the script — server-side expiry keeps working even when the script does not.

Restoring:

```bash
age --decrypt -i cvforge-backup.key cvforge-….dump.age > restore.dump
docker exec "$PG" psql -U postgres -c "CREATE DATABASE cvforge_restore OWNER cvforge;"
docker exec -i "$PG" pg_restore -U cvforge -d cvforge_restore < restore.dump
```

> A backup nobody has restored is a hypothesis. Run the restore into a scratch database occasionally and confirm the data is there.
>
> **GDPR:** these dumps contain every personal-data field in the system. They need a stated retention period — the lifecycle rule is what makes that real — and the privacy policy must name Cloudflare as a recipient. Encrypting before upload means Cloudflare stores ciphertext rather than readable personal data.

### 6. Routing

`cv-forge.appfinningar.se` is published directly by Cloudflare Tunnel to the server's LAN IP on the `app` container's published port (`3005` by default — see `docker-compose.yml`), configured under **Cloudflare Zero Trust → Networks → Tunnels → [tunnel] → Published application routes**. No reverse proxy in front; Cloudflare terminates TLS at the edge. File storage (`S3_PUBLIC_URL`) is served directly by R2 via its Custom Domain, unrelated to the Tunnel.

---

## Implementation Phases

- [x] Phase 0 — Decisions & architecture
- [x] Phase 1 — Next.js scaffold + Vercel config
- [x] Phase 2 — Prisma schema + Neon (PostgreSQL) migrations
- [x] Phase 3 — Sanity.io init + Studio embed + Draft Mode *(later removed)*
- [x] Phase 4 — Better Auth (email+password, admin plugin)
- [x] Phase 5 — Vercel Blob storage helper + upload API
- [x] Phase 6 — Sanity schemas + GROQ queries + pages *(later removed)*
- [x] Phase 7 — Production deploy to Vercel
- [x] Phase 8 — PDF CV import (Gemini + Sanity write) *(Sanity write later replaced with Prisma)*
- [x] Phase 9 — Multi-user signups + multi-CV compositions (Neon CV table)
- [x] Phase 10 — Navigation (`(main)` route group), CV layout system, A4 PDF export via browser print, colour theme applied to output
- [x] Phase 11 — Multiple profiles per user, avatar selection per CV, profile creation flow
- [x] Phase 12 — Hosted Sanity Studio, auto-userId via userMapping, Teal CV layout *(Sanity later removed)*
- [x] Phase 13 — Colour themes (CvTheme table + editor), sidebar gradient utility, mobile-responsive nav (hamburger drawer), CvScaleWrapper, ViewToolbar
- [x] Phase 14 — Rebrand to CV Creator; landing page; Logo SVG; account settings (delete account); dirty-state save button in CV editor
- [x] Phase 15 — Terminal + Slate CV layouts (IT/dev-focused, theme-aware, with thumbnails)
- [x] Phase 16 — Coding style standardisation across all 5 CV layout files
- [x] Phase 17 — Google OAuth sign-in/sign-up; admin self-delete guard; Vercel project renamed `cv-creator`
- [x] Phase 18 — `other` content type (certifications, awards, etc.); `otherIds` on CV; PDF importer fallback category
- [x] Phase 19 — Studio user isolation *(Sanity later removed)*
- [x] Phase 20 — **Sanity removed entirely.** All content (profile, experience, education, skill, project, other) migrated to Neon/Prisma. Content managed via `/content` tabbed library + `/api/content/*` CRUD routes. Account delete simplified to single `prisma.user.delete()` cascade. PDF importer writes to Prisma. `SyncAppUserId` is now a dead stub.
- [x] Phase 21 — Avatar system: `avatar` Prisma model (userId unique, images TEXT[] of Vercel Blob URLs); `/api/avatars` GET/POST/PATCH; `AvatarsTab` in `/content`; Vercel Blob store must be **public**. `CvEditShell` keeps CvSwitcher in sync on save. `maxLength` caps on all CV editor text inputs.
- [x] Phase 22 — Email verification (Resend); `requireEmailVerification: true` in Better Auth; domain `mail.appfinningar.se` verified in Resend (DKIM + SPF via Cloudflare DNS); `trustedOrigins` added for localhost dev. Domain DNS moved to Cloudflare; `cv-creator` CNAME updated to new Vercel target `f65758c71be4b67c.vercel-dns-017.com`.
- [x] Phase 23 — CV duplication (`DuplicateCvButton` + `POST /api/cvs/[cvId]/duplicate`; copies all field selections, names result "Copy of …"); profile editing + deletion (`PATCH + DELETE /api/profiles/[id]`; full field update with ownership guard).
- [x] Phase 24 — **Fork to `cv-forge`; self-hosting migration begins.** Rebrand from "CV Creator" to "CV Forge" across UI and email templates.
- [x] Phase 25 — Dockerization: multi-stage `Dockerfile` (`deps` → `builder` → `runner`), `output: "standalone"` in `next.config.ts`, `.dockerignore`. Runtime image intentionally excludes the Prisma CLI (only the generated client, already bundled by Next's standalone tracing) — migrations run from the separate `builder`-stage image instead.
- [x] Phase 26 — Storage migrated from `@vercel/blob` to a generic S3-compatible client (`@aws-sdk/client-s3`) in `src/lib/r2.ts`; `next.config.ts`'s `images.remotePatterns` now derived from `S3_PUBLIC_URL` at build time instead of a hardcoded (and previously incorrect) hostname.
- [x] Phase 27 — CI/CD: GitHub Actions builds and pushes the image to GHCR (`ghcr.io/saymartin/cv-forge`) on every push to `main`; Watchtower on the server polls and auto-updates (no inbound SSH needed from CI). A second `:migrator` tag publishes the `builder` stage for running migrations manually.
- [x] Phase 28 — Hosting moved off Vercel to Docker Compose on a home server ("smurfserver"), alongside existing NextCloud/Postgres/Nginx Proxy Manager services. Database migrated from Neon to a dedicated database (`cvforge`) in the server's existing self-hosted Postgres container (`pg_dump`/`psql` data-only migration, schema already aligned via Prisma migrations on both sides).
- [x] Phase 29 — Ingress: Cloudflare Tunnel routes `cv-forge.appfinningar.se` directly to the app's host port — no reverse proxy in front (Nginx Proxy Manager, present on the server, is unused for this app). TLS terminated by Cloudflare at the edge.
- [x] Phase 30 — File storage moved from a self-hosted MinIO container to Cloudflare R2 (external, S3-compatible), connected via R2's Custom Domain feature (`files.appfinningar.se`). Resend re-verified against the `appfinningar.se` root domain (the previous `mail.appfinningar.se` domain had failed verification) and a new, correctly-scoped API key issued.
- [x] Phase 31 — Old Vercel project and Neon database decommissioned after end-to-end verification of the self-hosted deployment (login, CV/profile/avatar data, avatar upload, password reset email). A `pg_dump` backup of the migrated database was taken before deletion.
- [x] Phase 32 — Fixed silently-failing verification emails: `emailVerification.sendOnSignUp: false` + explicit `authClient.sendVerificationEmail(...)` call from `sign-up/page.tsx`, so a Resend failure (bad recipient, misconfigured key) surfaces a real error instead of the sign-up form always claiming success. LinkedIn contact links in `TealSidebarLayout` and `TerminalLayout` changed from `break-all` to `wrap-break-word` so the URL only wraps when unavoidable, never mid-character, keeping it readable and clickable in the exported PDF.
- [x] Phase 35 — Cost controls on `/api/cv-import`, prompted by registration being open: a 10-page cap counted locally before the request reaches Google, and per-import logging of Gemini token usage. The per-user quota — the part that actually bounds spending — is deliberately deferred until that log has something to say. Corrected two long-stale claims in this document: the importer does not convert the PDF to text with `pdf-parse`, it sends the PDF itself, and it *creates* a profile on every import rather than upserting one.
- [x] Phase 34 — **GDPR.** Account deletion made complete: avatar objects removed from R2 by prefix and password-reset `verification` rows by `value`, both before the user row and both failing closed (`purgeUserSideEffects`, also wired to `databaseHooks.user.delete.before` so the admin plugin's remove-user endpoint cannot bypass it). `scripts/purge-expired.sh` gathers up expired `verification` and `session` rows nightly. Storage split per environment (`cv-forge-bucket-eu` / `cv-forge-dev-bucket`, both EU jurisdiction, one scoped token each), `forcePathStyle` dropped so a bucket/token mismatch fails loudly instead of writing to the wrong bucket, and verification/reset emails print to the console outside production — completing the per-environment separation of database, storage, and email. Encrypted nightly backups actually scheduled for the first time (the script had existed unscheduled since Phase 30-something) and a restore rehearsed end to end. `/privacy` published, and the landing page's deletion promise — untrue until this phase — corrected to match.
- [x] Phase 33 — Fixed a 2026-07-26 production outage: the Europass-fields migration had never been applied to the production database even though Watchtower had already deployed the corresponding code (Prisma client querying columns that didn't exist yet → `ColumnNotFound` on every `profile`/`skill` read), plus a latent bug where `cv.otherIds`/`cv.sectionOrder` could be `NULL` on rows predating those columns' migrations (added without `NOT NULL DEFAULT '{}'`), crashing `/cvs/[cvId]` for older CVs. Fixed both immediately (null-guards in `page.tsx` + a backfill migration) and closed the underlying gap permanently: `.github/workflows/build-and-push.yml` now runs `build-migrator` → `migrate` (on a self-hosted runner installed on the server) → `build-app`, so schema migrations are always applied automatically before Watchtower can deploy code that depends on them.
- [x] Phase 36 — SEO groundwork: `robots.ts`, `sitemap.ts`, a hardcoded `SITE_URL` in `src/lib/site.ts`, `metadataBase` + Open Graph on the root layout, and `noindex` on the `(auth)` group. See **Search indexing** — the remaining blockers to actually being found (an inbound link from `appfinningar.se`, a Search Console property) are outside this repo.

---

## Key Packages

```json
{
  "next": "16.3.2",
  "react": "19.2.8",
  "typescript": "~6.0.3",
  "prisma": "^7.9.1",
  "@prisma/client": "^7.9.1",
  "@prisma/adapter-pg": "^7.9.1",
  "pg": "^8.20.0",
  "@aws-sdk/client-s3": "^3.1086.0",
  "better-auth": "~1.7.1",
  "resend": "^6.12.0",
  "ai": "^6.x",
  "@ai-sdk/google": "^3.x",
  "pdf-parse": "^2.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^10.x",
  "@dnd-kit/utilities": "^3.2.2",
  "dotenv-cli": "^11.x",
  "@react-pdf/renderer": "^4.6.1",
  "styled-components": "^6.5.3"
}
```

> `typescript` uses `~` rather than `^` deliberately: `typescript-eslint` declares `typescript: ">=4.8.4 <6.1.0"`, so a caret would let `npm update` walk out of the supported range and silently break linting. Keep the tilde until that range moves.
>
> **TypeScript 7** is blocked upstream, not by this codebase: `tsc --noEmit` under 7.0.2 is already clean, but no published `typescript-eslint` supports TS 7, and `eslint-config-next` pins `typescript-eslint: ^8.46.0` on top of that. Watch typescript-eslint's peer range, not TypeScript's releases.

> `@react-pdf/renderer` and `styled-components` are installed but not yet integrated — likely staged for a future programmatic PDF export path to replace or supplement `window.print()`. Verified 2026-08-22: neither is imported anywhere outside `next.config.ts` (`serverExternalPackages`), so bumping them cannot cause a regression, and `npm audit` findings against them are not reachable. They are dead weight in the image until that path is built.
