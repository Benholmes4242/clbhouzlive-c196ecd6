# WEB_HOMEPAGE_1 — stopped verification

## Implemented
- AppDownloadGate remains the default gate entrypoint for none/invite/profile states, with canonical context and invite-code stash.
- Ported the mock's fictional illustrations and section order into scoped homepage CSS and section components. Mock-only state switch is not rendered.
- Public figures, featured-course phone, popular courses, debounced existing course search, selected cards, zero/error fallbacks, official two-row badges, placement analytics and business-link read are implemented.
- BootHold, guest browsing, review wizard, news, round plots, generated types, deployed functions, native configuration, feed_config and round_pool_cap were not changed. No SQL or migrations were run or written.

## Files changed / added
- src/pages/AppDownloadGate.tsx
- src/pages/gate/home/useWebHomeData.ts
- src/pages/gate/home/HomeIllustrations.tsx
- src/pages/gate/home/WebCourseCard.tsx
- src/pages/gate/home/WebCourseSearch.tsx
- src/styles/web-home.css
- src/index.css (scoped stylesheet import)
- src/lib/storeLinks.ts
- src/test/webHome1.test.tsx
- src/test/appDownloadGateBadges.test.tsx
- AGENTS.md
- roadmap.md
- WEB_HOMEPAGE_1_REPORT.md

## Live public responses
Signed-out public RPC calls returned HTTP 200 without any writes:
- Featured: **Parkstone Golf Club**, `read_available: true`; 26 rounds, 24 hole rounds, average +7.1, 5 ratings, rating 9.0.
- Figures at inspection: 23,304 courses / 4,442 rounds / 79,407 holes.
- Popular courses returned five rows.
These are read observations, not hardcoded production content.

## Exact stop
Command: `npx vitest run --maxWorkers=2 --shard=2/4`

```text
FAIL src/lib/storeLinks.test.ts > fetchStoreLinks > parses string and { url } values and drops a non-https value
AssertionError: expected { …(3) } to deeply equal { …(2) }

  {
    "appStore": "https://apps.apple.com/app/clbhouz",
+   "business": null,
    "play": "https://play.google.com/store/apps/details?id=clbhouz",
  }

❯ src/lib/storeLinks.test.ts:45:37
45| expect(await fetchStoreLinks()).toEqual(links);
```

This is a new regression, not a claimed pre-existing failure. The business link added alongside store links changes the returned object shape. The brief authorises only the badge geometry test change; this existing assertion was not edited and no repair was attempted after the stop.

## Tests and accounting
Last verified full-suite result from the preceding report: **8,173**, not the brief's historical 8,038. Added **23** cases in `webHome1.test.tsx`; expected inventory **8,196**, not yet verified across all shards.

Executed commands:
1. `npx vitest run src/test/webHome1.test.tsx src/test/appDownloadGateBadges.test.tsx src/test/funnelTracking1.test.tsx src/test/guestStage3.test.tsx --maxWorkers=2` — 39 passed (23 new + 4 badge + 7 funnel + 5 guest).
2. `npx vitest run --maxWorkers=2 --shard=1/4` — 2,138 passed, 183 files passed.
3. `npx vitest run --maxWorkers=2 --shard=2/4` — 1,950 passed, 1 failed; 1,951 executed, 183 files.
4. Shards 3/4 were not run, respecting the stop.

Partial full-suite execution: **4,089 executed / 4,088 passed / 1 failed**. Logs: `/tmp/web-home-focused.log`, `/tmp/web-home-shard-1.log`, `/tmp/web-home-shard-2.log`.

Existing tests deleted: none. Only authorised existing case renamed/updated:
- `appDownloadGateBadges.test.tsx`: “both badges are 46px tall in a wrapping centred row, with no Play coming soon” becomes 52px / left-aligned. Assertion `['46px','46px']` becomes `['52px','52px']`; `['flex','wrap','center','10px']` becomes `['flex','wrap','flex-start','10px']`. Reason: explicit homepage brief. File case count remains 4 before/after.
- Funnel and guest-stage files unchanged. No known historical tourIsland failure appeared in the executed shards.

## Preview and outstanding checks
- Latest observability entry at 10:11:18 UTC: `build OK`.
- Actual localhost homepage wait failed: `Locator.wait_for: Timeout 15000ms exceeded`, waiting for `.web-home h1`. Localhost is intentionally a preview-bypass hostname, so the public gate is not mounted by default. No bypass/native code was changed to force it.
- None and invite `document.documentElement.scrollWidth` at 1280 / 390 / 320: **unverified**. No claim of visual/mock parity or successful end-to-end course-search flow.
- Diagnostic screenshot only: `/tmp/browser/web-home/initial.png`; not a verified homepage screenshot.
- Production BootHold presence/duration and visible canvas transition: **unverified**. Source retains a bounded 2,000ms bridge wait on production web; this is not a production timing measurement. BootHold was untouched.
- Remaining: resolve the store-reader compatibility regression under a follow-up authorisation, finish separate shards 3/4 (and fresh required verification), run the public homepage in a web-gate context, inspect all requested widths/states and production launch.