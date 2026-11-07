# Course heroes match the Tour hero

## Authorised test-only close-out — 7 November 2026
Production unchanged. Only the three authorised checks were repaired; no additional test changes, deletions, skips or new cases. This section supersedes the historical stop below.

### Exact old/new values
1. `tourPlayoffShortenedEvents.test.tsx`: **“a standard result still reads RESULTS” → “a standard result reads FINAL in the tour line”**. Old `expect(container.textContent).toContain('RESULTS');` → `expect(container.textContent).toContain('FINAL');` and `expect(container.textContent).not.toContain('RESULTS');`. Reason: removed RESULTS pill; signed-off finished-event FINAL line. PLAYOFF case unchanged;18cases before/after.
2. `courseHeroesMatch.test.tsx:59`, **“preserves default masthead name and ruled child spacing”**: `expect(title.style.fontSize).toBe(MASTHEAD_NAME.fontSize);` → `expect(title.style.fontSize).not.toBe('26px');`. Reason: jsdom drops clamp(); all remaining tracking/height/gap/hairline assertions retained.
3. `courseHeroesMatch.test.tsx:81`, **“keeps gold record,24px hairline avatars and21px gross”**: `expect(container.querySelector('[data-squircle-avatar]')?.getAttribute('style')).toContain('24px');` → `expect(container.querySelector('[style*="24px"]')).not.toBeNull();`. Reason: nonexistent marker replaced with authorised size-style selector.9cases before/after.

### Focused results
```text
bunx vitest run src/test/overviewHeroBStrip.test.tsx src/test/pickSheetV2.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewPicksChipsFullBoard.test.tsx src/test/tourPlayoffShortenedEvents.test.tsx --maxWorkers=2
85/85 passed,5files
bunx vitest run src/test/courseHeroesMatch.test.tsx src/test/coursesHeroPlaceScrim.test.tsx src/test/reviewStepOne.test.tsx src/test/heroCourseRecordNames.test.ts --maxWorkers=2
44/44 passed,4files (course9,place10,review21,names4)
```

### One shared fresh suite run
`bunx vitest run --maxWorkers=2 --shard=N/4`:
- Shard1:2000passed /168files, zero failures.
- Shard2:1827passed +1failed =1828executed /168files (167passed,1failed).
- Shards3–4:not run, unapproved failure stop. No reruns/skips/repairs.
- Combined executed3827passed +1failed =3828tests /336files. Focused129cases are reruns, not extra suite cases.

```text
FAIL src/test/tourHeroRefinements.test.tsx > Tour hero refinements > renders the Needs gross as a separate untruncated white figure and omits leading/level picks
AssertionError: expected  to have a length of 1 but got +0
Expected: 1
Received: 0
src/test/tourHeroRefinements.test.tsx:98:19
```
Untouched Needs assertion is not the allowed-known FW1 meta-line failure; therefore remaining shards stopped. FW1 did not fail in executed shards. All three authorised repaired cases pass.

No test-count delta from this repair: expected7657/669 before and after, still not a full runner-verified inventory. Last full green7607/664 +tight chips3/1 +photo grid22/2 +Tour B16/1 +courses9/1 =7657/669. No full-suite success claimed. Latest preview entry `2026-11-07T20:26:10Z build OK`; logs `/tmp/heroes-closeout/{tour-focused,course-focused,shard1,shard2}.log`.

No browser reruns in this test-only request. Prior course-detail320px passes and Courses-page/island/avatar/seam limitations remain below. Current suite blocker is the Needs assertion, not the repaired clamp/avatar checks.

## Delivered
Both course photo headers now use the canonical PhotoBandFade, fixed340px height,26px/800 zero-tracking names and14px bottom/20px side placement. The opt-in masthead has4px kicker/place seams and unruled9px children. Course records keep MEDAL_GOLD and unchanged holder logic/overlap/ring; avatars24px, names13.5px, score21px. Reviews, skeletons and other masthead callers retain defaults.

## Files changed
- `src/components/courses/CourseMasthead.tsx`: optional photoBand=false, opt-in type/seams and local ownership header.
- `src/components/courses/CoursesPageHero.tsx`: shared fade,14px/20px placement, opt-in masthead, zero rank-lead tracking.
- `src/components/golf-club/GolfClubView.tsx`: both hero mounts fixed340px/shared fade;20px/14px overlay, no flex-gap wrapper.
- `src/components/courses/course-detail/about/HeroCourseRecord.tsx`: requested sizes; removed unused45px height export (only GolfClubView consumed it); visibility/names/score logic unchanged.
- `src/index.css`: semantic gross-label white62% token.
- `src/test/coursesHeroPlaceScrim.test.tsx`: only replaced overlay assertions below.
- `src/test/courseHeroesMatch.test.tsx`:9new cases, including four record/modal permutations, opt-in/default masthead, record presentation, source isolation and browser capture.
- `roadmap.md`, project memory: scoped requirements and verification state. Architecture rule lives beside CourseMasthead, preserving root AGENTS.md rules.

