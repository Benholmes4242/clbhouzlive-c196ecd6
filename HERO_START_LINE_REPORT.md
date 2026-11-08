# HERO_START_LINE — incomplete, stopped

## Stop
Command: `bunx vitest run src/test/allHeroesMatch.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/courseHeroesMatch.test.tsx src/test/reviewStepOne.test.tsx src/test/tournamentNotch.test.ts --maxWorkers=2`

79 passed / 1 failed (80 executed, five files). No tests added or deleted: focused count before/after **80 / 80**. Failure preserved in `docs/verification/hero-start/focused.log`:

`src/test/reviewStepOne.test.tsx:119:37`, `header forms > renders the course page masthead over the photo: shared kicker, place, two-line name clamp`

`AssertionError: expected 'relative' to be 'absolute' // Object.is equality`

Expected `absolute`, received `relative`. That assertion is unchanged. No further test repairs or shard runs after this unexpected failure. Full-suite baseline remains **7,780**; no fresh full-suite total is available.

## Reference blocker
The current formula yields189.92px. Fixture live kicker text measured189.9375px at320/390/430, while the ruling freezes the earlier193.9px reference. The discrepancy is unresolved, not permission to change the reference. Completed fixture text189.90625px and band276.984375px; live band350px. No claim that the required reference/freeze tests pass. Required new measurement tests and converted-surface screens are incomplete.

## Production files touched during alignment
- `src/lib/heroHeights.ts`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/photoBandGeometry.ts` (new)
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx`
- `src/components/courses/CourseMasthead.tsx`
- `src/components/courses/CoursesPageHero.tsx`
- `src/components/golf-club/GolfClubView.tsx`
- `src/components/profile/hero/ProfileCoverBand.tsx`
- `src/components/profile/hero/ProfileHero.tsx`
- `src/components/profile/hero/HeroShell.tsx`
- `src/components/business/hero/ClubProfileHero.tsx`
- `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`
- `src/features/tourhub/tournament-v2/tournamentPage.css`
- `src/features/review-v2/components/ReviewCourseHero.tsx`
- `src/features/review-v2/components/ReviewComposerHeader.tsx`
- `src/features/review-v2/components/reviewComposerHeader.css`
- `src/features/review-v2/ReviewComposerV2.tsx`
- `src/features/amateur/AmateurHero.tsx`
- `src/components/skeletons/CourseDetailSkeleton.tsx`
- `src/components/skeletons/ProfileSurfaceSkeleton.tsx`

## Test assertion ledger (no deletion, no count delta)
Each old fixed layout assertion was revised because the brief requires content flow. Exact changed expectation expressions follow; names are the old case names.

`allHeroesMatch.test.tsx`:
- “the photo header is350px in total, notch counted inside”: `PHOTO_HEADER_H_CSS === '350px'` → review hero source contains `paddingTop: HERO_CONTENT_TOP`; CSS `height:350px` → `height:auto`.
- “is a350px band whose crop frame keeps the39/34 constant”: root `height === '350px'` → empty inline height; crop checks unchanged.
- “lays the fade over a350px cover with the identity on the photo”: cover `height === '350px'` → empty inline height.
- “replaces the wash, ramp and top guard with the shared fade”: `padding === '0px20px14px'` → derived paddingTop and paddingBottom14px; fade assertions unchanged.
- “the overview band is350 with no safe-area term; the news hero stays340”: source `height: photoBandHeight(bandHeight)` → conditional live-only definite height; constants unchanged.
- “the Courses page, amateur and course-detail heroes all read the350 constant”: fixed-height source checks → `paddingTop: HERO_CONTENT_TOP`, detail `paddingBottom: HERO_CONTENT_BOTTOM`.
- “the tournament hero is350 with no safe-area term”: fixed-height JSX → shared paddingTop/paddingBottom JSX; safe-area exclusions unchanged.
- “the review photo header is350 with no safe-area term”: same review change as first case.
- “the golfer cover band is350 with no safe-area term”: fixed-height source → derived paddingTop; mounted350px → empty inline height.
- “the business cover is350 with or without a photo”: fixed-height source → derived paddingTop; both mounted350px → empty inline height.
- “the pro hero carries a350 minHeight floor with a cover, none without”: floor350 → `HERO_CONTENT_TOP + HERO_TALLEST_CONTENT`, mounted `HERO_CONTENT_TOP +295`; no-cover assertion unchanged.
- “the HeroShell skeleton matches the350 floor”: fixed minimum source → derived paddingTop.

`courseHeroesMatch.test.tsx`:
- Four cases “keeps detail350px and one canonical fade (record%s,modal%s)”: height350px → empty inline height plus derived paddingTop; absolute left/right20px,bottom14px → relative position, margin0px20px, no bottom. Fade count/record/title assertions unchanged.

`reviewStepOne.test.tsx`:
- “preserves the safe-area photo height and compact height through the measured fold”: photo CSS350px → auto; child100% → auto; compact/fold assertions unchanged.

`tournamentNotch.test.ts`:
- “tournament photo is350px in total with the notch counted inside”: fixed-height JSX → shared paddingTop/paddingBottom JSX.

`tourOverviewMergedAiry.test.tsx`:
- Three cases “puts the sentence and note on the photo in$kind at the derived height”: live350 retained; non-live calculated definite height → empty inline height; absolute gutter/bottom checks → conditional absolute/relative position and bottom/paddingBottom14px.
- “a finished band with no sentence drops both live-only lines”: fixed calculated height → empty inline height plus relative text position; omission assertions unchanged.

No other assertions were changed to bypass the failure. Temporary fixture source/root HTML removed. Latest preview log reports build OK; no manual build run.

## Prior overview close-out
Fresh shard4:1,908. Previous shards1–3:2,007 /1,871 /1,994. Total7,780, +3 against7,777; named additions in `OVERVIEW_CHAMPION_CLOSEOUT_REPORT.md`. Those results precede this alignment work.

## Unverified / device checks
All converted hero first-line positions, loaded photographs/headshots, actual islands and adjacent sections, long-name/pro tab changes and review fold interaction remain unverified for this alignment. Overview fixture screenshots: `/tmp/browser/overview-closeout/live_{320,390,430}.png` and `done_{320,390,430}.png`; these are current fixtures, not before/after freeze proof. Authenticated live flows unavailable (`external_unmanaged`). No AppHeader overHero callers found. Receipt retains its class-scoped old layout path.

No SQL, migrations, deployed RPC/edge changes, feed_config or native/Median changes; round_pool_cap unchanged.
