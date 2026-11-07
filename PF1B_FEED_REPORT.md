# PF1B_FEED — Test close-out complete; phone checks outstanding

Updated 7 November 2026, after the requested standalone shard 4 run.

## Result

**Shard 4 passed: 1,821 tests / 162 files, zero failures.** No production code or tests were changed in this close-out. The accepted removal of the old client hole-guide writer and ready-update subscription remains intact; the composer writes `posts.add_to_hole_guide`, leaving publication and deferred video completion to Ben's existing server path.

The feed shows first-slide hole context and the attached-round row; fullscreen shows the first-slide chip and caption scorecard pill. Tags remain hidden. Text-only scheduled success follows the returned `status: 'scheduled'`. Live/device checks are not claimed complete.

## Four-shard totals and chronology

Command pattern: `bunx vitest run --maxWorkers=2 --shard=N/4`, each shard as its own command.

| Shard | Original PF1B run (historical) | Latest Pro-era run |
| --- | ---: | ---: |
| 1 | 1,919 passed | 1,920 passed (carried from preceding turn) |
| 2 | 1,831 passed | 1,783 passed (carried from preceding turn) |
| 3 | 1,909 passed | 1,885 passed (carried from preceding turn) |
| 4 | 1,804 passed | **1,821 passed (run now)** |
| Total | **7,463 passed / 648 files** | **7,409 passed / 647 files** |

The original totals come from the existing PF1B report; its runner logs are no longer available here for independent inspection. Latest shards 1–3 come from the preceding turn's reported results, not new runs in this close-out. The only command executed now was:

```sh
bunx vitest run --maxWorkers=2 --shard=4/4
```

Fresh output: `/tmp/pf1b-closeout-shard4.log`. Runner summary:

```text
Test Files  162 passed (162)
     Tests  1821 passed (1821)
  Start at  10:10:40
  Duration  230.15s
```

These two columns must not be mixed: intervening Pro work changed the inventory and shard membership. This is completion of the latest carried-forward four-shard run, not four freshly rerun shards today.

### Inventory reconciliation

