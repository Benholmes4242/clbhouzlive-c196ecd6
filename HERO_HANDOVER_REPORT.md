# Hero handover and pending tournament-notch verification

## Implemented handover
`daysUntilStartDate` uses whole UTC date days, matching `daysSinceEndDate`. New `UPCOMING_HANDOVER_DAYS = 2`. The completed branch preserves the finish day; afterwards an upcoming event takes over at two days or less before start, or once result age exceeds3. Missing start dates preserve the old age gate. No upcoming retains14-day cap. Live handling, slide sorting, cache reads and all other behavior are unchanged.

No existing direct carousel-handover test was present: `tourOverviewDesignA` and leader-round handover tests cover different rules and were not rewritten. Added `heroCarouselHandover.test.tsx` with15 executed cases:
- Sunday finish Monday→completed, Tuesday→upcoming, Wednesday→upcoming (3).
- Monday weather finish Monday→completed, Tuesday→upcoming (2).
- Off week day3→completed/day4→upcoming (2).
- No upcoming day14→completed/day15→omitted (2).
- Missing upcoming start→old three-day result window (1).
- Real November4 PGA/LPGA fixtures→both upcoming (1).
- Live retains priority (1).
- UTC Thursday-start offsets Tuesday2/Wednesday1/Thursday0 and constant2 (3).

No existing handover test deleted, renamed or rewritten. The hook is exercised with a real QueryClientProvider and only Date faked; data reads return empty optional enrichments. The existing cache fixture supplies completed/upcoming rows.

## Final full suite (both briefs' final source)
Focused command `bunx vitest run src/test/heroCarouselHandover.test.tsx src/test/tournamentNotch.test.ts src/test/fixGridClearance.test.ts --maxWorkers=2`: **37/37 in3 files**.

| Exact command | Passed/executed | Files |
|---|---:|---:|
| `bunx vitest run --maxWorkers=2 --shard=1/4` |1681/1681|145|
| `bunx vitest run --maxWorkers=2 --shard=2/4` |1562/1562|145|
| `bunx vitest run --maxWorkers=2 --shard=3/4` |1659/1659|145|
| `bunx vitest run --maxWorkers=2 --shard=4/4` |1654/1654|145|
| **Total** | **6556/6556** | **580** |

Zero failures/unhandled errors; all exit0. Full logs: `docs/verification/hero-handover/{focused,shard-1,shard-2,shard-3,shard-4}.log`.

Last fully reported baseline **6528/578** → notch intermediate inventory **6541/579** (+13 `tournamentNotch.test.ts`, no existing case-count changes) → final **6556/580** (+15 `heroCarouselHandover.test.tsx`). Net+28/+2 entirely named. Adding files redistributes shard membership; per-shard deltas are not solely the new cases. No pre-existing failure observed, no exemption used.

Automatic telemetry: **2026-11-04T04:41:13Z — build OK**; no manual build/typecheck.

## Live browser observations and unresolved request conflict
Real signed-out pages, no fixture data or guest bypass:
- PGA picker row now World Wide Technology Championship / Thu. Selected PGA hero has `data-overview-photo-state="upcoming"`, and Our tournament picks is present.
- LPGA picker row now TOTO Japan Classic / Thu. Selected LPGA hero has upcoming state. A guest join dialog shades its screenshot; no authenticated picks interaction claimed (`external_unmanaged`).
- **All tours still leads with Champions' Simmons Bank result**, while PGA/LPGA/DP upcoming events appear below in Also this week. Champions finished November1, next event November12: November4 age3 and next start8 days away, so the requested off-week rule correctly retains it. Existing ordering places every completed slide before upcoming. The request to “keep everything else as built” conflicts with “All tours ... lead with the event starting tomorrow” for this actual data. No sorting override was invented. Changing All tours ordering needs a ruling.

Screenshots inspected in `/tmp/browser/hero-handover/`: `all-tours.png`, `picker.png`, `pga-upcoming.png`, `lpga-upcoming.png`, `upcoming-notch.png`, `player-final-notch.png`. Browser script/output retained there.

