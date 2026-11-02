# PROFILE_CLEANUP_V1 — STOP report

## Result
Cleanup edits and authorized deletions were applied, but verification stopped on a new editor syntax failure. This work is **not complete** and the preview is not clean. No corrective edit or test rerun followed the failure.

## New failure (exact tool output)
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

## Verification and accounting
Command executed:
```text
bunx vitest run src/test/ob1Welcome.test.tsx src/test/ep2EditProfileYou.test.tsx src/test/ep3EditProfileGolf.test.tsx src/test/ep4LinksPrivacy.test.tsx src/test/be1BusinessEditSettings.test.tsx src/test/be2BusinessPreview.test.tsx src/test/be3BusinessWhereContact.test.tsx src/test/be4BusinessProfileLinks.test.tsx --maxWorkers=2
```
Result: **146/146 collected tests passed; 4 files passed and 4 suites failed collection (8 files).** This is not a full-suite pass. Full four-shard execution was not started after the new failure, in accordance with the stop rule. No failing shard exists for this cleanup; the failing focused output is retained instead.

Before inventory: last fully executed WS3 inventory was **5,903 tests / 542 files** (5,901 passed, two failed), followed by the WS3.1 Long form See all test (+1), giving an inferred baseline of **5,904 / 542**. A fresh `bunx vitest list --json` attempt timed out at 60 seconds with no JSON output; this inferred baseline is not a newly verified inventory. Cleanup removes exactly three cases, adds none, deletes no test files: candidate after inventory **5,901 / 542**. The full executed after total is **unverified**.

Automatic typecheck/build is **not clean**: the latest observed build log reports TS1128 above. No manual build or tsc command was run (the preview harness owns those checks). No authenticated or visual end-to-end verification was performed because the app has a surviving compile error.

## Pre-existing failures (not fixed or rerun)
Prior retained `.lovable/ws3-shard1-failing.log` identifies these two `src/test/rsRoundsShelf.test.tsx` cases:
- `shows on the For you chip for a signed-in member, after Quick hits, and not on other chips`
- `is absent for a signed-out visitor`
Both: `Error: No QueryClient set, use QueryClientProvider to set one` from CreatorSpotlight/useToggleFollow. They are outside this cleanup. Their present status was not re-executed.

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
- `src/components/profile/header/ProfileHeaderCard.tsx` (195 lines): retained dependency `src/test/canvasSurfaceToken.test.ts:317`.
- `src/components/profile/types/ActivityTypes.ts` (71 lines): retained dependency `src/lib/activityPostMapper.ts:10`; retained dependency `src/pages/PostDeepLinkPage.tsx:11`.
- `src/features/tourhub/hooks/useCollegeMedia.ts` (73 lines): retained dependency `src/features/tourhub/hooks/useCollegeMovers.ts:4`.
- `src/features/tourhub/hooks/useCollegeMovers.ts` (277 lines): retained dependency `src/components/profile/header/ProfileHeaderCard.tsx:6`.
- `src/features/tourhub/hooks/useCollegeStats.ts` (136 lines): retained dependency `src/features/tourhub/hooks/useCollegeMovers.ts:3`; retained dependency `src/features/tourhub/hooks/useCollegeMovers.ts:5`.
- `src/lib/utils/normalizeCollege.ts` (98 lines): retained dependency `src/features/tourhub/hooks/useCollegeMedia.ts:3`.

`ProfileHeaderCard` is retained because `canvasSurfaceToken.test.ts:317` reads its source; the brief does not authorize changing that assertion. Its dependent college hook chain is retained too. `VisibilityDropdown` has a live type importer; `ActivityTypes` has live production importers. The live `.ts` profile hook stays; extensionless imports resolve to it, not the deleted `.tsx` sibling. SocialLinksSection, LocationSection, SegToggle, PhotoActionSheet, cropper and SectionCard were preserved. All expressly out-of-scope handicap/FriendSheet/Creator tile files were preserved.

## Applied production/comment edits
- BusinessProfileEditor create-only prefill, duplicate/pending claim, college, create validation/dirty/submit/hero/identity, legacy sections, discard/pin-drop/request UI and mode variable removed. Immediate edit save handlers, profile preview, contact/links and Settings JSX retained, but their equivalence is **not verified** because of the syntax failure.
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

## Remaining work
Obtain authorization to finish the editor syntax/type correction, then rerun focused checks and the four full shards with --maxWorkers=2, retain any failure output, reconcile actual full totals and confirm the automatic build/typecheck. Refresh-gap success behavior has not been verified end-to-end. The existing WS3 failures remain outside scope.