PF1B: previous baseline **7,437 / 648** + **30 new cases in two files** − **4 retired cases in one file** = **7,463 / 648** (two new test files minus one deletion, with the baseline's file count already including the Stage 1 inventory; the executed PF1B total is the historical runner report).

Later Pro work, not this close-out, changed **7,463 / 648 → 7,409 / 647**:

| Test file | Before → after | Delta |
| --- | ---: | ---: |
| `src/test/proAskSection.test.tsx` | 32 → 34 | +2 |
| `src/test/proClubhouseSponsor.test.tsx` | 48 → 0 (deleted) | −48 |
| `src/test/proCollectionRules.test.ts` | 14 → 17 | +3 |
| `src/test/proCollectionSections.test.tsx` | 16 → 20 | +4 |
| `src/test/proProfileBuildOne.test.tsx` | 15 → 11 | −4 |
| `src/test/proProfileBuildOneRules.test.ts` | 29 → 17 (including three parameterized cases) | −12 |
| `src/test/proProfileSeason.test.tsx` | 4 → 5 | +1 |
| Total | | **−54; one file deleted** |

`proProfileBuildOneB.test.tsx` and `proVerification2.test.tsx` also changed in that separate work but have no count delta. The earlier Pro summary's “40” sponsor tests was inaccurate: its actual pre-deletion file contained **48**. No Pro tests were edited, removed or repaired in this PF1B close-out.

## Failures

- **No failures appeared in the fresh shard 4 run.** No new failure triggered the stop rule.
- Known pre-existing: **`src/test/tourIsland.test.tsx:235`**, TourGlance width assertion, historically `expected '' to be 'min(346px, calc(100vw - 24px))'`. It did not appear in this run; the historical PF1B report and carried latest shards 1–3 reported zero failures too. The test was not touched.
- No other pre-existing failure was reported in these runs. Console warnings are not counted as failed assertions.

## PF1B files

Corrected paths from the earlier abbreviated report:

- `src/features/post-v2/StageComposer.tsx` — remove client-guide call at composer handoff.
- `src/features/post-v2/hooks/usePostSubmit.ts` — guide flag and scheduled result handling.
- `src/features/post-v2/lib/composerGolfRules.ts` — guide flag in the same golf patch.
- `src/features/post-v2/lib/postUploadController.ts` — remove client-guide completion/subscription path; preserve scheduled response.
- `src/hooks/feed/usePostGolfContext.ts` — authenticated non-guest, at-most-100-ID context reads, course hole metadata and null-safe mapping.
- `src/features/courses/hooks/useCourseTeeSets.ts` — shared tee-set fetch and cache ownership.
- `src/components/feed/PostGolfContext.tsx` — shared hole chip, feed round row and fullscreen pill.
- `src/components/feed/FeedCard.tsx`, `src/components/feed/CardFeed.tsx`, `src/pages/Clubhouse.tsx` — page batching and feed context integration.
- `src/components/fullscreen-feed/FullscreenFeedOverlay.tsx`, `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx` — viewer context, first-slide chip and scorecard pill.
- `src/integrations/supabase/types.ts` — client types for already-live server fields/functions; no server deployment.
- New tests: `src/test/pf1bPostGolfContext.test.tsx` (**22 cases**), `src/test/pf1bFeedCard.test.tsx` (**8 cases**), and its no-context snapshot `src/test/__snapshots__/pf1bFeedCard.test.tsx.snap`.
- Deleted implementation: **`src/features/post-v2/lib/postHoleGuide.ts`** (not the post-studio path stated previously).
- Deleted tests: **`src/test/pf1HoleGuide.test.ts`**, four cases below.

Historical focused verification: new PF1B **30/30**, PF1 regression **87/87**, typecheck clean. Not rerun in this verification-only close-out. Existing retained test cases were not renamed or rewritten for PF1B; the new feed test's image fixtures received explicit dimensions before its initial verification, with assertions unchanged.

## Deleted `pf1HoleGuide.test.ts`: exact ledger

All four tested the retired client writer. Removing them is explicitly accepted; retaining them would require retaining the forbidden duplicate client publication path. Replacement tests assert the post flag and absence of client inserts/subscriptions instead.

1. **`inserts one pending row per ready media item with both source ids`**
   - Assertions: `expect(h.inserts).toHaveLength(2)`; `expect(h.inserts[0]).toMatchObject({course_id:'course',hole_no:15,user_id:'me',tagged_by:'me',status:'pending',source_post_id:'post',source_post_media_id:'media-1'})`; `expect(h.inserts[1]).toMatchObject({source_post_media_id:'media-2',stream_id:'stream'})`.
   - Why: insertion now belongs exclusively to Ben's server path.
2. **`processing media is deferred`**
   - Assertion: `expect(guideRow(ctx,'post',{...media,processing_status:'processing'})).toBeNull()`.
   - Why: deferred ready/poster publication no longer belongs to a client row builder.
3. **`a unique violation is ignored`**
   - Assertions, with `h.error={code:'23505'}`: `await expect(publishHoleGuide(ctx,'post')).resolves.toBeUndefined()`; `expect(h.inserts).toHaveLength(2)`.
   - Why: duplicate handling for the removed client inserts is no longer an application responsibility.
4. **`guide write failure does not fail the post`**
   - Assertion, with `h.error={code:'42501'}`: `await expect(publishHoleGuide(ctx,'post')).resolves.toBeUndefined()`.
   - Why: the removed client guide operation can no longer fail posting.

No other PF1B test was deleted. This close-out changed **zero tests**.

## Checks 1–6: what remains for Ben's phone

**All six live/device checks remain outstanding.** Automated isolated tests cover the stated behavior below but do not prove authenticated server readback, phone geometry, processing after app closure, or scheduled publication timing. Hosted end-to-end authentication is externally unmanaged and unavailable here; no new browser verification was attempted in this close-out.

| Check | Available evidence | Ben's remaining check |
| --- | --- | --- |
| **1. Hole 15 + attached round in feed** | Tests cover first-slide chip, gross/to-par, 18/9 bars, outlined hole and scorecard-only tap. | Open a real visible post with hole 15 and an attached round; confirm the chip/row and tap through to its scorecard. |
| **2. Same post fullscreen** | Isolated tests cover first-slide chip/pill and scorecard callback. | Confirm the chip clears the real top bar/back button and the pill opens the scorecard **above** the viewer, with dismissal returning correctly. |
| **3. Neither hole nor round** | No-context card snapshot and absence assertions pass historically. | Compare a real context-free post in feed/fullscreen; confirm it is unchanged. |
| **4. Guide video, close before processing finishes** | Tests assert the guide flag and that no client writer/subscription remains. | Post a hole video with guide on, close the app before processing completes, then confirm its guide row appears once a poster is ready; Ben may inspect it manually as the brief permits. Not verified here. |
| **5. Text-only post scheduled five minutes ahead** | Submit tests assert returned scheduled state/time and distinguish immediate publication. | Confirm scheduled success, its listing in Scheduled posts, and publication within one minute of the chosen time. |
| **6. 320px fit** | Render/structure tests only; no measured PF1B 320px screenshot evidence. | Check chip and round row at 320px: no overflow, collision or truncation, in the real feed/viewer. |

## Scope preserved in this close-out

Only this report and its roadmap entry were edited. No SQL, migrations or migration files; no deployed RPC/edge-function edits; no guest browsing, review wizard, news, round-plot, native or Median changes. `feed_config` was untouched and `round_pool_cap` remains 30. No server publication or scheduled job was triggered for verification. Preview build telemetry was unavailable (`/tmp/observability` absent); no product edits required a new build.
