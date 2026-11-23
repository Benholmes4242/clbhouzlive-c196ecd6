# Canonical heading series, brief 14 — Explore shelf heads

## Component change
`src/features/explore-magazine/watch/CourseVideosShelf.tsx:34` `ShelfHeading` props are now `{ eyebrow, title, seeAll?, onSeeAll? }`; `sub` removed.
- Eyebrow: `SECTION_EYEBROW` (11 / 700 / 0.16em / uppercase / lh 1), ink `A.INK` #F8FAFC, `data-shelf-eyebrow`.
- Title: `<h2>` on `SECTION_TITLE` (21 / 700 / -0.035em / 1.05 / font-synthesis none), `A.INK`, `minWidth: 0`, wraps, never truncates, `data-shelf-title`.
- Row under the eyebrow: `marginTop: SECTION_TITLE_GAP` (5px), flex, `align-items: flex-end`, gap 12 (mock `.hd` gap).
- See all: `flex: none`, nowrap, 15px, `A.MUTE` (existing colour, = mock rgba(248,250,252,.62)). Weight: mock sets none (400); the old 600 was dropped to match the mock.
- Outer padding 28px 16px 10px unchanged; rails untouched.

## Callers (file:line · eyebrow · title)
| file:line | eyebrow | title |
|---|---|---|
| WatchFeed.tsx:480 Shorts | rail.shorts "Shorts" | rail.shortsSub "Under three minutes" |
| WatchFeed.tsx:643 Long form | rail.longForm | rail.longFormSub "Three minutes and over" |
| WatchFeed.tsx:692 More shorts | rail.moreShorts (new) "More shorts" | rail.shortsSub |
| Top100FilmShelf.tsx:50 (loading), :58 | top100.title "Top 100 on film" | top100.sub "The lists, filmed by members" |
| RegionsShelf.tsx:23 | regions.title "By region" | regions.sub "Where the videos were filmed" |
| CourseVideosShelf.tsx:90 (loading), :101 | courseShelf.title "Filmed at your courses" | courseShelf.sub "Courses you've played or rated" |
| CreatorSpotlight.tsx:63 | creators.title "Creators" | spotlight.worthFollowing (new) "Worth following" |
| CreatorsRow.tsx:103 | people.title "Golfers to watch" | people.titleLine (new) "Members posting lately" |

See-all logic and analytics unchanged. `spotlight.title` ("Creators to follow") retained.

## New i18n keys (courses namespace, amateur.watch.*)
| locale | rail.moreShorts | spotlight.worthFollowing | people.titleLine |
|---|---|---|---|
| en | More shorts | Worth following | Members posting lately |
| en-XA | [~~Μóřé šĥóřţš~~] | [~~Ŵóřţĥ ƒóľľóŵíñğ~~] | [~~Μéɱƀéřš ƥóšţíñğ ľáţéľý~~] |
| de | Mehr Shorts | Lohnt sich zu folgen | Mitglieder, die zuletzt gepostet haben |
| es | Más shorts | Merece la pena seguir | Miembros que publican últimamente |
| ja | その他のショート | フォローする価値あり | 最近投稿しているメンバー |
| ko | 쇼츠 더 보기 | 팔로우할 만한 | 최근 게시한 회원 |
(de/en-XA had no `people` object; one was created holding only `titleLine`.)

## ExploreShelf sub-line (list only, nothing changed)
`ExploreShelf` prop `sub?: string | null`, rendered only when truthy (ExploreShelf.tsx:130-134). Live chain M = App.tsx:677 `/amateur` → AmateurPage.tsx:116 → ExploreMagazine.
| usage | sub | status |
|---|---|---|
| ExploreMagazine.tsx:240 / :327 / :377 | not passed | live (M) |
| WeeklyClubShelf.tsx:56, StandingShelf.tsx:398, PersonalBestsShelf.tsx:66, HelpfulReviewsShelf.tsx:45, PeopleShelf.tsx:119 | not passed | live (M) |
| CourseShelf.tsx:65 | `sub={sub ?? null}`; no caller (ExploreMagazine.tsx:1295-1340) supplies one → null | live (M) |
| CircleShelf.tsx:194 | not passed | dead (no importer) |
No live usage renders sub-line text today. Note: the Watch variant selects an empty ExploreMagazine shelf schedule (ExploreMagazine.tsx:795).

