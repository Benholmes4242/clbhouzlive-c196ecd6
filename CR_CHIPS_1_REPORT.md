# CR_CHIPS_1 — complete

## Screenshot follow-up — 2026-11-07
- The supplied creator screenshot shows the old larger white-selected pills. Current source already uses the exact same `RailChips size="sm"` as `Top100CoursesHubPanel.tsx:264–270`; no second size or colour treatment was introduced and Courses was not changed. The screenshot's older appearance cannot be reproduced in this sandbox, so its delivery/cache cause is unverified.
- `ProfileVideosTab.tsx` now also supplies `mx-auto w-max max-w-full`: fitting choices centre using intrinsic width and auto margins, independent of support for `justify-content: safe center`. Oversized rows retain horizontal scrolling. Existing gutters, counts, queries, analytics, grid and duration badges are unchanged.
- Command `bunx vitest run src/test/cr2CreatorProfile.test.tsx --maxWorkers=2`: **13/13 passed**. No tests added, deleted, renamed, rewritten or assertions changed. Full-suite inventory remains **7,408 tests / 645 files**, delta zero; full shards were not rerun for this follow-up (last full passing run is below).
- Browser-only actual-component fixture at **320px and 390px**, with alignment deliberately forced to `flex-start` to simulate missing safe-centre support: choice group width221px, scroll width221px, centre offset0.008px; shared11px font,9px radius,26.5px height. Both element screenshots reviewed. This verifies layout fallback, not authenticated profile placement or live readback; external unmanaged auth still prevents that check.
- Preview diagnostic **build OK 2026-11-07T05:47:50Z**. No shared control, Courses, SQL, migrations, edge functions, guest behavior, review wizard, news, round plots, feed_config, cap or native configuration changed.

## Changes
- `ProfileVideosTab.tsx` now uses the shared `RailChips` with default ground, `size="sm"`, `align="center-when-fit"`, `ariaLabel="Video type"`, and live All/Shorts/Long form counts. Wrapper retains 12px vertical and 16px side gutters. No chip-width ceiling or truncation.
- Existing kind state, `get_profile_videos` reads, analytics event/payload, grid and duration badges remain unchanged.
- Pre-edit search found local chip classes only in `ProfileVideosTab.tsx` and `profile-creator.css`; the chip-border token existed only in `src/index.css` and those local CSS rules. Removed the unused rules and token. Post-edit search across `src` returned no remaining references.
- Shared-choice ownership is documented in the creator module header; no shared chip implementation changed.

## Test ledger
Authorised selector-only change in `src/test/cr2CreatorProfile.test.tsx`, case **chips switch the server kind and tiles open the loaded list at the tapped index**:

Old:
```ts
fireEvent.click(screen.getByRole('button', { name: 'Shorts 0' }));
```
New:
```ts
fireEvent.click(screen.getByRole('tab', { name: 'Shorts 0' }));
```
Reason: the shared default choice ground exposes tab-role chips. The following RPC assertion remains unchanged:
```ts
expect(h.rpc).toHaveBeenCalledWith('get_profile_videos', { p_user_id: 'owner', p_kind: 'short', p_limit: 30 })
```

Two added cases in the same file:
1. **creator Videos renders three counted RailChips centred with the shared sm geometry** — All26/Shorts25/Long form1, three tab chips, selected state, safe centering and shared size.
2. **Long form filters the creator grid and tracks the unchanged chip event** — `p_kind: 'long'`, unchanged analytics payload, and opened grid data containing only the returned Long form video.

No existing test deleted, renamed or assertion rewritten. Focused file count: **11 → 13**. Full-suite baseline **7,406 tests / 645 files → 7,408 / 645**, reconciled solely by these two added cases.

## Verification
Focused command: `bunx vitest run src/test/cr2CreatorProfile.test.tsx --maxWorkers=2` — **13/13 passed**.

Each full-suite shard ran as its own command:

| Command | Passing tests | Passing files | Failures |
| --- | ---: | ---: | ---: |
| `bunx vitest run --maxWorkers=2 --shard=1/4` | 1,900 | 162 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | 1,828 | 162 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | 1,882 | 162 | 0 |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | 1,798 | 159 | 0 |

**Total: 7,408 passed / 7,408 executed, 645 files, zero failures.** Known TourIsland width failure did not recur (`tourIsland.test.tsx`14/14); neither sponsor-sheet style stop recurred (`proClubhouseSponsor.test.tsx`48/48). Those files were untouched. Logs: `/tmp/cr-chips-1/focused.log` and `shard1.log` through `shard4.log`.

Preview build diagnostic: **build OK**, 2026-11-07T05:24:36Z; no manual build/typecheck run.

## Four requested checks
1. **All26/Shorts25/Long form1 matching Top 100:** identical shared default sm implementation; isolated actual-component browser render at524px and320px shows centred choices, 11px font,9px radius,26.5px height. Real authenticated placement under profile tabs remains unverified (`external_unmanaged`).
2. **Switching filters the grid:** existing Shorts RPC assertion passes; new Long form test verifies the server kind, analytics and returned grid/opened-video identity. Authenticated live filtering remains unavailable.
3. **320px fit:** isolated actual-component browser render measured288px available width and288px scroll width; all three chips fit centred without clipping or truncation. Reviewed visible screenshot `/tmp/browser/cr-chips-1/chips-320.png`. Initial capture was obscured by app chrome; the isolated browser-only fixture was lifted above it, without modifying the app.
4. **Nothing else moves:** wrapper vertical/side padding unchanged; profile tabs, grid and duration-badge code/styles untouched. Full authenticated before/after profile positioning cannot be verified here. The shared sm chip height intentionally replaces the old30px pill height.

The browser fixture supplied only visual summary counts; it made no profile video read and did not mint a guest. It is not an authenticated end-to-end check.

## Scope preserved
No guest-browsing, review-wizard, news or round-plot changes. No SQL, migrations, migration files, deployed RPC/edge edits, feed_config changes, round_pool_cap changes, or native/Median changes.