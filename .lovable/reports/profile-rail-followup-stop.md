# Profile rail follow-up — stopped

## Result
The fixed 8×8 HTML markers, localised heading and removal of obsolete ProfileHero counter props/callers are implemented. Existing share-card rounds/reviews reads remain because ProfileTopTenRail uses them. The old hero.formLastFive key was already absent everywhere; no locale keys were deleted. Last compilation signal: build OK, 2026-11-16T10:41:59Z.

## Stop — exact tool output
Command: `npx vitest run --maxWorkers=2 src/test/profileRailFollowup.test.tsx src/test/profileCoverFallback.test.tsx src/test/heroConnectExample.test.tsx src/test/heroConnectPanel.test.tsx src/test/linkedHandicapProfile.test.tsx src/test/proVerification2Hero.test.tsx src/test/profileBioFull.test.tsx src/test/removeBadges1.test.tsx src/test/wagrProfileLine.test.tsx`
Nine files: 86 executed, 82 passed, 4 failed. No full-suite shards were run after this failure. Stop rule observed; none of the failing assertions was changed.

`src/test/profileRailFollowup.test.tsx:104:36`, **time-scaled points preserve 80-day and 10-day proportions**:
```
AssertionError: expected [ +0, 320.88888888888886, 361 ] to deeply equal [ +0, 320.8888888888889, 361 ]
```
The new test used strict equality on equivalent floating-point calculations; a numerical-tolerance assertion needs authorisation.

`src/test/profileRailFollowup.test.tsx:127:99`, **rail reverses oldest-first data and uses canonical short course names**:
```
AssertionError: expected 'Royal County Down (Championship)' to be 'Royal County Down' // Object.is equality
```
The new expected string incorrectly omitted the variant retained by the canonical shortCoursePart helper. Production shortener is unchanged.

`src/test/profileRailFollowup.test.tsx:159:109`, **member no-photo cover uses the gradient token without SVG** and **business no-photo cover uses the gradient token without SVG**:
```
AssertionError: expected '' to be 'var(--profile-fallback-cover-gradient)' // Object.is equality
```
The test DOM does not serialize the CSS-variable background shorthand. Both cover elements were present; testing the exported token and real-browser computed gradient needs authorisation to replace these assertions.

## Count reconciliation
Last verified full suite: **8,978** (2,284 / 2,196 / 2,237 / 2,261), 777 files, from the preceding Tour finished-week work. Profile follow-up adds **13** cases in `profileRailFollowup.test.tsx`; expected inventory **8,991**, 778 files, not a verified passing suite. No case deleted, renamed or rewritten. Eight existing files only lose the obsolete fixture props roundsCount/ratedCount; their case names and assertions remain byte-identical.

Fixture-only files: heroConnectExample.test.tsx, heroConnectPanel.test.tsx, linkedHandicapProfile.test.tsx, proVerification2Hero.test.tsx, profileBioFull.test.tsx, profileCoverFallback.test.tsx, removeBadges1.test.tsx, wagrProfileLine.test.tsx.

## Added cases
- it('time-scaled points preserve 80-day and 10-day proportions',()
- it('at interpolates between neighbouring points',()
- it('each in-window round has an HTML marker at its interpolated position and lowering state',()
- it('out-of-window round stays on the rail without a chart marker',()
- it('rail reverses oldest-first data and uses canonical short course names',()
- it('dates include a year only outside the current year',()
- it('rail tap tracks newest-first position and opens that round',()
- it('end-point round marker is below the existing end marker',()
- it('comment deep link still opens the course sheet with no reaction strip',async()
- it.each([true,false])('retired counter actions absent on own=%s',isSelf
- it.each(['member','business'])('%s no-photo cover uses the gradient token without SVG',kind

## Verification limits / remaining work
Own/other profile 320/375/430 dot measurements and full-suite verification were not run after the stop. Authenticated real-profile checks are unavailable with this project's external_unmanaged session status; browser-only actual-component fixtures can verify geometry after authorisation. New counter absence test should assert each forbidden action independently; colour coverage currently asserts lowering state but needs actual computed green/ink checks. The comment test exercises the actual rail's URL-driven sheet and verifies the page handoff in source, not an authenticated full ProfilePageV2 flow.

The previous Tour leaderboard-row misalignment received a presentation-only specificity fix (`.cw-block .cw-more { display:grid }`); it remains visually unverified because checks stopped. No SQL, migrations, feed_config, pool cap, native or server changes.