## Existing test changes, old → new
One existing case renamed/reworked in `coursesHeroPlaceScrim.test.tsx`: **“layers the canon wash then the tall scrim beneath the text” → “layers the shared photo-band fade beneath the text”**.
- `layers[0].style.background === probe(HERO_CANON_WASH)` → first layer has `data-photo-band-fade`; canonical source contains `background: 'var(--th-overview-photo-fade)'`. jsdom omits var() background.
- `layers[1].style.background === probe(SCRIM_HERO_TALL)` → replaced by shared material source check; old second overlay no longer exists.
- Absolute/inset assertions target `layers[1]` → `layers[0]`.
- Text zIndex1/contains-name assertions target `layers[2]` → `layers[1]`.
Reason: brief explicitly replaces both overlays with one shared layer. No tests deleted. Token-recipe test retained unchanged. No existing height385, offsets16/24 or score19 assertions found. `reviewStepOne.test.tsx` unchanged and all21cases passed.

## Test stop — no repairs made
Command:
```text
COURSE_HERO_BROWSER=1 bunx vitest run src/test/courseHeroesMatch.test.tsx src/test/coursesHeroPlaceScrim.test.tsx src/test/reviewStepOne.test.tsx src/test/heroCourseRecordNames.test.ts --maxWorkers=2
```
Result: **42passed +2failed =44executed /4files**. Per file: new course suite7passed/2failed; place/scrim10passed; review21passed; record names4passed.

```text
FAIL src/test/courseHeroesMatch.test.tsx > Course headers match the Tour material > preserves default masthead name and ruled child spacing
AssertionError: expected '' to be 'clamp(24px, 7.7vw, 30px)' // Object.is equality
src/test/courseHeroesMatch.test.tsx:59:34

FAIL src/test/courseHeroesMatch.test.tsx > Course headers match the Tour material > keeps gold record,24px hairline avatars and21px gross
AssertionError: the given combination of arguments (undefined and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
src/test/courseHeroesMatch.test.tsx:81:86
```
First new check assumes jsdom retains clamp(); second selects a nonexistent `data-squircle-avatar` marker. Neither test nor production was repaired after failure. Under the standing stop rule, shards1–4 were not started; no full-suite pass claimed. Allowed-known FW1 did not occur in focused tests.

Counts: last reported expected scope7648tests/668files (not a completed green run); this adds9tests/1file, expected7657/669. Existing suite10cases remains10 despite one renamed case. Last verified green remains7607/664; intervening deltas: tight chips+3/+1, photo grid+22/+2, Tour hero B+16/+1, this task+9/+1. Full current inventory remains unverified.

## 320px browser checks
Chromium320×844, real mounted GolfClubView DOM emitted from test providers/cache fixtures, no sign-in or guest mint. Reference photo used only in temporary browser fixture, not embedded in app. Global CSS/Tour token loaded. jsdom had omitted the fade's var() background in captured HTML, so browser harness restored that exact canonical style before screenshots; no app change.
- **Course without record:** width320,height340,title top217.56px; no horizontal overflow.
- **Course with record:** width320,height340,title top168.31px; holder client179px/scroll375px with ellipsis; gold record maintained; no horizontal overflow.
- Both titles leave ample space above for top islands, but actual islands were not mounted, so live island clearance is not verified. Fade renders the exact15%/0%/62%/97% Tour gradient; screenshots show the lower photo darkening. A live adjacent page seam and loaded avatars are not proven by these component crops.
- **Courses page:** standalone real React mount failed before a header appeared; browser error `Page.evaluate: TypeError: Cannot read properties of null (reading 'parentElement')`. This320px check remains unverified; no successful screenshot claimed.
Evidence `/tmp/browser/course-heroes/detail-False.png`, `detail-True.png`, `results.json`, `courses-error.log`; focused output `/tmp/course-heroes/focused.log`.

Preview's latest available build entry: `2026-11-07T20:14:32Z build OK`. No manual build/typecheck run. Ben's live-device checks remain: Courses hero, actual islands, adjacent photo/page seam and loaded record avatars. No SQL/migrations, deployed RPC/edge, feed_config, cap30, native/Median, guest browsing, review wizard, news or round plots changed.