# Canonical heading — brief 1: shared heading components

## Changed (all read src/lib/tokens/type.ts or the --section-* variables)
| Component | Before | After |
|---|---|---|
| ui/SectionHeader | eyebrow 11/700/.14em, amber (prime) / muted / tone / accent; title prime 26, section 20 (-0.02em, 1.15), rail 19 (-0.01em) | SECTION_EYEBROW + SECTION_TITLE in A.INK for every role/tone/accent/surface; props kept, documented as no longer colouring; eyebrow→title gap = SECTION_TITLE_GAP |
| darkAtoms DarkSectionHeader | via SectionHeader dark (--hcp-t-*) | follows SectionHeader, ink #F8FAFC |
| ui/SheetHeader | eyebrow KICKER 9/.19em, title TITLE 17/-0.032em/1.15; light variant slate #0F172A | SECTION_EYEBROW + SECTION_TITLE, ink #F8FAFC both variants; padding 8→10px top, once, here only |
| ui/sheet SheetTitle | text-lg font-semibold (18/600) | --section-title-* variables, ink |
| friend-sheet SheetHeader | TITLE 17 | SECTION_TITLE |
| friend-sheet Eyebrow | 10.5, muted T60 | SECTION_EYEBROW, ink |
| DiscoverSectionHeading | 16/-0.01em/1.2 | SECTION_TITLE |
| courseled tokens EYEBROW_TEXT / SECTION_TITLE | DISCOVER_QUIET; title 17/-0.02em/1.2 | canon, ink (KICKER, LABEL, others untouched) |
| OverviewSectionHead | 20/800/0/1.2 | SECTION_TITLE |
| SectionShell | KICKER, eyebrowColor or muted | SECTION_EYEBROW in ink; eyebrowColor ignored |
| SectionEyebrow | KICKER | + lineHeight 1; CJK rule kept |
| .tv-head h2 / aside / link | 11/800 no LH; aside 10.5/800; link 800 | eyebrow vars + uppercase + LH 1 + --tv-ink; aside 700 (size, muted kept); head link 700 |
| SearchSectionHeader | KICKER .19em, inherited LH | SECTION_EYEBROW |
| CourseEyebrow | 11.5 / 1.2 | SECTION_EYEBROW; on-photo white kept |
| .t100b-kicker / .t100b-title | literal values | --section-* variables (rendered values unchanged) |
| watch/proshop/Kicker.tsx | 0 consumers | deleted |

Not touched (step 2): analytical KICKER/TITLE/LABEL, type.ts KICKER/TITLE, courseled KICKER/LABEL, news story kickers, business/insights kickers.

## SheetTitle consumers overriding the default (listed, not changed)
- components/profile/courses/BreakdownsPickerSheet.tsx:140 — inline fontSize 19.
- features/amateur-ranking/WagrLinkSheet.tsx:51 and SettingsWagrCard.tsx — `.wagr-heading` 22/700/-0.02em (wagr-settings.css:15).
- features/review-v2/components/ReviewHoleTags.tsx:127 — `.hole-photo-fast-title` 16/700/1.2 (hole-photo-fast.css:5).
- components/courses/course-detail/CourseWebsiteSheet.tsx:328 — sr-only (no visual).

## Wrapping (step 3)
21px titles wrap to two lines, no ellipsis: SectionHeader, SheetHeader, SheetTitle, friend name, OverviewSectionHead. Long SheetHeader title at 320 wraps to 2 lines (captures/after_b_320.png); SheetTitle "Choose a breakdown for your courses" 44px = 2 lines at 320 (after.json c_320).
Nowrap + ellipsis by design, kept: DiscoverSectionHeading default (opt-in `wrap` prop) — "The courses members played this week" ellipsises at 320.

## Skeletons (step 4)
- Discover EyebrowBar shells: eyebrow row has minHeight 20, unchanged → no jump.
- OverviewSectionHead row minHeight 28 holds the 22.05px title → height unchanged.
- tourhub SectionHeaderSkeleton has 0 consumers.
- No sheet-header or ui/SectionHeader shells found by name. Not verified: unnamed per-page shells of SectionHeader/DiscoverSectionHeading consumers (title heights moved 29.9→22.05, 23→22.05, 19.2→22.05).

## Weights (step 5)
Every heading touched ends at 700. Remaining 800s in touched tournamentPage.css are non-heading (tile small/b, chart labels) — left for the weights brief.

## Verification
Harness (actual components, real app styles) at 390/320 before/after: captures/{before,after}_{a,b,c}_{390,320}.png + computed styles in before.json/after.json. Real consumer: /tourhub (guest, live data) before/after at 390/320 — Also this week / Coming up (OverviewSectionHead) now 21/700. No horizontal overflow anywhere (scrollWidth = viewport).
Not captured on real screens (need sign-in or specific data): handicap DarkSectionHeader, messaging/report/circle sheets, friend sheet, search overlay, tournament page, Discover tabs, Breakdowns/WAGR sheets.
Visible shifts beyond the heading change: SheetHeader light variant (TourPickerSheet) — title/eyebrow were slate on the dark sheet (invisible) and are now ink; its close button keeps the light-variant colours and is still near-invisible. DarkSectionHeader with a right meta now wraps "How your index moved" to two lines at 320. SectionHeader eyebrow line box 16.5→11px tightens the eyebrow-to-title space.

## Tests
Before 9,891 / 875. After 9,920 / 876 (2,444 / 2,454 / 2,459 / 2,563), all passing.
+29: new file src/test/canonicalSharedHeads.test.tsx (28 tests: SectionHeader 10 role×tone/accent/surface + rail, DarkSectionHeader, SheetHeader ×2, SheetTitle, friend SheetHeader, friend Eyebrow, DiscoverSectionHeading, courseled exports, OverviewSectionHead, SectionShell ×3, SectionEyebrow, .tv-head CSS, SearchSectionHeader, CourseEyebrow, proshop Kicker deleted); +1 in canonicalSectionHeading.test.tsx (".t100b-kicker / .t100b-title read the --section-* variables").
Changed assertions (authorised, step 0), src/test/coursesSectionHeads.test.tsx:
- :46 old `'font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;line-height:1;color:var(--t100b-ink)'` → new `'font-size:var(--section-eyebrow-size);font-weight:var(--section-eyebrow-weight);letter-spacing:var(--section-eyebrow-tracking);text-transform:uppercase;line-height:1;color:var(--t100b-ink)'`
- :47 old `'margin-top:5px;font-size:21px;font-weight:700;line-height:1.05;letter-spacing:-.035em;font-synthesis:none;color:var(--t100b-ink)'` → new `'margin-top:5px;font-size:var(--section-title-size);font-weight:var(--section-title-weight);line-height:var(--section-title-leading);letter-spacing:var(--section-title-tracking);font-synthesis:none;color:var(--t100b-ink)'`
No other existing test pinned the old metrics (84 related test files, 1,210 tests, passed unchanged).
