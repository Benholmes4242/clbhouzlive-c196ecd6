# Follow tiles Option B — authorised mocks, remaining assertion stop

## Scope and exact authorised repair

Only `src/test/proVerification2B.test.tsx` changed, plus reporting/roadmap. No assertion, application code or activeRing test changed.

Old mock line quoted exactly:
```tsx
vi.mock('@/features/find-people/useSuggestionCovers', () => ({ useSuggestionCovers: () => new Map() }));
```

Replacement and added mock, exactly as authorised:
```tsx
vi.mock('@/features/find-people/useSuggestionCovers', () => ({ useSuggestionCovers: () => new Map(), useSuggestionCoversQuery: () => ({ covers: new Map(), settled: true }) }));
vi.mock('@/features/find-people/useFollowTileMedia', () => ({ useFollowTileMedia: () => ({ media: new Map(), settled: true }) }));
```

Why: provide the newly consumed exports with settled empty maps, keeping this file's member-name tests and batched pro-read assertions unchanged.

## Fresh shard totals

| Shard | Command | Passed | Failed | Executed |
|---|---|---:|---:|---:|
| 1/4 | `bunx vitest run --shard=1/4 --maxWorkers=2` | 2,167 | 1 | 2,168 |
| 2/4 | Not run under stop rule | — | — | — |
| 3/4 | Not run under stop rule | — | — | — |
| 4/4 | Not run under stop rule | — | — | — |

Shard 1: 187 files passed / 1 failed / 188 executed. No rerun and no further shards after the unexpected failure. proVerification2B itself: 17 passed / 1 failed / 18 executed. The missing-export failures are gone; the unchanged inline-style assertion now fails.

## STOP: exact file, line and error

`src/test/proVerification2B.test.tsx:143:40`, `Brief 2B mounted member names > rail: name element is unchanged`:
```text
AssertionError: expected null to be 'overflow: hidden; text-overflow: elli…' // Object.is equality

- Expected:
"overflow: hidden; text-overflow: ellipsis;"

+ Received:
null
```

Unchanged failing assertion:
```tsx
expect(el.getAttribute('style')).toBe('overflow: hidden; text-overflow: ellipsis;');
```

No repair made to this assertion, component, or any other test. Log: `/tmp/follow-tiles-mock-verification/shard-1.log` (sandbox-local). The previously authorised Follow selector repair remains saved, but kindRails is not in this shard and has not been rerun.

## Inventory

Last fully passing suite: 8,534. Follow-tile build adds 20 named cases below, expected 8,554. Both authorised continuations add/remove/rename zero cases; expected before/after this turn: 8,554 / 8,554. Fresh executed total: 2,168, with 2,167 passing and 1 failing; full-suite total is not verified. No deleted tests.

Original build: eight updated existing cases, seven renamed. Follow selector continuation: one additional unchanged-name case updated. This turn: shared mock setup only; all 18 proVerification2B case names and assertions remain unchanged (listed below).

## Every new case across the build (20)

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

## Every changed existing case across the build (9)

`src/test/activeRing.test.tsx` (changed in the original build only, untouched this turn):
- `makes one cover call for all slot cards and keeps cover dismissal isolated` (name unchanged).
- `a ringed card shows the when line and its avatar opens the post, not the profile` → `a card without media keeps its figures and its avatar opens the post, not the profile`.
- `an unringed card has no when line, shows its figures in a 35px slot and no avatar button; cards are 266 tall` → `a card without activity shows figures and a large avatar without an avatar button`.
- `a ringed card renders a two-line clamped when line, no figures, in a 35px slot; card stays 266` → `a card with media shows Posted in the stat line instead of activity or figures`.

`src/test/kindRails.test.tsx`:
- `the slot shows amber activity first, else figures, else stays empty` → `the slot shows figures without media, even with recent activity, else stays empty`.
- `follow goes through useToggleFollow` (unchanged name/assertion; authorised selector repair in preceding turn).

`src/test/wf2FeedRail.test.tsx`:
- `shows the rail reason lines and figures, with blank figures keeping their height` → `shows the rail reason lines and figures, with blank figures keeping the stat line`.

`src/test/wfFixRail.test.tsx`:
- `golfer and business cards share the fixed height and a bottom-pinned Follow button` → `golfer and business cards share the fixed tile and bottom block Follow button`.
- `a missing reason or figures leaves its fixed space empty` → `a missing reason or figures keeps the bottom block and leaves the stat line empty`.

Exact removed assertions and one-line reasons for the original eight cases remain quoted in `follow-tiles-option-b-stop.md`. Exact old Follow click and unchanged assertion remain quoted in `follow-tiles-option-b-authorised-fix.md`. No case is silently rewritten here.

## Cases consuming this turn's shared mock setup (18; assertions unchanged)

`src/test/proVerification2B.test.tsx`:
- `rail: verified-only labels with one batched screen read`
- `find people: verified-only labels with one batched screen read`
- `suggested block: verified-only labels with one batched screen read`
- `suggested row: verified-only labels with one batched screen read`
- `friend requests: verified-only labels with one batched screen read`
- `course members: verified-only labels with one batched screen read`
- `picks members: verified-only labels with one batched screen read`
- `people shelf: verified-only labels with one batched screen read`
- `grid card: verified-only labels with one batched screen read`
- `business grid names never enter the pro read`
- `centred shelf name stays in the original second child with unchanged sibling reservations`
- `mixed follow rail labels members but never businesses`
- `rail: verified non-pro keeps the tick in the name's parent`
- `rail: verified pro shows PRO and no tick`
- `rail: name element is unchanged`
- `find people: verified non-pro keeps the tick in the name's parent`
- `find people: verified pro shows PRO and no tick`
- `find people: name element is unchanged`

## git diff --stat

Captured before adding this report and updating final roadmap status.

This turn (`git diff --stat`):
```text
 roadmap.md                          | 1 +
 src/test/proVerification2B.test.tsx | 3 ++-
 2 files changed, 3 insertions(+), 1 deletion(-)
```

Across the build (`git diff --stat dae189240b^`, includes prior reports/new files):
```text
 .../follow-tiles-option-b-authorised-fix.md        | 130 +++++++++++
 .lovable/reports/follow-tiles-option-b-stop.md     | 245 ++++++++++++++++++++
 roadmap.md                                         |   7 +
 src/features/find-people/FollowTileImage.tsx       |  10 +
 src/features/find-people/WhoToFollowRail.tsx       | 250 +++++----------------
 src/features/find-people/follow-tiles.css          |  18 ++
 src/features/find-people/useFollowTileMedia.ts     |  32 +++
 src/features/find-people/useSuggestionCovers.ts    |   9 +-
 src/index.css                                      |   6 +
 src/test/activeRing.test.tsx                       |  36 ++-
 src/test/followTilesB.test.tsx                     | 117 ++++++++++
 src/test/kindRails.test.tsx                        |  13 +-
 src/test/proVerification2B.test.tsx                |   3 +-
 src/test/wf2FeedRail.test.tsx                      |   4 +-
 src/test/wfFixRail.test.tsx                        |  24 +-
 15 files changed, 656 insertions(+), 248 deletions(-)
```

`git diff --check` passed. Preview: `build OK` at 2026-11-13T19:19:29Z. No SQL/migration, activeRing edits, application edits, browser/device or authenticated-member checks. Ben's 390/320 rendering remains pending.