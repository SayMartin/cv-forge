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
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── PasswordField.tsx                   ← shared eye-toggle password input component
│   │   │   ├── GoogleSignInButton.tsx              ← shared "Continue with Google" OAuth button
│   │   │   ├── sign-in/
│   │   │   │   ├── layout.tsx                      ← metadata: title "Sign In"
│   │   │   │   └── page.tsx                        ← Google button + email/password form, reads ?callbackUrl
│   │   │   └── sign-up/
│   │   │       ├── layout.tsx                      ← metadata: title "Sign Up"
│   │   │       └── page.tsx                        ← Google button + email + password + confirm; instant account creation
│   │   ├── (main)/                                  ← route group with shared nav layout
│   │   │   ├── layout.tsx                           ← reads session; renders BotanicalBackground + NavBar; footer with support email
│   │   │   ├── NavBar.tsx                           ← client nav; logo + "CV Forge" wordmark; desktop inline / mobile hamburger
│   │   │   ├── SignOutButton.tsx                    ← client sign-out; variant="nav"|"page"
│   │   │   ├── page.tsx                             ← landing page: hero + how-it-works (4 steps) + CTA (visitors only)
│   │   │   ├── import/
│   │   │   │   ├── layout.tsx                       ← metadata: title "Import CV"
│   │   │   │   └── page.tsx                         ← PDF CV import UI
│   │   │   ├── content/
│   │   │   │   ├── page.tsx                         ← tabbed content library (auth-gated)
│   │   │   │   ├── ContentTabs.tsx                  ← client tab switcher; open tab lives in ?tab=, carries ?from= back to a CV
│   │   │   │   ├── AvatarsTab.tsx                   ← upload / remove avatar images (POST/PATCH /api/avatars); max 5, 5 MB, JPEG/PNG/WebP
│   │   │   │   ├── ProfilesTab.tsx
│   │   │   │   ├── ExperienceTab.tsx
│   │   │   │   ├── EducationTab.tsx
│   │   │   │   ├── SkillsTab.tsx                    ← flat alphabetical skill library; delete lives inside the edit card
│   │   │   │   ├── SkillCategoryManager.tsx         ← create/rename/reorder/delete categories (max 8; the language one is locked)
│   │   │   │   ├── ProjectsTab.tsx
│   │   │   │   └── OtherTab.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx                         ← account card (email, sign-out, delete account)
│   │   │   │   └── DeleteAccountSection.tsx         ← client: email-confirm dialog → DELETE /api/user
│   │   │   └── cvs/
│   │   │       ├── page.tsx                         ← CV list + create (auth-gated)
│   │   │       ├── CreateCvForm.tsx                 ← "New CV" client form
│   │   │       ├── DuplicateCvButton.tsx
│   │   │       └── [cvId]/
│   │   │           ├── page.tsx                     ← CV editor page (server); renders CvEditShell
│   │   │           ├── CvEditShell.tsx              ← client wrapper: breadcrumb + Preview link; holds live CV name and the dirty flag
│   │   │           ├── CvSwitcher.tsx               ← select dropdown to switch between CVs
│   │   │           ├── CvEditor.tsx                 ← layout picker + theme picker + profile radio + avatar picker + entry checkboxes + section order + cover letter; dirty-state save button; maxLength on all text inputs; calls onNameChange on successful save
│   │   │           ├── SectionOrderEditor.tsx       ← drag-and-drop section reorder (dnd-kit)
│   │   │           ├── SortableEntryList.tsx        ← drag-and-drop entry list with checkboxes
│   │   │           ├── CvSkillsEditor.tsx           ← per-CV skill grouping: reorder categories, drag skills between them, show/hide
│   │   │           ├── UnsavedChangesGuard.tsx      ← beforeunload + capture-phase link interception while the editor is dirty
│   │   │           └── view/
│   │   │               ├── page.tsx                 ← A4 CV preview (server)
│   │   │               ├── CvScaleWrapper.tsx       ← client wrapper: scales CV to fit viewport (transform: scale)
│   │   │               ├── ViewToolbar.tsx          ← client toolbar: `← Back to <CV name>` | layout badge + PDF
│   │   │               └── ExportButton.tsx         ← "Save as PDF" client button (calls window.print())
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
│   ├── components/
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
  2. `prisma.user.delete({ where: { id } })` — all content models have `onDelete: Cascade`, so this single delete removes every **database** row: sessions, accounts, CVs, themes, profiles, avatars, experience, education, skills, projects, other
  3. Client calls `authClient.signOut()` and redirects to `/`

> **Deletion is currently incomplete — GDPR gap.** The cascade covers Postgres only. Two things survive it:
>
> - **Avatar image files in R2.** `blobDelete` is called only when a single image is removed via `PATCH /api/avatars`; the account-delete path never touches the bucket. Because the bucket is public via a Custom Domain, uploaded face photos stay retrievable at `files.appfinningar.se/avatars/<userId>/<ts>.<ext>` indefinitely after the account is gone.
> - **`Verification` rows.** The model has no `userId` and no FK (see the schema), so pending verification and password-reset records — keyed by the user's email address — are not cascaded and are never cleaned up.
>
> Both are scheduled for the GDPR phase. Until then, do not describe account deletion to users as erasing everything.

