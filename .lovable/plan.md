# PF3C — round videos and following scorecards

## Scope
Match signed-off panels A–D only for exactly one long-form video with the personal creator's own round attached. Preserve PF3A/PF3B for all other videos, photos and mixed posts, and preserve PF1B's feed round row, fullscreen hole chip and round pill.

## Build
1. **Shared hole chapters**
   - Extend the canonical video-details model with hole marks and a default-on Scorecard follows setting.
   - Validate marks in hole-number order: at least 10 seconds between neighbours, including Intro at zero, and at least 10 seconds before the end. Use the recorded 9/18-hole round length; never infer eighteen from absent data.
   - Pre-fill unmarked holes from the four specified timestamp/hole formats, in description order, dropping invalid candidates and never replacing existing marks.
   - Two or more valid marks produce Intro plus hole chapters, replacing timestamp chapters. Fewer retain the existing timestamp parser unchanged.
2. **Composer and Mark the holes**
   - Round-video Chapters shows the specified status, Intro, first four marked holes, real pars/scores and the remaining-count door.
   - Add the following switch below Chapters. Keep cover controls, footer and all existing composer paths unchanged.
   - Add a composer subpage with a non-autoplaying local-video player, scrubber/time badge, next-hole/move action, precise rejection reason and clearable marked rows. Player/action stay pinned while the hole list scrolls; Back and Done retain marks.
   - Clear marks whenever the attached round changes or is removed. Store marks, following preference and their round identity in video_data; discard marks on mismatched or no-longer-available round restoration.
3. **Publication**
   - After the post's attached-round patch and details upsert, insert valid hole marks only when at least two exist and the round-video gate holds.
   - Include score_follows in the details upsert. Keep metadata/chapter failures warning-only, never failed publication.
4. **Watching and About**
   - Normalize the existing RPC's score_follows and hole_chapters fields. Hole-chapters-only videos qualify for the detailed-video presentation.
   - Reuse the existing once-per-second chapter tracking and PF3B segmented scrubber. Show Intro or ordinal/par in the chapter line.
   - Add the top-right following chip with Intro totals or the last marked hole's actual gross and cumulative to-par. No invented values when round data is absent.
   - Add SCORECARD first among About sections: equal 9/18-column strip, active outline, inert dim unmarked holes and seek-and-close marked holes. Reuse the existing scorecard opener for Scorecard ›.
   - Show Intro plus three hole chapters initially, then expand with Show all. Following off retains chapters but removes the chip and SCORECARD section.

## Technical ownership
- Extend `src/features/post-v2/lib/videoDetails.ts` for mark validation, pre-mark parsing and shared chapter selection; do not add another timestamp parser.
- Composer round reads already use `gam_round_stats`; include its existing holes_played field, accepting only recorded 9/18 values. Viewer identity, total gross/par and hole count come from the existing page-batched `usePostGolfContext` payload.
- Per-hole par/actual gross come only from `useRoundHoleShapes`; preserve its shared behavior and use existing scorecard lifecycle/navigation.
- Keep round-video presentation in focused composer/viewer modules and scoped semantic tokens; local ownership rules belong in module headers, cross-cutting decisions in AGENTS.md.
- Use existing live tables/RPCs only. No SQL, migrations, deployed-function edits, feed_config changes, pool-cap changes or native/Median changes.

## Verification and report
- Baseline: **7,538 tests / 660 files**, PF3B's final four-shard total.
- Add focused tests for every mark/spacing/end/pre-fill rule, next/move/clear/refusal controls, composer gating/preview/switch, save order/non-blocking failures, draft/round invalidation, chip totals/colour/absence, sheet seek/opener/expansion and preserved PF3A/PF3B behavior.
- Run focused tests, then four separate full-suite commands with `--maxWorkers=2 --shard=1/4` through `4/4`.
- Carry only the brief's named pre-existing failures at `profileCoursesRecord.test.tsx:76` and `tourIsland.test.tsx:235`, naming any that appear. Stop and report any other failure without repairing tests.
- Check actual-component 320px chip, marking page and About grid where the environment permits. Separate browser fixtures from authenticated/device verification.
- Write `PF3C_ROUND_REPORT.md` with files, new tests by file, any authorized existing-test changes, before/after totals, four shard results and checks1–5. Ben confirms published rows in SQL and physical-device playback/seek; never claim those checks were performed here.