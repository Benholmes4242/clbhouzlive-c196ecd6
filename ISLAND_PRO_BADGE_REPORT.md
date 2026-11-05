# Island PRO badge — close-out

Verified pros now show only the centred PRO badge in the top island, with or without a WHS connection. The divider, Your profile aria-label and /profile navigation remain. Pending has no cell; amateur behavior remains. Removed caption markup/styles and the unused proIslandCaption helper. No SQL or server changes.

Island-only styling: height 22px, side padding 9px, text 10.5px/800/0.12em, fully rounded, #F8FAFC background with #0A0A0C text via existing semantic tokens. Shared ProLabel and its CSS were not edited.

## Verification
Focused command: `bunx vitest run src/test/proStatusControls.test.tsx src/test/proPolish.test.tsx --maxWorkers=2` — **26/26**.
Fresh full-suite commands: `bunx vitest run --maxWorkers=2 --shard=n/4`.

| Shard | Passed | Files |
|---|---:|---:|
| 1 | 1,827 | 155 |
| 2 | 1,673 | 155 |
| 3 | 1,774 | 155 |
| 4 | 1,750 | 155 |
| Total | **7,024** | **620** |

Baseline **7,036 / 620** → **7,024 / 620**, exactly twelve retired caption cases removed from proPolish.test.tsx (19 → 7). No new cases/files, failures, or pre-existing failures encountered. Full logs retained in docs/verification/island-pro-badge/.

Browser CSS fixture at widths 1280, 390 and 320 measured the actual stylesheet: island 22px/10.5px/9px padding; unchanged small 16px/8.5px/6px; unchanged large 20px/9.5px/8px. All three centre on the same vertical axis. Screenshot viewed at /tmp/browser/island-pro-badge/badges-390.png; measurements in results.json. This is isolated CSS geometry, not authenticated live-header E2E. Profile tap/no-glance, pending absence, amateur index and connection variants passed mounted HcpCell tests. No live account or hosted navigation proof claimed.

## Exact test changes
src/test/proStatusControls.test.tsx:
- `shows PRO instead of index linked=false` and `linked=true`: old `expect(...textContent).toContain('ALPS TOUR')` → `expect(action.textContent).toBe('PRO')`; added one badge child, retained divider and absent caption structure. Existing index absence assertion unchanged. Reason: caption expressly retired.
- `teaching pro shows PGA PRO even when chip hidden` renamed `teaching pro shows only PRO even when chip hidden`: old `expect(...textContent).toContain('PGA PRO')` → `expect(...textContent).toBe('PRO')`. Reason: teaching caption expressly retired.
- All remaining cases/assertions unchanged, including profile tap to /profile with no glance, unknown/pending suppression and amateur index.

src/test/proPolish.test.tsx:
- `verified HotelPlanner island keeps profile action with small label`: old `expect(action.textContent).toBe('PROHOTELPLANNER')` → `expect(action.textContent).toBe('PRO')`; data-size small assertion unchanged.
- Deleted each following case; old assertion was `expect(proIslandCaption('tour_pro', tour)).toBe(caption)`, with the exact arguments below; new assertion: none, because the helper and caption are retired:
  - `PGA TOUR short caption`: PGA TOUR → PGA TOUR.
  - `DP World Tour short caption`: DP World Tour → DP WORLD.
  - `LPGA Tour short caption`: LPGA Tour → LPGA.
  - `LIV Golf short caption`: LIV Golf → LIV GOLF.
  - `Korn Ferry Tour short caption`: Korn Ferry Tour → KORN FERRY.
  - `HotelPlanner Tour short caption`: HotelPlanner Tour → HOTELPLANNER.
  - `Ladies European Tour short caption`: Ladies European Tour → LET.
  - `PGA TOUR Champions short caption`: PGA TOUR Champions → CHAMPIONS.
  - `Alps Tour short caption`: Alps Tour → ALPS TOUR.
  - `Clutch Pro Tour short caption`: Clutch Pro Tour → CLUTCH PRO.
  - `Asia short caption`: Asia → ASIA.
- Deleted `teaching caption is PGA PRO`: old `expect(proIslandCaption('teaching_pro', 'Club')).toBe('PGA PRO')`; new: none, retired helper.

No fixture mock, data, RPC, pending rule, shared label sizing or other test changed. Product files: ChromeIsland.tsx, pro-status-controls.css, proRules.ts. Local sizing ownership recorded in stylesheet header. Documentation: roadmap, this report and saved pro-polish requirement updated. Global bans preserved: feed_config untouched, round_pool_cap 30, no migrations/deployed RPC/edge/native/Median edits.