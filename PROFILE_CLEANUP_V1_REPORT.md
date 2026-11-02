# PROFILE_CLEANUP_V1 — V1.2 verification STOP report

## Result
V1.2 applied only the authorised Creators-row test scoping and fresh RS QueryClientProvider. All **5,901 assertions passed across 542 files**, matching the expected inventory exactly, but shard 4 exited with **one new unhandled error**, so the suite is **not clean**. Work stopped without changing or rerunning the implicated test/component. The automatic build is clean.

## Historical V1 failure (corrected by V1.1)
The four business test files could not collect: `src/test/be1BusinessEditSettings.test.tsx`, `src/test/be2BusinessPreview.test.tsx`, `src/test/be3BusinessWhereContact.test.tsx`, `src/test/be4BusinessProfileLinks.test.tsx`.

```text
Error:   x Return statement is not allowed here
/dev-server/src/pages/BusinessProfileEditor.tsx:291:1
```
Additional parser locations: 298 and 328 (return statements), 353 (expression expected). The automatic check reports:
```text
src/pages/BusinessProfileEditor.tsx(353,1): error TS1128: Declaration or statement expected.
```
The edit retained an opening `/**` at line 4 while removing its original closing comment. It also removed the `Json` type import used by the retained save handler; that is a source-inspection finding, not a separately executed compiler result. These are unfinished implementation errors, not failing business assertions. No fix was attempted after the test stop.

Full focused stdout/stderr: `PROFILE_CLEANUP_V1_FAILING_FOCUSED.log`.

## Historical V1 verification and accounting
Command executed:
```text
bunx vitest run src/test/ob1Welcome.test.tsx src/test/ep2EditProfileYou.test.tsx src/test/ep3EditProfileGolf.test.tsx src/test/ep4LinksPrivacy.test.tsx src/test/be1BusinessEditSettings.test.tsx src/test/be2BusinessPreview.test.tsx src/test/be3BusinessWhereContact.test.tsx src/test/be4BusinessProfileLinks.test.tsx --maxWorkers=2
```
Result: **146/146 collected tests passed; 4 files passed and 4 suites failed collection (8 files).** This is not a full-suite pass. Full four-shard execution was not started after the new failure, in accordance with the stop rule. No failing shard exists for this cleanup; the failing focused output is retained instead.

Before inventory: last fully executed WS3 inventory was **5,903 tests / 542 files** (5,901 passed, two failed), followed by the WS3.1 Long form See all test (+1), giving an inferred baseline of **5,904 / 542**. A fresh `bunx vitest list --json` attempt timed out at 60 seconds with no JSON output; this inferred baseline is not a newly verified inventory. Cleanup removes exactly three cases, adds none, deletes no test files: candidate after inventory **5,901 / 542**. The full executed after total is **unverified**.

Automatic typecheck/build is **not clean**: the latest observed build log reports TS1128 above. No manual build or tsc command was run (the preview harness owns those checks). No authenticated or visual end-to-end verification was performed because the app has a surviving compile error.

## Pre-existing failures (reproduced in V1.1 shard 1)
Prior retained `.lovable/ws3-shard1-failing.log` identifies these two `src/test/rsRoundsShelf.test.tsx` cases:
- `shows on the For you chip for a signed-in member, after Quick hits, and not on other chips`
- `is absent for a signed-out visitor`
Both: `Error: No QueryClient set, use QueryClientProvider to set one` from CreatorSpotlight/useToggleFollow. V1.1 explicitly authorises a fresh QueryClientProvider in the render helper only if these reproduce. Both reproduced in shard 1. That conditional harness change has **not** been applied because the subsequent new shard-2 failures triggered the stop rule.

## Deleted files
Each path was checked against source/test dependency resolution excluding the deletion closure. Approved ManageProfile source assertions and approved business section mocks were removed first. Line counts are the pre-deletion file counts.

