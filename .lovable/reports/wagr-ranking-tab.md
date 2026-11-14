# BRIEF_WAGR_RANKING_TAB — report

The profile Ranking tab for verified elite amateurs, matching amateur-ranking-A-signed-off.html. No SQL, no migrations, no policies; feed_config untouched. The client never re-implements the visibility switch — the server gates the rows, so no rows means no tab.

## Files

New:
- `src/features/amateur-ranking/useAmateurRanking.ts` — `useAmateurSummary` (select *, maybeSingle, key `['amateur-summary', userId]`), `useAmateurHistory` (week asc, id asc, key `['amateur-history', userId]`), `useAmateurEvents` (event_week desc, wagr_event_id desc, key `['amateur-events', userId]`). History and events take an `enabled` flag; the tab and the card pass "summary resolved non-null".
- `src/features/amateur-ranking/rankingTabRules.ts` — pure rules: `rankingTabVisible`, `insertRankingTab` (directly after Posts), `isoWeekThursday`, `axisLabel`/`eventMonthLabel` (fixed 3-letter months — en-GB ICU renders September as "Sept", the mock reads "Sep"), `rankingMovement` (this week vs the week before; year vs the last row ≤ W−100; fewer than two distinct weeks → no line), `rankingChartPoints` (x = 4 + i×342/(n−1), log-scale y 14–100, 57 when all ranks equal, rounded to 0.1), `rankingLabelY` (flips under the point below y 8), `finishLabel` (numeric → ordinal, 'Participant' → "Team" dim, other words as-is dim).
- `src/features/amateur-ranking/ProfileRankingTab.tsx` — headline (#rank, kicker, movement), SVG chart (viewBox 0 0 350 118, gradient area, 2px line, gold win dots for finish '1', white last point, end labels and ISO-Thursday axis months), four tiles (BEST RANK ordinal, WINS gold, TOP 10S, EVENTS; null → "–"), RECENT EVENTS (first 5, "See all {n} counting events ›" expands in place), foot "Points average … · last 104 weeks · updated weekly from WAGR®". Chart colours from `INDEX_DELTA.dark` (#4ADE80 up/line/fill, #F87171 down), wins #FBBC2E. A failed history read removes only movement+chart; a failed events read removes only the events section.
- `src/features/amateur-ranking/ranking-tab.css` — the mock's rules verbatim, renamed under `.amr-` and scoped under `.amateur-ranking-tab`, with only the three signed-off colour changes. `.amr-all` is a real button; only background/border/width/text-align resets were added.
- `src/test/wagrRankingTab.test.tsx` — 25 cases (below).

Changed:
- `src/features/amateur-ranking/SettingsWagrCard.tsx` — its three-column summary query replaced with the shared `useAmateurSummary` (one key, one shape). No visual change.
- `src/pages/ProfilePageV2.tsx` — `useAmateurSummary(profileUserId, isPersonal && proMember == null)` gate; `ranking` inserted after `activity` via `insertRankingTab`; `'ranking'` added to validTabs; redirect effect extended (`ranking` with no tab → activity) and now waits for the summary only when the gate actually runs (a disabled read stays pending forever for pros/businesses); `ranking` added to the `pt-0 px-0` wrapper list; `case 'ranking'` renders `<ProfileRankingTab userId={profile.id} />`.

## Tests

New file `src/test/wagrRankingTab.test.tsx`, 25 cases: gating (summary row → tab after Posts; no row → no tab; verified pro → no tab; business → no tab; insertion order), movement (up 3 / up 325 for Lewy, down, no change, no year-old row, fewer than two weeks), chart maths (first/last coordinates, win dots, label flip, equal ranks at 57, single row → no chart, axis/event labels), ordinals (11th/12th/13th/21st/112th), finish labels (Participant → Team), tab render (headline, tiles, foot), five events + in-place expand, failed-read scoping, and SettingsWagrCard showing 318 / 312th / 36 through the shared hook.

No existing test deleted, renamed or rewritten. During development, four of the new tests were corrected before any shard run (async waits on later-loading sections; September month label), and the source month formatting was fixed to match the signed-off "Sep". After the shard run, a preview typecheck error in `insertRankingTab` (generic splice cast, TS2352/TS2769) was fixed by dropping the generic for a plain `{ id, label }` signature, and the one new test calling it gained fixture labels — type-level only, no runtime change; the 25 focused tests re-passed and the preview build reports OK.

## Shard totals

Command: `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json`

- Shard 1: 2,211 passed / 0 failed
- Shard 2: 2,068 passed / 0 failed
- Shard 3: 2,182 passed / 0 failed
- Shard 4: 2,204 passed / 0 failed
- **Total: 8,665 passed, 0 failed** — previous baseline 8,640 + 25 new = 8,665. Reconciled.

## Not verified

- Real-member rendering at 390/320 (authenticated preview unavailable: external Supabase).
- The brief's Lewy 124-row polyline check: the chart maths are covered by coordinate tests, but the full 124-row replay against the mock path was not run.
