# Photo-grid review scores Option B — stopped

## Changes
- `src/components/feed/ReviewPostCard.tsx`: uses `feedPhotoGridLayout(post.mediaItems ?? [])` for both shapes; excludes grid reviews from glass/fade/measurement; reuses the glass contents below media and before the footer. The grid course name is one-line ellipsis; region and card score row retain their shared values. Grid Played with uses `media`. Non-grid glass, header pills, body, CTA and footer paths remain unchanged. Module-local ownership documented in its header; no root architecture change.
- `src/components/feed/feedReviewGlass.css`: grid score block padding 12px 14px 2px, sides 16px at ≤340px.
- `src/test/reviewGridScores.test.tsx`: seven new cases, listed below.
- `roadmap.md` and this report/full log.

No SQL, migrations, feed_config, pool-cap, unrelated fonts or brand copy changed.

## Existing tests: no edits
`feedReviewGlass.test.tsx` has no grid fixture: its post has no mediaItems array. Consequently none of its ten cases qualifies for the brief's authorized expectation replacement. All ten pass unchanged. All 23 existing `reviewPlayedWith.test.tsx` cases pass unchanged. No existing cases deleted, renamed or rewritten; no existing assertion old → new changes.

## New cases: 0 → 7
1. `(a) wide-lead grid places course, region and card scores after media without glass`
2. `(b) upright-lead grid places course, region and card scores after media without glass`
3. `(c) single photo retains the glass score strip`
4. `(c) video retains the glass score strip`
5. `(c) three-photo carousel retains the glass score strip`
6. `(d) grid Played with chip uses the media offset`
7. `(e) grid with no course name and no scores has no grid score block`

Cases (a)/(b) assert media → scores → footer order, course/region, shared card row, absent glass/fade/custom-property, and course tap. Cases (c) preserve glass; (d) asserts `expect(container.querySelector('[data-testid="played-with-chip"]')).toHaveAttribute('data-pw-offset', 'media')`; (e) omits empty scores.

## Verification and stop
Command: `bunx vitest run src/test/reviewGridScores.test.tsx src/test/feedReviewGlass.test.tsx src/test/reviewPlayedWith.test.tsx`

**40 executed / 39 passed / 1 failed**, three files. New cases: 6 passed / 1 failed. Full output: `focused.log`.

Failure:
```text
FAIL src/test/reviewGridScores.test.tsx > photo-grid review scores > (d) grid Played with chip uses the media offset
TypeError: Cannot read properties of undefined (reading 'trim')
❯ map src/features/post-v2/lib/golfPostRules.ts:90:49
```
The new Played with fixture supplied `displayName`, but the existing interface requires `name`. It crashed before the offset assertion. Stopped without test reruns or shard runs.

The preview separately reported:
```text
src/test/reviewGridScores.test.tsx(24,108): error TS2353: Object literal may only specify known properties, and 'displayName' does not exist in type 'PlayedWithPerson'.
```
To comply with the required preview-error repair, corrected only this new fixture field: `displayName: 'Friend'` → `name: 'Friend'`. No test names or assertions changed. No test rerun after that correction; the test stop remains unverified pending authorization to continue.

| Shard command | Outcome |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run: focused failure stop |
| `bunx vitest run --shard=2/4` | Not run |
| `bunx vitest run --shard=3/4` | Not run |
| `bunx vitest run --shard=4/4` | Not run |

Expected full-suite inventory **9,355 → 9,362**, solely +7 new cases. Last complete verified pass **9,352**; intervening +3 `fullscreenStackAndUploadWhite.test.tsx` cases produced expected 9,355, but its previous four shard failures remain awaiting ruling. No complete passing total claimed here.

## Mock and device limitations
Requested below-photo content/geometry implemented; no intentional deviations on changed elements. Frozen header/body/CTA/likes/chip appearance remains the build's canonical presentation, not the mock's illustrative values. The shared score row is reused exactly as instructed rather than copying illustrative mock typography. Browser visual comparison, 320px overflow and real authenticated feed flow are unverified after the stop; external unmanaged Supabase prevents authenticated end-to-end checks. Reference HTML is not embedded in the app.