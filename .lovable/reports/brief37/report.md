# Brief 37 — STOPPED at test gate (build complete)

Files: new `src/components/profile/sections/profileSectionTitles.tsx` (wording + ProfileSectionTitle); ClubsCard, JourneySummaryCard (profile-only head: SECTION_EYEBROW line-height 1 + title; shared Panel untouched), ProfileTourTab, ProfileRankingTab, LinkedProSections (eyebrow "How <first> plays"; owner/first props), ProSeasonSection, ProCollectionSections, ProAskSection (title hidden for the owner), ProProfileBuildOne (passes owner/first). New test `brief37ProfileSectionTitles.test.tsx` (5, pass).

Shards: 2,575 + 2,568 + 2,777 + 2,830 = 10,750 / 938 (baseline 10,745/937: +5/+1 = new file). 1 unexpected failure:
`src/test/proAskSection.test.tsx` "on with nothing shows the invitation card": `TestingLibraryElementError: Found multiple elements with the text: Ask Mason anything` — the new h3 title and the existing invitation card `<b>Ask Mason anything</b>` now both carry the text. Not edited.
Screenshots not taken (profile sign-in unavailable). No SQL/migrations; feed_config untouched; cap 30.
