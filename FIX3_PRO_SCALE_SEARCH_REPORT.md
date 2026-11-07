# FIX3 — Pro profile scale, search order, IN ACTION fallbacks

## Files changed
- `src/features/pro-profile/pro-profile.css` — every pro section below the hero brought to the golfer scale (HeroHandicapDisplay): section padding 26→18px top; heading margin 12→8, h2 10.5px/800→9px/700 (0.16em kept); source 10.5→10px; season tiles gap 6, padding 8px 5px 7px, b 16px/700, span 7px/700 0.10em (outline, centring, gold-on-1st kept); result rows padding 10px 2px, finish 40px 13px/800, eliminated 11.5px, event b 13px/700, small 11px, score b 13.5px (gross 13px), chevron 14px, see-all 12px; career year 9px/0.14em, text 12.5px/600/1.4, small 10.5px, item padding-bottom 12px; bag slot 9px, main b 12.5px, small 11px, row padding 9px 0; partners tile 64px, name 11px; Ask card b 14.5→12.5, small 12→11.5, question b 13.5→12.5, answer p 13→11.5, door/waiting 12→11.5, kicker 10→9; generic mapping applied to live-card kicker (11→9), add-row b (14→12.5) and small (12→11), career-win b (14→12.5) and small (11.5→11), clubhouse supporter line (13→12.5). No colour, order or content changes. Hero, sheets, sponsor sheet and the owner kit card untouched.
- `src/features/search-v2/SearchOverlayV2.tsx` — All scope order is now People, Clubs, Courses, Players, Videos, Posts. Scope chips and single-scope views unchanged.
- `src/features/search-v2/components/SearchEmptyState.tsx` — IN ACTION rail `PlayerInitialAvatar` now passes `color={{ bg: A.TRACK, fg: A.MUTE }}` and `ringColor={A.BORDER}` (analytical tokens aliased as `ANALYTICAL` because `A` is already imported from `../lib/tokens`), matching the Players rows' ResultTile plate/border/initials. 64px size, 34% radius and photo path unchanged.

## Tests
- New `src/test/proProfileScale.test.tsx` (6 tests): section/heading scale, season tile 16px figures + 7px labels, result-row sizes, career 12.5px text, bag/partners, Ask mapping.
- New `src/test/searchOrderAndFallback.test.tsx` (2 tests): All scope renders People, Clubs, Courses, Players, Videos, Posts; IN ACTION rail fallback uses the same A.TRACK background, A.MUTE initials and A.BORDER ring as PlayerRow's ResultTile fallback.
- Updated assertions (old → new), both in `src/test/proProfileSeason.test.tsx:18-19`:
  - season tile padding `12px 4px` → `8px 5px 7px`;
  - span rule `.pro-season-tiles .pro-profile-tile span { line-height:1.3; }` → `{ line-height:1.3; margin-top:4px; font-size:7px; font-weight:700; letter-spacing:.1em; }`.
- No tests deleted. Focused run: 18/18 passed.

## Shards (fresh, --maxWorkers=2)
- Shard 1: 1,989 / 168 files
- Shard 2: 1,840 / 168
- Shard 3: 1,952 / 168
- Shard 4: 1,897 / 168
- Total: 7,678 tests / 672 files, zero failures. The permitted FW1 meta-line failure did not recur. These shards also cover the carried-over ALL_HEROES_MATCH verification. Build: OK.

## 320px checks
Not run this turn (time). Outstanding: pro profile (season, results, career, bag, partners, Ask), Tour tab rows, search overlay — plus the carried-over ALL_HEROES_MATCH 320px checks. Long event names already ellipsis via `.pro-profile-event b` (nowrap/hidden/ellipsis, retained).

## Judgment calls (reported, not silently adopted)
- The brief's generic "figure 16px" mapping was not applied to the live-card headline figures (`.pro-profile-live-position strong` 40px, `.pro-profile-live-score b` 24px) or the live card's 18px event title — those read as feature-card headlines, not tile figures. Flagging for a ruling if Ben wants them scaled too.
- Ask sheet, collection sheets and sponsor sheet typography left unchanged (sheets are not "sections below the hero").