| File | Lines |
|---|---:|
| `src/pages/ManageProfile.tsx` | 976 |
| `src/hooks/useProfileData.tsx` | 98 |
| `src/components/profile/edit-v2/index.ts` | 16 |
| `src/components/profile/edit-v2/PrivacySection.tsx` | 46 |
| `src/components/profile/edit-v2/InviteClubModal.tsx` | 152 |
| `src/components/profile/edit-v2/IdentitySection.tsx` | 59 |
| `src/components/profile/edit-v2/HomeClubCard.tsx` | 136 |
| `src/components/profile/edit-v2/HandicapInput.tsx` | 97 |
| `src/components/profile/edit-v2/BioWebsitesSection.tsx` | 90 |
| `src/components/profile/edit-v2/AdditionalClubsList.tsx` | 125 |
| `src/components/profile/header/index.ts` | 7 |
| `src/components/profile/header/ProfileTop100Chip.tsx` | 96 |
| `src/components/profile/header/ProfileStatsRow.tsx` | 110 |
| `src/components/profile/header/ProfileCompletionStamps.tsx` | 57 |
| `src/components/profile/header/ProfileAvatarRing.tsx` | 194 |
| `src/components/profile/header/ProfileActionsRow.tsx` | 61 |
| `src/components/profile/actions/useProfileActions.tsx` | 75 |
| `src/components/profile/actions/ProfileSocialButtons.tsx` | 359 |
| `src/components/profile/actions/BusinessProfileActions.tsx` | 215 |
| `src/components/profile/components/BioWebsitesSection.tsx` | 154 |
| `src/components/profile/index.ts` | 9 |
| `src/components/profile/journey/GolfJourneyCard.tsx` | 107 |
| `src/components/profile/courses-journey/HighlightReelSection.tsx` | 209 |
| `src/components/profile/courses-journey/RecentlyPlayedSection.tsx` | 173 |
| `src/components/profile/courses-journey/RegionalProgressRings.tsx` | 285 |
| `src/components/profile/courses-journey/TopRatedSection.tsx` | 268 |
| `src/components/profile/courses-journey/index.ts` | 12 |
| `src/components/profile/courses-journey/types.ts` | 63 |
| `src/components/profile/courses-journey/regions/ContinentalEuropeSection.tsx` | 177 |
| `src/components/profile/courses-journey/regions/CoursesbyRegionSection.tsx` | 27 |
| `src/components/profile/courses-journey/regions/GreatBritainIrelandSection.tsx` | 247 |
| `src/components/profile/courses-journey/regions/USASection.tsx` | 250 |
| `src/components/profile/courses-journey/regions/WorldwideSection.tsx` | 248 |
| `src/components/profile/courses-journey/utils/courseSorting.ts` | 83 |
| `src/components/profile/EnhancedRegionalCoursesModal.tsx` | 828 |
| `src/components/profile/CollegeSearchDropdown.tsx` | 269 |
| `src/components/profile/debug.ts` | 195 |
| `src/components/CourseCardDraggable.tsx` | 83 |
| `src/components/ui/SkeletonRow.tsx` | 19 |
| `src/hooks/useCarouselNavigation.tsx` | 52 |
| `src/hooks/useDragScroll.tsx` | 108 |
| `src/hooks/useModalDetector.ts` | 47 |
| `src/hooks/usePlayedCoursesWithRatings.ts` | 223 |
| `src/hooks/useRelationshipStatus.ts` | 69 |
| `src/hooks/useSectionLoader.ts` | 46 |
| `src/lib/top100Helpers.ts` | 154 |
| `src/utils/debugFlags.ts` | 13 |
| `src/components/business/editor/IdentitySection.tsx` | 257 |
| `src/components/business/editor/FacilitiesSection.tsx` | 59 |
| `src/components/business/editor/LocationContactSection.tsx` | 234 |
| `src/components/business/editor/PrimaryActionSection.tsx` | 45 |
| `src/components/business/editor/OpeningHoursSection.tsx` | 130 |
| `src/components/business/editor/SocialSection.tsx` | 86 |

Total: **53 files, 8,198 lines**.

## Requested files kept

- `src/components/profile/edit-v2/VisibilityDropdown.tsx` (180 lines): retained dependency `src/features/edit-profile/linkPrivacyRules.ts:3`.
- `src/components/profile/types/ActivityTypes.ts` (71 lines): retained dependency `src/lib/activityPostMapper.ts:10`; retained dependency `src/pages/PostDeepLinkPage.tsx:11`.

