# FIX + VERIFY — deployment complete, verification stopped

## Deployment and routing

`process-push-queue` deployment succeeded via `supabase.deploy_edge_functions({ function_names: ["process-push-queue"] })`.

Submitted source SHA-256: `96819bead9e5cab4e6e2f2454846b4b3aa8a8a69fb1db31256db2dc59e560595`.

Only production edit: `supabase/functions/_shared/notifRoute.ts:211`.

```ts
// Old
if (type === 'mention_post' || type === 'tag' || type === 'comment_mention') {
// New
if (type === 'mention_post' || type === 'video_credit' || type === 'tag' || type === 'comment_mention') {
```

`ROUND_REACTION_TYPES`, client routing, function entrypoint/configuration and the existing parity tests are unchanged. This deployment confirmation does not establish a real device push delivery/tap.

## Exactly authorized test repairs

1. `src/test/profileCoursesRecord.test.tsx:76`, “unplottable courses keep unmapped text without a map key and country bars use neutral fill”:

```ts
// Old
expect(fill?.style.background).toBe('var(--course-country-bar)');
// New
expect(fill?.getAttribute('style')).toContain('var(--course-country-bar)');
```

Reason: apply the brief's exact inline-style assertion instead of reading jsdom's background property. The opacity assertion is unchanged. **The approved replacement still fails in this environment; no further repair attempted.**

2. `src/test/tourOverviewScorecardTap.test.tsx:54`, “pick-style movers have direction-only arrows and independent white place counts”:

```ts
// Old
expect((card.firstElementChild as HTMLElement).style.width).toBe('28px');
// New
expect(card.querySelector('[style*="width: 28px"]')).not.toBeNull();
```

Reason: find the sized avatar within its wrapper, as authorized. Passed. No other line in either test file changed. No existing case renamed, deleted or rewritten beyond these two explicit assertions.

Three new route rules in `src/test/videoCreditPushRoute.test.ts`:
- “opens the credited video post from post_id without an entity fallback” asserts `/post/credited-video` with no entity fallback available.
- “uses the post entity when post_id is absent” asserts `/post/entity-video`.
- “does not classify a video credit as a round reaction” asserts `/post/credited-video` even with round markers and a score id.

All three passed. The unchanged parity file passed **85/85**.

## Focused result and mandatory stop

Command:

`bunx vitest run src/test/proProfileSeason.test.tsx src/test/profileCoursesRecord.test.tsx src/test/tourOverviewMergedAiry.test.tsx src/test/tourOverviewScorecardTap.test.tsx src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts src/test/videoCreditPushRoute.test.ts --maxWorkers=2`

| File | Passed | Failed |
|---|---:|---:|
| proProfileSeason.test.tsx | 7 | 0 |
| profileCoursesRecord.test.tsx | 7 | 1 |
| tourOverviewMergedAiry.test.tsx | 16 | 0 |
| tourOverviewScorecardTap.test.tsx | 5 | 0 |
| notifRoute.parity.test.ts | 85 | 0 |
| videoCreditPushRoute.test.ts | 3 | 0 |
| **Total** | **123** | **1** |

The requested four presentation files alone: **35 passed + 1 failed = 36 tests / 4 files**. Combined focused scope: **123 passed + 1 failed = 124 / 6 files**.

Exact surviving failure:

```text
FAIL src/test/profileCoursesRecord.test.tsx
profile courses record > unplottable courses keep unmapped text without a map key and country bars use neutral fill
src/test/profileCoursesRecord.test.tsx:76:41
AssertionError: expected 'display: block; height: 100%; width: …' to contain 'var(--course-country-bar)'

Expected: "var(--course-country-bar)"
Received: "display: block; height: 100%; width: 100%; border-radius: 3px;"
```

This is not the permitted-known FW1 meta-line failure. Stop preserved; no alternative assertion, product workaround, test exclusion or failing test repair was attempted. Full output: `/tmp/fix-verify/focused.log`. Non-failing missing-RPC mock warnings from the existing profile course fixture remain unchanged.

## Full-suite counts

Last reported inventory before this request: **7,505 tests / 656 files**, expected inventory from the preceding PF3A close-out, not a green suite. This request adds exactly three route tests in one new file: **7,508 / 657 expected**. No deletions or other case-count changes. The prior Pro tiles-only expected 7,496/655 gained nine PF3A mounted cases/one file before this request.

| Requested fresh command | Passed | Failed | Result |
|---|---:|---:|---|
| `bunx vitest run --maxWorkers=2 --shard=1/4` | — | — | Not run: focused stop |
| `bunx vitest run --maxWorkers=2 --shard=2/4` | — | — | Not run: focused stop |
| `bunx vitest run --maxWorkers=2 --shard=3/4` | — | — | Not run: focused stop |
| `bunx vitest run --maxWorkers=2 --shard=4/4` | — | — | Not run: focused stop |

No carried counts are represented as fresh shards. Only `fw1FeaturedDeck` “reserves no right padding on the meta line” may be known in this request; it was not executed in the focused scope. Earlier PF3A credits/thanks failures remain untouched and are not reclassified as allowed-known here.

## Each 320px check

| Check | Result |
|---|---|
| Upcoming LAST YEAR board with a long name | Not run after mandatory focused stop; horizontal overflow unverified |
| Archive Global → Top 100, Global retained and empty state | Not run after mandatory focused stop; horizontal overflow unverified |
| Pro season tiles and open results | Not run after mandatory focused stop; horizontal overflow unverified |
| Course legacy tiles and courses chart | Not run after mandatory focused stop; horizontal overflow unverified |
| Overview Biggest movers band | Not run after mandatory focused stop; horizontal overflow unverified |

Authenticated hosted checks are unavailable on this external unmanaged Supabase connection; no guest session was minted or held. Fixture-based component checks would not establish real member-route/live-data behavior.

## Changed files and protected scope

Changed: shared push router, the two authorized test assertions, new three-case routing test file, `roadmap.md`, `PRO_TILES_LEGACY_MOVERS_REPORT.md`, and this report. No SQL, migrations/migration files, feed_config, pool-cap, native/Median config, guest browsing, review wizard, news or round-plot changes. Only the explicitly authorized `process-push-queue` deployment occurred; no RPC changes.