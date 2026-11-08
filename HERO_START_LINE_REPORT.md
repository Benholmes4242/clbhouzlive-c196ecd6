# HERO_START_LINE — rulings applied, screen coverage incomplete

## Rulings and verification
Both rulings applied. Only the four authorized expectation lines changed in reviewStepOne this turn. Case “renders the course page masthead over the photo: shared kicker, place, two-line name clamp”: position absolute→relative; left20px→margin0px20px; right20px→left empty; bottom14px→empty. Nothing else in that file changed this turn.

Leader name line-height1.5→1.1; MASTHEAD_PLACE and overview venue1.5→1.2. Geometry comment now names the existing line boxes and accepted no-headshot exception.

Real PhotoBand, one-line title, three faces, sentence and spine at320/390/430: text193.9375px, row186.53125px, height350px at every width. Derived reference193.9px; difference0.0375px. Place line15px at all widths, matching pre-build15px within0.5px. Source proof uses real CourseMasthead, not the whole course-detail page. Original193.9 baseline is restored numerically; old screenshots were not retained across sandbox reset.

Derivation: kicker28; title gap4; leader face row27.2+gap5+score21+name gap4+name11=68.2; title/venue block25.74+4+15=44.74 (leader wins); sentence9+18.9=27.9; spine10+11.4=21.4; live stack149.5. Therefore350−14−149.5+(28−13.2)/2=193.9. Each part is exported in photoBandGeometry.ts beside PhotoBand.

Focused command: `bunx vitest run src/test/heroStartLine.test.tsx src/test/allHeroesMatch.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/courseHeroesMatch.test.tsx src/test/reviewStepOne.test.tsx src/test/tournamentNotch.test.ts --maxWorkers=2`: **84/84 passed**. Prior focused total80; +4 named cases in new heroStartLine.test.tsx:
- derives the reference and matches the measured live three-face text top within0.5px
- preserves the original leader name and place line boxes
- keeps the review offset measured, with the first-paint fallback
- shares the reference across every converted hero and named skeleton
No tests deleted, no existing case count changed. Earlier assertion rename/rewrite ledger retained below.

Full command, four independent sequential invocations: `bunx vitest run --maxWorkers=2 --shard=N/4`.
|Shard|Passed|Files|
|---|---:|---:|
|1|2007|170|
|2|1871|170|
|3|1983|170|
|4|1923|170|
**Before7780 / after7784**, zero failures,680 files. +4 entirely from the named new file; redistribution across shards is not case deletion. Logs docs/verification/hero-start/shard1.log through shard4.log. No known FW1 failure appeared.

## Available390px screen measurements
|Actual fixture|First-line top|Band height|
|---|---:|---:|
|Live overview|193.9375|350|
|Golfer ProfileCoverBand|193.890625|285.078125|
|Business visitor|193.890625|307.765625|
|Business team|193.890625|307.765625|
|Pro HeroShell (simplified props)|193.890625|488.890625|
All above also checked320/430 with no horizontal overflow. Profile height286.265625 at320,285.078125 at430; other listed heights unchanged. Screens /tmp/browser/hero-start/{proof,profile,business,business-team,pro}_{320,390,430}.png. Numeric evidence persisted in docs/verification/hero-start/live-proof.json and surface-measurements.json.

These are isolated real-component fixtures, fallback art; Pro fixture does not include real world-rank/actions. **Not completed:** Tournament live/finished; Courses with/without blurb/rank; whole course detail/modal; review Step1/fold; actual ProProfileBuildOne; Amateur; skeleton-to-loaded jump; actual page island/header scroll transitions. Source tests pass but do not replace these browser checks. No completion claim for all-surface screen coverage.

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

Previous stop assertion repaired only under the new explicit authorization. Temporary fixture source/root HTML removed. Latest preview log reports build OK; no manual build run.

## Prior overview close-out
Fresh shard4:1,908. Previous shards1–3:2,007 /1,871 /1,994. Total7,780, +3 against7,777; named additions in `OVERVIEW_CHAMPION_CLOSEOUT_REPORT.md`. Those results precede this alignment work.

## Remaining checks
See incomplete screen coverage above. Authenticated live flows remain unavailable for the external unmanaged project. No AppHeader overHero callers found. Fixed-height consumers remaining: overview HybridHero/constants/OverviewHero; review first-paint measured-height fallback. EXPLORE_COURSE_HERO_HEIGHT has no production consumer outside its export. Receipt retains its class-scoped old layout path.

No SQL, migrations, deployed RPC/edge changes, feed_config or native/Median changes; round_pool_cap unchanged.
