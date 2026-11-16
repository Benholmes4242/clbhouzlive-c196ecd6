# BRIEF_REPORT_LOGS — stop committing raw test logs

## Changes
- Deleted all 10 raw `*.log` files under `.lovable/reports` (profile-rail-authorised-focused, profile-rail-authorised-shard1–4, profile-rail-followup-focused, tour-finished-shard1–4).
- Added `.lovable/reports/*.log` to `.gitignore` so future raw run logs stay untracked.
- No product or test code changes. No test added, deleted, renamed or rewritten.
- Reference check: no source or test file referenced any of the deleted logs; only `profile-rail-followup-authorised.md` mentioned their names in prose.

## Reporting rule going forward
Reports carry only the summary (per-shard totals, overall total, delta) plus the full output of any FAILING test — never the whole run.

## Suite (run once, four separate shard commands)
- Command: `npx vitest run --maxWorkers=2 --shard=N/4` for N = 1..4
- Shard 1: 2,284 passed (195 files)
- Shard 2: 2,196 passed (195 files)
- Shard 3: 2,237 passed (195 files)
- Shard 4: 2,274 passed (193 files)
- Total: **8,991 passed**, 778 files, 0 failed, 0 skipped
- Delta vs previous baseline (8,991): **0** — nothing depended on the deleted logs.
