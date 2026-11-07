# PF3A_VIDEO — close-out complete with one permitted pre-existing failure

## PF3A_FIX_2 final summary — 7 November 2026

PF3A delivered creator-only single-video title/description, Details with credits/links/business thanks/gear, cover choices and timestamp chapters, metadata-preserving mixed-media transitions, best-effort metadata writes, draft restoration and video-credit Activity treatment. Viewer-stage work was not included.

**Final focused scope: 92/92 passed across 8 files. Fresh final-code suite: 7,507 passed + 1 explicitly permitted pre-existing failure = 7,508 tests across 657 files. No other failure occurred.**

PF3A new coverage totals **50 cases / 4 files**: initial rules 27, writes/state/ledger 9 and UI 5; close-out added eight Details transitions in `pf3aVideoUi.test.tsx` plus one composer transition in `pf3aVideoComposerMounted.test.tsx`. PF3A_FIX_2 added/deleted/renamed no cases or files. Current inventory before/after is **7,508 / 657**, unchanged. Reconciliation from the preceding PF3A report's expected 7,505 / 656: separate FIX_VERIFY work added three `videoCreditPushRoute.test.ts` cases and one file, as documented in FIX_VERIFY_REPORT.md; none belongs to this fix.

| Fresh command (each executed separately) | Passed | Failed | Files |
|---|---:|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,965 | 0 | 165 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,766 | 0 | 165 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,917 | 1 pre-existing | 165 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,859 | 0 | 162 |

### Exact permitted pre-existing failure

Owned by separate country-bar presentation work; file was not edited:

```text
FAIL src/test/profileCoursesRecord.test.tsx > profile courses record > unplottable courses keep unmapped text without a map key and country bars use neutral fill
src/test/profileCoursesRecord.test.tsx:76:41
AssertionError: expected 'display: block; height: 100%; width: …' to contain 'var(--course-country-bar)'
Expected: "var(--course-country-bar)"
Received: "display: block; height: 100%; width: 100%; border-radius: 3px;"
```

The other permitted pre-existing failure, `src/test/tourIsland.test.tsx:235`, **did not recur** (14/14 passed). All seven upcomingLastYearBoard cases and all 34 fw1FeaturedDeck cases passed; neither file was edited or skipped.

### Approved changes and test ledger

- Production changed only `VideoDetailsSheets.tsx`: the two result-row SquircleAvatar instances now have `alt=""`. SquircleAvatar does not accept/forward `aria-hidden`, so a layout-neutral `display: contents` wrapper hides each decorative avatar from accessibility. Explicit `fallback={getInitialsFromName(name)}` preserves the existing initials, geometry, ring and user-keyed colour; merely emptying alt would have replaced initials with a silhouette. Shared SquircleAvatar was not changed.
- Test file changed only `src/test/pf3aVideoUi.test.tsx`, its two authorized helper selectors:
  - Old: `screen.findByRole('button', { name: 'Added Person' })`; new: `screen.findByRole('button', { name: /^Added Person/ })`.
  - Old: `screen.findByRole('button', { name: 'Added Club' })`; new: `screen.findByRole('button', { name: /^Added Club/ })`.
  - Reason: match a name-first result while allowing existing supporting text. These helpers serve the four previously failing credit/thanks chip/limit cases. No assertion, test name, test case or other line in that test file changed; none deleted or renamed.
- Documentation changed: this report and `roadmap.md`.

Focused command: `bunx vitest run src/test/pf3aVideoComposerMounted.test.tsx src/test/pf3aVideoRules.test.ts src/test/pf3aVideoWrites.test.tsx src/test/pf3aVideoUi.test.tsx src/test/pf1ComposerGolf.test.tsx src/test/pf1Drafts.test.ts src/test/viewPost1Composer.test.tsx src/test/pf2HoleGuide.test.tsx --maxWorkers=2`.

Logs: `/tmp/pf3a-fix-2/focused.log` and `shard1.log` through `shard4.log`. Latest available preview build: **build OK**, 2026-11-07T16:49:26Z. Non-failing existing act/jsdom/accessibility warnings remain warnings. Hosted authenticated publish/draft/notification readback and device checks remain unverified; the real mounted composer and Details transitions are verified by the focused tests, not a claim of hosted publishing.