`ProfileHeaderCard` and its college dependency chain were retained in V1 for the source-reading assertion; V1.1 authorises removing that assertion and these five files, listed below. `VisibilityDropdown` has a live type importer; `ActivityTypes` has live production importers. The live `.ts` profile hook stays; extensionless imports resolve to it, not the deleted `.tsx` sibling. SocialLinksSection, LocationSection, SegToggle, PhotoActionSheet, cropper and SectionCard were preserved. All expressly out-of-scope handicap/FriendSheet/Creator tile files were preserved.

## Applied production/comment edits
- BusinessProfileEditor create-only prefill, duplicate/pending claim, college, create validation/dirty/submit/hero/identity, legacy sections, discard/pin-drop/request UI and mode variable removed. Immediate edit save handlers, profile preview, contact/links and Settings JSX retained. V1.1 focused tests now pass; hosted authenticated equivalence remains unverified.
- Removed Welcome's onboarding-status seed and useProfileSave's invalidation plus FIX I5 comment.
- Added profile-prefix invalidation after useSetHomeClub success; added user-profile invalidation after GenderPromptSheet success. Other write payloads unchanged.
- Corrected only the named personal-profile clause in AGENTS.md; updated the named category, cover-height and ManageProfile comments. Category values and editorTypes untouched.
- HeroShell rendering search: **no production component renders `<HeroShell>`**. The module remains imported for helpers/tokens by ClubProfileHero, ProfileSurfaceSkeleton, ProfileHero, ProfileCoverBand and HeroHandicapDisplay. The shell definition itself remains untouched.

## Authorized test changes (quoted assertions)
1. `ob1Welcome.test.tsx`: deleted `old edit onboarding URL redirects without removing normal mode` (−1): `expect(source).toContain('if (searchParams.get(\'onboarding\') === \'1\') return <Navigate to="/welcome" replace />')`; `expect(source).toContain('const showTabBar = !isNewUser.current')`. Deleted source route is no longer mounted.
2. Same file: repointed `coach row occupies its own card after Home club`: old `expect(source).toMatch(/<\/ManageCard>\s*<ManageCard>\s*<YourCoachRow viewerId=\{user\?\.id\} \/>/)`; new `expect(source).toContain('<YourCoachRow')`, reading `EditProfileGolf.tsx`. Name unchanged, count unchanged.
3. `ep2EditProfileYou.test.tsx`: deleted `ManageProfile does not import the new You group` (−1): `expect(src).not.toContain('EditProfileYou')`, `expect(src).toContain('<LocationSection')`, `expect(src).not.toContain('appearance="card"')`. Dead editor protection retired.
4. `ep3EditProfileGolf.test.tsx`: deleted `ManageProfile remains independent` (−1): `expect(readFileSync('src/pages/ManageProfile.tsx', 'utf8')).not.toContain('EditProfileGolf')`. Dead editor protection retired.
5. `ep4LinksPrivacy.test.tsx`: existing `legacy ManageProfile is independent and Settings reads the same hook without a handicap writer`: removed only `expect(readFileSync('src/pages/ManageProfile.tsx', 'utf8')).not.toContain('EditProfileLinksPrivacy')`; both Settings assertions and test name unchanged. Count unchanged.
6. Additional explicit chat authorization: `ob1Welcome.test.tsx`, parameterized `row %s completes then navigates with replace to %s` (courses, top100, clubhouse): removed only `expect(qc.getQueryData(['onboarding-status', 'me'])).toEqual(expect.objectContaining({ hasCompletedOnboarding: true }))`. Navigation/save/analytics assertions retained; all three cases retained. Count unchanged.
7. Business mocks only: removed IdentitySection, LocationContactSection, FacilitiesSection, PrimaryActionSection, OpeningHoursSection, SocialSection mocks from BE1 (6); FacilitiesSection, PrimaryActionSection, SocialSection, LocationContactSection, OpeningHoursSection from BE2 (5); FacilitiesSection, PrimaryActionSection, OpeningHoursSection, SocialSection from BE3 (4) and BE4 (4). **No business test assertion or case name changed**, and no business case removed.

No other test cases deleted, renamed or rewritten. Total delta −3 tests / 0 files.

## Scope protection
No SQL, migration or migration file; no deployed RPC/edge-function edits; feed_config untouched; round_pool_cap remains 30; no native/Median changes. Guest browsing, review wizard, news and round plots untouched. No backend or category/permission logic changed.

