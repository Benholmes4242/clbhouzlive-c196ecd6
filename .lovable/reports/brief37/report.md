# Brief 37 — STOPPED at test gate (build complete)

Files: new `src/components/profile/sections/profileSectionTitles.tsx` (wording + ProfileSectionTitle); ClubsCard, JourneySummaryCard (profile-only head: SECTION_EYEBROW line-height 1 + title; shared Panel untouched), ProfileTourTab, ProfileRankingTab, LinkedProSections (eyebrow "How <first> plays"; owner/first props), ProSeasonSection, ProCollectionSections, ProAskSection (title hidden for the owner), ProProfileBuildOne (passes owner/first). New test `brief37ProfileSectionTitles.test.tsx` (5, pass).

Shards: 2,575 + 2,568 + 2,777 + 2,830 = 10,750 / 938 (baseline 10,745/937: +5/+1 = new file). 1 unexpected failure:
`src/test/proAskSection.test.tsx` "on with nothing shows the invitation card": `TestingLibraryElementError: Found multiple elements with the text: Ask Mason anything` — the new h3 title and the existing invitation card `<b>Ask Mason anything</b>` now both carry the text. Not edited.
Screenshots not taken (profile sign-in unavailable). No SQL/migrations; feed_config untouched; cap 30.

## Resolution (Option 3, Ben's ruling)

The section title "Ask <first name> anything" stays. The invitation card's
heading changed from "Ask {first} anything" to "Be the first to ask"; the rest
of the card (the "Practice, kit, life on tour. His answers show here." line and
the Ask button) is unchanged.

Test changed — src/test/proAskSection.test.tsx, "on with nothing shows the
invitation card":
- old: `expect(await screen.findByText('Ask Mason anything')).toBeTruthy();`
- new: `expect(await screen.findByText('Be the first to ask')).toBeTruthy();`
  plus `expect(screen.getAllByText('Ask Mason anything')).toHaveLength(1);`
  so the section title is asserted to appear exactly once.
No other test or assertion was touched.

## Four sequential shards (post-fix)

Shard 1: 2575 tests / 235 files. Shard 2: 2568 / 235. Shard 3: 2777 / 235.
Shard 4: 2830 / 233. Total 10,750 tests / 938 files, zero failures — identical
to the Brief 37 baseline (10,750 / 938); no count delta.