No guest browsing, review wizard, news, round plots, SQL, migrations/migration files, deployed RPCs/edge functions, feed_config, round_pool_cap or native/Median configuration was changed. Earlier STOP sections below are historical; the four failed selectors are resolved and the fresh results above supersede old verification statuses.

## PF3A_VIDEO close-out — 7 November 2026

**STOP: four new mounted Details tests failed. No failing selector, expectation, production code or unrelated test was repaired. All four fresh shards remain unrun under the requested stop rule.**

Added nine mounted cases:
- `src/test/pf3aVideoComposerMounted.test.tsx`: one real StageComposer/real state-hook/file-input/media-tray round trip; long video → added photo/mixed post → photo removed. Checks actual header and publish button, retained title, description and gear read back through Details. **Passed.** The standard translation mock returns `defaultValue` or `''`; the mixed-mode button is checked structurally/enabled, not against an invented translated Share label.
- `src/test/pf3aVideoUi.test.tsx`: four parameterized chip add/remove cases (credits, links, thanks, gear), checking `data-filled` and count; four parameterized near-limit → add → full-limit → remove cases, with literal 10/5/3/10 limits. Links and gear cases passed; credits and thanks failed in both groups.

Exact failures from `/tmp/pf3a-closeout/focused.log`:

```text
FAIL src/test/pf3aVideoUi.test.tsx
'credits' chip becomes filled with a count after adding and outlined after removing
src/test/pf3aVideoUi.test.tsx:39:34 (caller :61:11)
TestingLibraryElementError: Unable to find role="button" and name "Added Person"

'thanks' chip becomes filled with a count after adding and outlined after removing
src/test/pf3aVideoUi.test.tsx:44:34 (caller :61:11)
TestingLibraryElementError: Unable to find role="button" and name "Added Club"

'credits' add row hides at 10 and returns after removing
src/test/pf3aVideoUi.test.tsx:39:34 (caller :79:11)
TestingLibraryElementError: Unable to find role="button" and name "Added Person"

'thanks' add row hides at 3 and returns after removing
src/test/pf3aVideoUi.test.tsx:44:34 (caller :79:11)
TestingLibraryElementError: Unable to find role="button" and name "Added Club"
```

Command: `bunx vitest run src/test/pf3aVideoComposerMounted.test.tsx src/test/pf3aVideoRules.test.ts src/test/pf3aVideoWrites.test.tsx src/test/pf3aVideoUi.test.tsx src/test/pf1ComposerGolf.test.tsx src/test/pf1Drafts.test.ts src/test/viewPost1Composer.test.tsx src/test/pf2HoleGuide.test.tsx --maxWorkers=2`.

Result: **88 passed + 4 failed = 92 tests / 8 files**. Original focused scope was 83; the nine new cases reconcile to 92. No existing case deleted, renamed, rewritten or assertion changed. The existing UI test file gained only a search fixture and appended coverage. After the failed run, unsupported `exact: true` role-query options were removed solely to resolve TS2769 (`Object literal may only specify known properties, and 'exact' does not exist in type 'ByRoleOptions'.`); string role names are already exact by default. No failing selector name or assertion changed, no rerun attempted.

Full inventory before this close-out: **7,496 tests / 655 files**, the last reported Pro tiles/legacy/movers inventory (7,491 archive-era + five Pro tiles cases). After: **7,505 / 656**, expected inventory only, not a passing-suite claim. Delta +9/+1: eight appended Details cases and one new composer file/case. Earlier PF3A-only inventory 7,488/655 is historical; intervening archive and presentation cases account for +8 cases, not this close-out.

| Fresh final-code shard command | Passed | Failed | Status |
|---|---:|---:|---|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | — | — | Not run: new focused failure stop |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | — | — | Not run: new focused failure stop |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | — | — | Not run: new focused failure stop |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | — | — | Not run: new focused failure stop |

**User-authorized pre-existing failures:** the three `upcomingLastYearBoard.test.tsx` cases quoted historically below (“puts the shared year in the condensed header, not the rows”; “omits the heading year when the displayed rows have different years”; “keeps the winner the same size with a 14px trophy in the position cell and gold score/band”) belong to the separate upcoming LAST YEAR stream, not PF3A. They are pre-existing for this close-out, and that file was not fixed, skipped or edited. `src/test/tourIsland.test.tsx:235` is also permitted pre-existing if encountered. None was encountered in the focused scope; no new result for those files is claimed. The notification parity and separate presentation failures are not authorized known failures for this close-out; no repair attempted.

