--- message 1 of 2 ---

## TL;DR

**The shipped `/amateur` entrypoint has no reachable non-Watch view.** Its allowlist contains only `watch`; All is disabled, Scores is intercepted, and Courses/Reviews are not selectable views. Consequently, **there are no reachable E1/E2 gray-label changes in this Batch C scope**. The three explicitly requested grid routes remain registered, but their gray text does not meet the uppercase + tracking ≥ `.08em` selection. The reachable guest-gate kicker already uses white. **Important limitation:** this report establishes the shipped reachability result and records inspected dormant sites; it is **not an exhaustive label-by-label inventory of every dormant component and its sheets**. No files were changed and no tests were run.

## Evidence

### 1. Reachability proof graph

```text
App.tsx:677 /amateur
└─ AmateurPage
   ├─ ?view=scores
   │  └─ Navigate to /amateur with view removed
   ├─ ExploreMagazine
   │  ├─ URL view accepted only if EXPLORE_VIEWS.includes(view)
   │  ├─ otherwise readExploreView()
   │  │  └─ stored view accepted only if in the same allowlist
   │  └─ EXPLORE_VIEWS = ['watch']
   │     └─ WatchFeed                         [Watch-content audit]
   ├─ RoundDetailSheet                       [see A/B]
   ├─ ScrollToTopGlass                        [icon control]
   └─ useGuestScrollGate('explore')
      └─ GuestGateHost → GuestJoinCard

App.tsx:681 /watch/region/:region ─┐
App.tsx:682 /watch/courses ────────┼─ WatchGridPage(kind)
App.tsx:683 /watch/top100 ─────────┘  ├─ PageTitle
                                    ├─ region only: course chips
                                    │  └─ duplicate IslandDock chips
                                    ├─ empty state / video grid
                                    └─ tile → openVideoList
                                       └─ openWithOrigin
                                          [canonical Watch viewer boundary]
```

Load-bearing evidence:

- `src/App.tsx:677,681-683`: all four requested routes are registered.
- `src/pages/AmateurPage.tsx:100-106`: Scores interception **removes `view` and returns to `/amateur`**.
- `src/pages/AmateurPage.tsx:118-129`: mounts `ExploreMagazine` and the shared round-detail sheet.
- `src/features/explore-magazine/exploreViewMemory.ts:24`:
  ```ts
  export const EXPLORE_ALL_TAB_ENABLED = false;
  ```
- `src/features/explore-magazine/exploreViewMemory.ts:28-30`:
  ```ts
  export const EXPLORE_VIEWS: ExploreView[] = EXPLORE_ALL_TAB_ENABLED
    ? ['all', 'watch']
    : ['watch'];
  ```
- `src/features/explore-magazine/exploreViewMemory.ts:38-48`: stale session values cannot bypass that allowlist.
- `src/features/explore-magazine/ExploreMagazine.tsx:480-483`: URL values also pass through the allowlist.
- `src/features/explore-magazine/ExploreMagazine.tsx:1376`: `watch` mounts `WatchFeed`.
- `src/features/explore-magazine/watch/openVideoList.ts:6-15`: grid taps transform the loaded list with `toFeedPosts(list.map(toHubRow))`, then call `openWithOrigin`.

**Comment/code contradiction:** comments claim Scores redirects to `/rounds` in `exploreViewMemory.ts:10-13` and `ExploreMagazine.tsx:475-477`. The actual redirect above wins. Additionally, `src/App.tsx:679` redirects `/rounds` to `/amateur`. Do not infer a reachable Scores tab from those comments.

### 2. Reachable label disposition

The selection requires **all three**: uppercase rendering, tracking ≥ `.08em`, and gray color. The table includes the relevant keep/exclusion cases so gray text is not mistaken for an omitted E1/E2 candidate.