---

## PDF CV Importer

Any authenticated user can import a PDF CV at `/import`.

**Flow:**

1. User uploads a PDF
2. `POST /api/cv-import`:
   - Parses PDF to plain text via `pdf-parse`
   - Sends text to Google Gemini 2.5 Flash via Vercel AI SDK with a structured extraction prompt + Zod schema
   - Writes all extracted documents to Postgres via Prisma, tagging each with `userId`

**Prisma models created/updated:** `Profile` (upsert on fixed id `profile-{userId}`), `Experience`, `Education`, `Skill`, `Project`, `Other` (always created as new rows). Uses `other` as fallback category for ambiguous entries (certifications, awards, publications, etc.).

> Reimporting updates the single profile row and adds new rows for all other types — it does not deduplicate experience/education/etc.

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
- `trustedOrigins` — the production `BETTER_AUTH_URL` plus localhost ports, so both deployed sign-in and local dev sign-in pass Better Auth's CSRF origin check

- Client-side helpers live in `src/lib/auth-client.ts` — only import from `"use client"` files
- The catch-all route `src/app/api/auth/[...all]/route.ts` must set `export const dynamic = "force-dynamic"`

### Navigation — `(main)` route group

All main app pages live under `src/app/(main)/`. This group has its own `layout.tsx` that reads the session server-side and renders `<NavBar>`. The `(auth)/` group sits outside it and receives no nav bar.

`NavBar` is a `"use client"` component. On desktop (`≥ sm`) all links are rendered inline. On mobile (`< sm`) a hamburger button opens a full-width drawer with the user name, nav links, and sign-out.

Both rows share one `NavLink`, which marks the current section from `usePathname()` and sets `aria-current="page"`. Matching is a prefix (`pathname === href || pathname.startsWith(href + "/")`) so **My CVs** stays marked while editing or previewing a CV — `/cvs/<id>` and `/cvs/<id>/view` are that section, not separate destinations.

The marker is a bar in `--cl-nav-muted` olive — underneath the link on desktop, to its left in the drawer — plus white text and `font-medium`. Two colours that look like the obvious choice are not: `--cl-accent` (`#2d5a1b`) is *darker* than the nav itself (`#1b2f0e`) and vanishes against it, and colour alone cannot carry the state either, since links are already cream going white on hover. Inactive links keep a transparent border of the same width so nothing shifts, and the drawer's non-link rows carry a matching `pl-3` so the name and Sign out do not hang to the left of the list.

### CV edit page — CvEditShell

`CvEditShell` is a thin client wrapper around `CvSwitcher` + `CvEditor`. It holds `liveName` state (initialised from the current CV's name) and patches it into the `cvs` array passed to `CvSwitcher` whenever `CvEditor` reports a successful save via `onNameChange`. This keeps the dropdown label in sync without a page reload.

The page has no heading of its own; the breadcrumb is the heading. `My CVs / [switcher]` — the switcher **is** the CV segment, because a bare `<select>` reads as a control rather than as a title, and having both would mean two elements competing to say where you are.

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

`max-w-5xl mx-auto px-6` is the **page band** — nav bar, footer, preview toolbar, and the back link on My Content all use it, so the way back starts at the logo's left edge wherever it appears. A page's content column is a separate, narrower container and is *not* meant to line up with it: putting the back link inside that column instead is what pushed it far right of every other top-level element.

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
| `S3_ENDPOINT`          | R2 dashboard → bucket → Settings → S3 API                    |
| `S3_PUBLIC_URL`        | R2 bucket → Settings → Custom Domain (`files.appfinningar.se`) |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | R2 API Token (Object Read & Write, scoped to the bucket) |

**Important:** `S3_PUBLIC_URL` is also needed at **Docker build time** (not just runtime) — `next.config.ts` derives `images.remotePatterns` from it during `next build`, and that config is baked into the built image. It's passed as a `--build-arg` in `.github/workflows/build-and-push.yml`, hardcoded to the production value. If this argument is missing, avatar images silently fall back to a placeholder (Next.js Image blocks the unrecognised hostname) even though upload succeeds.

---

## Deployment runbook (self-hosted)

One-time setup steps for bringing the app up on a new server. Day-to-day deploys need none of this — a push to `main` migrates and ships on its own (see **Deployment model** above).

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
- [x] Phase 33 — Fixed a 2026-07-26 production outage: the Europass-fields migration had never been applied to the production database even though Watchtower had already deployed the corresponding code (Prisma client querying columns that didn't exist yet → `ColumnNotFound` on every `profile`/`skill` read), plus a latent bug where `cv.otherIds`/`cv.sectionOrder` could be `NULL` on rows predating those columns' migrations (added without `NOT NULL DEFAULT '{}'`), crashing `/cvs/[cvId]` for older CVs. Fixed both immediately (null-guards in `page.tsx` + a backfill migration) and closed the underlying gap permanently: `.github/workflows/build-and-push.yml` now runs `build-migrator` → `migrate` (on a self-hosted runner installed on the server) → `build-app`, so schema migrations are always applied automatically before Watchtower can deploy code that depends on them.

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
