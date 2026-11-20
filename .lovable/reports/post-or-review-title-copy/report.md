# Post or review sheet — copy-only ruling

## Files changed and locales
- `src/locales/{en,de,es,ja,ko,en-XA}/composerFlow.json`: post.title, review.title, reviewSearch.title only.
- `src/features/composer-flow/ReviewCourseSearchSheet.tsx`: title defaultValue only, Review a course → Review a golf course.
- `src/test/postOrReviewSheet.test.tsx`: two authorized assertions only; all case names, other assertions and mocks unchanged.
- `roadmap.md`: result accounting. This report, full test outputs and browser evidence are supporting files.

Locales updated: **en, de, es, ja, ko, en-XA**. All five normal locales had the identical English post/review strings; no genuinely translated title was overwritten. reviewSearch.title was absent in all six catalogues: added it with the requested title, replacing the previous runtime-default-only source. Existing translated step/close/back values are unchanged.

For en-XA, only these three title values were generated with the accent mapping and `[~~…~~]` wrapping used in scripts/i18n-pseudo.cjs; the generator was not run over other keys or namespaces. New values: `[~~Ƥőšţ šőɱéţĥíñĝ~~]` and `[~~Řéṽíéŵ á ĝőļƒ ĉőúřšé~~]` (the latter for both review titles).

No layout, style, behaviour, SQL, migrations, feed_config or round_pool_cap changes. post.line, review.line, camera/library button copy, review.search, sheet title and OR unchanged.

## Every assertion changed (old → new)
`src/test/postOrReviewSheet.test.tsx`, case `renders a heading and Post then OR then Review, without a counter or NEXT`:
- Line 49: `expect(boxes[0].querySelector('h2')).toHaveTextContent('Post')` → `expect(boxes[0].querySelector('h2')).toHaveTextContent('Post something')`.
- Line 50: `expect(boxes[1].querySelector('h2')).toHaveTextContent('Review a course')` → `expect(boxes[1].querySelector('h2')).toHaveTextContent('Review a golf course')`.

Why: the brief explicitly changes those titles. No other matching sheet-title assertion was found. The case name at line 97 remains exactly as written. No assertions or cases deleted, added or renamed. Affected file remains 15 tests.

## Test totals and full output
Baseline **9,383 tests / 837 files**, previous full pass 69a451999f. After **9,383 tests / 837 files**, no inventory delta and no failures. Each shard ran as its own command, sequentially, once.

| Command | Passed | Failed | Files | Full output |
|---|---:|---:|---:|---|
| `bunx vitest run --shard=1/4` | 2,304 | 0 | 210 | shard-1.log |
| `bunx vitest run --shard=2/4` | 2,287 | 0 | 210 | shard-2.log |
| `bunx vitest run --shard=3/4` | 2,349 | 0 | 210 | shard-3.log |
| `bunx vitest run --shard=4/4` | 2,443 | 0 | 207 | shard-4.log |
| Total | **9,383** | **0** | **837** | |

Focused: `bunx vitest run src/test/postOrReviewSheet.test.tsx` — **15/15**, focused.log. Existing non-failing act/provider warnings retained, not edited.

## 320px title check
Chromium, actual ComposerFlowSheet rendered with real providers and unchanged CSS, 320×1800 viewport:
- Post something: **18px**, one line, text width **135.02px** inside **201.80px**.
- Review a golf course: **18px**, one line, text width **179.06px** inside **202px**.
- Clicking the unchanged Find a course to review button opens the actual search sheet with Review a golf course.

Both English titles fit; no size or styling change needed. Screenshots visually inspected: 320-entry-sheet.png and 320-search-title.png. results.log contains measurements. Check was an isolated actual sheet, not an authenticated live publication flow; authentication was not needed for this copy/geometry check. Pseudo-locale wrapping was not measured; the required English 320px check passed.