| File:line | Actual text/key | Route | Existing color | Role | Disposition / reason |
|---|---|---|---|---|---|
| `src/features/guest/GuestJoinCard.tsx:88`; `src/features/guest/guestCopy.ts:45-48` | `Explore` → rendered uppercase | `/amateur`, guest gate | `var(--eyebrow-ink)` = `#F8FAFC` | K6 gate | **Keep; outside gray selection.** Gate identity, not a page section. |
| `src/features/guest/guestGate.css:68-75`; `src/index.css:24,70-72` | `.guest-gate-kicker` | Same | `#F8FAFC` | K6 gate | Canonical uppercase `.16em`; already white. |
| `src/pages/WatchGridPage.tsx:65` | `amateur.watch.grid.yourCourses`: “Your courses” | `/watch/courses` | PageTitle h1 token | Page title | **Outside selection:** title has zero tracking, not uppercase styling. |
| `src/pages/WatchGridPage.tsx:65` | `amateur.watch.top100.title`: “Top 100 on film” | `/watch/top100` | PageTitle h1 token | Page title | Same exclusion. |
| `src/pages/WatchGridPage.tsx:65` | `{region}` | `/watch/region/:region` | PageTitle h1 token | Page title | Same exclusion, even if a data value happens to contain capitals. |
| `src/pages/WatchGridPage.tsx:66`; `src/features/chrome-v2/page-title.css:5` | `videosLabel(...) · coursesLabel(...)` | Region grid | `var(--player-other)` | K3 metadata | **Keep; outside selection:** sentence-case subtitle, no qualifying tracking. |
| `src/pages/WatchGridPage.tsx:71-93` | `amateur.watch.grid.all`: “All”; shortened course names | Region grid, inline chips | Inactive `A.MUTE`; active `#0B0B0D` | K4 controls | **Keep; outside selection:** no uppercase transform or qualifying tracking. |
| `src/pages/WatchGridPage.tsx:71-93,104-107` | Same labels | Region grid, docked chips | Inactive `A.MUTE`; active `var(--island-back-ink)` | K4 controls | Same exclusion; dock duplicate must not be counted as a section/group. |
| `src/pages/WatchGridPage.tsx:112-115` | `amateur.watch.grid.empty`: “No videos here yet.” | All three grids | `A.MUTE` | K3 state | **Keep; outside selection:** sentence case, no qualifying tracking. |
| `src/pages/WatchGridPage.tsx:122` | `#` and `{row.list_rank}` | Top 100 grid | Prefix `rgba(255,255,255,0.7)`; number `#FFFFFF` | K3 badge | **Keep; outside selection:** rank badge, tracking absent/negative, not a section. |

Supporting definitions:

- `src/features/chrome-v2/page-title.css:4`: h1 uses `letter-spacing:0`.
- `src/features/explore-magazine/watch/watch-grid.css:2-5`: grid poster/rank/creator tokens.
- `src/features/courses/components/holes/analytical/tokens.tsx:48-52`:
  - `A.INK = #F8FAFC`
  - `A.MUTE = rgba(248,250,252,0.62)`
  - `A.DIM = rgba(248,250,252,0.42)`

**Reachable selected-row totals outside Watch content:** E1 **0**, E2 **0**, K1 **0**, K2 **0**, K3 **0**, K4 **0**, K5 **0**, K6 **0**. These are totals for the strict selection, not counts of all visible text or controls.

### 3. Dormant code: do not promote these to reachable Explore candidates

All-only rendering is explicitly conditional in `src/features/explore-magazine/ExploreMagazine.tsx:1377-1401`; the current allowlist prevents entering that branch.

The following are **inspected dormant sites**, not a claim that every dormant label has been enumerated:

| File:line | Actual text/value | Existing color | Classification from `/amateur` | Reason |
|---|---|---|---|---|
| `src/features/explore-magazine/StandingShelf.tsx:435-442` | `copy.seeAll(standing.total)` | `A.MUTE` | **D**; intrinsic K4 | `.08em` uppercase action, but its All shelf is unavailable. |
| `src/features/explore-magazine/ExploreCard.tsx:686-690` | `{right}` in review identity | `PHOTO_REVIEW_LABEL` | **D**; intrinsic K3/K6 | `.10em` uppercase photo metadata; dormant All composition. |
| `src/features/explore-magazine/ExploreCard.tsx:1219-1232` | `{storySectionLabel}`; adjacent story age | `HERO_STORY_META_COLOR` | **D**; intrinsic K3/K6 | `.16em` photo identity/meta, not a page section heading. |
| `src/features/explore-magazine/ExploreCard.tsx:1339-1344` | `{kickerDate}` | `rgba(255,255,255,0.72)` | **D**; intrinsic K3/K6 | `.14em` uppercase date over media. |
| `src/features/explore-magazine/ExploreCard.tsx:1397-1402` | `{reviewRegion}` | `rgba(255,255,255,0.62)` | **D**; intrinsic K3/K6 | `.14em` uppercase location over media. |
| `src/features/explore-magazine/ExploreCard.tsx:1047-1050` | Round kicker container | `#FFFFFF` | **D**, also outside gray selection | `.19em`, already white at container level; individual children require their own classification. |
| `src/features/explore-magazine/ExploreCard.tsx:1258-1263` | `{storyEyebrow}` | `#FFFFFF` | **D**, also outside gray selection | `.19em`, already white. |
| `src/features/explore-magazine/FeaturedRoundCard.tsx:121` | Featured kicker | `GOLD` | **D**, also outside gray selection | `.16em` uppercase, colored accent rather than gray. |

**Not globally dead:** `AchievementCallout`, `Section`, leaderboards, and related shared pieces cannot safely be labeled D merely because All is unavailable. They have other callers; Batch C reachability must be distinguished from repository-wide reachability.

### 4. Shared modules and opt-in boundary

#### `ExploreShelf`

- `src/features/explore-magazine/ExploreShelf.tsx:24-27`:
  ```ts
  export const SHELF_HEADING: CSSProperties = {
    ...SECTION_TITLE,
    color: A.INK,
  };
  ```
- Heading renders at `ExploreShelf.tsx:95-97`.
- Its see-all is deliberately a sentence-case rail action, documented at `ExploreShelf.tsx:10-12`; its gray color is at `:110`.

**Finding:** this is not a gray tracked-uppercase E1/E2 primitive. **No Batch C opt-in is needed; do not change its shared heading or action styles.**

#### `Section`

- `src/features/explore-magazine/Section.tsx:67`: section eyebrow already explicitly uses `A.INK`.
- `Section.tsx:85-86`: the metadata slot spreads uppercase `.16em` `EYEBROW` but uses `A.DIM`.
- `Section.tsx:113-137`: `SeeAll` spreads `EYEBROW` and uses `A.MUTE`.

**Role distinction:** the section eyebrow is E1-shaped but already white; metadata is K3 (or a caller-owned control), and `SeeAll` is K4. Do not brighten those slots as collateral damage.

Direct non-magazine component callers found:

| Caller | Reference | Opt-in implication |
|---|---|---|
| `CompetitionBoards` | `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:4` | Imports `Section`, `Rail`, `SeeAll`; preserve shared metadata/action defaults. |
| `StandoutRounds` | `src/components/explore-tab-new/courseled/StandoutRounds.tsx:3` | Imports `Section`; preserve existing defaults. |

Additional direct local callers:

- `src/features/explore-magazine/LeaderboardsSection.tsx:8`
- `src/features/explore-magazine/ScoresLeaderboardsPage.tsx:44`

**Exact opt-in required for this audit: none**, because there is no selected reachable E1/E2 change. If a later task introduces an Explore-specific color exception, scope it to the particular heading instance/prop; do not change `EYEBROW`, `A.MUTE`, `A.DIM`, `SeeAll`, or the metadata slot globally. This is a recommendation, not an existing API.

### 5. Sheets and ownership exclusions

- `src/pages/AmateurPage.tsx:121-129`: shared `RoundDetailSheet` — **see A/B**, not re-audited.
- `src/features/explore-magazine/ExploreMagazine.tsx:1513,1575`: round-detail and comments mounts — **see A/B**, not re-audited.
- Grid tiles call the canonical viewer through `openVideoList`; viewer internals remain the **Watch audit** boundary.
- Tour components are not a reachable non-Watch `/amateur` tab under the shipped allowlist; **see A/B** rather than reopening their typography audit.
- Guest conversion card is included above because the page explicitly invokes the Explore scroll gate.

