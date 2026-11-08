# Hole tiles — prerequisite stop

The uploaded brief says: “Run this after the leaderboard brief (no faces, hole tiles) and the round-opacity fix.” Neither prerequisite is present in this checkout, so the dependent extension has not been implemented.

## Exact source evidence

- `src/features/tourhub/leaderboard/BoardRound.tsx:21–26` exports `HoleStrip`, not numbered `HoleTiles`, and renders `<i>` elements without stroke numbers.
- `src/features/tourhub/leaderboard/leaderboard.css:29–31` sets that strip to `height:4px`, `gap:1.5px`, and a `3px` separator, rather than the required numbered16px tiles.
- `src/features/tourhub/leaderboard/BoardTable.tsx:729` still renders `<SquircleAvatar size={30} ...>` in player rows.
- `src/features/tourhub/overview/sections/AlsoWeekEvent.tsx:32` still renders `<Avatar player={e.player} tour={tour}/>` in WeekBoard rows, contradicting the assumed completed no-faces prerequisite.
- `src/features/tourhub/leaderboard/BoardTable.tsx:753` still says `opacity: settled ? 0.55 : 1`, despite the adjacent comment saying “no opacity drop.”
- `src/features/tourhub/tournament-v2/sections/MiniBoard.tsx:283–287,438–463` still selects live TODAY/SHAPE columns and a leading face, rather than the brief's assumed unchanged position/name/round-columns/total first line. Applying the attached first line would therefore silently implement omitted earlier work.

## Changes and checks

Only the pending task in `roadmap.md` and project requirements memory were recorded; this report was added. No production files, tests, SQL, migrations, server functions, native files, or configuration were changed.

No test was added, removed, renamed, rewritten or run. Last reported full-suite baseline remains7728 executed (7722passed,6failed in `profileFeedInViewGate.test.tsx` from PF4); test inventory delta for this task is0. No shard or320/390/430 app verification was run for this unimplemented extension.

## Required next input

Supply the preceding leaderboard no-faces/numbered-hole-tiles brief and round-opacity fix brief, or confirm that those completed changes should be available in this checkout before this extension runs. Their scope and authorization must not be inferred from this dependent brief.