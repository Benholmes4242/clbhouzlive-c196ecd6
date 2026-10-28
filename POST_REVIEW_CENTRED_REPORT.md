# POST / REVIEW — Centred option B: STOP report

## Changes
- `src/components/GlobalBottomNavigation.tsx`: centre button now uses justifyContent `center`, padding `0 3px`, gap 3.5; both words carry display `block` and textBox `trim-both cap alphabetic`; SVG is 14×11.9 with viewBox `0 1.8 24 20.4`. Existing paths, stroke, word styles, other tabs and behaviour retained.
- `src/test/postReviewTab.test.tsx`: authorized changes to both existing cases; no cases added or removed.
- `roadmap.md`: task and verification/stop status.
- `POST_REVIEW_CENTRED_REPORT.md`: this report.
- Project memory: added signed-off centre-tab requirement and its index link.

## Tests and inventory
Command: `bunx vitest run`.

Before: last reported 4,112 tests across 436 files (4,111 passed, one known onboarding flake).
After: 4,112 tests across 436 files (4,111 passed, one new centre-tab failure).
Delta: zero. No tests deleted or added.

Authorized rewritten/renamed case in `postReviewTab.test.tsx`:
- Previous name: “renders POST, the arrows and REVIEW in order, arrows a fixed 16 x 16 svg”. Previous assertions: `expect(svg.getAttribute('width')).toBe('16')`, `expect(svg.getAttribute('height')).toBe('16')`, `expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')`.
- New name: “renders POST, the arrows and REVIEW in order with cap-trimmed words and ink-cropped arrows”. Expected dimensions/viewBox updated to brief values; display and text-box checks added. Order, stroke and paths retained. Reason: signed-off option B explicitly supersedes the old geometry.

Authorized strengthened case: “labels the tab \"Post or review\", keeps id post, and opens ComposerFlowSheet on tap”. Original assertions retained; added `expect(button.style.justifyContent).toBe('center')`, `expect(button.style.gap).toBe('3.5px')`, `expect(button.style.padding).toBe('0px 3px')` per brief. Name unchanged.

## Surviving errors — no corrections after failure
`src/test/postReviewTab.test.tsx:38:55`:
```text
AssertionError: expected '' to be 'trim-both cap alphabetic' // Object.is equality
```
Failing assertion: `expect(word.style.getPropertyValue('text-box')).toBe('trim-both cap alphabetic')`.

Automatic typecheck, 2026-10-28T21:11:47Z:
```text
src/components/GlobalBottomNavigation.tsx(44,21): error TS2353: Object literal may only specify known properties, and 'textBox' does not exist in type 'Properties<string | number, string & {}>'.
```

The known pre-existing onboarding upload flake is owned by onboarding and was not edited; `src/test/ob1Welcome.test.tsx` passed all 74 cases in this run. No other pre-existing failure observed.

## Rendered check
Not performed after the completed-edit stop. Visible gaps above/below arrows are unverified; 3.5px is the specified setting, not a measured result. The preview is not typecheck-clean.

No SQL, migrations, migration files, deployed RPC/edge changes, feed_config, round_pool_cap or native/Median changes.