### 6. Typography drift — report only, no font changes

- `src/features/courses/components/holes/analytical/tokens.tsx:242` defines the analytical system-font stack.
- `src/features/explore-magazine/AchievementCallout.tsx:510-514` explicitly documents preserving analytical SANS in shared profile/course pill chrome. **Do not normalize that font under a color-only brief.**
- `src/features/explore-magazine/Section.tsx:25-29` retains a local `.16em` uppercase `EYEBROW` for metadata/actions, whereas its actual section eyebrow uses `SECTION_EYEBROW` at `:67`. That distinction is intentional in current code; matching tracking does not make the roles equivalent.
- The guest gate uses canonical eyebrow variables, while its body/head typography remains separately defined in `guestGate.css:77-100`. No font alteration is warranted by this audit.

## Open questions

1. **Dormant inventory completeness:** every label in retired All/Scores/legacy Explore compositions and every dormant sheet has not been individually resolved to actual translation text, conditional color, and external caller. Completing that separate dead-code appendix would close the gap against the request’s literal “exhaustive D rows” requirement.
2. **Shared-module caller completeness:** the direct `Section` callers above are established, but their full external route ancestry and every consumer of shared token exports were not exhaustively traced. Do not interpret this report as authorization for global primitive changes.
3. **Scope interpretation:** “every view/tab” could mean historical compiled views as well as shipped reachable views. This report uses the shipped allowlist for reachability and explicitly separates dormant findings. The stale redirect comments should not be used to expand that scope silently.

--- message 2 of 2 ---

## TL;DR

Confirmed: **old leaderboard filters are D, not candidates**. The current `ExploreMagazine` allowlist exposes only Watch; All is compiled but disabled, and Scores is redirected before magazine rendering. **Batch C has no reachable E1/E2 recolor candidates outside Watch content.** However, following the grid creator badges uncovered **five qualifying gray uppercase rows in the member-badge popover**—all **K2/K3 keeps**. This corrects my earlier “zero selected K rows” statement. No edits or tests.

## Evidence

### Reachability graph

```text
App.tsx:677 /amateur
└─ AmateurPage
   ├─ ?view=scores → remove view, Navigate /amateur
   ├─ ExploreMagazine
   │  └─ allowed views: ['watch']
   │     └─ WatchFeed                         [separate Watch audit]
   ├─ Explore guest scroll gate → GuestJoinCard
   └─ shared RoundDetailSheet                 [see A/B]

App.tsx:681-683
/watch/region/:region | /watch/courses | /watch/top100
└─ WatchGridPage
   ├─ PageTitle
   ├─ region course chips + IslandDock duplicate
   ├─ grid tiles
   │  ├─ SolidDurationBadge
   │  ├─ Top 100 rank
   │  ├─ course name
   │  └─ InlineProMemberName
   │     └─ PRO/AM badge → MemberBadgeCard → GlanceShell
   └─ tile tap → openVideoList → canonical viewer [Watch audit boundary]
```

Proof:

- `src/pages/AmateurPage.tsx:100-106`: actual Scores redirect strips `view`.
- `src/features/explore-magazine/exploreViewMemory.ts:24-30`: All flag is `false`; allowlist is `['watch']`.
- `src/features/explore-magazine/ExploreMagazine.tsx:480-483`: URL selection is validated against that allowlist.
- `src/features/explore-magazine/exploreViewMemory.ts:38-48`: session memory cannot restore disabled views.
- `src/features/explore-magazine/ExploreMagazine.tsx:575`: legacy client composition explicitly disabled for Watch.
- `src/features/explore-magazine/ExploreMagazine.tsx:795`: Watch receives no legacy shelves.
- `src/features/explore-magazine/ExploreMagazine.tsx:1376-1401`: Watch branch and disabled All-only featured/header branches.
- `src/pages/WatchGridPage.tsx:127` → `src/features/pro-verification/InlineProMemberName.tsx:12-15` → `src/features/pro-verification/ProLabel.tsx:33-43`: creator badge opens its own popover rather than opening the video.

