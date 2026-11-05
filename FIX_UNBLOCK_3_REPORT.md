# FIX_UNBLOCK_3 — STOPPED; combined close-out not met

ST2 and all requested focused tests pass. Four fresh shards ran; shard 4 retains the same 21 pre-existing failures reported in the preceding Settings fix. The untouched linkedHandicapState file also fails its first isolated run, so it cannot qualify for the 3/3 flake exemption. No browser checks or combined sign-off claimed.

## Exact authorised fixture edit
Only `src/test/st2SettingsHandicapCard.test.tsx:19` changed:

```ts
vi.mock('@/lib/whs/hooks', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/whs/hooks')>(), useWhsConnection: () => ({ data: h.connection, isFetched: h.fetched, isError: h.connectionError }), useHandicapTrend: () => ({ data: h.connection ? { current: h.eg } : undefined, isFetched: true, isError: false, isLoading: false, isPending: false }) }));
```

Original spread and connection override preserved exactly. No assertion, case name, case count or product source changed. `useHandicapChipState` reads only trend.current plus fetched/error flags; SettingsHandicapCard does not read trend. Settings now already gates on full pro status alone (preceding product fix), so the brief's historical ownHandicap.settled cause no longer describes current Settings. No other trend fields required by the tested render path.

## Focused checks
1. `bunx vitest run src/test/st2SettingsHandicapCard.test.tsx --maxWorkers=2`: **22/22**, output `docs/verification/fix-unblock-3/st2.log`.
2. `bunx vitest run src/test/fixUnblock2.test.tsx src/test/islandsNav.test.tsx src/test/proOwnHandicapState.test.tsx src/test/proStatusControls.test.tsx --maxWorkers=2`: **45/45 / four files**, output `docs/verification/fix-unblock-3/focused.log`.

## Fresh full suite
Command for each: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Failed | Executed | Files |
|---|---:|---:|---:|---:|
| 1 | 1,753 | 0 | 1,753 | 152 |
| 2 | 1,653 | 0 | 1,653 | 152 |
| 3 | 1,750 | 0 | 1,750 | 152 |
| 4 | 1,702 | 21 | 1,723 | 152 |

**6,858 passed + 21 failed = 6,879 tests / 608 files**. Every shard's full output is kept in `docs/verification/fix-unblock-3/shard{1,2,3,4}.log`.

Before and after this fixture-only change: **6,879 / 608**, delta **0**. Against brief expected **6,878 / 608**, the one additional case is the already-approved preceding `proStatusControls.test.tsx` Settings pro-only readiness regression (18 → 19). FIX_UNBLOCK_2's four cases/file remain. No tests deleted, renamed or rewritten.

## Named pre-existing failures and required STOP
Same files/case counts as preceding `docs/verification/settings-pro-only/shard4.log`, all untouched here:
- `hb5ProfileBackName.test.tsx` — 8; `Error: [vitest] No "isGuestUser" export is defined on the "@/features/guest/useIsGuest" mock. Did you forget to return it from "vi.mock"?`
- `islandsRound2.test.tsx` — 6; missing disconnected-cell buttons at 47:28, 55:28, 60:28, 67:28, 83:28, 91:25.
- `linkedHandicapProfile.test.tsx` — 2; `Error: No QueryClient set, use QueryClientProvider to set one`.
- `linkedHandicapState.test.tsx` — 5; `Error: No QueryClient set, use QueryClientProvider to set one`.

QueryClient stack: `src/hooks/useProfileData.ts:8:23` → `src/features/pro-verification/useMyProStatus.ts:38:48` → `src/lib/whs/useOwnHandicapState.ts:8:18` → HcpCell or ScoresStandingSlot. Full errors and test names retained in shard4.log.

Flake check command: `bunx vitest run src/test/linkedHandicapState.test.tsx --maxWorkers=2` — **4 passed / 5 failed**, first isolation. Full output `docs/verification/fix-unblock-3/linkedHandicapState-isolated1.log`. Cannot achieve three passing isolated runs; stop, no failing fixtures edited and no browser continuation.

Latest harness signal: **build OK, 2026-11-05T12:51:51Z**.

## Outstanding checks
All four browser checks remain blocked by the required suite-first stop: 1x live-dot historical geometry/full halo/condensed absence; Tour and Amateur News at 320/430; authenticated Activity digest → Tour top/burger → Activity back; non-pro and Mason cold-load island.

FIX_TOUR_NOTIF_1, FIX_LIVE_DOT_1, FIX_UNBLOCK_1, FIX_UNBLOCK_2 and Pro status controls are not collectively closed out. PRO_STATUS_CONTROLS_REPORT.md remains because all-green conditions are not met. No SQL, migrations, deployed RPC/edge, feed_config or native/Median changes; round_pool_cap untouched.