## Pending notch brief completed where verifiable
Tournament detail roots only now return immersive from the same `isImmersiveRoute` used by pre-React seeding. Other Tour detail/subroutes remain non-immersive. The existing tournament root registry already had exactly the requested dark, bleed, soft, condense/history-back spec with schedule fallback; preserved it and clarified the stale deeper-subroute note.

Extracted `photoBandMaterial.tsx` from overview PhotoBand: shared `PhotoBandFade` and opt-in `photoBandHeight`. Overview still returns its unchanged definite340px height; tournament uses `calc(340px + var(--sat, 0px))` and the same overview fade. Its bottom16px text anchor remains unchanged. No second fade recipe or overview/news height changes.

Player arrangement: route classifier remains non-immersive, **but existing `body.route-hub .app-shell` CSS actually overrides shell padding to0**, contrary to the assumed default. Therefore CHROME_CLEARANCE pays the notch once. Player root now uses `calc(${CHROME_CLEARANCE} - ${CHROME_BREATHING + 10}px)` to remove token breathing16 and existing identity inset10, while preserving hero26. At simulated `--sat:47px`, island bottom103, kicker129 (exact26px), root padding93, shell0. Loaded headshot and two-line name are clear. Final screenshot `player-final-notch.png` inspected; earlier overlapping apparatus screenshot is superseded.

Mexico Open finished detail `/tourhub/tournament/fa65c3bc-18ef-4058-8048-cf61808fea78`: hero top0, height387 with47px notch, content top191.0625 versus islands bottom103, real photo loaded at2560px. Inspected `/tmp/browser/tournament-notch/mexico-notch.png`.

Upcoming World Wide detail `/tourhub/tournament/3d67be1e-95f0-426e-a38b-15d583b9fb5d`: top0, height387, content142.421875 > island103, picks present. **No image is supplied on this event**, so photo-behind-status-bar proof is unavailable for that upcoming event. No photo invented. Native status bar not directly tested;47px notch is browser CSS simulation. Authenticated search/index island remains unverified.

## Exact rewritten guard assertions (authorised player arrangement audit)
Only existing test file changed: `fixGridClearance.test.ts`,9→9 cases; no deletion/rename.
- Import assertion old `/import\s*\{\s*CHROME_CLEARANCE\s*\}\s*from.../` → same pattern allowing `(?:,\s*CHROME_BREATHING)?`, because player uses both exports.
- Old uniform `/paddingTop:\s*(?:headerB\s*\?\s*)?CHROME_CLEARANCE/` → unchanged for four non-player files; player case now asserts exact source `paddingTop:\`calc(${CHROME_CLEARANCE} - ${CHROME_BREATHING + 10}px)\``. The old-clearance ban and all-bleeding-pages/no-exception guard remain unchanged.

New `tournamentNotch.test.ts`13 cases: two tournament root shapes immersive, eight other Tour shapes false, one exact registry comparison, one340+sat height and one unchanged overview height.

An initial combined shard runner exceeded600 seconds after shards1–2; incomplete shard3 output preserved as `docs/verification/tournament-notch/shard-3-interrupted.log`. Individual reruns passed. Earlier notch shards before final player correction do not substitute for the final four shards above.

## Scope and files
Handover: `HybridHero.utils.ts`, `useHeroCarouselData.ts`, new `heroCarouselHandover.test.tsx`.
Notch: `globalHeaderRules.ts`, registry comment/note only, new `photoBandMaterial.tsx`, `PhotoBand.tsx`, `TournamentV3Sections.tsx`, tournamentPage.css hero height/wash removal, PlayerPage.tsx/header, fixGridClearance.test.ts, new tournamentNotch.test.ts.
Roadmap/report/logs updated. No SQL/migrations, RPC/edge deployment, feed_config, round_pool_cap, guest browsing rules, wizard, news, round plots, native or Median edits.