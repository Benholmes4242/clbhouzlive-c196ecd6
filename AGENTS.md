Cross-area rules; local rules stay in section comments.
# Architecture rules

ABSOLUTE RULES — never compress, reword or remove these.
Never run SQL. Ben runs every statement by hand.
Never write a migration or a migration file.
Never touch feed_config.
round_pool_cap stays at 30.
Any unexpected test failure: STOP AND REPORT. Never edit a test to make it pass unless a brief explicitly authorises that exact change.

## Tests
Every test deleted, renamed or rewritten is named in the build report, with its assertion quoted and one line on why. A brief that changes a documented rule implicitly authorises updating the test encoding it; it never authorises doing so silently. State the test count before and after; every difference must reconcile by name.

Copy every react-i18next mock in full from src/test/profileCoursesRecord.test.tsx:33: initReactI18next is required at module load; t returns defaultValue or ''. Assert structure, not translated words; never change components for mocks.

When AGENTS.md approaches its limit, always move an architecture note into a file header, never compress a rule. A fact about how one module behaves belongs next to that module. AGENTS.md holds only what cannot live in a header: cross-cutting process rules.

- Shared standings/Top 100 helpers live in `src/lib/gam`; achievement levels live beside celebrations, preserving active consumers after Trophy Room removal.

- Profile course archive overrides are scoped by `courses-archive`, with an opt-in archive appearance on shared region controls, so matching its mock cannot restyle other course filters or section headings.

- Member Radar panels read only the Stage 3 member hooks; legacy member details serve existing More actions only, so analytics displays cannot silently fall back to unrelated client reads.
- Message entrypoints hand optional focus and return navigation through the existing start-conversation hook, so server messaging refusals remain authoritative and no entrypoint sends automatically.

- `whs/pickCourse.ts` is shared by AgeingOut and PersonalBests; section removal must preserve their course selection.
- Every surface that prints a course aggregate rating reads `COURSE_RATING_FLOOR` (`courseRatingFloor.ts`), so card, rails and ranker agree on one sample floor.
- Token ownership and amber restrictions: see `src/features/courses/components/holes/analytical/tokens.tsx`.
- Handicap-index authority and reader audit: see `src/lib/handicap/resolveHandicap.ts`.
- The admin Analytics page and its header pill read figures only from the five `get_admin_analytics_*` RPCs via `useAnalyticsLenses.ts`, never tables, because browser reads truncate at the row cap and staff filtering belongs to the server.
- Admin Health and drawer query ownership: see src/features/admin/AdminDrawerStatus.tsx header.
- Rankings hand all row taps to TourSection, which alone resolves directory names and sheet navigation, so linked and unlinked entrypoints cannot drift.
- Review course names link only through `CourseNameLink` (see its header), so the id-or-plain-text rule and tap isolation live once.

- Owner copy uses `profileOwnerVoice` to share grammar.
- First-sign-in uses the isolated welcome feature with opt-in partial profile saves and canonical connect-controller options; defaults preserve normal profile editing and handicap setup.
- Club analytics opening copy is computed by courseLead from the selected CourseBlock payload only; no seed fallback or additional reads, so chip switches cannot mix courses.
- Club weekday conclusions share weekRoom between the lead and tee-sheet card; selected-course conclusions must not drift between surfaces.
- AccountGlance content ownership: see AccountGlance.tsx header; PostingAsMenu retains actor routing and source ownership while GlanceShell supplies the shared modal lifecycle.
- Small-sample Reviews reuse SingleReview's RaterReviewRow, so context and media cannot drift.
- Course tab gaps and canon: see tabCanon.css and AboutSection.tsx; null chains stay aligned.
- Course photo publication and metadata live in `src/lib/courseMedia`; shared payloads prevent entrypoint drift.
- Course Media gallery ordering/identity lives in courseGallery and chrome overlays the canonical fullscreen engine; gallery replacements never nest opens, so playback and synthetic request gates remain shared.
- Media place catalogue, independent owner-source contributions and ready-cover selection are shared by tab surfaces; see places.ts and useCoursePlaceMedia.ts headers, so hole writes and admin paths remain isolated.
- Media state/RPC ownership: see CourseMediaEmptyStates.tsx header.
- Latest holes rail query/order/geometry ownership: see LatestHolesSection.tsx header; Media consumes initial URL focus once and useCourseGallery retains shot fallback ownership.
- Course rails share rail-local observation and stable deduplication in useRailPagination.ts; each section owns its RPC cursor and first-page rules, so pagination cannot drift into page scrolling or viewer fetching.
- Leaders' group round selection ownership: see leadersGroupRules.ts header; shared board helpers remain authoritative for score and thru cells.
- Insights visits/source snapshot and UTC bucket ownership: see InsightsVisitsSection.tsx and visitBuckets.ts headers; club analytics remains independent.
- Insights course pulse read and conditional ownership: see useBusinessCourseActivity.ts and InsightsCourseSection.tsx headers; server availability and privacy must not be inferred by sibling cards.
- Admin tagging is an opt-in batch mode backed only by the admin RPCs; AdminHoleTagging.tsx owns attribution and queue/place/hole cache refresh so member writes stay untouched. ShotTagCard owns the shared glass presentation for member single/batch and admin tagging, preventing their grids and viewer entrypoint from drifting.
- Review preupload ownership and item joins live in reviewUploadController; cleanup verifies server-stamped Stream creators or owned legacy reviews and canonical caller-folder R2 keys before deletion, so composer departure cannot duplicate uploads or authorize foreign asset removal.

