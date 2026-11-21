# Fullscreen course-photo hole tile — stopped

## Changes
- `src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx`: moved the existing hole strip into the synthetic shot author row as its last child, after the unchanged name/date column. Removed the full-width trailing tile/margin. Preserved FS_GLASS, attributes, kicker/detail content and date. Hole names opt into the existing inline text-flow name content and two-line CSS; other shot names retain single-line ellipsis. Local ownership recorded in the existing module header; root AGENTS.md unchanged because it is at its size budget.
- `src/components/fullscreen-feed/fullscreen-hole-tile.css`: new local geometry stylesheet, 14px tile radius, 9px 13px 8px padding, flex none, max-width 58%, min-width 0, nowrap kicker/detail, two-line name clamp. At max-width 340px: 8px 11px 7px padding, 14px detail, 10px author gap. No new material/color/font-family declarations.
- `src/test/fullscreenHoleTileRow.test.tsx`: four requested cases; existing tests untouched. Full react-i18next mock copied from profileCoursesRecord; viewer setup follows memberShotCredit with MemoryRouter.
- `roadmap.md`, this report, `focused.log`: scope/status and complete focused-run output.

No SQL, migrations, feed_config or round_pool_cap changes. CourseGalleryChrome, ordinary post/review rows, course header, dots, View post, video row, round pill, review strip, Played with and action pills unchanged. Frozen mock-context differences were not adopted; visual comparison remains unverified.

## Exact stop
Command:
```text
bunx vitest run src/test/fullscreenHoleTileRow.test.tsx src/test/canonicalFullscreenViewer.test.tsx src/test/memberShotCredit.test.tsx src/test/latestHolesSwipeCaption.test.tsx
```

**29 passed / 1 failed of 30**, four files (three passed, one failed).

```text
FAIL src/test/fullscreenHoleTileRow.test.tsx > fullscreen hole tile row > (d) declares the narrow-phone padding and detail size in CSS
TypeError: The URL must be of scheme file
 ❯ src/test/fullscreenHoleTileRow.test.tsx:69:17
const css = readFileSync(new URL('../components/fullscreen-feed/fullscreen-hole-tile.css', import.meta.url), 'utf8');
```

The new stylesheet-reading fixture throws before its CSS assertions. No test or app repair, rerun, or further test execution after the failure. A ruling authorizing a filesystem-path fixture correction is needed to continue.

Unchanged files passed: canonicalFullscreenViewer **13/13**, memberShotCredit **6/6**, latestHolesSwipeCaption **7/7**. New cases (a), (b), (c) passed; (d) failed as above.

## Test accounting
Last verified full suite: **9,390 / 9,390**, 838 files. After this change: **expected inventory 9,394**, 839 files; not a verified full-suite passing total. Delta **+4**, all in fullscreenHoleTileRow.test.tsx:
1. `(a) places the hole tile last inside the shot author row` — asserts direct parent, last child, and hole-name class.
2. `(b) keeps only the kicker when no detail is present` — asserts one child, kicker class and absent detail.
3. `(c) omits the tile and retains the single-line name for a place shot` — asserts absent tile, single-line class and absent hole-name class.
4. `(d) declares the narrow-phone padding and detail size in CSS` — intended assertions for max-width 340px, padding 8px 11px 7px, detail 14px and gap 10px; fixture error before assertions.

Existing tests deleted, renamed, rewritten or assertions changed: **none**.

| Requested command | Result |
| --- | --- |
| `bunx vitest run --shard=1/4` | Not run — focused test stop |
| `bunx vitest run --shard=2/4` | Not run — focused test stop |
| `bunx vitest run --shard=3/4` | Not run — focused test stop |
| `bunx vitest run --shard=4/4` | Not run — focused test stop |

## Preview and screenshots
Latest harness entry: `=== build 2026-11-21T07:56:53Z ===`, `build OK`. No manual build/typecheck run.

Requested Woking photo, Sundridge video, eighteenth, kicker-only fourteenth and long-name screenshots at both 320/390: **not captured**, because the test failure triggered the explicit stop rule. Two-line ellipsis, tile nowrap/no-squeeze and horizontal containment remain visually unverified; no claim of exact visual match.