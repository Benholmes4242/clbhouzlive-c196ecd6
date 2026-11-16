# BRIEF_PLAYED_RINGS_AND_AREA_TABS

Suite: `npx vitest run --shard=N/4` — see the totals line below; baseline 9,024.

## Authorised test rewrites (Ben: "rewrite them to the new behaviour, list every changed assertion")
- `src/test/coursesSectionSettled.test.tsx` "WhoPlaying is ready for a resolved signed-out viewer without rounds"
  - old: `expect(screen.queryByTestId('held')).toBeNull()` — a resolved signed-out viewer with no rounds settled was expected to be ready at once.
  - new (two tests, so +1): "WhoPlaying waits for the everyone-rounds read for a resolved signed-out viewer" asserts `expect(screen.getByTestId('held')).toBeVisible()`; "WhoPlaying is ready for a resolved signed-out viewer once the everyone-rounds read settles" sets `f.rounds.isFetched = true` and asserts `expect(screen.queryByTestId('held')).toBeNull()`.
  - why: the section now reads `get_recent_rounds` for guests too, so readiness waits for that read instead of resolving instantly with no rounds.
- `src/test/proVerification2B.test.tsx` "course members: verified-only labels with one batched screen read"
  - old: `expect(proReadIds()?.sort()).toEqual([...ids].sort())` — every one of the three fixture ids had to reach the batched pro read.
  - new: `expect(proReadIds()?.sort()).toEqual([...mountedIds(name)].sort())` where `mountedIds('course members')` is `ids.slice(0, 2)`, plus `expect(container.querySelectorAll('[data-played-ring]').length).toBeGreaterThan(0)`.
  - why: the section mounts only the selected course's card, whose name row shows two members ("and 1 more" is not a name), so the read covers exactly the mounted names. The retired `useCircleLatestRounds` fixture is now joined by a `usePlayedRounds` mock supplying the same rounds plus course geography.
  - the other 17 tests in that file are untouched, including the `ids`-wide read assertion in "mixed follow rail labels members but never businesses".

## Failing, unchanged, awaiting ruling
None. Both failures above were rewritten under Ben's ruling; no other test changed.

## Rulings / facts

- Home: `user_profiles.home_club_id` is deprecated and never written; used `primary_club_id` (useViewerHomeClubId).
- `golf_courses.country` stores the grouping "Britain & Ireland" / "Continental Europe" / "Rest of World" (per countryVocabulary.ts, not re-queried: no SQL). UK & Ireland = country 'Britain & Ireland'; per-country tabs key on sub_country.
- Label map: United States / United States of America → USA, United Arab Emirates → UAE, South Korea / Republic of Korea → Korea, Dominican Republic → Dominican Rep.; others as stored.
- Guests: get_recent_rounds returns 401 to signed-out visitors, so the section stays hidden for guests. Guest tab rules (UK & Ireland, Europe, then abroad) are coded and tested but unreachable today.
- Unchecked: signed-in device checks at 375/320 (no sign-in available).
