# Leaderboards page: lead figure removed, between-rounds state fixed

Files: LeaderboardTab.tsx, BoardTable.tsx (THRU tee label, boardHasMovementMark), leaderboardRules.ts (teeTimeLabels, wonByUnitKey), six tourhub locale files, src/test/leaderboardsPage.test.tsx.

i18n deleted (de, en, en-XA, es, ja, ko): rebuilt.atTop, rebuilt.lead, rebuilt.tied (no other reader, template strings searched). Added rebuilt.shot.

Tests: renamed "live below the field gate shows LEAD, ON COURSE and LOW TODAY, no average" -> "...shows ON COURSE and LOW TODAY, no lead and no average" (lead now toBeNull); renamed "...as the fourth cell" -> "third cell" (toBe(4) -> toBe(3)). Added (a)-(e). Test-file mock changes: tee-times mock reads f.tees; heroStateLine mocked to echo its state (canonical i18n mock returns '' so the kicker words cannot be asserted).

Shards (sequential, logs /tmp/lb-shard-{1..4}.log): 2,266 / 2,282 / 2,301 / 2,428 = 9,277, all passed. leaderboardsPage 14 -> 19 (+5). Pre-change total therefore 9,272; the Standout report's 9,293 was an unverified estimate and does not reconcile (last verified full run 9,264). Typecheck clean.
