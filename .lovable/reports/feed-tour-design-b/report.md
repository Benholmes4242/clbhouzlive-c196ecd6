# Feed Tour post — design B

## Result and scope
Rebuilt the feed-only Tour card: photo → lead → live round bar / preview facts → inert board → existing actions → liked-by → existing add-comment. Removed the old header, photo leader face, sentence/chase presentation, movers and PhotoBandFade. Dropped sentence/chase props and tournamentHeadline calculation. Preserved exported chaserSentence, resultSentence, slotTopThree and their pure coverage; shared RoundSpine/HeroBoardRows and all data reads, upsert, analytics, likes/share/comment paths are unchanged. No SQL, migration, edge-function, feed_config or round_pool_cap edits.

Feed lead copy is owned by slotLeadRules, with shared heroRoundScore and calendar-day London countdowns. New geometry is scoped in tourSlot.css; new colours/fade are semantic global CSS tokens. Module headers document ownership; root AGENTS.md has no available space for another cross-cutting rule.

## Verification and inventory
Last full baseline: **9,710 tests / 862 files**. After: **9,744 passed / 9,744 tests across 863 files**, delta **+34 cases / one file**, all in `src/test/feedTourLead.test.tsx`. Existing `tourSlot.test.tsx` remains 38 cases; `tourSlotStates.test.tsx` remains 14. No tests deleted. Six case titles renamed; two rewritten with their original titles retained. No other existing test behaviour changed; removal of retired sentence/chase props from fixtures is mechanical. Canonical react-i18next mocks remain intact.

Four commands executed separately, sequentially. Full stdout/stderr was redirected to per-shard files during execution; final inspection found those .log files absent, so full-output retention is **not complete**. The observed runner totals below remain verified; no shards were rerun to recreate logs.

| Command | Passed tests | Passed files |
|---|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,391 | 216 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,393 | 216 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,426 | 216 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,534 | 215 |

No unexpected test failures. Latest completed preview compilation: build OK. The capture script first timed out on an exact accessible-name selector for Add comment (the avatar contributes to the name); the apparatus selector was corrected to the existing comment-button marker. No app/test repair or rerun occurred. Final capture script passed.

## Authorised existing-test rewrites (assertions quoted)
Full exact before/after assertion text is preserved in `authorised-test-changes.diff`.

1. `tourSlot.test.tsx`: **renders board rows with the shared 31px minimum in live and result** → **renders board rows with the feed 34px minimum after the lead in live and result**. Old: `expect(rows).toHaveLength(3)` and `expect(row.style.minHeight).toBe('31px')`. New: `expect(rows).toHaveLength(2)`; class ownership and CSS `min-height: 34px` checked. Why: leader group now lives in the lead card and feed rows are 34px.
2. `tourSlot.test.tsx`: **renders the photo at 162px** → **renders the photo at aspect-ratio 3 / 2**. Old: `.style.height).toBe('162px')`. New: photo class plus CSS `aspect-ratio: 3 / 2`. Why: photo height is derived from width.
3. `tourSlot.test.tsx`: **shows the first top tie marker only** (title retained). Old: `toEqual(['T1','','3'])`. New: `toEqual(['T2','','4'])` using board 1,T2,T2,4. Why: chasing board is below the lead; ties still print once.
4. `tourSlotStates.test.tsx`: **last-round live selects FINAL ROUND in the photo kicker while round 3 of 4 keeps ROUND 3 and the LIVE header is unchanged** → **last-round live selects FINAL ROUND in the photo kicker while round 3 of 4 keeps ROUND 3 and the LIVE prefix**. Old: header `toContain('● LIVE  Round 4')` and `toContain('● LIVE  Round 3')`. New: header `toBeNull()`, kicker branch `toBe('● LIVE\u00a0 DP World Tour · Round 3')`, LIVE span exists, final-round translation key and totalRounds rule retained. Why: header removed; live prefix moved into photo. Canonical mock still returns empty translations.
5. `tourSlotStates.test.tsx`: **(b) folds T3 four times into the first name and three others** → **(b) keeps pure T3 folding but renders four result rows after the winner without folding**. Old rendered rows `toHaveLength(3)`. New `toHaveLength(4)` and `[data-slot-others]` `toBeNull()` with exact four names asserted. Why: pure slotTopThree folding assertion stays; card no longer folds.
6. `tourSlotStates.test.tsx`: **(d) round four has dots, movers and five rows with R1–R4** → **(d) round four has four round nodes, no movers and four chasing rows with R1–R4**. Old movement `not.toBeNull()` and rows `toHaveLength(5)`. New movement `toBeNull()` and rows `toHaveLength(4)`. Four nodes, three done, one live and R1–R4 assertions stay. Why: replaces shared spine/movers with feed bar and excludes leader group.
7. `tourSlotStates.test.tsx`: **(e) result has no dots or round columns and uses final-round movers and top three** → **(e) result has no round bar, R1–R4 headers, no movers or sentence and a winner lead**. Old header `toBeNull()`, movement cards `toHaveLength(roundMovementCards(...).length)`, result sentence strong `not.toBeNull()`. New headers `toEqual(['1','2','3','4'])`, no green header, movers `toHaveLength(0)`, sentence `toBeNull()`, winner lead `not.toBeNull()`. Why: result now has a winner card and all played rounds.
8. `tourSlotStates.test.tsx`: **(g) single leader has a portrait block and a tie has none** → **(g) single leader has one avatar and a joint lead has overlapping avatars**. Old leader-face assertions present/absent. New kinds leader/joint and avatar counts `toHaveLength(1)` / `toHaveLength(2)`. Why: both solo and joint lead cards carry canonical avatars.