## V1.1 exact changes
- `BusinessProfileEditor.tsx`: deleted only the stray line-4 `/**`, deleted only the stray `};` after handleClose, restored `import type { Json } from '@/integrations/supabase/types';` directly after editorPermissions. No other line in that file changed. PageRoot stays as requested; the automatic check did not fail on unused imports.
- `canvasSurfaceToken.test.ts`: retained the test name and complete `expect(PROFILE_PILL_SURFACES).toEqual({...})` assertion. Removed only the ProfileHeaderCard readFileSync and the five authorised assertions below. No case removed, added, or renamed; delta **0 tests / 0 files**.
- `rsRoundsShelf.test.tsx`: unchanged. The two conditional failures reproduced, but the new-failure stop occurred before an authorised provider edit could be applied.

### Exact five assertions removed
Test: `keeps the complete profile pill set together and removes the dead legacy styling hooks` in `src/test/canvasSurfaceToken.test.ts`.
```ts
expect(source).toContain("PROFILE_PILL_SURFACES } from '@/lib/tokens/surfaces'");
expect(source).toContain('backgroundColor: PROFILE_PILL_SURFACES.inactive');
expect(source).toContain('backgroundColor = PROFILE_PILL_SURFACES.hover');
expect(source).not.toContain('profile-pill-inactive');
expect(source).not.toContain('--profile-pill-hover');
```
Reason: these protected only the source of the now-authorised dead header; the shared live pill token assertion remains.

### Newly deleted files
Production and test string references were checked using TypeScript Bundler resolution with the @ alias, including readFileSync/mock paths. No external references remained after the canvas source check was removed. Deletion followed dependency order: header → movers → stats/media → normalizer.

| File | Pre-deletion lines |
|---|---:|
| `src/components/profile/header/ProfileHeaderCard.tsx` | 195 |
| `src/features/tourhub/hooks/useCollegeMovers.ts` | 277 |
| `src/features/tourhub/hooks/useCollegeStats.ts` | 136 |
| `src/features/tourhub/hooks/useCollegeMedia.ts` | 73 |
| `src/lib/utils/normalizeCollege.ts` | 98 |

V1.1: **5 files / 779 lines**. Combined V1 + V1.1: **58 files / 8,977 lines**. VisibilityDropdown and ActivityTypes remain for the previously identified live importers.

## V1.1 verification
Focused command: the eight files in the V1 command above plus `src/test/canvasSurfaceToken.test.ts`, using `bunx vitest run ... --maxWorkers=2`. Result **284/284 tests / 9 files passed**. The eight requested files all passed; the extra ninth checks the newly authorised assertion removal. Full focused output: `/tmp/profile-cleanup-v11/focused.log`.

Full-suite command, executed sequentially until the new failure:
```text
bunx vitest run --maxWorkers=2 --shard=1/4
bunx vitest run --maxWorkers=2 --shard=2/4
```
- Shard 1: **1,481 tests**, 1,479 passed / 2 known failures; 136 files (135 passed / 1 failed). Full output `PROFILE_CLEANUP_V1_FAILING_SHARD_1.log`.
- Shard 2: **1,433 tests**, 1,430 passed / 3 newly observed failures; 136 files (135 passed / 1 failed). Full output `PROFILE_CLEANUP_V1_FAILING_SHARD_2.log`.
- Shards 3/4: **not run**, as ANY NEW FAILURE requires STOP AND REPORT.
- Actual executed subset: **2,914 tests / 272 files**, 2,909 passed / 5 failed. This is **not** a full-suite total.

### Newly observed failures — exact tool output
All three are in `src/test/ws1WatchTop.test.tsx`; none was changed or rerun.
1. `WS1 Creators row > hides, heading included, when the read returns fewer than three` — line **318:43**:
```text
AssertionError: expected <button type="button" …(1)></button> to be null
```
2. `WS1 Creators row > See all appears only when the read returns more than eight` — line **332:43**:
```text
AssertionError: expected <button type="button" …(1)></button> to be null
```
3. `WS1 Creators row > See all opens the sheet, which lists every creator and follows through useToggleFollow` — line **407:28**:
```text
TestingLibraryElementError: Found multiple elements with the text: See all
```
The received extra element is a `See all` button. V1.2 confirms these three failures came from WS3.1 commit `5d921a20` adding the correct Long form shelf heading action, not from profile cleanup; whole-feed WS1 selectors also found that action. V1.1 made no Watch component or assertion change; V1.2 scopes only the authorised test queries.

