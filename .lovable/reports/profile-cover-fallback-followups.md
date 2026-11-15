# Profile cover fallback — two audit follow-ups

## Source changes (ProfileHero.tsx only, look unchanged)

1. **Legacy home clubs.** `useProfileClubs` returns the sentinel id
   `text-fallback` for a typed-in club name with no linked club. ProfileHero
   now passes `homeClub.id` to `useClubCoverPhoto` only when it matches a UUID
   regex (`UUID_RE`); otherwise it passes `null`, so those members fall
   through to the Top 10 photo or the contours and no non-uuid value ever
   reaches `golf_courses.club_id`.
2. **No photo swap while loading.** While the club photo read is in flight
   (valid club id, no own cover, `clubCover.isLoading`), the cover resolves to
   `null` so the band shows the contours instead of flashing the Top 10 photo
   first. A null read result still continues to the Top 10 photo as before.

## Test changes (src/test/profileCoverFallback.test.tsx)

- Three new cases: (a) a `text-fallback` home club never reaches the club
  photo read and falls through to the Top 10 photo; (b) while the club read is
  in flight the Top 10 photo is not shown (contours instead); (c) a club read
  returning null still shows the Top 10 photo.
- The `db` supabase mock gained a `hang` flag so a read can stay in flight
  (isLoading true) for case (b).
- `HOME` id changed from `club-1` to a real UUID so the pre-existing
  club-photo cases keep exercising the club read under the new UUID gate; no
  assertion in those cases changed.
- The existing "no club photo → Top 10" case now waits for the read to
  resolve before asserting the Top 10 image (the loading gate defers it); the
  assertion itself is unchanged.

No test deleted, renamed or rewritten. Files changed:
`src/components/profile/hero/ProfileHero.tsx`,
`src/test/profileCoverFallback.test.tsx`.

## Counts

Baseline 8,831 + 3 = 8,834 expected. Shards run one at a time:
2,243 / 2,146 / 2,217 / 2,228 = **8,834**, no failures or skips.