## Briefs

### Stops

STOP for: a test failing once the work is complete; a type or build error surviving the finished edit; a clause contradicting another clause or the attached mock; data the brief assumes and the codebase lacks.

DO NOT STOP for: an intermediate compile state inside your own edit — finish, compile, then report; a clause you disagree with — report it with the finished work; a check your environment cannot run — name it and continue.

A stop carries the error itself: file, line, and the tool's own words. A stop blocking sections the error does not touch is badly scoped; build the rest.

### Mocks

Prefer a real provider to a hand-written mock — MemoryRouter over a useNavigate mock. A provider cannot be partially wrong.

If you mock, copy the whole thing. A mock missing one export is broken, not smaller, and fails in an unrelated file. react-i18next must include initReactI18next:

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

That t returns defaultValue or ''. Assert on structure, never on translated words, and never add a defaultValue to pass a test. Do not convert passing tests to another pattern.

### Conflicts

When a brief's stated rule and its signed-off mock disagree, do not pick one. Both come from the same author and one is a mistake. Quote both and wait.

### Counts

Report the suite total before and after, and name the source of any delta. A count that moves under an "unchanged" report hides a real change.
- Video perf spans end only via vperf's moving-frame helper (`vperfArmMoving*`), never on play/playing/firstFrame, so cold, decoded and swapped-in lanes are timed by one definition.
- Every business profile renders ClubProfileHero (see its header); non-club pages pass optional secondAction/insightsTone/stripCells whose defaults reproduce the club, with rules in `src/lib/business/businessHero.ts`, so one hero cannot drift into two; personal profiles keep HeroShell.
- Club viewer cards reuse per-course stats/circle hooks through keyed collectors (see ClubYouCard.tsx); shared activity-name grammar lives in courseLabel and is re-exported for Insights compatibility, preventing stale viewer data and naming drift.
- Card-title letter-spacing is -0.01em on club, business and Insights surfaces; the zero-letter-spacing note in .lovable/plan/tour-overview-redesign-design-a-2026-09-17.md governs the Tour plan only.
- Every surface printing ONE review's overall plus breakdown renders `ReviewScoreRow` (src/components/shared), including the fullscreen viewer via align/textShadow props, so single-review score rows cannot drift; course aggregates keep their own layouts.
- Every business Visiting/Contact surface reuses ClubVisiting with opt-in non-club props and the hero booking callback, preserving club defaults and tracking; About shares opening-hours and SOCIAL_CONFIG definitions, with local rules in ClubVisiting.tsx.
- Feed layout ownership and review footer-slot composition: see ReviewPostCard.tsx header; feed callers opt in while direct standard cards and separate grid/round cards remain independent.
- Course review navigation uses the course detail Reviews tab; CourseReviewsTab owns one-shot landing/target consumption and the legacy redirect preserves intent, so club links and bookmarks share one destination.
- Coach surfaces share session-scoped seven-function caches and mutation invalidation through features/coach; every failed read suppresses its dependent surface even with stale data, so server privacy and measurement remain authoritative.
- ProfilePageV2 owns the coach-line read and passes an optional node to ProfileHero; the hero never imports coach modules, preserving standalone rendering without a query provider.
- Business mention qualification and visibility belong to the mentions RPCs; BusinessMentionsRail owns viewer-scoped reads and non-optimistic hide/show so cached team rows cannot cross identities.
- Connected and disconnected island glances share GlanceShell lifecycle and positioning; the disconnected variant never imports read hooks, keeping invitation figures absent rather than invented.
- Floating glances, scorecards and reviews consume the card/backdrop material from `src/lib/tokens/glass.ts`; island material is re-exported by ChromeIsland for compatibility, preventing independent material drift while preserving local geometry and lifecycle.
- The canonical BC create-business flow keeps step state in history and one draft typed from editorTypes; display labels live only in business-create/createRules.ts and the draft stores canonical category values, so stored categories never drift. Step 2 branch ownership (club/college/other) lives in business-create/Step2*.tsx with pure figure rules in step2Rules.ts; the club duplicate guard, pending-claim check and address prefill mirror the editor's logic exactly, and changing the category on step 1 clears the old branch's step 2 fields. Creation/notice/departure ownership lives in features/business-create (see headers), so editor and flow preserve one save path and recovery copy.
- Business creation and the live business hero share action labels in businessHero; WelcomeCropper's shape/aspect options are opt-in and preserve setup defaults, so draft previews cannot fork labels or onboarding geometry.
- Rounds gate lifecycle ownership lives in RoundsGate.tsx; shared score atoms expose inert blur markers and connect primary/decline styles have one owner, preventing gated presentation from changing ungated figures or connect controls.
- Composer entry and suggestion ownership: see ComposerFlowSheet.tsx and useReviewSuggestions.ts headers; displayed counters exclude entry without renumbering wizard state or analytics, preserving handoff and draft compatibility.
- Review score-step requirements and footer priority share scoreStepRules; useScoreRuler owns tap/drag/keyboard bounds so overall and category controls cannot diverge.
- Edit-profile group ownership lives in the feature file headers.
