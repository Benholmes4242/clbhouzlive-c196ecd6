# News pages — canonical bottom clearance

## Completed scope

Changed only four news-page files and added the requested three-case spacer regression file. No SQL, migrations, feed_config, pool-cap, shared PageRoot, nav pill, NAV_CLEARANCE or NAV_BREATHING changes. Tour News hub was measured before edits and already correct, so NewsTab/TourHubShell were left unchanged.

- StoryPage and AmateurStoryPage: replace the duplicate safe-area/breathing spacer with `var(--bottom-nav-height, ${NAV_CLEARANCE})`.
- AmateurNewsPage: remove BOTTOM_SPACER and use that same expression directly.
- WireNewsPage: add that expression once as shell paddingBottom because this standalone page has no PageRoot. Its header note documents the existing shell ownership; no new shared module or architecture introduced.

## Before-change Tour index audit at 390px

Measured at the true bottom of #root with the actual nav visible and real published stories, before changing any news spacing.

**Tour hub News tab `/tourhub?tab=news`:** last element Show older stories, bottom 689.55px; pill top 706px; gap 16.45px. PageRoot paddingBottom 96px = measured 60px pill +20px float +16px breathing, once. NewsTab and all ancestors inside PageRoot have zero trailing padding/margin; the button has margin `18px auto 0` (18px ABOVE, 0 below), no trailing margin, height 42px, paddingBottom 0. The preceding archive row has 13px bottom padding inside its own box and a 1px divider, followed by the 18px button top margin; neither adds anything AFTER the button. App shell/depth/root/body have zero bottom padding/margin. The remaining 0.45px is integer scroll-height rounding (PageRoot bottom 785.55px against viewport 786px). No duplicated clearance: no hub change.

**Standalone `/tour/news`:** last element Show older stories, bottom 785.55px; pill top 706px; gap -79.55px (covered by the pill). Identical button/row geometry, no PageRoot and no spacer/padding on its shell, inner frame, NewsTab or app ancestors. Contrary to the reported overly large gap, this path has missing clearance; add exactly one canonical padding on WireNewsPage. Complete ancestor/sibling computed geometry is retained in browser-before.log, including row/pill geometry and CSS variable values.

## Before/after viewport measurements

CSS pixel coordinates, viewport height 786px. Negative gap means overlap. Last element is Show older stories for both Tour indexes, the final More tour news / More amateur news article row for story pages, and Load more for Amateur News. Both after captures show the entire last element above the nav.

| Surface | Width | Before last bottom | Before pill top | Before gap | After last bottom | After pill top | After gap |
|---|---:|---:|---:|---:|---:|---:|---:|
| tour-hub | 390 | 689.55 | 706.00 | 16.45 | 689.55 | 706.00 | 16.45 |
| tour-index | 390 | 785.55 | 706.00 | -79.55 | 689.55 | 706.00 | 16.45 |
| tour-story | 390 | 673.81 | 706.00 | 32.19 | 689.81 | 706.00 | 16.19 |
| amateur-index | 390 | 673.28 | 706.00 | 32.72 | 689.28 | 706.00 | 16.72 |
| amateur-story | 390 | 674.47 | 706.00 | 31.53 | 690.47 | 706.00 | 15.53 |
| tour-hub | 320 | 690.09 | 706.00 | 15.91 | 690.09 | 706.00 | 15.91 |
| tour-index | 320 | 786.09 | 706.00 | -80.09 | 690.09 | 706.00 | 15.91 |
| tour-story | 320 | 674.39 | 706.00 | 31.61 | 690.39 | 706.00 | 15.61 |
| amateur-index | 320 | 673.28 | 706.00 | 32.72 | 689.28 | 706.00 | 16.72 |
| amateur-story | 320 | 673.94 | 706.00 | 32.06 | 689.94 | 706.00 | 16.06 |

All gaps are within 1 CSS pixel of the 16px target. Root scrolling is integer-rounded against fractional content geometry. Amateur index also retains its existing 1px wire-section bottom border after Load more (part of the last content frame): button-to-pill is 16.72px; frame-to-pill is 15.72px. No unrelated border/row styling was changed. The 13px story-row bottom padding remains inside the measured row, not an additional page gap.

