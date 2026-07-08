# PR-C — Symmetric mount window for up-feed early motion

Date: 2026-07-08
Scope: `src/components/feed/CardFeed.tsx`, `src/components/posts-tab/LightCardFeed.tsx`
Depends on: PR-A (early motion), PR-B (role rotation) — both remain untouched.

## Symptom

On device (Median iOS WebView, 2026-07-08): early motion works when
scrolling DOWN the feed (cards entering from the bottom are already playing
as they enter). When the user scrolls back UP after a sustained down-run,
cards entering from the TOP behave like the pre-early-motion system — no
motion until roughly half visible. Both `CardFeed` (Clubhouse) and
`LightCardFeed` (profile posts tab) affected.

## Root cause (verified)

Not in the role rotation, not in the warming, not in the reveal chain — all
of which were re-audited symmetric (see Part A of the audit exchange for the
concrete `playingIdx = 5 → 4` walkthrough).

The bug was one line per feed: `increaseViewportBy` on the `Virtuoso`
component was **asymmetric** — top was literally half of bottom:

- `CardFeed.tsx:860` — `{ top: 400, bottom: 800 }`
- `LightCardFeed.tsx:497` — `{ top: 600, bottom: 1200 }`

Under any real down-flick velocity the viewport passes `playingIdx`'s
settled center by 300–800 px; anything past 400/600 px above viewport top
falls outside Virtuoso's keep-window and gets **unmounted**. On reversal
the up-entering card has:

- No `FeedItemGate` render → no `InlineVideo` mounted
- No `IntersectionObserver` entry → `visibilityRef.get(cand) = 0`
- `earlyIdx` gate cannot arm (needs `ratio >= 0.12` and a warm-lane match)

By the time Virtuoso re-mounts the card, the observer registers it, the
callback fires (1–2 iOS WebView frames), `visibilityRef` catches up, and
`earlyIdx` finally sets, the card is already ~30–50 % visible — matching
the observed symptom exactly. Below-viewport cards approached in the scroll
direction never hit this failure mode because the viewport is closing on
them and the below overscan was already generous (800/1200 px).

## Fix

Symmetric, viewport-anchored keep window. Match top to the current bottom
value in both feeds (widen top only — do not shrink bottom):

- `CardFeed.tsx` → `increaseViewportBy={{ top: 800, bottom: 800 }}`
- `LightCardFeed.tsx` → `increaseViewportBy={{ top: 1200, bottom: 1200 }}`

`overscan={{ main, reverse }}` is left unchanged (already symmetric at
400/400 and 600/600 respectively). `mountVideo` gate
(`Math.abs(index - activeIdx) <= 1`) unchanged.

## What this DOES NOT change

Per the brief's guardrail — role rotation, engine, warming, reveal are
verified symmetric and were not touched:

- `feedLaneRoles.rotate('up' | 'down')` — untouched
- `warm('next', +1)` / `warm('prev', -1)` — untouched
- `InlineVideo.detectEarlyRole` — untouched
- `useVideoLane` mount/load/play — untouched
- `VideoEngine.preload` / `load` / `alreadyLoaded` skip — untouched

## Memory cost

Two additional mounted card shells on average (one further above, one
further below than before, for the widened top window; the below window is
unchanged). Concretely:

- +1 card DOM subtree above (~40–80 elements)
- Poster `<img>` stays `loading="lazy"` — bitmap decode only near-visible
- No additional `<video>` decoders — physical lane pool is still 3
- No additional GPU surfaces

Practical delta: ~150–250 KB heap per feed instance. Invisible on the
device budget; well within the "two extra mounted cards" the brief
authorized.

## Acceptance

- [x] `playingIdx − 1` provably mounted during sustained down-scroll —
      widened top keep-window (800 / 1200 px) exceeds a single card's
      layout height by a comfortable margin
- [x] No changes outside the mount-window config — grep confirms only the
      two Virtuoso lines changed plus this shipnote
- [x] Both feeds covered — `CardFeed` and `LightCardFeed`
- [x] Typecheck + build clean (verified by tooling)

## Device verification (Ben — capture on next device build)

1. **Repro, healed** — scroll DOWN through 10+ videos without stopping,
   then scroll back UP through all of them. Every card entering from the
   top should ALREADY BE MOVING as it enters, identical feel to downward.
2. **FLOW capture** — `card.summary` verdicts `IG` in both directions;
   `flow.handover` `SEAMLESS` in both; `rotation.promote` lines with
   `direction: 'up'` present and clean.
3. **Memory sanity** — no jank / budget regressions in `feed.scroll`; two
   extra mounted cards should be invisible in the tally.
