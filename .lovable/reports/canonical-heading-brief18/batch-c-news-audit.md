--- message 1 of 2 ---

## TL;DR

The two News routes share the Tour story shapes and reader, but **amateur data explicitly removes Tour embeds and tournament context**. The qualifying gray uppercase labels are primarily **K3 metadata**, plus the comments count, disabled report control, search “Previews” group heading, and account-sheet analytics labels. **No gray E1 section heading is rendered by the News index itself.** The Amateur magazine has its **own independently wired round-detail and comments sheets**; it must not be assumed covered solely by Watch/feed reachability. No files changed or tests run.

## Evidence

### Route and sheet reachability

| Entry | Actual reachable tree |
|---|---|
| `/discover/news` | `App.tsx:685` → `AmateurNewsPage` → `NewsChromeBridge` and `NewsTabPage` (`src/features/amateur/news/AmateurNewsPage.tsx:25-28`). Index renders hero, feature pair, workhorse rows, category rail, wire items and pagination (`src/components/explore-tab-new/NewsTabPage.tsx:122-173`). |
| `/discover/news/:slug` | `App.tsx:686` → `AmateurStoryPage` → shared `StoryArticle`, `StoryEngagementBlock`, “MORE AMATEUR NEWS” and `WorkhorseRow` (`src/features/amateur/news/AmateurStoryPage.tsx:77-89`). |
| Index comments | Signed-in viewer + selected story → `CommentsSheetV2`, target `amateur_story` (`src/components/explore-tab-new/NewsTabPage.tsx:104,177-183`). |
| Article comments | `StoryEngagementBlock` mounts `CommentsSheetV2` only when signed in (`src/features/stories/StoryEngagementBlock.tsx:149-155`). Guest prompt is sentence case (`:140-145`). |
| Comments descendants | Comment rows/composer; action sheet; report sheet; draft-discard, edit and delete dialogs (`src/features/comments-v2/CommentsSheetV2.tsx:470-522,533-616`). |
| Header overlays, **both routes** | Search and account controls remain present in both header modes; `SearchOverlayV2`, authenticated `PostingAsMenu`, and `TourSideMenu` are mounted (`src/features/tourhub/news/NewsChromeBridge.tsx:82-95`). Only index menu mode exposes the menu trigger (`:82-83`). |
| Mobile account descendants | `PostingAsMenu` → `AccountGlance`, upload panel, course analytics sheet; invite action dispatches shared invite sheet (`src/components/header/PostingAsMenu.tsx:254-283`). |

### Qualifying labels

Routes: **N** = `/discover/news`; **S** = `/discover/news/:slug`; **both/header** includes overlays opened without leaving either route.

Gray tokens: `A.DIM` and `INK_FAINT` = `rgba(248,250,252,0.42)`; `A.MUTE` = `rgba(248,250,252,0.62)` (`src/features/courses/components/holes/analytical/tokens.tsx:49-52`; `src/features/tourhub/_shared/tokens.ts:42-43`).

**Shared Tour pieces are marked “see BatchA” rather than proposed for a second audit.** Roles below describe their News use.