### Exhaustive qualifying rows on the reachable non-Watch surfaces

Scope here is the requested page/grid rendering and their opened popovers, excluding canonical Watch-viewer content and A/B-owned shared sheets.

All five rows use **`.14em`, uppercase, `rgba(248,250,252,0.42)`**.

| File:line — rendering / text | Actual rendered text | Route | Old color | Role | Decision / reason |
|---|---|---|---|---|---|
| `src/features/member-badge/MemberBadgeCard.tsx:29`; `member-badge.css:7` | **VERIFIED BY CLBHOUZ** | All three grid routes, creator badge popover | `rgba(248,250,252,0.42)` | **K3** | Keep. Verification/provenance metadata, not a section or group heading. |
| `src/features/member-badge/MemberBadgeCard.tsx:33`; `memberBadgeRules.ts:32`; `member-badge.css:12` | **WORLD RANKING** | Same; Tour-pro badge with rank | Same | **K2** | Keep. Caption for rank statistic. |
| `src/features/member-badge/MemberBadgeCard.tsx:33`; `memberBadgeRules.ts:33`; `member-badge.css:12` | **EVENTS THIS YEAR** | Same; Tour-pro badge with event count | Same | **K2** | Keep. Caption for event-count statistic. |
| `src/features/member-badge/MemberBadgeCard.tsx:33`; `memberBadgeRules.ts:46`; `member-badge.css:12` | **WORLD AMATEUR RANK** | Same; AM badge with rank | Same | **K2** | Keep. Caption for rank statistic. |
| `src/features/member-badge/MemberBadgeCard.tsx:33`; `memberBadgeRules.ts:47-49`; `member-badge.css:12` | **THIS YEAR** | Same; AM badge with nonzero movement | Same | **K2** | Keep. Caption for movement statistic. Up/down branches share the same label styling; only the figure changes color. |

`MemberBadgeCard.tsx:26,33` renders facts only when available. Missing facts disappear; they do not introduce additional label variants. `GlanceShell.tsx:111-123` supplies the dialog shell and children, not another visible heading.

**Selected totals:** E1 **0**, E2 **0**, K1 **0**, K2 **4**, K3 **1**, K4 **0**, K5 **0**, K6 **0**.

### Other rendered text — explicit exclusions

These are not omitted recolor candidates; they fail the requested selection.

| File:line | Text/key | Route | Existing color | Role / exclusion |
|---|---|---|---|---|
| `src/features/guest/GuestJoinCard.tsx:88`; `guestCopy.ts:45-47`; `guestGate.css:68-75` | **EXPLORE** | `/amateur` guest gate | `var(--eyebrow-ink)` → `#F8FAFC` (`src/index.css:24`) | **K6**, already white. Canonical `.16em` uppercase. |
| `src/pages/WatchGridPage.tsx:65`; `src/features/chrome-v2/page-title.css:4` | “Your courses”; “Top 100 on film”; region name | Respective grids | `var(--island-back-ink)` | Page identity; tracking `0`, no uppercase transform. Keys: `amateur.watch.grid.yourCourses`, `amateur.watch.top100.title`. |
| `src/pages/WatchGridPage.tsx:66`; `page-title.css:5` | Video count · course count | Region grid | `var(--player-other)` | **K3**; no qualifying tracking/uppercase. |
| `src/pages/WatchGridPage.tsx:71-93,99-106` | “All”; shortened course names; inline/docked copies | Region grid | Inactive `A.MUTE`; active inline `#0B0B0D`, docked island ink | **K4**; no qualifying tracking/uppercase. “All” key: `amateur.watch.grid.all`. |
| `src/pages/WatchGridPage.tsx:110-111` | “No videos here yet.” | All grids | `A.MUTE` | **K3** state; no qualifying tracking/uppercase. Key: `amateur.watch.grid.empty`. |
| `src/features/explore-magazine/watch/SolidDurationBadge.tsx:11-19` | Formatted duration | All grids | `#FFFFFF` | **K3**; white numeric metadata, no qualifying tracking. |
| `src/pages/WatchGridPage.tsx:122` | `#` / list rank | Top 100 grid | Prefix `rgba(255,255,255,0.7)`; number `#FFFFFF` | **K3**; numeric badge, number tracking `-.01em`. |
| `src/pages/WatchGridPage.tsx:124-125` | Shortened course name | All grids | Inherited `A.INK` | Content title; no qualifying tracking/uppercase. |
| `src/pages/WatchGridPage.tsx:127` | Creator display name or handle | All grids | `var(--watch-grid-creator)` = `rgba(248,250,252,0.55)` | **K3**; no qualifying tracking/uppercase. |
| `src/features/pro-verification/ProLabel.tsx:21-22`; `pro-label.css:2` | **PRO / AM** | Creator badge and popover | Foil background-clipped text; transparent text fill | **K3** status badge; `.14em` uppercase but not flat gray text. Preserve badge material. |
| `src/features/member-badge/MemberBadgeCard.tsx:31-40`; `member-badge.css:8-15` | Professional/amateur title, member identity, explanatory body, profile action | Badge popover | White/gray by element | Titles use negative tracking; other text lacks qualifying uppercase/tracking. Action is **K4**. |