Changed in this close-out: the two test files above, `roadmap.md`, and this report. No application, SQL, migrations, migration files, deployed RPC/edge functions, guest browsing, review wizard, news, round plots, feed_config, pool cap or native/Median configuration changes. Hosted publishing/readback and device checks remain unverified; this mounted test does not establish a real authenticated publish.

The earlier sections below are historical and superseded where they call the three Tour failures a PF3A stop.

## Subsequent authorized Tour test-only rerun
The three Tour assertions below were repaired under exact user authorization; no PF3A production or tests changed. Focused Tour files passed23/23. Separate shards passed1936,1787,1913,1851 respectively; shard4 also failed one unexpected notification-type parity test. Full inventory7488/655 unchanged: **7487 passed,1 failed**. Failure: `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts:318:46`, “handles the same notification types in both files”; `missingFromPort` received `["video_credit"]` instead of `[]`. Stop preserved; no repair attempted. Only allowed known FW1 meta-line did not recur. The 320px check remains unrun due to this stop. Exact output, changed assertions and commands are in TOUR_UPCOMING_LAST_YEAR_REPORT.md.

## Delivered
Creator-only single-video title, description door, Details page, credits/links/business thanks/gear sheets, cover choices and timestamp chapters. Personal and business actors use the same one-video gate. Photo/mixed and edit mode keep their normal caption UI; retained metadata survives media additions/removals. Long form uses the existing 240-second rule, “New video”/“PUBLISH VIDEO”; shorts use “New short”/existing Share. Schedule/Save retain their labels; the shared footer carries the profile destination suffix.

Description stays in caption/posts.content and the existing mention pipeline. Metadata writes are separately best-effort after the posts patch; ordered credits and thanks contain positions. No client notification insert. Draft save writes video_data, and load restores it; poster choices also retain the existing media studio_edits path. Video-credit Activity uses the mention actor/thumb treatment and post destination.

## Files changed for this brief
- `src/features/post-v2/StageComposer.tsx`
- `src/features/post-v2/hooks/useStageComposer.ts` — metadata state and existing video probe's duration/dimensions retained for classification/cover aspect.
- `src/features/post-v2/hooks/usePostSubmit.ts`
- `src/features/post-v2/hooks/useDrafts.ts`
- `src/features/post-v2/lib/composerDrafts.ts`
- `src/components/mentions/MentionsComposerInput.tsx` — same member/business query helpers with opt-in extra metadata; ordinary mention query fields unchanged.
- `src/features/activity-v2/components/ledgerKinds.tsx`
- `src/features/activity-v2/utils/activityLinks.ts`
- New: `src/features/post-v2/lib/videoDetails.ts`, `videoDetailsWrites.ts`, `videoDetailsSearch.ts`
- New: `src/features/post-v2/components/video/VideoComposerFields.tsx`, `VideoDetailsPage.tsx`, `VideoDetailsSheets.tsx`, `videoCreator.css`
- New tests: `src/test/pf3aVideoRules.test.ts`, `pf3aVideoWrites.test.tsx`, `pf3aVideoUi.test.tsx`
- `roadmap.md`, this report.

Structural ownership is documented in module headers: shared pure timestamp rules, creator-only state/sheets, independently non-blocking writes and shared mention search. No unrelated architecture rules changed.

## Test accounting
No existing test deleted, renamed or edited for PF3A. New cases: **41 across 3 files** — rules 27; writes/state/ledger 9; UI 5. New test typing was corrected before first execution; no failed assertions rewritten.

Last green full-suite baseline **7,440 / 651**. Intervening upcoming LAST YEAR work added **7 / 1**, giving 7,447 / 652 (not green). PF3A adds 41 / 3: expected inventory **7,488 / 655**. No full-suite result is claimed because shard 4 was not run.

Focused command:
`bunx vitest run src/test/pf3aVideoRules.test.ts src/test/pf3aVideoWrites.test.tsx src/test/pf3aVideoUi.test.tsx src/test/pf1ComposerGolf.test.tsx src/test/pf1Drafts.test.ts src/test/viewPost1Composer.test.tsx src/test/pf2HoleGuide.test.tsx --maxWorkers=2`

