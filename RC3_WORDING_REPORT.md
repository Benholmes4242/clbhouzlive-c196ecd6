# RC3_WORDING — close-out

## Shipped

Member-best defaults and English translations now use Best on clbhouz, including women’s/net achievements, friends insights, benchmark copy, lost/taken headlines and remaining stale member-best translations. Keys, interpolation variables and scoring/navigation logic are unchanged. Additional member wording in Settings and admin job descriptions was included to complete the audit.

User ruling: genuine Tour-event records and the admin “Create a new golf course record” catalogue-entry subtitle remain exceptions. The original four feature-name exceptions and admin event label remain unchanged.

Featured gross/joint labels already render with `UNIT.textTransform = uppercase` in FeaturedRoundCard.tsx:59; no style edit was needed there. The discover.golfThisWeek.moment.label.courseRecord key and handicap career recordsKicker have no production reader in src; their source values are mixed case, but there is no mounted label on which to add uppercase CSS. No invented consumer or layout change.

## Verification

- Focused command: `bunx vitest run src/test/rc3Wording.test.tsx src/test/exploreCopy.test.ts src/test/exploreNetChips.test.tsx src/test/rc2Wording.test.tsx --maxWorkers=2`: **102/102**, four files.
- Fresh ordered commands: `bunx vitest run --maxWorkers=2 --shard=n/4`.
- Shard 1: **1,819**, 154 files.
- Shard 2: **1,670**, 154 files.
- Shard 3: **1,762**, 154 files.
- Shard 4: **1,722**, 151 files.
- Total: **6,973 passed / 613 files**, zero failures or flakes. Full logs retained under `docs/verification/rc3-wording/`.
- Against the last supplied baseline **6,948 / 611**, delta is **+25 tests / +2 files**: the already-present RC2 file `src/test/rc2Wording.test.tsx` contributes four cases/one file; this task adds `src/test/rc3Wording.test.tsx` with 21 cases/one file. Thus the on-disk pre-RC3 inventory was 6,952 / 612. RC2’s historical run was not reverified; its four cases passed in this run.
- No tests deleted or renamed. Existing case names remain unchanged. No fixture lines added to existing tests. New coverage uses real I18nextProvider and MemoryRouter; it does not change production components for mocks.
- Latest preview build log reports build OK; no manual build or typecheck run. Hosted/member browser flow not checked in this wording-only pass.

## Every rewritten assertion

