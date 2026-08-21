# CV-överlämning — profiltexter och åtgärdslista

**Skapad:** 2026-08-21
**Ursprung:** Claude Code-session i Wordlune-projektet, där CV-innehållet togs fram.
**Syfte:** Underlag för att mata in/uppdatera innehåll i cv-forge. Filen är arbetsmaterial — radera den när innehållet är inlagt.

Utgångsläge: `MartinPersson CV 4.1.pdf` → `4.2` (fullstack-profil) → `4.3` (mobil-profil).
Texterna nedan är de färdiga versionerna. Åtgärdslistan längst ned är **inte** genomförd i 4.2/4.3.

---

## 1. Profile summary — två varianter

Två profilinriktningar som ska kunna växlas i cv-forge. Båda är fyra meningar och avslutas
på ett belagt påstående, inte på självbeskrivning.

### Profil A — Fullstack / .NET / Web
Rubrikrad: `DEVELOPER | FULLSTACK, CROSS-PLATFORM, MOBILE`

> Fullstack developer with a .NET and TypeScript focus, built on several years of shipping
> production mobile software. Works across the stack — C#, .NET, Entity Framework and SQL on
> the backend, React, Next.js and React Native on the frontend — and takes projects all the way
> to production, including Docker, CI/CD, and cloud/self-hosted infrastructure. Brings an
> analytical mindset from a physics background, approaching problems methodically and
> understanding systems from the ground up. Has shipped and maintained software real people
> depend on: the TYRA preschool app (2,500+ preschools, 250,000 users) and a live Next.js site
> for Munka Folkhögskola, plus several projects designed, built, and deployed solo from database
> to production.

### Profil B — Mobil / Android / Native
Rubrikrad: `DEVELOPER | MOBILE, CROSS-PLATFORM, FULLSTACK`

> Mobile developer with three years of production Android experience, from a large Java codebase
> to modern Kotlin with coroutines and MVVM, plus cross-platform work in Flutter and React
> Native. Shipped and maintained the TYRA preschool app (2,500+ preschools, 250,000 users),
> owning Android feature development and maintenance in a small team, and worked as sole app
> developer on a Flutter prototype. Recently broadened into fullstack (C#/.NET, React,
> TypeScript) and cloud infrastructure, enabling full ownership of a feature from database to
> screen. Brings an analytical mindset from a physics background, approaching problems
> methodically and understanding systems from the ground up.

### Redaktionella beslut bakom texterna
- **Inga subjektiva personlighetsomdömen.** "Calm, collaborative, and comfortable with
  end-to-end feature ownership" är borttaget ur båda — obeläggbart och skrivs av alla.
  Personlighet hör hemma i det personliga brevet, med kontext.
- **Fysikraden behölls.** Också delvis subjektiv, men den förklarar en ovanlig bakgrund och
  gör den till en tillgång istället för en obesvarad fråga.
- **"three years"** i profil B, inte "several years" (Bayou: jan 2022 – okt 2024). Siffra
  slår vagt uttryck. **Detta är en ändring mot 4.3**, som fortfarande säger "several years".

---

## 2. Ny timeline-post: Wordlune

Rättad version. **4.2/4.3 innehåller en tidigare formulering som överdriver** — se not nedan.

**Datum:** May 2026 – Present *(se varning)*
**Typ:** PROJECT
**Titel:** Wordlune

> A self-built, cross-platform word game (Wordle-style) running on Android, iOS, and web from a
> single Expo/React Native codebase, with the web build live in production. Includes realtime
> 1v1 duels over Supabase Realtime, leaderboards, and full localization in three languages with
> per-language keyboard layouts. Backend is Supabase/Postgres with row-level security on every
> table, plus self-service GDPR data export and account deletion. Continuously deployed as a
> containerized Docker/Nginx site to my self-hosted server via GitHub Actions and Cloudflare
> Tunnel. Designed, built, and deployed end-to-end solo.

**Live at:** https://wordlune.appfinningar.se

**Skills used** (frivillig — de andra PROJECT-posterna har ingen sådan rad):
React Native, Expo, TypeScript, Supabase (Postgres, RLS, Realtime), Docker, Nginx,
GitHub Actions, Cloudflare Tunnel

