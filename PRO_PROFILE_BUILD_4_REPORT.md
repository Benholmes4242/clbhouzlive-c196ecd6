# PRO PROFILE BUILD 4 — In the clubhouse, Only you see this, the sponsor sheet

## What shipped
- **View tracking**: `ProProfileBuildOne` tracks `pro_profile_viewed` once per mount (ref-guarded), visitors and guests, never the owner; `source: null` (the profile page has no visit source today).
- **IN THE CLUBHOUSE** (`ProClubhouseSection`): mutual faces for visitors (recent fallback), recent on his own view; 30px squircles, −8px overlap, 2px card-colour separation ring (not an avatar border); full visitor/owner copy matrix incl. singulars, club sentence and the 0-followers rules; face taps open that member's profile. Hidden until settled, on error, on null payload, and from visitors at 0 followers.
- **ONLY YOU SEE THIS** (`ProOnlyYouSection`): owner-only amber header, kit-gradient card, VIEWS / FOLLOWERS (+n green, else 0) / QUESTIONS tiles, "Views are counted from {d Mon}." while tracking is under 30 days (null start reads from today), white "Make my sponsor sheet".
- **Sponsor sheet** (`ProSponsorSheet`): BottomSheet with SPONSOR SHEET kicker, six block chips (all on by default, empty blocks omit their chip, choice persisted in localStorage under try/catch), the fixed 360px card scaled to the preview width (never above 1), and export of the off-screen full-size node at html2canvas scale 3 (1080px) — the TopTenShareSheet pipeline, with CORS blob URLs for cover/avatar. Card matches the mock: cover top band, identity with ProLabel, rank row (muted-worse movement, Career best, BEST FINISH fallback, omitted with no rank and no events), 5 season tiles identical to the Season section, 4 latest results (MC/WD/DQ dim), first 4 career entries (gold ring for wins), ON CLBHOUZ reach tiles, partners joined " · ", bag grouped by brand in bag order, QR (qrcode package, SVG-safe PNG data URL) encoding https://clbhouz.co.uk/profile/{username}, and both source-line variants. Save downloads `{first}-{last}-sponsor-sheet.png`; Share uses the native sheet with the PNG + text, falling back to Save; both busy-state and toast on failure.
- `types.ts`: no change needed — `get_pro_clubhouse` and `get_pro_reach` were already present.

## Files added
- `src/features/pro-profile/proClubhouseRules.ts` (parsers, copy, bagLine, source/tracking lines)
- `src/features/pro-profile/useProClubhouse.ts` (`['pro-profile','clubhouse',proId]`, `['pro-profile','reach']`)
- `src/features/pro-profile/ProClubhouseSection.tsx`
- `src/features/pro-profile/ProOnlyYouSection.tsx`
- `src/features/pro-profile/ProSponsorSheet.tsx`
- `src/test/proClubhouseSponsor.test.tsx` (39 tests)

## Files changed
- `src/features/pro-profile/ProProfileBuildOne.tsx` — view tracking, `username?` prop, mounts the two sections after ASK, computes `sponsorSeason`
- `src/pages/ProfilePageV2.tsx` — passes `username={username}`
- `src/features/pro-profile/pro-profile.css` — build-4 styles appended
- `package.json` / lockfile — added `qrcode` + `@types/qrcode`

## Tests
- Added: 39 (new file, listed above). Existing tests changed: **none**. Deleted: none.
- Focused: 39/39 pass.
- Shards: 1) 1,892/1,892 · 2) 1,818 pass + 1 known failure · 3) 1,882/1,882 · 4) 1,798/1,798. Total 7,391 tests / 645 files.
- Known failure (separate FM1_MUTE_1 work, untouched): `fw1FeaturedDeck.test.tsx › reserves no right padding on the meta line`.
- Note: shard 1's first run showed a single failure whose name was not captured (tail-only output); two immediate full reruns passed 1,892/1,892 with zero failures. Treated as a one-off flake; logs at /tmp/shard1.log.
- Build: OK (build-errors.log, 18:15:17Z).

## Not verified
- Live member-device render at 320px/390px and the real `get_pro_clubhouse` / `get_pro_reach` reads (auth is externally managed; no session available in the sandbox).
- Real html2canvas PNG output on device (export path is mocked in tests).
