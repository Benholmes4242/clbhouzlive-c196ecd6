# Golf Travel category

## Implementation

- Canonical `Golf Travel` option with Plane icon and `Golf trips, tours and packages` subtitle, immediately after Hotel / Accommodation. The derived BusinessCategoryValue union includes it.
- Around golf picker: `Golf travel` directly after Hotel / Stay (canonical Hotel / Accommodation), expanding this group from seven to eight tiles. Existing tile geometry and flow unchanged.
- Shared hero category word: `Golf travel`; booking action: `Plan a trip`.
- Exactly seven facilities: Tailor-made trips, Group trips, Tee time booking, Accommodation, Airport transfers, Club hire, Flights.
- Bookable category membership added. VENUE_CATEGORIES, NEARBY_CATEGORIES and HOSPITALITY_CATEGORIES unchanged and exclude travel.
- Two new hero keys have English values in every locale.
- MasterGolf Travel's stored category was not changed; no SQL, migration, deployed function, guest/native change, feed_config change or round_pool_cap change.

## Every changed file

1. `src/constants/businessCategories.ts`
2. `src/features/business-create/createRules.ts`
3. `src/lib/business/businessHero.ts`
4. `src/components/business/editor/editorTypes.ts`
5. `src/components/business/home/doNext.ts`
6. `public/locales/en/common.json`
7. `public/locales/en-XA/common.json`
8. `public/locales/de/common.json`
9. `public/locales/es/common.json`
10. `public/locales/ja/common.json`
11. `public/locales/ko/common.json`
12. `src/test/golfTravelCategory.test.ts` — new, eight cases.
13. `roadmap.md`
14. `GOLF_TRAVEL_CATEGORY_REPORT.md`

## Category sweep

Extra production files requiring edits: **none**. Additional relevant readers found:

- `src/pages/BusinessDirectoryPage.tsx`: filters already map BUSINESS_CATEGORIES; travel appears automatically.
- `src/features/admin/components/AdminVerifiedCard.tsx`: labels already resolve through BUSINESS_CATEGORIES_WITH_ICONS.
- `src/pages/BusinessCreate.tsx`: renders CREATE_CATEGORY_GROUPS; no separate category list.
- `src/components/business/BusinessYouCard.tsx`, `src/components/business/BusinessNearbyCourses.tsx`, `src/hooks/useBusinessNearbyCounts.ts`: retain canonical nearby eligibility and exclude travel.
- `src/hooks/useNearbyBusinesses.ts`: hospitality-only category list deliberately unchanged.

Other category matches were unrelated review/achievement/news/support categories, not business-category labels. No separate business analytics label map needing a change was found.

## Tests and stop

No existing test was edited, deleted, renamed or rewritten. New `golfTravelCategory.test.ts` adds eight cases covering registration/icon, placement/group size, hero word, booking action, nearby exclusion, seven facilities, booking membership and venue exclusion.

Last verified full suite: **8,173**. Prior homepage work added 23 cases, giving pre-task inventory **8,196** (not verified passing). This task adds eight, giving expected after inventory **8,204**, not verified as a complete run.

Commands actually run:

| Command | Result |
| --- | --- |
| `npx vitest run src/test/golfTravelCategory.test.ts src/test/bc1BusinessCreate.test.tsx src/test/cb112BusinessHero.test.tsx --maxWorkers=2` | 57 passed, 3 files |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,133 passed, 183 files |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 1,956 passed, 1 failed, 1,957 executed, 183 files |
| Shard 3/4 | Not run: stop rule |
| Shard 4/4 | Not run: stop rule |

Full-suite shards executed sequentially. Partial full-suite execution: **4,090 tests, 4,089 passed / 1 failed**; focused results are separate, not added to this total.

Existing homepage failure reproduced unchanged:

```text
FAIL src/lib/storeLinks.test.ts > fetchStoreLinks > parses string and { url } values and drops a non-https value
AssertionError: expected { …(3) } to deeply equal { …(2) }

Expected: { appStore: "https://apps.apple.com/app/clbhouz", play: "https://play.google.com/store/apps/details?id=clbhouz" }
Received: same fields plus business: null

❯ src/lib/storeLinks.test.ts:45:37
45| expect(await fetchStoreLinks()).toEqual(links);
```

Stopped without repairing the unrelated source or changing its test.

## 320px picker verification

Actual browser visit to `http://localhost:8080/business/create` at 320×970 redirected to `/auth`; `.bizc-tiles` timed out after 20 seconds. The project reports `external_unmanaged`; authenticated end-to-end checks are unavailable here. No session was minted and no sign-in or gate code was changed.

The requested picker screenshot and `scrollWidth === clientWidth` measurement are **unverified**. The existing grid uses `repeat(2,minmax(0,1fr))` and tile `min-width:0`, unchanged; this source inspection is not claimed as visual proof.

Latest observed compilation: `build OK` at 2026-11-11T10:32:20Z.