**83 passed / 7 files**, including all 41 new cases. Non-failing React act warnings from asynchronous cover-frame mock resolution were printed.

Separate full-suite commands/results:

| Command | Passed | Failed | Files |
|---|---:|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,936 | 0 | 164 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,787 | 0 | 164 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,910 | 3 | 164 |
| Shard 4 | Not run — stop | — | — |

Executed aggregate: **5,633 passed + 3 failed = 5,636 tests / 492 files**. Shards 1–2 ran before the final video-dimensions retention edit; shard 3 ran after it. Fresh four-shard verification of the final state remains outstanding.

## Mandatory stop — exact errors
The three unresolved assertions from the immediately preceding Tour brief recurred. They are **not** on this brief's allowed-known list, so execution stopped; they were not repaired, excluded or relabelled as permitted known failures.

```text
FAIL src/test/upcomingLastYearBoard.test.tsx
puts the shared year in the condensed header, not the rows
src/test/upcomingLastYearBoard.test.tsx:38:33
AssertionError: expected 'Last year · 2025' to be 'LAST YEAR · 2025' // Object.is equality

omits the heading year when the displayed rows have different years
src/test/upcomingLastYearBoard.test.tsx:50:113
AssertionError: expected 'Last year' to be 'LAST YEAR' // Object.is equality

keeps the winner the same size with a 14px trophy in the position cell and gold score/band
src/test/upcomingLastYearBoard.test.tsx:81:63
AssertionError: expected 'rgb(212, 160, 23)' to be 'rgb(251, 188, 46)' // Object.is equality
```

The allowed pre-existing `src/test/tourIsland.test.tsx:235` did not appear in the executed shards. No PF3A test failed. Logs: `/tmp/pf3a-focused.log`, `/tmp/pf3a-shard-1.log`, `/tmp/pf3a-shard-2.log`, `/tmp/pf3a-shard-3.log`.

Latest preview telemetry: **build OK**, 2026-11-07T15:14:33Z. Intermediate typing issues were resolved before the finished-state check.

## Six checks and remaining verification
1. 18-minute titled video, timestamps, credits, link, thanks and gear: creator controls and pure/write fixtures covered; actual publish/readback and Ben's SQL row confirmation **not performed**. Exact visual match remains unverified.
2. Live credit notification text/delivery: **Ben's device check**; server-owned and unchanged. Client ledger treatment/destination covered.
3. 40-second clip: short cover/title-on-cover/no-chapters behavior covered in UI tests; 320px real composer **not verified**.
4. Add photo/remove photo: metadata retention and one-video gate covered; full mounted composer transition **not verified**.
5. All-field draft round-trip: metadata serialization and existing media restore covered; actual save/reopen server round-trip **not verified**.
6. CoverFrameSheet → poster_timestamp → poster: **source path exists**. `CoverFrameSheet.tsx` emits seconds; StageComposer updates posterTimestamp; `postUploadController.ts:277–312` inserts poster_timestamp and derives poster_url; `src/uploads/posterUrl.ts` chooses member-picked positive timestamps. Draft studio_edits preserves the timestamp. No new pipeline invented. Hosted playback/poster persistence **not verified**. Existing edit loader does not read poster_timestamp and initializes it null; existing thumbnail cache/posterUrl can retain an old preview frame. Those existing paths were left unchanged as required.

320px Details/sheets/composer screenshots, long-name/address browser wrapping, and authenticated central flow were **not run after the stop**. Authentication is externally managed; authenticated hosted checks have previously been unavailable here.

## Explicit limits
Stage 3b viewer/feed/Watch/profile changes were not built. Edit mode still shows “Edit post”, the existing caption/media/golf/Sharing controls, and Save changes; no video Details reads/writes were added there. No SQL, migration, migration file, deployed RPC/edge-function edit, feed_config, native/Median configuration, guest browsing, review wizard, news, round-plot or pool-cap change.

Remaining coverage gaps: full mounted composer top-bar/switch-back, all Details chip/remove variants, submission-through-hook and server draft round-trip, cover-path browser proof and exact mock/320px matching. These are not claimed complete.