| File:line | Text/key | Route | Old color | Role / disposition |
|---|---|---|---|---|
| `src/features/tourhub/news/StoryShapes.tsx:155` | `tagFor(story)` hero photo label | N | `rgba(248,250,252,0.82)` | **K6 photo**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryShapes.tsx:189` | `tagFor(story)` feature-photo label | N | `rgba(248,250,252,0.82)` | **K6 photo**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryShapes.tsx:208` | Story tag + relative date | N, S more-news rows | `A.DIM` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryShapes.tsx:230` | Wire-item `tagFor(story)` | N | `A.DIM` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryPage.tsx:142-143` | `story.kicker`, **only without image** | S | `INK_FAINT` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryPage.tsx:149` | `storyTime(story.published_at)` | S | `INK_FAINT` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryPage.tsx:150-153` | `tag`: amateur category/event line | S | `INK_FAINT` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryPage.tsx:157` | `{readingMinutes(story)} min read` | S | `INK_FAINT` | **K3 metadata**; `.16em`; see BatchA |
| `src/features/tourhub/news/StoryBody.tsx:113-124` | Quote `attribution` | S | `INK_FAINT` | **K3 attribution metadata**; `.16em`; see BatchA |
| `src/features/comments-v2/CommentsSheetV2.tsx:432-441` | `comments.count` | N/S comments | `A.DIM` | **K3 count metadata**, not E1; `.16em`; absent while unready or zero |
| `src/features/comments-v2/components/ReportCommentSheetV2.tsx:119-133` | `Next`, **when no reason selected** | N/S → comments → report | `MUTED` = `rgba(248,250,252,0.40)` (`:16`) | **K4 disabled control**; `.10em`; selected state becomes white |
| `src/features/search-v2/SearchOverlayV2.tsx:637-645` | `Previews` | both/header → search | `S.QUIET` = `A.MUTE` (`src/features/search-v2/lib/tokens.ts:26-27`) | **E2 group heading**; `.08em`; conditional on video results |
| `src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:707-710,728-738` | `yourCourses.tileBest` | both/header → mobile account → course analytics | `A.DIM` | **K2 stats-summary label**; `.12em`; tiles conditional at `:697-698` |
| Same references | `yourCourses.tileBites` | same | `A.DIM` | **K2 stats-summary label**; `.12em` |

`COLUMN` supplies `.16em` uppercase to the story-shape rows (`src/features/tourhub/news/StoryShapes.tsx:36-42`); article `KICKER` supplies the same (`src/features/tourhub/news/StoryPage.tsx:57-62`). `tagFor` selects tournament name, kicker, categories, then “Golf” (`src/features/tourhub/news/StoryShapes.tsx:76-82`). Amateur article tag construction is category/event based (`src/features/amateur/news/AmateurStoryPage.tsx:34-43`).

### E1/E2 exclusions and shared-change boundaries

- **“Tour news” on the amateur index is the literal rendered title**, not a corrected “Amateur news”: `src/components/explore-tab-new/NewsTabPage.tsx:166-169`. It uses `DiscoverSectionHeading`, which renders sentence-case `SECTION_TITLE` in `A.INK`, not tracked gray caps (`src/components/ui/DiscoverSectionHeading.tsx:56-62`). **E1, outside the qualifying gray-label set.**
- **“By category” / “By competition”** passes `sentenceHeading` (`src/components/explore-tab-new/NewsTabPage.tsx:148-155`). That selects `DiscoverSectionHeading`; the legacy uppercase branch is not rendered here (`src/features/tourhub/news/StoryShapes.tsx:275-279`). **E2, outside the qualifying set.**
- **“MORE AMATEUR NEWS”** is uppercase `.14em`, but explicitly `INK`, not gray (`src/features/amateur/news/AmateurStoryPage.tsx:83-85`; `src/features/tourhub/news/StoryShapes.tsx:53-58`). **E1; see BatchA shared heading token.**
- Feature timestamps and wire dates explicitly reset tracking to `0`, despite spreading `COLUMN` (`src/features/tourhub/news/StoryShapes.tsx:194,227`).
- Article photo kicker is `#FFFFFF`; photo credit has no qualifying tracking (`src/features/tourhub/news/StoryPage.tsx:128-135`).
- Business badges in comments/replies are amber, not gray (`src/features/comments-v2/components/CommentCard.tsx:123-128`; `src/features/comments-v2/components/ReplyRow.tsx:85-90`).
- Comment action-sheet labels are `INK` or destructive, not gray (`src/features/comments-v2/components/CommentActionSheetV2.tsx:74-80,91-99`). Report form headings/reasons are not qualifying gray caps; “Back” is `INK`, submit is white, and report eyebrow is amber (`src/features/comments-v2/components/ReportCommentSheetV2.tsx:79,87,105,156-174`).
- Desktop account section labels use `tracking-wider`, not an explicit ≥`.08em` style (`src/components/header/PostingAsMenu.tsx:343-348,439-442`); they are not included in the threshold table.

**Explore-only opt-in requirements:**

1. **Preserve `StoryChipRail.sentenceHeading` as an opt-in.** Its documented default preserves Tour Hub’s Wire; changing the shared `KICKER`/default branch globally would cross that boundary (`src/features/tourhub/news/StoryShapes.tsx:251-255,275-279`).
2. **Do not globally change `MORE_HEADING` for an Explore E1 adjustment.** Tour’s story page consumes the same token (`src/features/tourhub/news/StoryPage.tsx:244`); amateur consumes it separately (`src/features/amateur/news/AmateurStoryPage.tsx:84`).
3. **Search “Previews” E2 is global search UI**, reached here through `NewsChromeBridge`, not a News-local heading (`src/features/tourhub/news/NewsChromeBridge.tsx:95`; `src/features/search-v2/SearchOverlayV2.tsx:637-645`). Any Explore-only treatment needs caller/context opt-in rather than an unconditional shared-overlay edit.
4. Shared reader changes also affect **Tour and admin previews**: Tour mounts `StoryArticle` (`src/features/tourhub/news/StoryPage.tsx:237`); the Wire editor does likewise (`src/features/admin/components/wire/WireStoryEditor.tsx:418`). These are additional reasons not to repoint shared typography globally.

