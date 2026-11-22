# Canonical heading — Brief 1 follow-ups (from 83941fa)

## Changes
1. Switch tour close: `SheetHeader` gains opt-in `darkClose` (dark disc #272C37, glyph rgba(255,255,255,0.96), same 30×30 button, X 15/2.4). `TourPickerSheet` passes it. Border, title, eyebrow unchanged (the `dark` prop was not used because it also changes border/sub colours).
2. Sheet titles: new `.canon-sheet-title` (reads `--section-title-*`, wraps, never ellipsises) and `.canon-sheet-eyebrow` (`--section-eyebrow-*`) in `src/index.css`, triple-class specificity over feature CSS. Applied to Breakdowns picker title (inline 19/800/caps removed; A.INK kept), WAGR link sheet title + kicker, WAGR unlink title, "Which hole is this?" (ReviewHoleTags only; HolePhotoFastPaths' shared `.hole-photo-fast-title` dialog is untouched). Title colour stays each surface's ink.
3. ui/SectionHeader (and DarkSectionHeader through it): title rows with a right slot use `align-items:flex-end`; title is `flex:1; min-width:0`; the slot is wrapped in a strut with the title's 21px/1.05 line box, so its text sits on the title's last line. Covers prime/section meta+action and rail action.
4. Shell audit — see below.

## Tests
Before 9,920 / 876 files (83941fa). After 9,929 / 877: 2,447 / 2,474 / 2,457 / 2,551. Delta +9 = new `src/test/canonicalHeadingFollowups.test.tsx` (3 slot-alignment, 1 CSS rule, 4 sheet-title files, 1 darkClose). No existing test changed. Logs in `logs/`.

## Verification (harness: real components and app CSS, sheets rendered with the real classes; not the full sheet components with live data)
- Switch tour close 390/320: bg rgb(39,44,55), glyph 0.96 white, 30×30.
- Breakdowns, WAGR link, WAGR unlink, Which hole: 21px/700/-0.735px/22.05px, white-space normal, no clip, no page overflow at 390 and 320 (all one line at 320 with these strings).
- "How your index moved": 1 line at 390, 2 lines at 320 for both SectionHeader and DarkSectionHeader; slot bottom = last line bottom (±0.05px); no overlap (12px gap).
- Overlays: `shells_390/320.png`.

## Shell audit (item 4)
| Shell | Models | Result |
|---|---|---|
| src/components/courses/browse/sectionShells.tsx:45 HeadShell | Courses SectionHead | Already token-driven (11 + 5 + 22.05 = 38.05); overlay matches loaded title (top 36, h 22.05). No change. |
| src/components/courses/browse/sectionShells.tsx:82-83 played head | PLAYED_KICKER/PLAYED_TITLE | Token-driven; no change. |
| src/components/courses/top100/top100Shells.tsx:31 Head, :49 YourHundredShell | Top 100 heads | Token-driven; no change. |
| src/components/skeletons/shellVocabulary.tsx:29 EyebrowBar (used DiscoverSectionShells.tsx:31/73/120/137) | courseled Eyebrow | Eyebrow row fixed minHeight 20, 11px eyebrow fits: unaffected by new metrics. Pre-existing drift found: subline row 19 vs loaded 3 + 16.8 = 19.8 (loaded head 39.8 vs shell 39). Not changed — not a heading-metric change; awaiting ruling. |
| src/features/tourhub/components/skeletons.tsx:72 SectionHeaderSkeleton | — | No consumers. No change. |
No other page- or sheet-level skeleton found that reserves space specifically for ui/SectionHeader, DarkSectionHeader, ui/SheetHeader, SheetTitle, friend-sheet header, DiscoverSectionHeading or OverviewSectionHead; generic page skeletons (Handicap, Tournament, Profile etc.) use approximate bars not tied to those headings. This audit was a code search, not an exhaustive visual check of every loading state.