## Notched-phone arithmetic

`env(safe-area-inset-bottom)` is **0 in desktop Chromium**; Ben's phone check remains outstanding. Let H be the measured pill height and S the home-indicator inset.

Before, all three spacers:
`calc(env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 96px) + 16px)`.

The populated variable already equals `calc(var(--nav-pill-h, 64px) + 36px + env(safe-area-inset-bottom, 0px))` = H+20+16+S. Before spacer = H+52+2S; gap to pill =32+S. Extra =16+S (about50px when S=34px). With desktop H=60 and S=0, before spacer is112px.

After template expression, all three plus standalone shell padding:
`var(--bottom-nav-height, ${NAV_CLEARANCE})`, with NAV_CLEARANCE imported from `src/lib/navClearance.ts`.

Expanded fallback:
`var(--bottom-nav-height, calc(var(--nav-pill-h, 64px) + 36px + env(safe-area-inset-bottom, 0px)))`.

After populated clearance =H+36+S, desktop96px; gap =16px. No safe-area or +16px is added outside the canonical token. A hidden nav writes the variable to0px, which wins over the fallback and therefore reserves0px; no hidden-nav browser scenario was added.

## Browser evidence

Commands, before app changes and after respectively:
`python3 /tmp/browser/news-gap/capture_news.py before`
`python3 /tmp/browser/news-gap/capture_news.py after`

Twenty screenshots in captures/before and captures/after: five surfaces ×390/320×before/after. Actual app routes and actual nav, not isolated fixture pages; public signed-out reading is supported, no auth mint or guest creation. Followed each index's real lead-story action to verify story navigation and its real More list:
- Tour story `/tour/news/korda`; last More row: Ten is too many: a Ryder Cupper wants the pathway closed.
- Amateur story `/discover/news/a-club-captain-off-23-just-won-a-national-final-on-the-hotchkin`; last More row: They play off 32 between them. They won at St Andrews.

Full geometry output in browser-before.log and browser-after.log; reusable capture script in capture_news.py. All ten after screenshots were visually inspected; automated after checks assert gap16±1px and complete last-element visibility above the pill. No physical-phone verification claimed.

## Tests and inventory

Before: last reported full suite9,744/9,744 tests across863 files (Feed Tour design B).
After: **9,747/9,747 across864 files**, exactly +3 cases/+1 file, all in src/test/newsBottomClearance.test.ts. No existing test deleted, renamed, rewritten or edited.

Three generated case names, one for each StoryPage.tsx, AmateurStoryPage.tsx and AmateurNewsPage.tsx path:
`<path> uses the nav variable with the canonical fallback and no added inset or breathing term`.

Each asserts:
- Import `NAV_CLEARANCE` from `@/lib/navClearance`.
- Spacer expression exactly ```var(--bottom-nav-height, ${NAV_CLEARANCE})``` (JavaScript template literal).
- Spacer source contains no `env(safe-area-inset-bottom` or `+ 16px` term outside that fallback reference.
- No remaining BOTTOM_SPACER constant.

Focused command: `./node_modules/.bin/vitest run src/test/newsBottomClearance.test.ts` →3/3, one file, full output focused.log.

Four sequential separate commands, no concurrent shards:

| Command | Tests passed | Files passed | Retained full log |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` |2391|216|shard-1.log|
| `./node_modules/.bin/vitest run --shard=2/4` |2393|216|shard-2.log|
| `./node_modules/.bin/vitest run --shard=3/4` |2426|216|shard-3.log|
| `./node_modules/.bin/vitest run --shard=4/4` |2537|216|shard-4.log|
| **Total** |**9747**|**864**| |

Against previous shard totals2391/2393/2426/2534, only shard4 grows by the three new cases and one file. Zero unexpected test failures. No manual build or typecheck was run.

Latest observed harness entry: **build OK**, 2026-11-22T09:10:52Z.
