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
- Tour tee-alert toggles use `tourOptimisticToggle` for cache writes and per-id rollback, because invalidation alone does not refresh this app's mounted queries.
- Every surface that prints a course aggregate rating reads `COURSE_RATING_FLOOR` (`courseRatingFloor.ts`), so card, rails and ranker agree on one sample floor.
- A local copy of a design value that has a token is a fork, whether or not it currently matches. Ink, surfaces and canvases have owners: read them from `@/lib/tokens/surface` and `@/lib/tokens/surfaces` and never redeclare the value. THE BRAND AMBER `#F7931E` HAS NO OWNER YET — it is declared raw in around 105 files and partially owned by four modules (`frostPanel.amber`, `gam/visuals.rare`, `reactionKind.AMBER`, `PROFILE_PILL_SURFACES.active`). Until it has a single home, a local amber is the existing state rather than a new fork: do not add more, do not promote any of the four part-owners to canon, and do not fix it one file at a time.
- DECIDING A MEMBER'S INDEX IS resolveDisplayHandicap's JOB AND NO ONE ELSE'S. Loading eg_handicap_index and manual_handicap_index to display, edit or save them is fine. Choosing between them — coalescing, falling back from one to the other, or treating a present manual figure as the index of a connected member — is not. A connection without a synced index means the index is UNKNOWN, not the manual figure. board_pool's 'near' band coalesces the two columns in SQL and so does not follow this rule; today every member with rounds has a synced index, so the two agree. If that stops being true, the function needs the same rule.
  - NOTE: an app-wide check of which readers CHOOSE between the columns rather than merely loading them has not been done. Start from this list: ProfilePageV2, ManageProfile, useUserProfile, useUserByUsername, useProfileSave, useProfileForm, profile-wizard/types, SettingsTabContent, RoundDetailSheet, usePostLikers, useEchoSuggestions, admin useUsers, review-island/overrides, types/profile, lib/supabase/selects.
- The admin Analytics page and its header pill read figures only from the five `get_admin_analytics_*` RPCs via `useAnalyticsLenses.ts`, never tables, because browser reads truncate at the row cap and staff filtering belongs to the server.
- The admin Health page and the drawer's Health dot read figures only from the `get_admin_health_*` RPCs (`useHealthLenses.ts`) and the existing service hooks, and share one verdict (`useHealthVerdict` in `components/health/healthIssues.ts`), so the dot and the page cannot disagree and no Health panel reads a table.

- Record, counting-round and log rows open `RoundDetailSheet` by score id with the known profile owner, keeping one scorecard and member context.
- Owner copy uses `profileOwnerVoice` to share grammar.
- Reviews state-local rater context stays isolated from communitySample; module headers own each state contract to prevent context from becoming aggregate data.
