# Pro profile build2 — STOP

Bag, partners, and career sections and single BottomSheet list/editor flows were added under ProProfileBuildOne after Season/How he plays. The three generated table types already existed; types.ts, SQL, migrations, RLS, RPCs and functions were not changed. No existing test file was edited.

## Unexpected focused failures

Command: `bunx vitest run src/test/proCollectionRules.test.ts src/test/proProfileBuildOne.test.tsx src/test/proProfileBuildOneB.test.tsx --maxWorkers=2`

50 passed /23 failed /73 executed,3 files (2 failed). Full output: `/tmp/pro-build2/focused.log`.

All23 failures share the tool error:
```text
TypeError: Cannot read properties of undefined (reading 'onAuthStateChange')
 ❯ src/hooks/useSupabaseSession.tsx:51:54
 const { data: { subscription } } = supabase.auth.onAuthStateChange…
```

New ProCollectionSections imports useSupabaseSession for guest-safe owner editing; the existing focused files' Supabase mocks omit auth. Existing files/fixtures/assertions remain untouched. Do not classify this as a pre-existing failure: the new import exposes it. Further implementation/coverage, four shards and browser checks stopped. No named FS_NOTCH failures occurred in this focused command.

Affected files/cases (complete tool list):

proProfileBuildOne.test.tsx (9):
- rank replaces index with real figure and season improvement
- worse movement is muted not red
- rank uses prior-week fallback
- no rank uses best finish, no data omits headline
- unsettled sections stay absent
- visitor has Follow and Message; owner has Edit and Share
- nonlinked pro never shows linked statistics
- linked live takes week priority
- OWGR result opens strokes and real round tiles

proProfileBuildOneB.test.tsx (14):
- pro avatar is72 with full-height wrapper; default shell avatar56
- identity keeps surname badge together with three lines
- missing tour/club omits third line
- strip has top10 and friends action
- zero top10 uses BEST; no finish omits second cell
- friend state Add friend
- friend state Requested
- friend state Accept
- friend state Friends
- business excludes friend
- owner keeps Edit and Share
- no par controls for visitor
- no par controls for owner
- no par controls for admin

## Counts and existing assertions

Last full-suite baseline7,258/639;14 new rules cases in proCollectionRules.test.ts make expected inventory7,272/640. This is not a full-suite pass count. Existing tests deleted/renamed/rewritten: none; assertions changed: none.

The14 new rules cases passed, including real Mason high#1,354, two second places, earliest supplied ranking event Ein Bay2025, no wins, separate win marker, five podium cap, ordering/tie behavior, own win, bag ordering/payload/required slot, year1950/current-year and text120 limits.

Type-only correction after stop: new fixture owgr_event_id values changed from number to string to match generated ProEvent type; no assertion changes. Earlier completed-edit import typo was corrected before tests. Latest preview signal must be checked separately; no manual build/typecheck performed.

## Remaining scope/limits

- Required collection mounted interaction/write/removal/cap tests not yet added.
- Real authenticated save/readback and320px browser checks not run.
- Existing business logo primitive consistency, category wording and exact signed-off sheet copy still require close-out review.
- All four shards unrun because of unexpected focused failures.
- Source files added: proCollectionRules.ts, useProCollections.ts, ProCollectionSheets.tsx, ProCollectionSections.tsx; mounted from ProProfileBuildOne. Styles use semantic pro tokens, isolated classes; no unrelated product surface edits.
## Close-out (auth-mock fix)
- `ProCollectionSections.tsx`: removed `useSupabaseSession`; `canEdit = owner && !getGuestUser()`.
- `ProCollectionSheets.tsx`: copy corrected to mock "On clbhouz · links to their page" (was "Links").
- New `src/test/proCollectionSections.test.tsx`: 12 mounted tests (own supabase mock).
- Partner logo: SquircleAvatar `hairlineRing` → 1px traced overlay at 34%.
- Focused 73/73. Shards 1,889 / 1,761 / 1,872 / 1,762 = 7,284 tests / 641 files, zero failures (FS_NOTCH did not recur).
- Delta vs 7,258/639: +14 proCollectionRules, +12 proCollectionSections, +2 files. No existing test changed.
