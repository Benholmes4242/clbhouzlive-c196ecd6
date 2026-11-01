# TOUR NEWS PAGE, REBUILT — Report

Scope: the Tour News page only, per the signed-off brief and `news-page-signed-off.html`. StoryPage and the overview News section are untouched; `StoryLeaderboardStrip` remains for StoryPage.

## What changed

- `src/features/tourhub/news/NewsTab.tsx` — rewritten page: "Tour News" head with circular search button, shared new-since-last-visit line, 440px lead hero (everything at the bottom), still event card, Your players, Top stories, By-event chips, grouped archive (This week / Last week / month / month+year) with weekday date blocks and "✓ Read" styling, server-side search with debounce, underlined matches and Cancel. Legacy `LeadStory`/`StoryRow` exports kept for existing importers.
- `src/features/tourhub/news/newsPageRules.ts` (new) — pure rules: archive grouping/date labels, Your players selection, Top stories assignment, event chips, search highlighting, margin words, event-start formatting.
- `src/features/tourhub/news/newsPageData.ts` (new) — one-read event-name hook, gated event leaderboard query, debounced server story search (250 ms, 2+ chars, 50 results) using the shared projection.
- `src/features/tourhub/news/NewsEventCard.tsx` (new) — event card on `deriveHeroState`: start countdown with "field not out yet", live top-three with amber followed players, winner/playoff result. Never a marquee.
- `src/features/tourhub/news/useTourStories.ts` — exported `STORY_COLS`/`toStory` so search shares the projection/parser.
- `src/features/tourhub/overview/sections/overviewNewsRules.ts` + `OverviewNewsStory.tsx` — opt-in engagement counts on the details line; overview defaults unchanged.
- `src/index.css` — shared news tokens extended to `.tour-news`; new page styles, no negative letter-spacing added.
- `public/locales/{en,de,en-XA,es,ja,ko}/tourhub.json` — like/comment singular/plural and News page strings.

## Reused, never forked

`newsVisit.ts` (a story seen on the overview is not new here), `overviewNewsRules.ts` (details line, players-in-the-story), `OverviewNewsStory.tsx` pair/row shapes, `displayEventName`, `useTourPlayerFollows`, `deriveHeroState`.

## Type-only fixes (authorized, no behaviour change)

1. `NewsEventCard.tsx:37` — `tournament as unknown as Record<string, unknown>` (TS2352).
2. `NewsTab.tsx:352` — `ref={visitRef as React.MutableRefObject<HTMLDivElement | null>}` (TS2322).

## Verification

- `npx tsc --noEmit -p tsconfig.app.json`: zero errors.
- `src/test/tourNewsPage.test.tsx`: 31/31.
- Overview News and story-page suites: 87/87 untouched.
- Full suite (sharded): 5,513/5,513 across 522 files — +31/+1 vs the 5,482/521 baseline, solely the new test file. No existing test edited, renamed or deleted.
- Preview build: OK.

Screenshots skipped per instruction — the guest join card covers the section; visuals are unit-tested. Signed-in live verification unavailable (external auth).

No SQL, no migrations, `feed_config` untouched, `round_pool_cap` unchanged, no native/Median changes.