### Real before/after accounting
The last reported fully executed baseline remains **5,903 tests / 542 files**, 5,901 passed / the two named RS failures. As previously disclosed, WS3.1 then added the Long form See all case (+1 in `ws3WatchBottom.test.tsx`); V1 removed the three named cases above (−3). V1.1 canvas removes assertions only (0), and the RS harness has not been changed (0). Expected current inventory: **5,901 tests / 542 files** (5,903 + 1 − 3). **Actual full after total is unavailable**, because the new failure stopped execution after two shards. The only newly executed total is the 2,914-test subset above. No test-count difference is hidden as “unchanged”.

### Editor rendering and saves
The four business focused files passed, covering the live editor's preview, immediate identity/photo saves, Where and contact, Profile and links, status/error/retry line, Settings tab and role protection. The source still wires `BusinessEditPreview → saveIdentity/savePhoto`, `BusinessEditWhereContact → saveContact`, `BusinessEditProfileLinks → saveProfileLink`; `runPartial`, its saving/error/retry lifecycle and `invalidateBusiness` remain untouched by the three V1.1 fixes. Settings remains passed to BusinessEditFrame; the route remains `/business/:id/edit`. No save payload or permission rule changed in V1.1.

**Automatic typecheck and build:** latest entries at `2026-11-02T17:13:52Z` and `2026-11-02T17:14:31Z` in `/tmp/observability/build-errors.log` report `build OK`, superseding the V1 errors. No manual tsc/build was run because the harness owns project checks. Therefore the automatic checks are clean; a separately executed tsc command is not claimed.

**Hosted authenticated UI/save readback:** unverified. The browser auth status is `external_unmanaged`; authenticated end-to-end checks are unavailable for this project, and the new-test-failure stop prevented further verification. Passing real-component tests do not establish hosted persistence.

## Remaining work / stop blockers
- Resolve the three newly observed `ws1WatchTop.test.tsx` failures under a further exact authorisation; no changes made here.
- Apply the already conditionally authorised RS render-helper provider after resuming, then rerun the requested focused checks and all four full shards, preserving output and reconciling actual totals.
- Hosted authenticated rendering/save readback remains unavailable on the external unmanaged Supabase project.

No SQL, migrations, deployed RPC/edge-function changes, feed_config changes, cap changes, native/Median changes, or changes to guest browsing, review wizard, news or round plots in V1.1.

## V1.2 authorised edits and verification
### Test changes, names preserved
Only `src/test/ws1WatchTop.test.tsx` and `src/test/rsRoundsShelf.test.tsx` changed in application/test source this follow-up. No component changes. No case was added, removed or renamed; count delta **0 tests / 0 files**.

`WS1 Creators row > hides, heading included, when the read returns fewer than three`:
```ts
// Before
mountFeed();
expect(screen.queryByText('See all')).toBeNull();
// After
const { container } = mountFeed();
expect(container.querySelector('[data-watch-creators="row"]')).toBeNull();
```
The Creators-heading assertion is unchanged. Reason: assert absence of the entire Creators row, not another shelf's correctly present action.

`WS1 Creators row > See all appears only when the read returns more than eight`:
```ts
// Before, eight
expect(screen.queryByText('See all')).toBeNull();
// After, eight
expect(within(eight.container.querySelector('[data-watch-creators="row"]') as HTMLElement).queryByText('See all')).toBeNull();
// Before, nine
mountFeed();
expect(screen.getByText('See all')).toBeTruthy();
// After, nine
const nine = mountFeed();
expect(within(nine.container.querySelector('[data-watch-creators="row"]') as HTMLElement).getByText('See all')).toBeTruthy();
```
Reason: the eight/nine threshold belongs to the Creators row only. Fixture and other assertions unchanged.

