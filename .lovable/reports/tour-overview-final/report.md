# Tour overview — final verification

## Authorised change

Only `src/test/tourOverviewHeroFixes.test.tsx:68` changed:

```diff
- expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('Champions · STARTS 14 JAN');
+ expect(container.querySelector('[data-overview-photo-kicker-row]')?.textContent).toBe('Champions · Starts 14 JAN');
```

Case: **the overview 53-day kicker reads STARTS 14 JAN and excludes FIRST TEE**. Its name and all other assertions are unchanged. Reason: English textContent correctly retains “Starts”; CSS supplies visible uppercase. No application files changed. No tests added, deleted or renamed in this request.

## Full sequential suite

Each command ran separately, after the preceding command finished. No reruns were needed. Complete output is retained in `shard-1.log` through `shard-4.log` beside this report.

| Command | Passed / executed tests | Passed files |
|---|---:|---:|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,377 / 2,377 | 215 |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,341 / 2,341 | 215 |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,416 / 2,416 | 215 |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,512 / 2,512 | 212 |
| **Total** | **9,646 / 9,646** | **857** |

Expected inventory before this correction: **9,646 tests / 857 files**. Verified after: **9,646 tests / 857 files**. Delta: **zero**.

Reconciliation from the previous fully passing 9,611 / 855 baseline: the earlier hero implementation added 13 cases in `tourOverviewHeroFixes.test.tsx` (+one file), taking inventory to 9,624 / 856; the earlier recap implementation added 22 cases in `seasonRecapNextUp.test.tsx` (+one file), taking inventory to 9,646 / 857. This request adds no further cases. Historical assertion/rename reports remain in the corresponding original implementation reports.

## Captures at 390 and 320 CSS pixels

Ten screenshots accompany this report: four requested views at both widths, plus two longer-title stress captures. They use actual application sections in a disposable fixture page served by the existing Vite preview, with a real English provider and QueryClient. No sign-in, SQL, migrations, writes or app/test capture affordances were used. The temporary HTML/TSX pages were deleted afterward.

The golf photograph is an existing local course asset used only as fixture imagery; it does not claim to depict Phoenix, Waialae or Jumeirah. Fixture clock: 21 November 2026 at 00:00 UTC. The next event is the supplied fixture “Sony Championship Hawaii”, 14–16 January 2027 at Waialae CC.

| View | 390 capture | 320 capture | Observation |
|---|---|---|---|
| Live hero and fact row | `captures/live-390.png` | `captures/live-320.png` | Four equal columns, all figures on one horizontal line: 64, 70.25, 68%, −3. Figure tops: 366px at 390, 370px at 320. |
| Upcoming more than a week away | `captures/upcoming-390.png` | `captures/upcoming-320.png` | Actual HybridHero visibly reads **CHAMPIONS · STARTS 14 JAN**. textContent is **Champions · Starts 14 JAN**; computed text-transform is uppercase. Countdown is 54 days. FIRST TEE is absent. |
| DP World Last year key | `captures/lastyear-390.png` | `captures/lastyear-320.png` | Actual UpcomingLastYear/WonChart shows **David Puig −18**, **Wenyi Ding −16**, **Nick Voke −15**. All three fit one key line at 390; Nick Voke wraps to the second key line at 320. No name ellipsis. |
| Champions recap | `captures/recap-390.png` | `captures/recap-320.png` | Season-over sentence, Cink winner, then Next up card within the same flowing photo content block. No recap points figure or final-event line. |
| Longer Next up title stress check | `captures/recap-long-title-390.png` | `captures/recap-long-title-320.png` | Photo band grows from **404.27px to 422.27px**, rather than clipping the two-line card title. |

Recap card starts exactly **16px after the sentence** at both widths; its bottom remains **14px above the photo-band bottom**. The band has no fixed inline height. The recap kicker begins at y=186.5px and does not move upward when the footer grows. The longer-title check changes only fixture DOM text, not app code or a test.

Measurements found no elements extending beyond the horizontal viewport in any of the eight main captures, and no browser page errors. All ten final screenshots were visually inspected. Latest harness diagnostic: **build OK**, 21:09:17 UTC.

### Scope and observations left unchanged

- These are isolated presentation captures, not authenticated live-event/data readback or full-page navigation checks. Full app islands were not mounted; integrated notch/island clearance on a physical phone is not claimed.
- At 320, the existing scoring-average label is invisible: the media rule hides the full label and a later equally specific rule hides the short label. The four figures still fit in one row. App/CSS changes were explicitly forbidden, so this existing presentation issue remains unchanged.
- The preliminary full recap fixture also showed tightly touching Behind/Points figures at 320 in the frozen standings section. Final recap captures frame the requested photo band; no standings changes were made.

## Retained evidence

Repository: `.lovable/reports/tour-overview-final/` contains this report, all four full shard logs, ten captures and `measurements.json`. Roadmap entries for the two requested Tour overview verifications are updated; unrelated historical tasks were not reopened. The Files ZIP includes the same evidence.
