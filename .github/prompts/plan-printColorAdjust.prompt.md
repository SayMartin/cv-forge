# Plan: Preserve background colours in PDF export

## Problem

Browsers strip background colours, background images, and box shadows by default when printing. This means the dark sidebar (#2d2d2d), gold accents (#c9a84c), teal sidebar (#2d7d8a), and all coloured section headers disappear in the printed/saved PDF, leaving a plain black-and-white output.

## Fix

Add `print-color-adjust: exact` (+ `-webkit-` prefixed variant for Safari/Chrome) to the global stylesheet. This instructs the browser to render backgrounds faithfully when printing.

### File to change

`src/app/globals.css` — append at the end:

```css
/* Preserve background colours and images when printing to PDF */
@media print {
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

That's the only change needed. No layout files touched.

---

## Verification checklist

- [ ] Open `/cvs/{id}/view` for a CV using the Modern layout
- [ ] Click "Save as PDF" → browser print dialog
- [ ] Print preview shows dark sidebar with gold accents intact
- [ ] Repeat for Teal layout — teal sidebar preserved
- [ ] Repeat for Default layout — any coloured elements preserved
- [ ] `npm run build` — no errors

---

## Notes

- `-webkit-print-color-adjust` covers Safari and older Chrome; `print-color-adjust` is the standard property covering Firefox and modern Chrome/Edge — both are needed for cross-browser coverage
- Scoping to `@media print` means zero effect on screen rendering
- This is a single CSS rule; no JavaScript, no new dependencies, no layout changes required
- The `window.print()` `ExportButton` is already in place from the previous step