### D — Tour descendants that are **not News-reachable**

This is a data-layer exclusion, not merely an absent current fixture:

> `const RENDERABLE = new Set(['paragraph', 'heading', 'image', 'quote']);`

`amateurRenderableBlocks` filters parsed blocks against that set, and `toStory` also forces `tournament_id: null` (`src/features/amateur/news/useAmateurStories.ts:31-49`).

Consequently:

| Pointer | Classification |
|---|---|
| `src/features/tourhub/news/StoryPage.tsx:167-177` → `StoryLeaderboardStrip` | **D for amateur News**: tournament condition cannot pass |
| `src/features/tourhub/news/StoryBody.tsx:207-227` — FINAL RESULT / venue | **D here; see BatchA K3** |
| `src/features/tourhub/news/StoryBody.tsx:239-251` — PLAYERS / PAR / LEADER | **D here; see BatchA K2** |
| `src/features/tourhub/news/StoryBody.tsx:419-431,592-598,680-686` — season/week figure labels | **D here; see BatchA K2** |
| `src/features/tourhub/news/StoryBody.tsx:473-474,607,696-699` — THE SEASON / THE WEEK | **D here; see BatchA group labels** |

These remain live Tour functionality; **D means unreachable from the audited amateur News routes**, not globally dead code.

### AmateurPage sheet reachability — separate pointers

- `AmateurPage` mounts **`ExploreMagazine`**, not the former amateur news/media/hero composition (`src/pages/AmateurPage.tsx:115-116`; retired composition documented at `:23-27`).
- The magazine owns its **own opener-backed `RoundDetailSheet`**, with current score/connection/member targets, seed and round paging (`src/features/explore-magazine/ExploreMagazine.tsx:1513-1568`).
- It separately mounts **standalone `CommentsSheetV2`**, returning directly to the feed on close (`src/features/explore-magazine/ExploreMagazine.tsx:1570-1590`).
- `AmateurPage` additionally mounts a **different opener instance’s** round sheet (`src/pages/AmateurPage.tsx:53,119-125`). The magazine’s own comment explains why its sheet could not rely on that parent instance (`src/features/explore-magazine/ExploreMagazine.tsx:1510-1512`).
- Round detail wraps the canonical **`CardScorecardSheet`**, and also owns a comments sheet (`src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx:26,495,561`). **Carry these explicit Amateur reachability pointers into the scorecard/shared-sheet batch; do not treat News comments coverage as scorecard coverage.**

## Open questions / audit limits

- **BatchA’s actual report was not available in the inspected repository.** “See BatchA” above identifies shared Tour source and News-use roles; it cannot certify correspondence with the prior report’s exact row identifiers.
- **A fully recursive global-overlay audit is not certified here.** Header account actions can dispatch the shared invite sheet (`src/components/header/PostingAsMenu.tsx:279`; `src/components/invite/InviteSheetProvider.tsx:8`), and Amateur round sheets reach the canonical scorecard. Their deeper descendants require their existing batch reports—or a separate shared-global-sheet pass—to claim literal exhaustiveness across every interaction beyond the News-owned tree.

--- message 2 of 2 ---

## TL;DR

**`src/components/explore-tab-new/NewsTabPage.tsx` is live, not a retired News block.** It is mounted by both `AmateurNewsPage` and Explore’s News mode. It introduces **no local uppercase ≥`.08em` gray typography**: its qualifying labels come from shared Tour story shapes (**already BatchA**) and shared comments descendants. The previous **`AmateurNewsBlock` is dead from the current AmateurPage composition**, and uses different legacy Tour exports—not `NewsTabPage`.

## Evidence

### 1. Live versus retired sources

| Source | Reachability | Evidence |
|---|---|---|
| `src/components/explore-tab-new/NewsTabPage.tsx` | **LIVE** `/discover/news` | Mounted at `src/features/amateur/news/AmateurNewsPage.tsx:28`, with `chrome="none" railBy="category"`. |
| Same | **LIVE** Explore News mode | Mounted at `src/components/explore-tab-new/ExploreTabContent.tsx:175-177`; story navigation targets `/discover/news/:slug` at `:142-144`. |
| `src/features/amateur/news/AmateurStoryPage.tsx` | **LIVE** `/discover/news/:slug` | Shared reader, engagement and related rows at `:77-89`. Tour shared reader pieces **see BatchA**. |
| `src/features/amateur/AmateurNewsBlock.tsx` | **D — previous Amateur news block** | Current `AmateurPage` renders `ExploreMagazine` at `src/pages/AmateurPage.tsx:115-116`, not the old composition; retirement documented at `:23-27`. Old block remains implemented at `src/features/amateur/AmateurNewsBlock.tsx:31-89`. |
| `LeadStory` / `StoryRow` from Tour `NewsTab.tsx` | **D through that previous block**; not the live Explore index shapes | Old imports: `src/features/amateur/AmateurNewsBlock.tsx:7`; calls at `:73,83`. Tour describes these as legacy exports, not used by its rebuilt page, at `src/features/tourhub/news/NewsTab.tsx:20-21`. |

