# Fix mentions-composer caret drift

## Scope
Apply only the requested typography-metric fixes in `src/index.css`, `MentionsComposerInput.tsx`, and `ReviewComposerV2.tsx`. No component restructuring, data changes, SQL, or migrations.

## Changes
1. **Disable WebKit text autosizing at the document root**
   - Add `-webkit-text-size-adjust: 100%` and `text-size-adjust: 100%` to the existing top-level `html` rule.
   - Keep this document-wide so the native shell cannot inflate block text independently of form controls.

2. **Make the painted text and caret-owning textarea use identical character metrics**
   - Add `fontKerning: 'none'`, `fontVariantLigatures: 'none'`, `fontFeatureSettings: '"kern" 0, "liga" 0, "clig" 0, "calt" 0'`, and `fontVariant: 'normal'` to `sharedText` in `buildMentionsStyle`.
   - Do not add these properties to `control`; they will reach only `highlighter` and `input` through the existing spreads.
   - Preserve mention colour, transparent textarea text, placeholder handling, and the suggestions panel.

3. **Pin the review field line height**
   - Replace the unitless `1.55` with `23px`, documenting that both layers must resolve the same fixed line box.

4. **Protect mentions fields from the mobile 16px fallback**
   - Change the existing mobile selector to `textarea:not(.mentions-composer__input)` while leaving ordinary inputs, selects, and the 16px anti-zoom rule intact.

## Verification
- Run the TypeScript check and focused mention/composer tests available in the repository.
- In the browser preview, inspect rendered computed styles for both layers and verify equal font size, line height, kerning, ligature, feature, spacing, padding, and box metrics.
- Exercise a reachable mentions composer with `hello ` and `AVATAR Wavy To Yo`, checking caret placement and trailing-space width; confirm the placeholder and suggestion panel still render correctly where session/data access permits.
- Report the shared callers found, exact computed measurements, and any device-only or authentication limits. A desktop browser can verify style parity, but the final WKWebView behavior still requires the supplied on-device checklist.
