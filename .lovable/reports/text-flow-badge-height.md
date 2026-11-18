# Text-flow AM/PRO badge height

## Delivered
Changed only the two specified `[data-flow="text"]` badge rules in `src/features/pro-verification/pro-label.css`, exactly as supplied. Badge font-size is 7.5px, line-height 1, padding 2.5px 5px, vertical-align 3px, with cloned box decoration; label explicitly remains inline at 7.5px. Base badge/name rules, border, radius, plate, rim and foil are untouched.

## Tests and inventory
Before: **9,071 passing tests**. After: **9,071/9,071 passing tests**, 808 files. No count delta; no case added, deleted or renamed.

Extended existing `src/test/reviewExcerptTextFlow.test.tsx` case **`media-first review body opts every nested member name into text flow`**. All previous assertions remain exactly as written:
```ts
expect(body?.querySelector('[data-flow="text"]')).not.toBeNull();
expect(body?.querySelector('.pro-inline-name:not([data-flow])')).toBeNull();
expect(body?.querySelector('.pro-label')).toHaveAttribute('data-kind', 'am');
expect(container.querySelector('[data-review-who] .pro-inline-name')).not.toHaveAttribute('data-flow');
```
Added stylesheet-text assertions scoped to the exact badge selector:
```ts
expect(badgeRule).toMatch(/(?:^|;)\s*font-size:\s*7\.5px\s*;/);
expect(badgeRule).toMatch(/(?:^|;)\s*line-height:\s*1\s*;/);
```
Reason: explicitly requested CSS contract preventing inherited excerpt font size from enlarging the inline badge. File count **2 before / 2 after**. Default-name snapshot untouched. No other test changed.

Focused command: `npx vitest run src/test/reviewExcerptTextFlow.test.tsx src/test/proLabelMemberRows.test.tsx src/test/cb109MediaFirstEverywhere.test.tsx --maxWorkers=2`: **16/16 passed**, three files.

All four full-suite commands ran sequentially:
| Command | Passed tests | Passed files |
| --- | ---: | ---: |
| `npx vitest run --maxWorkers=2 --shard=1/4` | 2,225 | 202 |
| `npx vitest run --maxWorkers=2 --shard=2/4` | 2,245 | 202 |
| `npx vitest run --maxWorkers=2 --shard=3/4` | 2,273 | 202 |
| `npx vitest run --maxWorkers=2 --shard=4/4` | 2,328 | 202 |

Total **9,071**, zero failures. Known jsdom container-CSS parser warnings in focused coverage did not fail tests.

## Verification limits
Isolated Chromium geometry harness using the actual stylesheet: normal and text-flow badges both **16px**; labels have **0px** centre offset. Text-flow badge/name offset was **−0.5px** in this harness (not claimed as the supplied harness's exact 0px). Excerpt retained clamp **2** and measured **43.0625px** in this environment. This is geometry-only evidence: the isolated screenshot omitted theme token definitions, so plate/foil appearance was not verified by it. Application theme rules were not changed.

Preview harness **2026-11-18T12:24:53Z — build OK**; `git diff --check` passed. No manual build/typecheck run. Ben's physical iPhone check remains outstanding: matching badge height elsewhere, centred AM text, level with name, and two full excerpt lines.

Logs: `/tmp/text-flow-badge/focused.log`, `shard1.log`, `shard2.log`, `shard3.log`, `shard4.log`. Geometry script: `/tmp/browser/text-flow-badge/check_badge.py`.