## Added cases: src/test/feedTourLead.test.tsx (+34)
Pure-copy rules use the real English catalogue, not a partial translation mock. Parameterised cases reconcile separately:
- One leader digit margins: 1 and 2 (2).
- Leading without a next row; leading without a gap; full name/shared score (3).
- Current-round score with capital Thru 14; Finished at 18; unsupported thru 0/null/19 (5).
- Unstarted round does not fall back to a prior round (1).
- Two joint leaders / one-shot clearance; two-shot clearance; three-player wording; missing clearance; first three avatars for four leaders (5).
- Winner digit margins 1/2; play-off; highest played round score; round-three fallback; absent final-round detail; joint team winners (7).
- Preview 0/1/4 calendar days including Today/DAY/DAYS, full start weekday and ending date (3).
- London midnight in BST; calendar days across spring clock change; stale current-round board; unpositioned leader exclusion; empty board (5).
- Centred facts; entirely null facts omitted; no weight-800 inline/CSS declarations across all states (3).
Total 34. Every case remains in the project.

## Browser captures
Eight `captures/compare-{live,tied,preview,final}-{390,320}.png` show actual components beside the original **390px** drawing. No 320px drawing was provided; its right-hand reference remains unmodified at 390px rather than inventing a narrow mock. `observations.json` contains measurements and `check_cards.py` contains the instrumented check; browser.log was also absent on final inspection.

At 390: photo 390×260; at 320: 320×213.328. All board rows 34px. Round tracks are 30px/8px gap at 390 and 26px/6px gap at 320. Solo avatars are 46px wide; joint avatars 40px at 390 and 34px at 320. Lead-name sizes 17px/16px and figure sizes 36px/28px. No element bounding box exceeds the card width; neither page nor root overflows; no computed font-weight 800; no page errors.

Live fixture: `● LIVE  PGA Tour · Round 3`, `LEADS BY 1`, full Ludvig Åberg, `−4 today · Thru 14`, total −15. Tied: JOINT LEADERS, Åberg & Straka, Two shots clear, −14. Preview: FIRST TEE, Thursday 20 Nov, 4 rounds · ends Sun 23 Nov, 4 DAYS. Final: WON BY 2, Ludvig Åberg, −4 in the final round, −19. The fixture uses a real Thursday 20 November schedule in 2025 and clock 16 November 2025 to reproduce the drawing's stand-in dates. Long board names ellipsise at 320 without losing positions/rounds/totals.

Like control updates 128→129; Add comment opens; recorded events are exactly like/add-comment, with no body-navigation event. These are isolated component callbacks, not a persisted hosted like/comment write. Actual engagement binding/navigation remains covered by retained TourSlot integration tests. No sign-in, live hosted data, or physical-phone verification claimed. Temporary HTML/module removed.

## Differences from drawing — reported, not silently repaired
- Canonical SquircleAvatar retains 1 / 1.05 geometry and traced ring, rather than mock square-height grey blocks: solo 46×48.297, joint 40×42 (34×35.688 narrow). This follows the explicit canonical-avatar rule; placeholder initials differ from blank artwork.
- Shared FeedPostActions remains unchanged: current like glyph is a thumb rather than the mock heart, with existing 21px glyph geometry, muted colours and inherited count weights. Insets/gaps match the brief. Shared add-comment avatar retains its canonical squircle and fallback, not the mock blank square.
- Shared LikedByRow retains its canonical first-name/plain-text typography and reserved three-face width; the mock bolds selected copy and uses a shorter blank stack. The cache-seeded row reads jamie_r and 127 others. No shared-component restyling was introduced.
- System font is inherited, never the mock's explicit font declaration. App global line-height inheritance produces slightly taller subtitle/kicker/lead/facts text metrics and downstream vertical offsets than the mock's reset/normal line-height. No unrequested font or shared-line-height override was added.
- The right-hand 390px mock intentionally remains unchanged for 320px comparisons; narrow title/figures/tracks therefore differ by the requested narrow rules, and long board names ellipsise only on the actual 320px card.
- Unsupported missing winner/runner scores produce a neutral WINNER label (added key) rather than inventing a margin or play-off; final-round detail is omitted when absent.

## Outstanding unrelated work
The prior Season recap Our picks browser label-weight stop remains unchanged and still needs an authorised ruling before repair; its 320px capture/sheet verification was not resumed by this brief.