### D disposition: retired views and filters

| File:line | Branch/module | Classification | Reason |
|---|---|---|---|
| `src/features/explore-magazine/exploreViewMemory.ts:24-30` | All view | **D from current Explore entrypoint** | Disabled flag; URL and memory cannot enable it. |
| `src/pages/AmateurPage.tsx:100-106` | Scores view | **D** | Redirected before `ExploreMagazine` renders. |
| `src/features/explore-magazine/ExploreMagazine.tsx:1377-1401` | Featured round / “What’s happening” All header | **D** | Explicit `view === 'all'` conditions. |
| `src/features/explore-magazine/ExploreMagazine.tsx:780-797` | Legacy All shelves and associated openings | **D from current Explore** | Watch shelf list is empty; All cannot be selected. |
| `src/features/explore-magazine/ExploreMagazine.tsx:572-575` | Legacy stream composition under Watch | **D rendering path** | Explicitly disabled for Watch. |

**Old leaderboard filters are excluded as D, not K4 candidates.** Their individual legacy labels are not being presented as live audit rows.

Shared scorecard, likes and comments: **see A/B**. Tour pieces: **see A/B**. No hook-internal audit is needed beyond the rendering gates above.

### Candidate files and contents-read requirements

**No E1/E2 candidate file requires editing in the current scope.**

The newly found gray-label files have now had their actual contents read:

- `src/features/member-badge/MemberBadgeCard.tsx`
- `src/features/member-badge/member-badge.css`
- `src/features/member-badge/memberBadgeRules.ts`
- `src/features/pro-verification/InlineProMemberName.tsx`
- `src/features/pro-verification/ProLabel.tsx`
- `src/features/pro-verification/pro-label.css`

They are **keep evidence, not edit candidates**. No Explore-only opt-in is needed because no change is proposed.

Previously discussed shared primitives are also **not candidates**:

- `src/features/explore-magazine/Section.tsx:67`: actual section eyebrow already `A.INK`; metadata and see-all remain distinct keep roles.
- `src/features/explore-magazine/ExploreShelf.tsx:24-27,95-97`: heading already `A.INK`, canonical title typography—not the selected gray uppercase treatment.

Do **not** edit dormant card/shelf/filter files on the basis of my earlier sampled D rows. Those samples were not a full contents audit authorizing changes.

### Typography drift

No font changes proposed. The grid inherits analytical `SANS`; the badge popover’s `GlanceShell` uses the corresponding system-font stack (`src/features/chrome-v2/index-glance.css:10`). Badge foil and its `.14em` typography are intentional material/status styling, not color-only cleanup targets.

## Open questions

- None blocking the **current reachable non-Watch E1/E2 decision: no changes**.
- If All is subsequently re-enabled, its cards, shelves and sheets need a separate complete pass before edits. This report does not promote disabled branches into today’s scope.