### 2. Complete qualifying News-body rows

**N** = live News index, including its Explore-mode mount. **S** = amateur story route.  
**A** = `rgba(248,250,252,0.42)` (`A.DIM` / `INK_FAINT`), resolved at `src/features/courses/components/holes/analytical/tokens.tsx:52` and `src/features/tourhub/_shared/tokens.ts:43`.

| File:line | Text/key | Route | Old color | Role | Ownership |
|---|---|---|---|---|---|
| `src/features/tourhub/news/StoryShapes.tsx:155` | Hero `tagFor(story)` | N | `rgba(248,250,252,0.82)` | **K6 photo**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryShapes.tsx:189` | Feature-image `tagFor(story)` | N | `rgba(248,250,252,0.82)` | **K6 photo**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryShapes.tsx:208` | Workhorse story tag + relative date | N; S related rows | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryShapes.tsx:230` | Wire-item story tag | N | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryPage.tsx:142-143` | `story.kicker` without image | S | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryPage.tsx:149` | Published relative time | S | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryPage.tsx:150-153` | Amateur category/event tag | S | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryPage.tsx:157` | `{readingMinutes(story)} min read` | S | A | **K3 meta**, `.16em` | **See BatchA** |
| `src/features/tourhub/news/StoryBody.tsx:113-124` | Quote attribution | S | A | **K3 attribution**, `.16em` | **See BatchA** |
| `src/features/comments-v2/CommentsSheetV2.tsx:432-441` | `comments.count` | N/S comments sheet | A | **K3 count**, `.16em` | Shared descendant; rendered only when ready and nonzero |
| `src/features/comments-v2/components/ReportCommentSheetV2.tsx:119-133` | `Next`, before reason selection | N/S → comments → report | `rgba(248,250,252,0.40)` | **K4 disabled control**, `.10em` | Shared descendant |

**No additional qualifying local row exists in `NewsTabPage.tsx`.** Its two locally colored gray messages are sentence-case states, not tracked uppercase:

| File:line | Text/key | Route | Old color | Disposition |
|---|---|---|---|---|
| `src/components/explore-tab-new/NewsTabPage.tsx:117` | `amateurNews.emptyAll` / “The first stories are on their way.” | N | `A.MUTE` | **K3 state; outside caps/tracking filter** |
| `src/components/explore-tab-new/NewsTabPage.tsx:119` | `amateurNews.emptyFilter` / “Nothing filed under this yet.” | N | `A.MUTE` | **K3 state; outside caps/tracking filter** |
| `src/features/amateur/news/AmateurStoryPage.tsx:71-72` | `amateurNews.notFound` | S | `INK_MUTE` | **K3 state; outside caps/tracking filter** |

### 3. News headings and controls — do not misclassify as gray caps

| File:line | Text/key | Route | Old color | Role / outcome |
|---|---|---|---|---|
| `src/components/explore-tab-new/NewsTabPage.tsx:167` | Literal **“Tour news”** | N | `A.INK` | **E1**, sentence-case `DiscoverSectionHeading`; not qualifying gray caps |
| `src/components/explore-tab-new/NewsTabPage.tsx:149-155` | “By category” / “By competition” | N | `A.INK` | **E2**, `sentenceHeading` branch; not qualifying |
| `src/features/amateur/news/AmateurStoryPage.tsx:83-85` | `amateurNews.more` / “MORE AMATEUR NEWS” | S | `INK` | **E1**, `.14em` but not gray; **see BatchA** |
| `src/features/tourhub/news/StoryShapes.tsx:194` | Feature relative date | N | `A.DIM` | **K3**, explicitly `letterSpacing: 0`; excluded |
| `src/features/tourhub/news/StoryShapes.tsx:227` | Wire day number | N | `A.DIM` | **K3**, explicitly `letterSpacing: 0`; excluded |
| `src/features/tourhub/news/StoryShapes.tsx:291-295` | “Load more” | N | `A.INK` | **K4**, not qualifying |
| `src/features/tourhub/news/StoryPage.tsx:128-135` | Photo kicker / credit | S | White / translucent white | Kicker white; credit lacks qualifying tracking; **see BatchA** |

Heading rendering is explicit at `src/features/tourhub/news/StoryShapes.tsx:275-279` and `src/components/ui/DiscoverSectionHeading.tsx:56-62`.

### 4. Dead previous News block — complete disposition rows

These are **D through the retired Amateur composition**, not additional live News index labels.

| File:line | Text/key | Route | Old color | Role / disposition |
|---|---|---|---|---|
| `src/features/amateur/AmateurNewsBlock.tsx:61-62` | `amateurNews.section` / “Amateur news” | Previous AmateurPage | Delegated to `AboutSection` | **D / E1**; old section heading, not mounted |
| `src/features/amateur/AmateurNewsBlock.tsx:63-67` | `amateurNews.seeAllCount` / “See all {{count}}” | Previous AmateurPage | Delegated to `AboutSection` | **D / K4**; old index-navigation action |
| `src/features/amateur/AmateurNewsBlock.tsx:73` → `src/features/tourhub/news/NewsTab.tsx:119-175` | Old lead-story presentation | Previous AmateurPage | Shared legacy Tour styles | **D; see BatchA**, not live `HeroStory` |
| `src/features/amateur/AmateurNewsBlock.tsx:83` → `src/features/tourhub/news/NewsTab.tsx:213-217` | Old row kicker/time | Previous AmateurPage | Kicker `INK`; time `INK_MUTE` | **D / K3; see BatchA** |
| `src/features/tourhub/news/NewsTab.tsx:95` → `src/features/tourhub/news/StoryImageText.tsx:5-8` | Legacy kicker | Previous block descendant | Explicit `INK` override | **D / K3**; `.16em`, **not gray** |
| `src/features/tourhub/news/StoryImageText.tsx:13-18` | Legacy relative time | Previous block descendant | `INK_MUTE` | **D / K3**; uppercase but **no ≥`.08em` tracking** |
| `src/features/tourhub/news/NewsTab.tsx:172-174` | Legacy lead standfirst | Previous block descendant | `INK_MUTE` | **D**, prose, not qualifying |

**No new qualifying gray-cap row should be generated merely because the old `AmateurNewsBlock` file still exists.** Its local JSX delegates typography and introduces no uppercase/tracking styles.

### 5. Shared header descendants retained from the previous report

Both News routes mount search/account overlays at `src/features/tourhub/news/NewsChromeBridge.tsx:87-95`.

| File:line | Text/key | Route | Old color | Role |
|---|---|---|---|---|
| `src/features/search-v2/SearchOverlayV2.tsx:637-645` | “Previews” | N/S → search | `S.QUIET` = `A.MUTE` | **E2**, `.08em` |
| `src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:707-710,728-738` | `yourCourses.tileBest` | N/S → mobile account → courses | `A.DIM` | **K2**, `.12em` |
| Same | `yourCourses.tileBites` | Same | `A.DIM` | **K2**, `.12em` |

**Explore-only opt-in:** do not globally change the shared E2 search heading or shared E1 `MORE_HEADING`. Tour consumes `MORE_HEADING` at `src/features/tourhub/news/StoryPage.tsx:244`. `StoryChipRail` already has the correct opt-in boundary: its `sentenceHeading` documentation preserves Tour’s default at `src/features/tourhub/news/StoryShapes.tsx:251-255`.

### 6. AmateurPage sheets are independently reachable

- Current AmateurPage mounts the magazine: `src/pages/AmateurPage.tsx:115-116`.
- Magazine mounts **its own** round-detail sheet and opener targets: `src/features/explore-magazine/ExploreMagazine.tsx:1513-1568`.
- Magazine mounts standalone comments separately: `:1570-1590`.
- Parent AmateurPage also has another opener-backed sheet: `src/pages/AmateurPage.tsx:119-125`.
- Round-detail descendants: canonical `CardScorecardSheet` and comments at `src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx:495,561`.

These are explicit Amateur reachability pointers for the shared scorecard/sheet audit—not grounds to re-audit Tour News pieces.

## Open questions

- BatchA’s report was not present, so **“see BatchA” preserves source ownership without claiming its exact prior row IDs**.
- The tables complete the News-owned/body and identified header-label rows. Deep global invite/scorecard descendants remain separate shared-sheet scope; their full audit is not certified here. No edits or tests performed.