### Två varningar på den här posten
1. **"shipped to Android, iOS, and web" i 4.2/4.3 är felaktigt.** Appen ligger inte på Google
   Play och inte på App Store — bara webbversionen är live. Texten ovan säger "running on …
   with the web build live in production", vilket är sant. Byt ut. När appen väl är publicerad
   är "published on Google Play" en stark rad att lägga till.
2. **Startdatumet May 2026 stämmer inte med repot**, vars första commit är 2026-08-04. Maj
   gäller möjligen den ursprungliga Vite-webbappen ("Wordse") som projektet är en port av, men
   posten beskriver Expo-porten. Kontrollera att datumet går att försvara.

---

## 3. Åtgärdslista — kvar att göra i 4.2/4.3

### Behöver åtgärdas
- [ ] **Wordlune-texten** — byt till versionen i avsnitt 2 ovan ("shipped to Android, iOS").
- [ ] **Tempusfel, två avslutade poster.** Lexicon "Fullstack development with AI" (slut jun
      2026) säger *"Studying Backend…"* → **Studied**. Munka-praktiken (slut jul 2026) säger
      *"Developing a new website…"* → **Developed**.
- [ ] **PERSONAL SKILLS backar inte upp profilen.** Profil A lovar C#, .NET, Entity Framework,
      SQL, Next.js, Docker och CI/CD; bara C# finns i listan. Trovärdighets- *och*
      ATS-problem. Föreslagen omgruppering:
      - **Languages:** C#, TypeScript, JavaScript, Kotlin, Java, Swift, Dart, Python, SQL
      - **Backend:** .NET, Entity Framework, LINQ, Node.js, Prisma, PostgreSQL, Supabase, REST
      - **Frontend:** React, Next.js, React Native, Expo, Flutter, Tailwind, HTML/CSS
      - **DevOps & Cloud:** Docker, Nginx, GitHub Actions, Cloudflare, Azure, Linux
      - **Tools & methods:** Git, VS Code, Android Studio, Xcode, Figma, Jira, Scrum/Kanban,
        Claude Code
- [ ] **Flytta "Claude Code" från första till sista plats** i kompetenslistan. Att leda hela
      listan med ett AI-verktyg riskerar att läsas som att verktyget *är* kompetensen.
- [ ] **Lägg till GitHub-länk** under PERSONAL INFORMATION. CV:t leder med fyra egenbyggda
      projekt — varje teknisk läsare vill se kod, live-demos räcker inte.
- [ ] **Grammatik i profil A:s sista mening** — `…Munka Folkhögskola, plus several projects…`
      (ordet "plus" saknas i 4.2, satsen hänger löst). Redan rättat i texten ovan.

### Strukturellt
- [ ] **TYRA hamnar på sida 3.** Starkaste meriten — betald produktion, 250 000 användare —
      ligger efter fyra hobbyprojekt och en hemserver. Extra illa i profil B, där
      Bayou-anställningen *är* kvalifikationen. Antingen separata sektioner (EXPERIENCE före
      PROJECTS) eller skär ner till två projekt på sida 1.
- [ ] **Projektordningen är inte kronologisk** (May → Jul → May → Jul). Sortera per profil
      istället, eftersom cv-forge ändå tillåter växling:
      - Profil A (fullstack): School CMS Demo → CV Forge → Wordlune → Home Server
      - Profil B (mobil): Wordlune → CV Forge → School CMS Demo → Home Server
- [ ] **Glappet okt 2024 – sept 2025** (elva månader). Behöver inte förklaras i CV:t, men ha
      en mening redo i det personliga brevet.

### Småsaker
- [ ] Munka-postens "Live at:" är svart text medan projektens är blå länkar — inkonsekvent,
      fixas i cv-forge.
- [ ] `Nationality: Swedish` tillför inget i ett svenskt sammanhang (adress Malmö, svensk
      utbildning rakt igenom). För utländska rekryterare är "EU citizen" mer användbart.
- [ ] `Physicist Education` är knagglig engelska → `Physics`, och namnge examen om en togs ut.
      Sju år utan angiven examen väcker en fråga man inte vill att läsaren ställer sig själv.

---

## 4. Att göra i cv-forge

- Lägg in de två profilsammanfattningarna som växlingsbara **profiler**.
- Lägg in Wordlune som ett nytt **projekt** i innehållsbiblioteket.
- Kontrollera om projektordning per CV redan går att styra; annars är det den funktion
  åtgärdslistans strukturpunkt förutsätter.
