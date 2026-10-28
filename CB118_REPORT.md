# CB118 — Visiting or Contact: completed-edit STOP report

## Result
The non-club card is implemented, but CB118 is **not green**. Corrections stopped after two new failures in protected club tests. No pre-existing failures: the last reported green baseline was 3,756 tests across 415 files; the earlier Media failures do not recur.

## Diff
- `ClubVisiting.tsx`: added optional `nonClub` and `onBook` props; default club rows/copy remain. Non-club booking uses `businessSecondPill`, precise Directions gates, Visiting/Contact kicker, Call/Email, coaches/team sheet wording, empty-card omission. Existing rows, chips, socials, hours and sheet are reused. The sheet title uses the existing semantic ink token instead of its literal equivalent.
- `BusinessProfilePage.tsx`: inserts non-club ClubVisiting directly after mentions, passes public team count and the existing hero callback. Posts/About/Team remain. Removed non-null assertions in that callback without changing tracking or destinations.
- `public/locales/en/common.json`: added business.visiting strings and team plurals; existing hero booking keys reused.
- `AGENTS.md`: replaced the shared Visiting/About ownership note to cover the shared non-club card and hero callback.
- `roadmap.md`: added CB118 status. Uploaded HTML remains a reference, not an embedded app asset.

## Commands and inventory
- `bunx vitest run src/test/cb118BusinessVisiting.test.tsx src/test/cb107ClubVisiting.test.tsx src/test/cb108ClubFeed.test.tsx src/test/cb112BusinessHero.test.tsx src/test/cb117BusinessMentions.test.tsx`: **118 passed / 2 failed / 120 total**, 4 passing / 1 failing files.
- `bunx vitest run`: **3,787 passed / 2 failed / 3,789 total**, 415 passing / 1 failing files, **416 files**. No skipped cases reported.
- Baseline **3,756 / 415** → **3,789 / 416**: exactly **33 added tests** in `src/test/cb118BusinessVisiting.test.tsx`, no removals. New-file tests cover precise/coarse Directions (including zero coordinates), hours/Contact, clbhouz stored details, category booking and Soon, phone/email handlers, team sheets, empty/facilities-only cards, team plural keys, club default copy, and page insertion/callback wiring.
- Automatic check: latest available entry **2026-10-28T06:56:55Z — build OK**. No manual build/typecheck run.

## Explicitly authorized existing-test changes
No existing test was deleted. One was renamed; four CB112 cases retain their names.

1. `cb107ClubVisiting.test.tsx`, old **“a non-club keeps contacts in its About tab and the Posts tab bar without Visiting”** → new **“a non-club adds Visiting contacts while keeping its About and Posts tabs”**.
   - Old assertions: `expect(container.querySelector('[data-club-visiting]')).toBeNull()` and `expect(screen.queryByRole('button', { name: 'Website' })).toBeNull()`.
   - New assertions: card and its website row exist; `expect(within(hero).queryByRole('button', { name: 'Website' })).toBeNull()` protects the retired hero contact row. Book query is scoped to the hero. About/Posts and booking destination assertions remain.
   - Why: user explicitly approved this non-club-only conflict correction.
2. `cb112BusinessHero.test.tsx`, **“renders the shared hero; old hero, bio block and action rows are absent”**.
   - Old: `expect(screen.queryByRole('button', { name: 'Call' })).toBeNull()`.
   - New: `expect(within(hero).queryByRole('button', { name: 'Call' })).toBeNull()`, `expect(calls).toHaveLength(1)`, and `expect(calls[0].closest('[data-club-visiting]')).not.toBeNull()`.
   - Why: user expressly required the sole page Call action to belong to Visiting; all other assertions preserved.
3. **“hotel with a booking link: Book a stay with arrow opens it”**: whole-page `screen.findByRole('button', { name: 'Book a stay' })` → `within(hero).getByRole(...)`; arrow, link and Soon absence assertions preserved.
4. **“academy without a link: Book a lesson + Soon toasts”**: whole-page `screen.findByRole('button', { name: /Book a lesson/ })` → `within(hero).getByRole(...)`; Soon/toast/no-link assertions preserved.
5. **“brand with primary website: Website + arrow; none renders no second pill”**: whole-page Website query → `within(hero).getByRole(...)`; arrow and empty second-pill assertions preserved.
   - Why for 3–5: user explicitly approved scoping these repeated actions to the hero.

CB108 and CB117 tests unchanged and passing. All 33 CB118 cases and all CB112 cases pass. No protected failing case was changed after the stop.

## Exact new failures (both recur in full suite)
1. `src/test/cb107ClubVisiting.test.tsx:257:107`, **“CB107 page integration > club Visiting follows What golfers say; contact rows and About are gone”**:
   `AssertionError: expected false to be true // Object.is equality`
   Failing assertion: `expect(container.querySelector('[data-say]')?.nextElementSibling?.hasAttribute('data-club-visiting')).toBe(true)`.
2. `src/test/cb107ClubVisiting.test.tsx:273:43`, **“CB107 page integration > Team stays conditional and moves into Visiting as Meet the team”**:
   `AssertionError: expected <div role="tablist" …(3)>…(3)</div> to be null`
   Failing assertion: `expect(screen.queryByRole('tablist')).toBeNull()`; received Posts/About/Team tablist.

Observed condition: adding a immediately available non-club card makes these club fixture waits resolve before the asynchronous club-course query settles. This is a diagnosis, not an applied correction; the actual club path is not claimed verified. Resolving protected fixture waits requires authorization; no tests were silently rewritten.

## Limits and protected scope
Authenticated end-to-end and visual checks unavailable (`external_unmanaged`); not claimed. No browser verification was attempted after the test stop. No SQL, migrations/migration files, deployed RPC/edge-function edits, feed_config, round_pool_cap or native/Median config changes. Cap remains 30.