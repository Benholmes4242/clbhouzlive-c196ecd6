# BRIEF_COUNTING_EIGHT_A2 — build report

Date: 2026-11-13. Baseline 8,556 → 8,557 (+1 new test).

## File changed
`src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx` only (plus the authorised test file).

## 1. NET
useRoundNetScores call line:
```ts
const nets = useRoundNetScores(windowBase.map((r) => r.id));
```
Called once with the window's whs_scores ids; each round's net is `nets.get(r.id)?.net ?? null`. No client derivation, no gross fallback, no course-handicap arithmetic. NET renders as the plain integer, no to-par suffix. The header comment paragraph "NET IS ABSENT, NOT APPROXIMATED…" and the "Not carried by whs_scores" line comment are replaced by one line: "NET comes from gam_round_net via useRoundNetScores, blank when absent."

## 2. Detail block
Line 1: course name (unchanged: 12.5/700 CHART.INK, minWidth 0, nowrap, ellipsis) + `detail-counts` on the right (12.5/700, A.IMPROVED when counting, CHART.MUTE otherwise, flexShrink 0). Line 2 (marginTop 4, gap 12, nowrap, baseline): GROSS / NET / DIFF unchanged, then `detail-date` (11/600 CHART.DIM) at `marginLeft: 'auto'`. SLOT_H 40 and every data-testid kept.

## 3. THE COUNTING EIGHT
Green-bordered box, chip styling and the maxWidth 72 ellipsis removed. Kicker marginTop 22, 9.5/700/0.14em uppercase A.IMPROVED. Grid marginTop 10, `repeat(2, minmax(0, 1fr))`, gap 8, best-differential-first order unchanged.

Final tile JSX:
```tsx
<button
  key={r.id}
  type="button"
  data-round-id={r.id}
  aria-label={roundLabel(r)}
  aria-pressed={activeId === r.id}
  onClick={() => onSelect(window20.findIndex((w) => w.id === r.id))}
  style={{
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '11px 12px 10px', borderRadius: 12, background: MEMBER_PANEL,
    border: 0, margin: 0, textAlign: 'left', minWidth: 0,
    font: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
    /* Dim the other seven only when the selected round is one of the eight. */
    opacity: activeId != null && activeId !== r.id && countingEight.some((c) => c.id === activeId) ? 0.55 : 1,
  }}
>
  <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, color: inkWithAlpha(CHART.INK, 0.86), overflowWrap: 'anywhere' }}>
    {r.course_name ?? ''}
  </span>
  <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
    <span style={{ fontSize: 10.5, fontWeight: 600, color: CHART.DIM, whiteSpace: 'nowrap' }}>
      {formatDayMonthShortGB(r.play_date)}
    </span>
    <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1, fontVariantNumeric: 'tabular-nums lining-nums', color: A.IMPROVED }}>
      {fmtDiff(r.diff as number)}
    </span>
  </span>
</button>
```

## Untouched confirmation
HcpSection `hairline` prop, LastTwentyBars (props, cut line, date axis) and the §4.1 caption are byte-identical to before; kicker/title unchanged. Nothing else on the page was edited.

## Tests (authorised edits only, in RoundsThatCountSection.pairing.test.tsx)
- (a) added `vi.mock('@/components/explore-tab-new/courseled/hooks/useRoundNetScores', () => ({ useRoundNetScores: () => new Map([['s3', { net: 69 }]]) }));`
- (b) "a chip tap updates the detail block…" gained `expect(detail('net')).toBe('69');`
- (c) "…a null net renders empty" unchanged (s10 absent from the map, NET '')
- (d) new test "dims the other seven tiles only when the selected round counts": default selection (s0 counts) → seven others at opacity '0.55'; after `fireEvent.click(barFor('Course 10'))` every `[data-round-id]` tile is '1'.
- Existing chipFor/aria-pressed assertions pass unchanged. No test deleted, renamed or rewritten.

## Shard totals (each its own command, --maxWorkers=2)
- 1/4: 2,168 passed (188 files)
- 2/4: 2,020 passed (188 files)
- 3/4: 2,183 passed (188 files)
- 4/4: 2,186 passed (186 files)
- Total: 8,557 passed, 0 failed. 8,556 + 1 new = 8,557. Reconciled.

No SQL, no migrations. 320-wide render not verified in a browser here.
