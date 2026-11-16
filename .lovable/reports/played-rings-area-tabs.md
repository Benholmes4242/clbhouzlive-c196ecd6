# BRIEF_PLAYED_RINGS_AND_AREA_TABS

Suite: `npx vitest run --shard=N/4` — 9,036 (2,238 / 2,235 / 2,241 / 2,322); baseline 9,024; +12 = new `src/test/playedRingsAreaTabs.test.tsx`. Failing: 2 (awaiting ruling).

## Failing, unchanged, awaiting ruling
- `coursesSectionSettled.test.tsx` "WhoPlaying is ready for a resolved signed-out viewer without rounds": `expect(screen.queryByTestId('held')).toBeNull()`. Guests now wait for the everyone-rounds read (the old section had no guest read). Its mock now routes the new usePlayedRounds hook (mock only, no assertion changed).
- `proVerification2B.test.tsx` "course members: verified-only labels with one batched screen read": `expect(proReadIds()?.sort()).toEqual([...ids].sort())`. Only the selected course's card renders now, so not every member is named; it still mocks the retired circle hook.

## Rulings / facts
- Home: `user_profiles.home_club_id` is deprecated and never written; used `primary_club_id` (useViewerHomeClubId).
- `golf_courses.country` stores the grouping "Britain & Ireland" / "Continental Europe" / "Rest of World" (per countryVocabulary.ts, not re-queried: no SQL). UK & Ireland = country 'Britain & Ireland'; per-country tabs key on sub_country.
- Label map: United States / United States of America → USA, United Arab Emirates → UAE, South Korea / Republic of Korea → Korea, Dominican Republic → Dominican Rep.; others as stored.
- Guests: get_recent_rounds returns 401 to signed-out visitors, so the section stays hidden for guests. Guest tab rules (UK & Ireland, Europe, then abroad) are coded and tested but unreachable today.
- Unchecked: signed-in device checks at 375/320 (no sign-in available).
