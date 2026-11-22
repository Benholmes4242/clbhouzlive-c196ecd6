# Canonical section heading — foundation and inventory

## Step 1 (built)
- `src/lib/tokens/type.ts`: SECTION_EYEBROW (11/700/0.16em/uppercase/lh 1), SECTION_TITLE (21/700/-0.035em/lh 1.05/fontSynthesis none), SECTION_TITLE_GAP = 5. Colourless.
- `src/index.css` `:root`: --section-eyebrow-size/-weight/-tracking, --section-title-size/-weight/-tracking/-leading.
- PlayedHead (`playedParts.tsx`) and SectionHead (`browse/SectionHead.tsx`) spread the tokens; PlayedHead keeps its px line-heights (11px, 22.05px = same computed value).
- Proof: `captures/heads_before_390.png` / `heads_after_390.png` — pixel diff bbox None; computed styles and boxes (`before.json`/`after.json`) identical.

## HELD — .t100b-kicker / .t100b-title repoint (stop: clause vs existing test)
Repointing these rules to `var(--section-*)` changes the CSS text that the existing assertions encode literally, which no brief authorises editing:
- `src/test/coursesSectionHeads.test.tsx:46` `expect(rule('.t100b-kicker')).toBe('font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;line-height:1;color:var(--t100b-ink)')`
- `src/test/coursesSectionHeads.test.tsx:47` `expect(rule('.t100b-title')).toBe('margin-top:5px;font-size:21px;font-weight:700;line-height:1.05;letter-spacing:-.035em;font-synthesis:none;color:var(--t100b-ink)')`
top100Compare.css is unchanged. Needs a ruling authorising those two expectations to read the var() forms; the new test's .t100b case follows then.

## Tests
Before 9,886 / 874 files. After 9,891 / 875 files (2,444 / 2,440 / 2,445 / 2,562), all passing.
+5 tests, +1 file = new `src/test/canonicalSectionHeading.test.tsx`: tokens carry the 52f015a values; index.css mirror; SectionHead/PlayedHead constants resolve to tokens; PlayedHead renders unchanged; SectionHead renders unchanged. No existing test changed. Logs in `logs/`.

## Inventory summary (headings = the five compared roles)
| Area | Headings | Differ | File |
|---|--:|--:|---|
| Courses (excl. tab) incl. Top 100, detail, reviews, media | 137 | 133 | courses.md (reference sheet at top) |
| Tour hub | 44 | 44 | tourhub.md |
| Clubhouse / feed / Explore / Watch / composer | 65 | 65 | clubhouse-explore.md |
| Profile / settings / auth / social / messaging | 151 | 151 | profile-social.md |
| Business / Insights / Admin | 129 | 129 | business-admin.md |
| **Total** | **526** | **522** | |
Lists (i) tile/body sizes, (ii) 320px wrap, (iii) celebration sheets are in each area file. Shared components (a) and weights above 700 (b) are in shared-heads-and-weights.md: **527 occurrences in 167 non-test files** (Tour hub 152, profile 60, courses 54, admin 51, business 45 …).
Source audit, not runtime measurement: inherited line-heights are noted as such.

## Proposed brief split
1. Shared heads: ui/SheetHeader (7 consumers), ui/SectionHeader (15), DiscoverSectionHeading (7), friend-sheet SheetHeader + Eyebrow, analytical tokens kicker/title, explore courseled tokens, tourhub SectionShell/OverviewSectionHead/tournament-v2 heads, search-v2 SearchSectionHeader, darkAtoms DarkSectionHeader, CourseEyebrow; plus .t100b repoint ruling.
2. Weights >700 sweep, one brief per area (Tour hub first: 152).
3. Photo kickers to white (overview hero, feed tour post, recap NEXT UP, OUR TOURNAMENT PICKS, other photo bands), LIVE green kept.
4. Per area pages, then that area's sheets: Courses detail → Tour hub → Clubhouse/Explore/Watch → Profile/Settings → Business/Insights → Admin.
5. Rulings needed: list (i) body/tile sizes, list (ii) wrapping sheet titles, list (iii) celebration sheets.