- `src/test/exploreCopy.test.ts:47`: `expect(headline).toBe('henryd3737 took your course record with a 68. Your 71 had stood since June 2025.');` → `expect(headline).toBe('henryd3737 took the clbhouz best here from you with a 68. Your 71 had stood since June 2025.');`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreCopy.test.ts:53`: `'henryd3737 took your course record with a 68.',` → `'henryd3737 took the clbhouz best here from you with a 68.',`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreNetChips.test.tsx:128`: `expect(subline?.textContent).toBe('2 shots better than the previous course record');` → `expect(subline?.textContent).toBe('2 shots better than the previous best on clbhouz');`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreNetChips.test.tsx:161`: `expect(record.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('2 shots better than the previous course record');` → `expect(record.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('2 shots better than the previous best on clbhouz');`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreNetChips.test.tsx:167`: `expect(singular.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('1 shot better than the previous course record');` → `expect(singular.querySelector('[data-explore-achievement-subline="true"]')?.textContent).toBe('1 shot better than the previous best on clbhouz');`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreNetChips.test.tsx:186`: `expect(container.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Net course record');` → `expect(container.querySelector('[data-explore-achievement-label="true"]')?.textContent).toBe('Net best on clbhouz');`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.
- `src/test/exploreNetChips.test.tsx:199`: `{ facts: { net_record: true }, tag: 'NEW', label: 'Net course record' },` → `{ facts: { net_record: true }, tag: 'NEW', label: 'Net best on clbhouz' },`. Reason: explicitly authorised old-copy replacement; other assertions unchanged.

The parameterised net-label case changes its expected `label` value, not the shared assertion or case template. Seven old-copy expected values changed in total (two Explore headline values and five net/subline values).

## Complete wording edit ledger

- `src/features/explore-magazine/PeopleShelf.tsx:170`: `lowest_gross_women_all_time: ['womensCourseRecordHolder', "Women's course record holder"],` → `lowest_gross_women_all_time: ['womensCourseRecordHolder', "Women's best on clbhouz here"],`
- `src/lib/gam/visuals.ts:70`: `lowest_gross_women_90d:       "Women's course record",` → `lowest_gross_women_90d:       "Women's best on clbhouz",`
- `src/lib/gam/visuals.ts:71`: `lowest_gross_women_all_time:  "Women's course record",` → `lowest_gross_women_all_time:  "Women's best on clbhouz",`
- `src/features/explore-magazine/AchievementCallout.tsx:157`: `title: t('amateur.stream.callout.record', 'New course record'),` → `title: t('amateur.stream.callout.record', 'New best on clbhouz'),`
- `src/features/explore-magazine/AchievementCallout.tsx:169`: `title: t('amateur.stream.callout.netRecord', 'New net course record'),` → `title: t('amateur.stream.callout.netRecord', 'New net best on clbhouz'),`
- `src/features/explore-magazine/AchievementCallout.tsx:388`: `defaultValue_one: '{{count}} shot better than the previous course record',` → `defaultValue_one: '{{count}} shot better than the previous best on clbhouz',`
- `src/features/explore-magazine/AchievementCallout.tsx:389`: `defaultValue_other: '{{count}} shots better than the previous course record',` → `defaultValue_other: '{{count}} shots better than the previous best on clbhouz',`
- `src/features/explore-magazine/AchievementCallout.tsx:396`: `label: t('amateur.stream.callout.netCourseRecord', 'Net course record'),` → `label: t('amateur.stream.callout.netCourseRecord', 'Net best on clbhouz'),`
- `src/components/explore-tab-new/friendRoundParts.tsx:312`: `push('record', t('discover.friendsRail.insight.record', { defaultValue: 'A new course record here' }));` → `push('record', t('discover.friendsRail.insight.record', { defaultValue: 'A new best on clbhouz here' }));`
- `src/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/proBenchmark.ts:184`: `? `The course record is ${recordGross - g} shy of ${first}'s predicted ${g}`` → `? `The best on clbhouz is ${recordGross - g} shy of ${first}'s predicted ${g}``
- `src/features/explore-magazine/CourseShelf.tsx:115`: `parts.push(t('amateur.stream.list.eventRecord', 'New course record'));` → `parts.push(t('amateur.stream.list.eventRecord', 'New best on clbhouz'));`
- `src/features/explore-magazine/exploreCopy.tsx:73`: `reasoning that removed "COURSE RECORD". The other ring prefixes STAY: a` → `reasoning that removed "Best on clbhouz". The other ring prefixes STAY: a`
- `src/features/explore-magazine/exploreCopy.tsx:291`: `'{{player}} took your course record with a {{gross}}. Your {{best}} had stood since {{month}}.',` → `'{{player}} took the clbhouz best here from you with a {{gross}}. Your {{best}} had stood since {{month}}.',`
- `src/features/explore-magazine/exploreCopy.tsx:298`: `'{{player}} took your course record with a {{gross}}. Your best here is {{best}}.',` → `'{{player}} took the clbhouz best here from you with a {{gross}}. Your best here is {{best}}.',`
- `src/features/explore-magazine/exploreCopy.tsx:302`: `return t('amateur.stream.headline.recordLost', '{{player}} took your course record with a {{gross}}.', {` → `return t('amateur.stream.headline.recordLost', '{{player}} took the clbhouz best here from you with a {{gross}}.', {`
- `src/features/explore-magazine/exploreCopy.tsx:368`: `? t('amateur.stream.headline.recordOwnToPar', 'You took the course record with a {{gross}}, {{topar}}.', {` → `? t('amateur.stream.headline.recordOwnToPar', 'You took the best on clbhouz with a {{gross}}, {{topar}}.', {`
- `src/features/explore-magazine/exploreCopy.tsx:372`: `: t('amateur.stream.headline.recordOwn', 'You took the course record with a {{gross}}.', { gross });` → `: t('amateur.stream.headline.recordOwn', 'You took the best on clbhouz with a {{gross}}.', { gross });`
- `src/features/explore-magazine/exploreCopy.tsx:378`: `'{{player}} took the course record with a {{gross}}, {{topar}}. Your best here is {{best}}.',` → `'{{player}} took the best on clbhouz with a {{gross}}, {{topar}}. Your best here is {{best}}.',`
- `src/features/explore-magazine/exploreCopy.tsx:385`: `'{{player}} took the course record with a {{gross}}, {{topar}}.',` → `'{{player}} took the best on clbhouz with a {{gross}}, {{topar}}.',`
- `src/features/explore-magazine/exploreCopy.tsx:389`: `return t('amateur.stream.headline.recordTaken', '{{player}} took the course record with a {{gross}}.', {` → `return t('amateur.stream.headline.recordTaken', '{{player}} took the best on clbhouz with a {{gross}}.', {`
- `src/features/admin/components/health/jobNames.ts:48`: `'refresh-hero-stories': { name: 'Hero stories', what: 'Ranks recent member course records, aces, albatrosses, eagles and birdie hauls into featured stories.' },` → `'refresh-hero-stories': { name: 'Hero stories', what: 'Ranks recent member bests on clbhouz, aces, albatrosses, eagles and birdie hauls into featured stories.' },`
- `src/features/admin/components/health/jobNames.ts:49`: `'refresh-latest-records': { name: 'Latest records', what: 'Rebuilds the list of the 12 newest course records set by members.' },` → `'refresh-latest-records': { name: 'Latest records', what: 'Rebuilds the list of the 12 newest bests on clbhouz set by members.' },`
- `src/components/settings/SettingsPrivacyCard.tsx:16`: `leaderboards: { title: 'Leaderboards', sub: 'Who sees you ranked on the boards, Course Champions and course records.', lines: ['Any golfer sees where you rank.', 'Only your friends see you on the boards.', "You're left off every board."] },` → `leaderboards: { title: 'Leaderboards', sub: 'Who sees you ranked on the boards, Course Champions and bests on clbhouz.', lines: ['Any golfer sees where you rank.', 'Only your friends see you on the boards.', "You're left off every board."] },`
- `public/locales/en/courses.json:297`: `"holdsCourseRecord": "Holds the course record",` → `"holdsCourseRecord": "Holds the best on clbhouz",`
- `public/locales/en/courses.json:298`: `"holdsCourseRecords_one": "Holds a course record",` → `"holdsCourseRecords_one": "Holds a best on clbhouz",`
- `public/locales/en/courses.json:299`: `"holdsCourseRecords_other": "Holds {{count}} course records",` → `"holdsCourseRecords_other": "Holds {{count}} bests on clbhouz",`
- `public/locales/en/courses.json:311`: `"womensCourseRecordHolder": "Women's course record holder"` → `"womensCourseRecordHolder": "Women's best on clbhouz here"`
- `public/locales/en/courses.json:346`: `"netCourseRecord": "Net course record",` → `"netCourseRecord": "Net best on clbhouz",`
- `public/locales/en/courses.json:347`: `"netRecord": "New net course record",` → `"netRecord": "New net best on clbhouz",`
- `public/locales/en/courses.json:354`: `"record": "New course record",` → `"record": "New best on clbhouz",`
- `public/locales/en/courses.json:355`: `"recordMargin_one": "{{count}} shot better than the previous course record",` → `"recordMargin_one": "{{count}} shot better than the previous best on clbhouz",`
- `public/locales/en/courses.json:356`: `"recordMargin_other": "{{count}} shots better than the previous course record",` → `"recordMargin_other": "{{count}} shots better than the previous best on clbhouz",`
- `public/locales/en/courses.json:429`: `"recordLost": "{{player}} took your course record with a {{gross}}.",` → `"recordLost": "{{player}} took the clbhouz best here from you with a {{gross}}.",`
- `public/locales/en/courses.json:430`: `"recordLostBest": "{{player}} took your course record with a {{gross}}. Your best here is {{best}}.",` → `"recordLostBest": "{{player}} took the clbhouz best here from you with a {{gross}}. Your best here is {{best}}.",`
- `public/locales/en/courses.json:431`: `"recordLostGap": "Took your course record with a {{gross}}. Your best is {{delta}} behind.",` → `"recordLostGap": "Took the clbhouz best here from you with a {{gross}}. Your best is {{delta}} behind.",`
- `public/locales/en/courses.json:432`: `"recordLostSince": "{{player}} took your course record with a {{gross}}. Your {{best}} had stood since {{month}}.",` → `"recordLostSince": "{{player}} took the clbhouz best here from you with a {{gross}}. Your {{best}} had stood since {{month}}.",`
- `public/locales/en/courses.json:433`: `"recordOwn": "You took the course record with a {{gross}}.",` → `"recordOwn": "You took the best on clbhouz with a {{gross}}.",`
- `public/locales/en/courses.json:434`: `"recordOwnToPar": "You took the course record with a {{gross}}, {{topar}}.",` → `"recordOwnToPar": "You took the best on clbhouz with a {{gross}}, {{topar}}.",`
- `public/locales/en/courses.json:435`: `"recordTaken": "{{player}} took the course record with a {{gross}}.",` → `"recordTaken": "{{player}} took the best on clbhouz with a {{gross}}.",`
- `public/locales/en/courses.json:436`: `"recordTakenBest": "{{player}} took the course record with a {{gross}}, {{topar}}. Your best here is {{best}}.",` → `"recordTakenBest": "{{player}} took the best on clbhouz with a {{gross}}, {{topar}}. Your best here is {{best}}.",`
- `public/locales/en/courses.json:437`: `"recordTakenToPar": "{{player}} took the course record with a {{gross}}, {{topar}}.",` → `"recordTakenToPar": "{{player}} took the best on clbhouz with a {{gross}}, {{topar}}.",`
- `public/locales/en/courses.json:449`: `"courseRecord": "Course record",` → `"courseRecord": "Best on clbhouz",`
- `public/locales/en/courses.json:459`: `"eventRecord": "New course record"` → `"eventRecord": "New best on clbhouz"`
- `public/locales/en/courses.json:1307`: `"held": "{{name}} holds the course record here with {{value}}.",` → `"held": "{{name}} holds the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1308`: `"notPlayed": "No course record here yet. It is there for the taking.",` → `"notPlayed": "No best on clbhouz here yet. It is there for the taking.",`
- `public/locales/en/courses.json:1309`: `"played": "No course record here yet. Your {{score}} would take it.",` → `"played": "No best on clbhouz here yet. Your {{score}} would take it.",`
- `public/locales/en/courses.json:1310`: `"yours": "You hold the course record here with {{value}}.",` → `"yours": "You hold the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1311`: `"heldJointTwo": "{{first}} and {{second}} jointly hold the course record here with {{value}}.",` → `"heldJointTwo": "{{first}} and {{second}} jointly hold the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1312`: `"heldJointMany": "{{first}} and {{count}} others jointly hold the course record here with {{value}}.",` → `"heldJointMany": "{{first}} and {{count}} others jointly hold the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1313`: `"yoursJointTwo": "You and {{other}} jointly hold the course record here with {{value}}.",` → `"yoursJointTwo": "You and {{other}} jointly hold the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1314`: `"yoursJointMany": "You and {{count}} others jointly hold the course record here with {{value}}.",` → `"yoursJointMany": "You and {{count}} others jointly hold the best on clbhouz here with {{value}}.",`
- `public/locales/en/courses.json:1472`: `"courseRecord": "Course record",` → `"courseRecord": "Best on clbhouz",`
- `public/locales/en/courses.json:1484`: `"courseRecordJoint": "Joint course record"` → `"courseRecordJoint": "Joint best on clbhouz"`
- `public/locales/en/courses.json:1661`: `"crown": "Course record",` → `"crown": "Best on clbhouz",`
- `public/locales/en/courses.json:1830`: `"record": "A new course record here"` → `"record": "A new best on clbhouz here"`
- `public/locales/en/courses.json:1934`: `"courseRecord": "COURSE RECORD",` → `"courseRecord": "Best on clbhouz",`
- `public/locales/en/courses.json:2241`: `"crownCourseRecord": "New course record",` → `"crownCourseRecord": "New best on clbhouz",`
- `public/locales/en/courses.json:2352`: `"crownRecord": "New course record",` → `"crownRecord": "New best on clbhouz",`
- `public/locales/en/common.json:274`: `"sub": "Connect your handicap to see your scoring average at this course against members, your friends and the course record.",` → `"sub": "Connect your handicap to see your scoring average at this course against members, your friends and the best on clbhouz.",`
- `public/locales/en/common.json:1767`: `"standingRecord": "Course record here · {{value}}",` → `"standingRecord": "Best on clbhouz here · {{value}}",`
- `public/locales/en/handicap.json:23`: `"recordsKicker": "COURSE RECORDS",` → `"recordsKicker": "Bests on clbhouz",`
- `public/locales/en/handicap.json:29`: `"recordsNoFieldData": "Course records held. How many were won against a field is not measured yet.",` → `"recordsNoFieldData": "Bests on clbhouz held. How many were won against a field is not measured yet.",`
- `public/locales/en/handicap.json:213`: `"line": "Course records, crowns and champions."` → `"line": "Bests on clbhouz, crowns and champions."`

## Every remaining whole-src match

All remaining non-comment UI matches are the four original feature-name exceptions, the admin event label, and the two user-approved Tour/catalogue exceptions. Test names still use historical feature terminology; these are diagnostic names, not displayed member-round copy, and are listed explicitly rather than silently renamed.

```text
src/hooks/top100/useTop100Enrichment.ts:16: *                                  member count, course record, player ids
src/lib/courseYou/youDerivations.ts:43: * here" below, "the course record" at or above) is driven by the same count.
src/components/friend-sheet/parts/UnsyncedPitchCard.tsx:22:  { icon: <Trophy size={16} strokeWidth={2.2} />, title: 'Course records', sub: 'Who holds what, where' },
src/pages/public/JoinLandingPage.tsx:52:  ['Records to chase', 'Course records, leaderboards and the Top 100, against the golfers you play with.'],
src/components/feed/featuredRoundTrigger.ts:7: * row), eagle brace (>= 2), CONTESTED course record. The record test is the
src/features/courses/_shared/scorecard/scorecardFeat.ts:14: * Standings do not belong here. Course record, net record and rank-up depend on
src/hooks/gam/useCircleLatestRounds.ts:659:      //  ii. COURSE RECORDS. ONE RPC FOR THE WHOLE SURFACED SET — its windowed
src/features/explore-magazine/useCourseRecordSignal.ts:9: * Who holds a course record is answered by ONE place: gam_course_legends, the
src/features/explore-magazine/useClubGolfers.ts:88:                 and lets the tile reserve "the course record" exclusively for
src/lib/gam/fieldGate.ts:11: * CROWN_MIN_OTHERS gates a CONTEST. A course record asks the binary question
src/lib/gam/fieldGate.ts:33: * round a course record or print the record fact. That is the SAME floor stated
src/features/comments-v2/components/StandingLine.tsx:3: * 10.5px, tabular. The course record takes the scorecard gold at 700; every
src/pages/EchoV2Page.tsx:158:    if (data.sources('course')) out.push(t('chat.sources.course', 'Course records'));
src/components/explore-tab-new/friendRoundParts.tsx:310:  // 1. A guarded, current course record.
src/features/explore-magazine/exploreCopy.tsx:65:    // adjacent lines never repeat "course record" or sacrifice its name.
src/features/explore-magazine/exploreCopy.tsx:220:   * achievement (BRIEF_EXPLORE_TWO_SHAPES §6). "took the course record with a
src/features/explore-magazine/exploreCopy.tsx:221:   * 69" becomes a Course record panel plus "Danny Robinson shot a 69, two
src/components/explore-tab-new/courseled/roundMoment.ts:18: *   2 COURSE RECORD   strictly beat an earlier clbhouz course mark. #F05AA6
src/components/explore-tab-new/courseled/roundMoment.ts:217:  /* 1 — ACE / ALBATROSS. They alone outrank a course record. Existing feat
src/components/explore-tab-new/courseled/roundMoment.ts:239:  /* 2 — COURSE RECORD. A RECORD IS SOMETHING YOU TAKE FROM SOMEONE. A first
src/components/explore-tab-new/courseled/roundMoment.ts:242:     COURSE RECORD as the catalogue grows. The fact is live, keyed by course_id,
src/features/explore-magazine/cardTreatment.ts:120:  /* "NEW COURSE RECORD" IS A CLAIM ABOUT NOW, so it may only be drawn from the
src/components/explore-tab-new/courseled/hooks/useGolfThisWeek.ts:20: * — nines, course records, per-course history, feats, index movement — is shared
src/features/business/clubAnalytics/sections.tsx:10: *   THE COURSE RECORD,
src/features/business/clubAnalytics/sections.tsx:464:/* ─────────────────── THE COURSE RECORD ─────────────────── */
src/features/business/clubAnalytics/sections.tsx:467: * §5 — THE COURSE RECORD, AND WHY IT CARRIES NO NAMES.
src/features/amateur/AmateurHero.tsx:77: *   4 COURSE RECORD            5 PERSONAL BEST HERE      6 JUST PLAYED
src/features/explore-magazine/AwardCluster.tsx:10: * than a course record. If that rule is ever loosened, revisit this figure.
src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:125: * A course is held by ID: two WHS course records can share a name, and
src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx:491:// course record, keyed on the id, so two records sharing a name stay two rows.
src/test/featuredRoundTrigger.test.ts:21:  it('contested course record', () => expect(featuredTriggerFor(post, round(), records(70))?.reason).toBe('course_record'));
src/test/featuredRoundTrigger.test.ts:26:  it('ace plus course record headlines the ace', () =>
src/test/exploreRoundTreatment.test.ts:26:    ['a course record draws the line', { is_course_record: true }, shape([0, 0, 0]), 'line'],
src/features/admin/lib/eventLabels.ts:53:  course_record_book_opened: 'Course record book opened',
src/test/exploreCardTreatment.test.ts:90:  /* "NEW COURSE RECORD" IS A CLAIM ABOUT NOW. A record that has since been
src/test/courseRecordSignal.test.ts:5:describe('course record holder reduction', () => {
src/test/heroCourseRecordNames.test.ts:11:describe('hero course record names (BRIEF_COURSE_HERO_1)', () => {
src/components/profile/handicap/whs/sections/course-legends/flat/YourCrowns.tsx:9: * ALWAYS ALL TIME. A crown is a claim on a course record; "you hold this over
src/components/courses/course-detail/you/UpForGrabsSection.tsx:22:  /** The course record gross, when someone holds it. */
src/components/courses/course-detail/you/UpForGrabsSection.tsx:32:   * here, never "the course record".
src/components/courses/course-detail/you/UpForGrabsSection.tsx:38:   * open. The held course record row, then every open all-time board. The
src/components/courses/course-detail/you/UpForGrabsSection.tsx:79:     here; the "course record" noun is reserved for a field that clears the
src/components/courses/course-detail/you/BoardList.tsx:4: * the course record (the hero already carries it; held boards live behind
src/components/courses/course-detail/useCourseRecordSummary.ts:52:  /** The course record (lowest gross, all time), or null. */
src/components/courses/course-detail/useCourseRecordSummary.ts:54:  /** Every holder of the course record (lowest gross, all time). */
src/test/roundMomentCourseRecord.test.ts:11:describe('COURSE RECORD moment', () => {
src/features/tourhub/hooks/useEventMoments.ts:61:  record: { icon: '📊', color: 'bg-blue-500/15 text-blue-600', label: 'Course Record' },
src/components/golf-club/GolfClubView.tsx:491:   * course record are deliberately NOT read here: nothing writes them, and on a
src/components/courses/course-detail/about/RecordBook.tsx:21: * marks the course record (lowest gross, all time).
src/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown.tsx:330:   * and the sheet only. A crown is a claim on the course record; "you hold it
src/components/courses/course-detail/about/HeroCourseRecord.tsx:4: * The course record row under the hero reference line. LOWEST GROSS ONLY —
src/components/courses/course-detail/CourseRecordBook.tsx:12: *   - the crown marks the course record row (lowest gross, all time) only
src/components/courses/CoursesPageHero.tsx:104: * app's mark for a course record (gam_course_legends are "crowns"). The other
src/components/courses/CoursesPageHero.tsx:280:                    contested flag, so COURSE RECORD vs BEST ROUND HERE cannot be
src/components/courses/course-detail/CourseYouTab.tsx:289:     the best card logged here, never "the course record". */
src/components/courses/course-detail/CourseYouTab.tsx:434:       same count: "the best card logged here" below, "the course record" at
src/features/admin/components/AddCourseSheet.tsx:129:      subtitle="Create a new golf course record"
src/features/admin/components/CourseClubControl.tsx:9: * Admin-only club attachment for a course record. Writes go through
src/components/courses/BrowseCourseCard.tsx:148:            count, the faces and the course record now arrive in the batched
src/features/activity-v2/ActivityPageV2.tsx:82:  crowns: { title: 'No records yet', sub: 'Course records, crowns, tiers and streaks land here as you play.' },
```

## Boundaries

No guest browsing, review wizard, news, round-plot logic/layout, SQL, migration files, deployed RPC/edge changes, feed_config, round_pool_cap or native/Median changes. Non-English locales are untouched. Echo’s English sources label is unchanged.
