# Wave 3d.iii — final courses sub-wave

## Scope receipt (measured, not assumed)

Ran the WARN-as-ERROR probe over the five sub-wave paths. Baseline:

- **152 violations across 26 files** in `course-detail/` + `network/` + `map/` + `phase5/` + `features/courses/components/`.
- Distribution (files with hits):
  - `course-detail/` — 14 files (Claim*, CommunityScoreCard, ConnectHandicapCue, CourseAboutTab, CourseExploreLinks, CourseLocationPills, CourseReviewsTab, CourseTop100*, SuggestEditModal, AboutMediaStrip)
  - `map/` — MapCourseSheet, MapInsightChip
  - `network/` — NetworkHighlightCarousel, UnseenReviewsBanner
  - `phase5/` — CourseStatusToggle, PersonalReviewCard, PlanningSignals
  - `features/courses/components/holes/` — CourseHolesTab, HoleFeatureCards, HolesCredibilityHeader, HolesEmptyState, HolesScoringKey

All of it is user-visible copy: JSX text, `aria-label`, `title`, `placeholder`, `alt`, and prop-passed `label`s. No literals sit in constants that legitimately stay in English (brand vocabulary lives in `achievements/` and stayed there in the previous ruling).

## How to execute

Because a single 26-file drop-and-pray is a bad shape (merge conflicts, review load, and the risk of a partial extraction leaving the gate un-flippable), I'll run this as **three tight sub-batches inside 3d.iii**, one per turn, each landing green before the next starts:

**3d.iii.a — course-detail/ (14 files, ~110 violations)**
- The bulk of the wave. Every file gets `useTranslation('courses')` if missing, JSX text and user-visible attrs routed through `t(...)`, with keys namespaced under:
  - `courseDetail.claim.*` (CTA, sheet states, under-review, claimed profile link)
  - `courseDetail.about.*` (media strip, description toggle, location empty, website button)
  - `courseDetail.locationPills.*`
  - `courseDetail.exploreLinks.*`
  - `courseDetail.top100.*` (spotlight, summary)
  - `courseDetail.suggestEdit.*`
  - Plus the "Category Scores" / "Based on N ratings" strings on `CommunityScoreCard` and the empty-state / "Be the first" copy.
- Interpolation for `{{clubName}}`, `{{count}}` (pluralised where the source already branches on `n === 1`), `{{cat}}` category label in State C of the claim sheet.

**3d.iii.b — map/ + network/ + phase5/ (7 files, ~28 violations)**
- `map.*`, `network.*`, `phase5.*` sub-namespaces; the `ConnectHandicapCue` COPY table's inline sentences move into keyed variants (`courseDetail.handicapCue.<variant>.benefit|sub`).

**3d.iii.c — features/courses/components/holes/ (5 files, ~14 violations)**
- Extends the existing `holes.*` namespace already in `courses.json`.
- No new locale namespaces — just additional keys.

## Locale coverage

Every new key lands in all six locales in the same turn it's introduced:
- `en`, `de`, `es`, `ja`, `ko`, `en-XA`.
- `en-XA` gets pseudo-localised strings (`[!!ëẍáṁṗłë!!]` style) matching the existing convention in the file.
- Non-English locales get English fallback text with a `// TODO: translate` sibling only if the existing file uses that convention; a quick scan says the file just carries English strings today, so I'll mirror that pattern rather than invent one.

## ESLint config — parent-dir gate consolidation

Only after all three sub-batches show 0 with the ERROR rule locally. The three sub-wave ERROR blocks (3d.i, 3d.ii, 3d.iii) collapse into a single block:

```js
// ─── Wave 3d — scope-dir ERROR flip for courses vertical ──────────
{
  files: [
    "src/components/courses/**/*.{ts,tsx}",
    "src/components/course-media-tab/**/*.{ts,tsx}",
    "src/features/courses/**/*.{ts,tsx}",
  ],
  rules: {
    "i18next/no-literal-string": ["error", i18nLiteralOptions],
    "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
  },
},
```

The three narrower blocks (`courses/*.{ts,tsx}`, `courses/review/**`, `courses/user/**`, `course-media-tab/**`, `_shared/**`) are removed as they're now covered by the two `**` globs. This closes the gap so any new file under `src/components/courses/**` or `src/features/courses/**` is gated on creation.

## Carry-over items

Both already landed in the previous turn per the summary:
- `PersonalReviewCard` / `CommunityScoreCard` / `CourseReviewsTab` — `{ key, labelKey }` conversion is done; I verified `t(labelKey)` sites in the files I just read.
- Achievements "pending-Ben" markers — flipped to "by product ruling".

No re-work needed on these; the receipts below will confirm on grep.

## Receipts each sub-batch will paste back

1. `npx eslint --rule '{"i18next/no-literal-string":["error",...]}' <sub-batch paths>` → **0 errors**.
2. Full-scope re-probe after the last sub-batch: same command over all five paths → **0 errors**.
3. `grep -rn '\bpending Ben\b' src/components/achievements/` → 0 hits.
4. `git diff --stat` per sub-batch.
5. `npx tsc --noEmit` clean; `vite build` succeeds.

## Non-goals for this wave

- No visual changes; extraction is text-in-place with `t(...)` swaps.
- No refactor of the ConnectHandicapCue variant table's structure — the COPY object stays, its string returns move to `t(...)`.
- No touching files outside the five listed directories.

---

**Ready to fire 3d.iii.a on your go.** Landing all three sub-batches plus the gate consolidation in one turn is technically possible but would ship ~40 file edits and ~150 locale-key additions without an intermediate green light — I'd rather you see 3d.iii.a's receipts first and greenlight .b and .c.
