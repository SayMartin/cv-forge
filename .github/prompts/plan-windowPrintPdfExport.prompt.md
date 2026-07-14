# Plan: Replace server export with browser `window.print()` PDF export

## Context

The layouts already have all required print CSS:

- `print:hidden` on the toolbar
- `print:break-before-page` on Row 2 of both Modern and Teal layouts
- `height: "297mm"` on Row 1, `minHeight: "297mm"` on Row 2
- `print:p-0 print:bg-white print:shadow-none print:border-none` on the outermost wrapper

The current export flow posts to `/api/cvs/{cvId}/export`, renders via `@react-pdf/renderer` (DefaultLayoutPdf only), saves to Vercel Blob, and downloads. Modern and Teal layouts have no PDF equivalent, so they fall back to the default layout — mismatching what the user sees.

Replacing the whole thing with `window.print()` gives pixel-perfect output from the web layout for all three layouts, with zero server infrastructure and zero new dependencies.

---

## Files to change

### 1. `src/app/(main)/cvs/[cvId]/view/ExportButton.tsx`

Replace the entire component. Key changes:

- Prop: `{ cvId: string }` → `{ cvName: string }`
- Remove `useRouter`, `useState`, `fetch`
- `onClick`: temporarily set `document.title = cvName`, call `window.print()`, then restore original title (the title is what browsers use as the default PDF filename)
- Label: `"Save as PDF"`

```tsx
"use client";

export function ExportButton({ cvName }: { cvName: string }) {
  function handlePrint() {
    const prev = document.title;
    document.title = cvName;
    window.print();
    document.title = prev;
  }

  return (
    <button
      onClick={handlePrint}
      className="bg-black text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors"
    >
      Save as PDF
    </button>
  );
}
```

### 2. `src/app/(main)/cvs/[cvId]/view/page.tsx`

One-line change in the JSX (around line 96):

```diff
- <ExportButton cvId={cvId} />
+ <ExportButton cvName={cv.name} />
```

---

## Verification checklist

- [ ] `npm run build` — no TypeScript errors
- [ ] Open `/cvs/{id}/view` — button reads "Save as PDF"
- [ ] Click it — browser print dialog opens; default filename matches the CV name
- [ ] Print preview shows no toolbar (print:hidden)
- [ ] Modern layout: Row 1 fills page 1, page break, Row 2 starts page 2
- [ ] Teal layout: same behavior
- [ ] Default layout: still renders correctly in print

---

## Decisions / out of scope

- The old `/api/cvs/[cvId]/export` route is **left untouched** — no deletions unless explicitly asked
- `ExportsList` on the CV detail page continues to show previously saved Blob exports — leave as-is
- `@react-pdf/renderer` stays in `package.json` (no cleanup unless asked)
- No new files created

---

## Further considerations for later refinement

1. **ExportsList UX** — Once the print approach is the only path, the list of old Blob exports becomes orphaned. Options: hide the list, add a note that it shows historical exports only, or delete old exports and remove the list entirely.
2. **Print margins** — Browsers default to ~10mm margins. Add `@page { margin: 0; }` in a `<style>` tag or global CSS if margin-free output is desired.
3. **Filename sanitisation** — `document.title` is used as-is. If CV names contain characters that are awkward in filenames (`/`, `:`, etc.) they may need sanitising before assignment.
4. **Safari behaviour** — Safari sometimes ignores `document.title` changes in `window.print()` calls. Acceptable caveat or worth testing.
