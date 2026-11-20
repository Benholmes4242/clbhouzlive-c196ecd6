# Overview upcoming/live type scale — stopped

## Scope and preservation
Implemented the brief-listed upcoming/live sizes using HERO_POS_TYPE and HERO_TOT_TYPE from HeroBoardRows and existing completedWeek rhythm variables. Fact figures use the shared type in the two builders rather than restating its numbers in CSS. Completed card branch (from the alternate grid through the file end) was compared with HEAD and is byte-identical; completed rendered name 12.5px/700 and avatar 28px pass the added check. Shared intro uses an upcoming-only conditional so completed output is unchanged. PhotoBand, HeroBoardRows, completedWeek.css, recap, Leaderboards/full sheet, copy, reads and all Tour font declarations are untouched. The explicit ≤340 fact margins and existing short-name/face-hiding rules are retained. Non-live, non-upcoming LeadersGroup retains its old presentation.

No SQL, migrations or feed_config changes; round_pool_cap unchanged.

## Inventory
Last complete baseline: 9,301. Six new cases in overviewTypeScale.test.tsx, no deleted cases: expected 9,307. Existing files keep their case counts: tourLiveStates 47, upcomingHeroNewOrder 8, tourOverviewMergedAiry 17. New cases:
- (a) live board has 31px rows, 13px names and 22px avatars
- (b) live facts use 15px/700 figures and 800 labels
- (c) LastYearRow has a 13px name
- (d) upcoming picks have 13px names and 26px avatars
- (e) upcoming sections use the existing section-gap token
- (f) completed picks retain their name and avatar sizes

## Every changed assertion (old → new)
All updates below encode superseded listed sizes/spacing only.

### tourLiveStates.test.tsx
Case “board faces use canonical hairline and header/row values match the ruling”:
- `toContain('size={26}')` → `toContain('size={22}')`.
- `toContain('minHeight: 22, fontSize: 9.5')` → `toContain('fontSize: 10')`; header no longer carries the retired minimum.
- `toContain("letterSpacing: '0.1em'")` → `toContain("letterSpacing: '0.08em'")`.
- `toContain('fontSize: 14, fontWeight: 600')` → `toContain('fontSize: 13, fontWeight: 600')`.
- `toContain('fontSize: 12.5, fontWeight: 700')` → `toContain('fontSize: 12, fontWeight: 700')`.
- `toContain("minHeight: 44, padding: '0 20px'")` → `toContain("minHeight: 31, padding: '0 20px'")`.

### upcomingHeroNewOrder.test.tsx
- “facts row is the flex space-between band with four cells”: exact CSS `margin:20px 20px 0` → `margin:var(--hero-section-gap) 20px 0`; flex assertion retained.
- “upcoming picks are full-name rows sorted by tee time with 32px avatars” renamed to “…with 26px avatars”; `toMatch(/32px|"32"/)` → `toMatch(/26px|"26"/)`.
- “computed: course sits 30px under Last year and fact cells carry no padding” renamed to “computed: course uses shared section gap under Last year and fact cells carry no padding”; `expect(getComputedStyle(course).paddingTop).toBe('30px')` → `expect(style.textContent).toContain('.upcoming-sec{padding:var(--hero-section-gap) 20px 0')`. Source-token assertion avoids jsdom's unresolved custom-property shorthand; remaining assertions preserved.

### tourOverviewMergedAiry.test.tsx
Two old-value failures discovered in shard 2 fall inside the brief's advance authorisation:
- “upcoming picks are 48px rows under a 30px section top with no hairline” renamed to “…under the shared section gap with no hairline”; `expect(picks.style.paddingTop).toBe('30px')` → `expect(picks.getAttribute('style')).toContain('padding: var(--hero-section-gap) 20px 10px')`. **Replacement currently fails** because jsdom omits the unresolved padding declaration entirely, returning null for style. Not adjusted again after the unexpected failure.
- “omits undrawn unknown facts and uses the upcoming history grammar”: row `style.height` equal to `36px` → row `style.minHeight` equal to `31px`.

## Commands and outcomes
- `bunx vitest run src/test/overviewTypeScale.test.tsx src/test/tourLiveStates.test.tsx src/test/upcomingHeroNewOrder.test.tsx src/test/cb58LeadersGroup.test.tsx`: 110/110 passed; /tmp/overview-scale-focused.log.
- `bunx vitest run --shard=1/4`: 2,279 passed, 208 files, 225.14s; /tmp/overview-scale-shard-1.log.
- `bunx vitest run --shard=2/4`: 2,269 passed / 2 failed (2,271 executed), 235.63s; /tmp/overview-scale-shard-2.log. Failures: tourOverviewMergedAiry.test.tsx:91:36 `AssertionError: expected '' to be '30px' // Object.is equality`; :112:81 `AssertionError: expected '' to be '36px' // Object.is equality`. Both were authorised obsolete spacing values, updated as listed.
- `bunx vitest run src/test/tourOverviewMergedAiry.test.tsx`: 16 passed / 1 failed, 7.32s; /tmp/overview-scale-authorised.log. New failure at :91:41, case “Merged Airy lower sections > upcoming picks are 48px rows under the shared section gap with no hairline”, 60ms:

```text
AssertionError: the given combination of arguments (null and string) is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a string
 ❯ src/test/tourOverviewMergedAiry.test.tsx:91:41
expect(picks.getAttribute('style')).toContain('padding: var(--hero-section-gap) 20px 10px');
```

This file-alone run supplies the isolated result: 16/17. STOP observed; no further assertion adjustment, no shards 3–4 and no complete passing total claimed. The next step needs authorisation to assert the literal PicksBlock source token instead of jsdom's dropped inline shorthand.

Latest harness signal: build OK, 2026-11-20T12:19:26Z. Manual typecheck not run (platform harness owns it). Browser/320px and physical iPhone checks not run before the stop; narrow containment is unverified.

## Files changed
- `roadmap.md`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LastYearRow.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/LivePicksBlock.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx`
- `src/features/tourhub/components/overview-v3/HybridHeroBands/liveStates.css`
- `src/features/tourhub/components/overview-v3/LiveOverviewSections.tsx`
- `src/features/tourhub/components/overview-v3/UpcomingOverviewSections.tsx`
- `src/styles/hybrid-hero.css`
- `src/test/tourLiveStates.test.tsx`
- `src/test/tourOverviewMergedAiry.test.tsx`
- `src/test/upcomingHeroNewOrder.test.tsx`
- `src/test/overviewTypeScale.test.tsx`