## Test updates
- `src/test/er2CreatorsRegion.test.tsx:54` — was `getByText('Creators to follow', { selector: 'b' })`, now `getByText('Creators', { selector: '[data-shelf-eyebrow]' })`: the spotlight head is now eyebrow "Creators".
- `src/test/ws2WatchMiddle.test.tsx:148, :152, :173` — `.find((e) => e.tagName === 'B')` → `.find((e) => e.hasAttribute('data-shelf-eyebrow'))`: the shelf name is no longer a `<b>`.
- `src/test/ws2WatchMiddle.test.tsx:174` — `heading.parentElement!.textContent` → `heading.closest('[data-shelf-head]')!.textContent` (still `toContain(shortsSub)`): the old sub is now the title, a sibling row.
- `src/test/ws3WatchBottom.test.tsx:112` — `headingByText` selector `'b, h2'` → `'b, h2, [data-shelf-eyebrow]'`; fixes :146, :344, :357, :361 that look up "Long form".
- Not changed: `ws1WatchTop.test.tsx:370` ("…without a sub-line") still passes; its name is now historical. `er1ExploreCommunity.test.tsx:23` mocks ShelfHeading with `{ title }` and still passes.
- Added `src/test/exploreShelfHeadCanon.test.tsx` (5 tests; harness copied from ws3WatchBottom.test.tsx, real English i18n): eyebrow 11px/0.16em/uppercase; title 21/700/-0.035em/1.05; See all present/absent; Shorts, Top 100 and Creators spotlight mappings asserted against courses.json values.

## Captures and mock comparison
Fixture page (b14.html + src/b14Fixture.tsx rendering the HEAD ShelfHeading vs the new one with each shelf's strings and stand-in rails), removed afterwards. Files: `captures/before_390.png`, `before_320.png`, `after_390.png`, `after_320.png`.

| shelf | before 390 | before 320 | after 390 | after 320 |
|---|---|---|---|---|
| Shorts | 1 | 1 | 1 | 1 |
| Top 100 on film | 1 | 1 | 1 | **2** (new wrap) |
| Long form | 1 | 1 | 1 | 1 |
| By region | 1 | 1 | 1 | 1 |
| Creators spotlight | 1 | 1 | 1 | 1 |
| Golfers to watch | 1 | 1 | 1 | 1 |
| More shorts | 1 | 1 | 1 | 1 |
| Filmed at your courses | 1 | 1 | 1 | **2** (new wrap) |
No title over two lines at 320; no horizontal overflow at either width. See all stays on the title's last line when it wraps.

Mock comparison (explore_shelves_390.html "Proposed"): eyebrow 11/700/.16em/uppercase/lh1 ink; title 21/700/-.035em/1.05/font-synthesis none; 5px gap; flex-end row, gap 12; See all 15px rgba(248,250,252,.62), no weight (400), nowrap, flex none — all match. Strings match the mock for the five shelves it draws. Limitation: fixture rails are plain stand-ins, not real tiles (rails unchanged by this brief).

## Shards (sequential, `npx vitest run --shard=N/4`)
| shard | files | tests |
|---|---|---|
| 1 | 223 | 2,462 passed |
| 2 | 223 | 2,483 passed |
| 3 | 223 | 2,504 passed |
| 4 | 223 | 2,752 passed |
| total | 892 | 10,201 passed |
Baseline: 10,196 / 891 (after c2cb8d14fa). Delta +5 tests / +1 file = `exploreShelfHeadCanon.test.tsx`. No failures, no reruns.
