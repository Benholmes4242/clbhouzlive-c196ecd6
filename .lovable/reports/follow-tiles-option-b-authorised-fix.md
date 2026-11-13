# Follow tiles Option B — authorised selector repair and shard stop

Only the authorised test selector and its import changed this turn; application code and assertions remain unchanged.

## Authorised repair

`src/test/kindRails.test.tsx`, `follow goes through useToggleFollow`:

Old line (quoted exactly):
```tsx
fireEvent.click(card.querySelector('button:last-of-type') as HTMLElement);
```
Replacement:
```tsx
fireEvent.click(within(card).getByRole('button', { name: 'Follow' }));
```
Added `within` to the existing testing-library import. This is the only last-of-type selector in this file. The toggle assertion is unchanged:
```tsx
await waitFor(() => expect(h.toggle).toHaveBeenCalledWith(expect.objectContaining({ targetActorType: 'personal', targetActorId: 'cr0', isFollowing: false })));
```
Why: the authorised selector identifies Follow rather than the direct-child Hide button. This test is not in shard 1, so the repair has not yet been exercised.

## Shard totals and STOP

| Shard | Exact command | Passed | Failed | Executed |
|---|---|---:|---:|---:|
| 1/4 | `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,163 | 5 | 2,168 |
| 2/4 | Not run under the stop rule | — | — | — |
| 3/4 | Not run under the stop rule | — | — | — |
| 4/4 | Not run under the stop rule | — | — | — |

Shard 1: 187 files passed, 1 failed, 188 executed. No rerun or additional shard after failure.

Unexpected failures in `src/test/proVerification2B.test.tsx`:
- `rail: verified-only labels with one batched screen read`
- `mixed follow rail labels members but never businesses`
- `rail: verified non-pro keeps the tick in the name's parent`
- `rail: verified pro shows PRO and no tick`
- `rail: name element is unchanged`

Mock definition: `src/test/proVerification2B.test.tsx:18`; runtime call: `src/features/find-people/WhoToFollowRail.tsx:217:23`.

Tool's exact error:
```text
Error: [vitest] No "useSuggestionCoversQuery" export is defined on the "@/features/find-people/useSuggestionCovers" mock. Did you forget to return it from "vi.mock"?
```

No mock, assertion or application repair made after this failure. Log retained at `/tmp/follow-tiles-verification/shard-1.log` for this sandbox session.

## Inventory reconciliation

Last fully passing baseline: 8,534 tests. Option B adds 20 cases in `src/test/followTilesB.test.tsx`, giving expected inventory 8,554; full-suite total remains unverified. This selector repair adds/deletes/renames zero cases: before/after expected inventory 8,554 / 8,554. Actual fresh executed total is 2,168, with 2,163 passing and 5 failing, not a full-suite pass.

No tests deleted. Across the Option B build, eight existing cases were updated (seven renamed), plus this one unchanged-name selector repair: nine changed existing cases total. Exact old assertions for the original eight cases are quoted in `follow-tiles-option-b-stop.md`; the ninth old line and unchanged assertion are quoted above.

## Every new test (20)

`src/test/followTilesB.test.tsx`:
- `media beats cover for person`
- `cover beats nothing for person`
- `no media or cover shows no-image avatar for person`
- `media beats cover for business`
- `cover beats nothing for business`
- `no media or cover shows no-image avatar for business`
- `media beats cover for pro`
- `cover beats nothing for pro`
- `no media or cover shows no-image avatar for pro`
- `image errors fall from media to cover to nothing`
- `video is a poster with a play glyph and never a video element`
- `media read error settles and permits cover fallback`
- `makes one media call per mounted rail surface`
- `caps ids at 100 per kind in display order`
- `sorted keys reuse the same cache when ids reorder`
- `waits for both reads when get_follow_tile_media is pending`
- `waits for both reads when get_suggestion_covers is pending`
- `does not call media for signed-out`
- `does not call media for anonymous`
- `does not call media for no-ids`

## Every changed existing test (9)

`src/test/activeRing.test.tsx`:
- `makes one cover call for all slot cards and keeps cover dismissal isolated` (name unchanged; source-marker assertions updated).
- `a ringed card shows the when line and its avatar opens the post, not the profile` → `a card without media keeps its figures and its avatar opens the post, not the profile`.
- `an unringed card has no when line, shows its figures in a 35px slot and no avatar button; cards are 266 tall` → `a card without activity shows figures and a large avatar without an avatar button`.
- `a ringed card renders a two-line clamped when line, no figures, in a 35px slot; card stays 266` → `a card with media shows Posted in the stat line instead of activity or figures`.

`src/test/kindRails.test.tsx`:
- `the slot shows amber activity first, else figures, else stays empty` → `the slot shows figures without media, even with recent activity, else stays empty`.
- `follow goes through useToggleFollow` (name and assertion unchanged; authorised selector repair only).

`src/test/wf2FeedRail.test.tsx`:
- `shows the rail reason lines and figures, with blank figures keeping their height` → `shows the rail reason lines and figures, with blank figures keeping the stat line`.

`src/test/wfFixRail.test.tsx`:
- `golfer and business cards share the fixed height and a bottom-pinned Follow button` → `golfer and business cards share the fixed tile and bottom block Follow button`.
- `a missing reason or figures leaves its fixed space empty` → `a missing reason or figures keeps the bottom block and leaves the stat line empty`.

Why for the original eight: explicitly authorised replacement of tile DOM, dimensions, avatars and source-dependent stat presentation. Full removed assertions remain in the original stop report, unmodified.

## git diff --stat

Captured before this continuation report and final roadmap status update:

This turn, `git diff --stat`:
```text
 roadmap.md                  | 1 +
 src/test/kindRails.test.tsx | 4 ++--
 2 files changed, 3 insertions(+), 2 deletions(-)
```

Across the build, `git diff --stat dae189240b^` (includes the original report and all new source/test files):
```text
 .lovable/reports/follow-tiles-option-b-stop.md  | 245 +++++++++++++++++++++++
 roadmap.md                                      |   6 +
 src/features/find-people/FollowTileImage.tsx    |  10 +
 src/features/find-people/WhoToFollowRail.tsx    | 250 +++++-------------------
 src/features/find-people/follow-tiles.css       |  18 ++
 src/features/find-people/useFollowTileMedia.ts  |  32 +++
 src/features/find-people/useSuggestionCovers.ts |   9 +-
 src/index.css                                   |   6 +
 src/test/activeRing.test.tsx                    |  36 ++--
 src/test/followTilesB.test.tsx                  | 117 +++++++++++
 src/test/kindRails.test.tsx                     |  13 +-
 src/test/wf2FeedRail.test.tsx                   |   4 +-
 src/test/wfFixRail.test.tsx                     |  24 +--
 13 files changed, 523 insertions(+), 247 deletions(-)
```

`git diff --check` passed. Preview log: `build OK` at 2026-11-13T19:11:08Z. No SQL, migrations, generated-type edits, device checks or authenticated-member checks this turn. Ben's 390/320 rendering remains pending.