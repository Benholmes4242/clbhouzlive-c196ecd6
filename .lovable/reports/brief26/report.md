# Brief 26 — stop report (shard 3)

## Parts
- A hook and types — `95253bd10a`
- B search overlay — `a4a2daf481`
- C other callers — `2da38adb6a`
- D strings (en, en-XA `common.json` → `search.*`) — `9793721a16`
- E tests (`src/test/brief26Search.test.tsx`, 13 tests) — `5d59424cfd`

## Existing test changed
`src/test/wf1FindPeople.test.tsx:46-47` (search mock; C2 replaces the 'people'/'clubs' calls with one 'directory' call):
- old: `people: opts.scope === 'people' ? h.searchPeople : [],` / `clubs: opts.scope === 'clubs' ? h.searchClubs : [],`
- new: `people: opts.scope === 'directory' ? h.searchPeople : [],` / `clubs: opts.scope === 'directory' ? h.searchClubs : [],`
No assertion changed.

## Stop
Shards: 1/4 2,533/232 passed; 2/4 2,544/232 passed; 3/4 2,741/2,742 — 1 failure; 4/4 not run.

`src/test/brief18EyebrowInk.test.tsx:129`, "every Part 1 eyebrow declaration computes to rgb(248, 250, 252)":
`AssertionError: src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:238 has a resolved colour: expected 'undefined' to be 'string'`

Cause: C1 added the line `includePros: false,` at CompareSheet.tsx:83, moving the fixture-pinned eyebrow from 238 to 239 (same drift as 24B's ClubFromTheClub).
Proposed source-only fix: write `limit: 12, includePros: false,` on one line so the eyebrow returns to 238. No test change.

No SQL run, no migration written. Logs: /root/shards26/.

## Ruling applied and close-out
Ruling: put `includePros: false` on the `limit: 12` line in CompareSheet.tsx (source only) — `60c102c6be`. Eyebrow back on line 238; no test change.

Shards (sequential, no retries; shards 1–2 from the first run, 3–4 after the ruling):
1/4 2,533/232 · 2/4 2,544/232 · 3/4 2,742/232 · 4/4 2,817/231 = **10,636 tests / 927 files**, against 10,623 / 926: **+13 / +1**, exactly `brief26Search.test.tsx` (13 tests). No test removed.

No SQL run, no migration written. Ben: run the new global_search_v2 SQL now.
