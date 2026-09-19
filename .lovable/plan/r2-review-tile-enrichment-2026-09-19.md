# R2 review tile enrichment

## Implementation
- Replace the static review rating label with the existing `getScoreTier(rating).label`; leave the numeric rating and all other card types unchanged.
- Add a page-level review-enrichment hook keyed by a stable sorted review-ID set. Fetch the four rating sub-scores and image-only review media in one nested Supabase query, then return a map of breakdowns and photo counts.
- Reuse cached results for IDs already resolved, querying only newly loaded IDs as additional stream pages appear.
- Merge enrichment into review stream items after ordering, preserving the server stream as the sole authority for order and identity.
- Add a fixed-height review metadata lane so delayed enrichment cannot move the course line, quote, or byline. Show photo copy only above one image and “Strongest on …” only for a unique category leader ahead by at least 0.5 with all four scores present.

## Verification
- Add focused tests for tier labels, image-only counts, the 0.5 strongest-category rule, missing/tied scores, and reserved-space behavior.
- Run the relevant test files and the TypeScript check.
- Verify the review card before and after enrichment at mobile widths, where authentication permits.

## Expected data cost
- One enrichment round trip for each newly loaded stream page containing review IDs. A full scroll through five pages therefore costs at most five enrichment round trips, while pages without reviews cost none and previously cached ID sets are not fetched again.