`WS1 Creators row > See all opens the sheet, which lists every creator and follows through useToggleFollow`:
```ts
// Before
mountFeed();
fireEvent.click(screen.getByText('See all'));
// After
const { container } = mountFeed();
fireEvent.click(within(container.querySelector('[data-watch-creators="row"]') as HTMLElement).getByText('See all'));
```
Reason: open the Creators action, not the separate Long form action. All sheet, follow and analytics assertions remain byte-identical.

`rsRoundsShelf.test.tsx`: the existing `mount(node, initial)` helper now wraps the existing router/i18n/routes in `QueryClientProvider` with a fresh `new QueryClient({ defaultOptions: { queries: { retry: false } } })` per render. No assertion, test name, fixture, mock or component changed. This resolves the two reproduced, pre-existing failures:
- `RS shelf placement on Watch > shows on the For you chip for a signed-in member, after Quick hits, and not on other chips`
- `RS shelf placement on Watch > is absent for a signed-out visitor`
Both previously reported `Error: No QueryClient set, use QueryClientProvider to set one`. Both now pass in focused and full shard 1.

### Commands and actual totals
Focused:
```text
bunx vitest run src/test/ws1WatchTop.test.tsx src/test/rsRoundsShelf.test.tsx --maxWorkers=2
```
**56/56 passed / 2 files** (WS1 34, RS 22). Output `/tmp/profile-cleanup-v12/focused.log`.

All four full shards executed:
```text
bunx vitest run --maxWorkers=2 --shard=1/4
bunx vitest run --maxWorkers=2 --shard=2/4
bunx vitest run --maxWorkers=2 --shard=3/4
bunx vitest run --maxWorkers=2 --shard=4/4
```
| Shard | Passed tests | Passed files | Exit | Unhandled errors |
|---|---:|---:|---:|---:|
| 1 | 1,481 | 136 | 0 | 0 |
| 2 | 1,433 | 136 | 0 | 0 |
| 3 | 1,530 | 136 | 0 | 0 |
| 4 | 1,457 | 134 | 1 | 1 |
| Total | **5,901** | **542** | **Not clean** | **1** |

No failing assertions or test files, but Vitest explicitly warns that the unhandled error might cause false positives. Therefore **not a clean suite pass**. Full shard outputs: `/tmp/profile-cleanup-v12/shard1.log` through `shard4.log`. The complete failing shard output is retained in `PROFILE_CLEANUP_V1_V12_FAILING_SHARD_4.log`; earlier V1/V1.1 failing logs remain too.

Actual total matches expected **5,901 tests / 542 files** exactly: baseline last full run 5,903/542, WS3.1 `ws3WatchBottom.test.tsx` adds `Long form's See all selects the Long form chip` (+1), V1 removes the three named tests quoted above (−3), V1.1 canvas source assertions (0), V1.2 scoped queries and RS provider (0). No other inventory differences.

### New failure — STOP (verbatim)
```text
Vitest caught 1 unhandled error during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.

TypeError: scroller?.scrollTo is not a function
 ❯ Module.scrollPageToTop src/lib/getScrollParent.ts:101:13
 ❯ WatchFeed.jsxDEV.children.jsxDEV.children.longRows.length.jsxDEV.children.jsxDEV.onSeeAll src/features/explore-magazine/watch/WatchFeed.tsx:637:19
```
Vitest identifies `src/test/ws3WatchBottom.test.tsx`; latest potentially responsible case: **`Long form's See all selects the Long form chip`**. That file/helper/component was not changed or rerun. This unhandled error was not among the five known failures authorised in V1.2; it is newly observed and triggers the stop rule. No unapproved stand-in or assertion adjustment applied.

**Build:** `/tmp/observability/build-errors.log` reports `build OK` at `2026-11-02T17:27:50Z`. No manual build/typecheck run; automatic checks own those commands. Production source unchanged in V1.2. Hosted authenticated acceptance remains unverified as recorded above.

### Current remaining blocker (supersedes earlier stop lists)
Authorisation is needed for the newly observed shard-4 unhandled scroll error before any fix or rerun. The five previous WS1/RS failures now pass; they are no longer open blockers. Full clean-suite acceptance remains pending because shard 4 exited 1 despite all tests passing.

V1.2 touched no guest browsing, review wizard, news, round plots, SQL, migrations, deployed RPCs/edge functions, feed_config, round_pool_cap, native or Median configuration.
