# World Rankings follow-up — 1 November 2026

## Delivered
- Zero events remaining is normalized to null by `leadSentence`, so the events-left clause is omitted and the sentence ends at the full stop.
- All six locale catalogues now have `overview.rankings.eventsLeft_one` and `eventsLeft_other`. `Trans` receives `count` explicitly to select the correct form. Disabled locales retain approved English copy; no locale switch changed.
- Four new cases in `src/test/worldRankingsRebuild.test.tsx`: “zero events left is omitted exactly like an uncountable total”; “zero season events ends the sentence at the full stop”; “selects the events-left plural form from count 1”; “selects the events-left plural form from count 2”. These pin zero/null equivalence, the exact full-stop sentence, singular/plural rendering and the emphasized count.
- No existing test deleted, renamed or rewritten; no existing assertion changed. This follow-up adds four cases to the existing rankings file.

## Earlier shard-2 failure — unavailable evidence
The previous message reported a mid-run failure during a sandbox interruption but did not name the file or case. Searches of surviving execution logs, reports and that message did not recover its name, error or line. It is not possible to reliably identify the file to run three times. No arbitrary substitute file was chosen and no three-pass claim is made. The earlier implication that this was sandbox instability is unverified, not a diagnosis.

## Tests and accounting
Targeted command: `bunx vitest run src/test/worldRankingsRebuild.test.tsx` — **36/36**, one file.

Full commands: `bunx vitest run --shard=1/4 --maxWorkers=2` through `--shard=4/4 --maxWorkers=2`.

| Shard | Passed tests | Passed files |
|---|---:|---:|
| 1 | 1,262 | 128 |
| 2 | 1,247 | 128 |
| 3 | 1,350 | 128 |
| 4 | 1,379 | 127 |
| Total | **5,238/5,238** | **511/511** |

Zero failed tests and no Vitest unhandled-errors summary. Raw logs: `/tmp/rankings-check/shard-{1,2,3,4}.log`.

Against the requested **5,172/509** baseline: **+66 tests/+2 files**, comprising `yc1YourCourses.test.tsx` (+30/+1) and `worldRankingsRebuild.test.tsx` (+36/+1, including this follow-up's four cases).

Correction to the earlier report: it claimed 36 rankings cases before this follow-up. The restored source contained **32**, and now runs **36** after four additions. The restored pre-follow-up inventory is therefore **5,234/511**; no evidence supports naming four historical deletions, and none occurred in this follow-up. The final executed total, not the earlier stated targeted count, is authoritative. One broad filename search matched `tournamentContest.ts`; Vitest correctly excludes that non-test file.

Latest automatic preview build: **build OK**, `2026-11-01T14:06:40Z`. No manual build or typecheck was run.

## 390×844 proof
Browser visited `http://localhost:8080/tourhub` at 390×844, with real guest data. World rendered the expected points sentence, five rows, dated column and live biggest-climb card. There was no horizontal overflow or page error.

The existing guest join card dimmed and covered the section. A normal Race to Dubai click was blocked by `[data-guest-gate-shade]`; it never switched the live board. No forced click, gate removal, session spoofing or access bypass was used.

Evidence under `/tmp/browser/world-rankings/`:
- `world-live.png`: real World view covered by the guest gate.
- `r2d-blocked.png`: blocked Race to Dubai attempt, still showing World; **not** a Race to Dubai live-state screenshot.
- `world-mock.png`, `r2d-mock.png`: signed-off reference sections.
- `world-comparison.png`, `r2d-comparison.png`: each reference beside its corresponding guest/blocking evidence, not unobstructed parity proof.
- `capture.log`: DOM observations and blocked-click evidence.

World and Race to Dubai presentation are unit-tested: header structure/nonwrapping, flag geometry, points bars, wins blank/zero, points format, sentences, followed-row highlighting/list order/cap, and climber history rendering. Your players is unit-tested only; no signed-in visual claim is made. Pixel parity and actual Race to Dubai browser state remain unverified because of the gate. Mock example names/counts/date differ from real data by design; existing system typography and shared chips were preserved.

## Protected scope
No SQL, migrations, backend/RPC changes, native/Median changes, or `feed_config` edits. `round_pool_cap` remains 30. YC2 is not part of this follow-up and remains open.
---

# FIX — flags cropped with a dark border, and the climber label case

## Cause
The flag sat in a 16×11 wrapper with `border: 1.5px solid TOUR_CANVAS` and
`overflow: hidden`, but CountryFlag `sm` renders at 16×12 (`w-4 h-3`). The
wrapper cropped the flag and the canvas-coloured border read as a black
outline.

## Diff — `src/features/tourhub/overview/sections/WorldRankings.tsx` (only file)
1. Flag wrapper: border removed entirely; sized to the flag's own 16×12;
   radius 3 → 2; `overflow: hidden` kept only to round the corners; position
   unchanged (right -4, bottom -3). No outline, ring or shadow.
2. CountryFlag now gets `className="border-none"` for this use only, removing
   the chip fallback's own `border border-border/10`. Other CountryFlag
   callers unchanged.
3. Climber card label span gains `textTransform: 'uppercase'`; the locale
   string `overview.rankings.climbLabel` stays sentence case.
4. `TOUR_CANVAS` import removed (now unused).

## Tests — `src/test/worldRankingsRebuild.test.tsx` (36 tests, count unchanged)
CHANGED assertions in "draws the headshot with the flag on its corner"
(renamed "…uncropped and without a border"):
- OLD: `expect(flag.style.height).toBe('11px');`
- NEW: `expect(flag.style.height).toBe('12px');`
- NEW: `expect(flag.style.border).toBe('');` `expect(flag.style.boxShadow).toBe('');`
  `expect(flag.style.overflow).toBe('hidden');`
- NEW: inner flag carries `w-4`/`h-3` (16×12, the wrapper's own size — nothing
  cropped) and `border-none`.
NEW assertion in the biggest-climb card test: the label span's
`style.textTransform` is `uppercase`.

## Results
- Focused: 36/36 passed. `npx tsgo --noEmit`: clean.
- Full suite in shards (4): 1,410 + 1,378 + 1,438 + 1,477 =
  **5,703 passed / 5,703 across 532 files**, zero failures — no delta vs the
  5,703/532 baseline (assertions changed/added inside the existing file).

## Unchanged
No SQL, no migrations, no RPC/edge edits, feed_config untouched,
round_pool_cap stays at 30, no native/Median changes.
