# Featured round / Round of the week — Option B

## Result and limits
Shared FeaturedRoundCard now uses the signed-off gold rule/kicker, normal author/follow row and 1.5px gold avatar ring. Figure feats opt into the fourth cell; word feats and Under par keep AWARDS. Home feed appends the existing shared round footer, celebrated line, share/comment controls and canonical played-with sheet. Home rail and Explore keep their own engagement row.

No SQL, migrations, feed_config, round_pool_cap, trigger, NET rules, follow handling, competition/medal reads or scorecard-opening changes. Ordinary ScorePostBody callers preserve their defaults. The canonical CompetitionMark stays shared and unchanged; the featured-only CSS exception resolves its inherited 800 inline weight to 700, implementing the brief's explicit no-800 rule without changing sibling hosts. Chromium checked every resolved descendant weight. jsdom does not honour stylesheet !important over that inline weight, so case (e) checks the scoped rule and all remaining resolved weights; real Chromium covers the shared mark too.

## Tests — complete sequential output
Baseline: **9,402 tests across 842 files**. Final: **9,407/9,407 across 843 files**. All four shards were separate commands, strictly sequential; no failed tests or shard reruns.

| Command | Files | Tests | Complete output |
|---|---:|---:|---|
| `bunx vitest run --shard=1/4` | 211 | 2,311/2,311 | [shard-1.log](shard-1.log) |
| `bunx vitest run --shard=2/4` | 211 | 2,292/2,292 | [shard-2.log](shard-2.log) |
| `bunx vitest run --shard=3/4` | 211 | 2,353/2,353 | [shard-3.log](shard-3.log) |
| `bunx vitest run --shard=4/4` | 210 | 2,451/2,451 | [shard-4.log](shard-4.log) |

Focused final run: eight files, **72/72**, command and complete output in [focused.log](focused.log): `bunx vitest run src/test/featuredRoundOptionB.test.tsx src/test/featuredRoundChamp.test.tsx src/test/featuredRoundNet.test.tsx src/test/featuredRoundCorrections.test.tsx src/test/roundCardFollowCB29.test.tsx src/test/cb111RoundScoreLed.test.tsx src/test/featuredRoundTrigger.test.ts src/test/holeTilesBoardBuild.test.tsx`.

### Inventory reconciliation — every difference
Exactly five additions in the one new file `src/test/featuredRoundOptionB.test.tsx`:
- (a) course record renders the kicker, gold gross Record cell and no AWARDS.
- (b) birdie run renders words in the kicker and retains AWARDS.
- (c) Home rail keeps Round of the week and its own like/comment row.
- (d) Home feed carries played-with, the round celebrated line and the shared footer.
- (e) no element in the featured card uses font-weight 800.

No tests deleted; no other test-count changes. Existing case renames below contribute zero to the count.

## Every authorized existing test rewrite
Only `featuredRoundChamp.test.tsx` and `featuredRoundNet.test.tsx` were modified among pre-existing tests. The complete diff below quotes every changed assertion, selector and case name. All scoring assertions outside the removed header feature remain unchanged.

### featuredRoundChamp.test.tsx
Suite label `FEATURED_ROUND_OPTION_A` → `FEATURED_ROUND_OPTION_B`; documentation follows the explicitly replaced presentation.

1. `course record renders the gross figure with the COURSE RECORD unit` → `course record renders its kicker and gross fourth cell with the Record label`.
   - `container.querySelector('[data-featured-feat-figure="true"]')!` → `container.querySelector('[data-round-score-feat="true"]')` with an explicit missing-cell guard.
   - `expect(feat.textContent?.toUpperCase()).toContain('COURSEDETAIL.FEATURED.COURSERECORD')` → `expect(feat.textContent).toContain('Record')` and `expect(container.querySelector('[data-featured-feat-name]')?.textContent).toBe('courseDetail.featured.courseRecord')`.
   - Why: gross moves into the gold fourth cell, Record labels it, and Course record moves to the kicker. The `74` assertion is unchanged.
2. `hole in one renders the words alone, no unit` → `hole in one renders the words in the kicker, no gold cell`.
   - Words target `[data-featured-feat-words="true"]` → `[data-featured-feat-name]`, with a missing-kicker guard; existing words assertion stays identical.
   - `expect(container.querySelector('[data-featured-feat-figure="true"]')).toBeNull()` → `expect(container.querySelector('[data-round-score-feat="true"]')).toBeNull()`.
   - Why: the words now belong to the kicker; this word feat must not replace AWARDS.
3. `birdie run renders the run words alone` → `birdie run renders the run words in the kicker`.
   - Words target `[data-featured-feat-words="true"]` → `[data-featured-feat-name]`, with a missing-kicker guard; `expect(words.textContent).toBe('courseDetail.featured.birdieRun')` stays unchanged.
   - Why: only the removed header location changes.

### featuredRoundNet.test.tsx
`danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; header feat is the net to-par −2` → `danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; kicker is Under par without a duplicate gold cell`.
- Removed header selector `[data-featured-feat-figure="true"]`.
- `expect(feat.textContent).toContain('−2')` / `expect(feat.textContent).not.toContain('−3')` → `expect(container.querySelector('[data-featured-feat-name]')?.textContent).toBe('courseDetail.featured.underPar')` / `expect(container.querySelector('[data-round-score-feat="true"]')).toBeNull()`.
- Why: the brief removes the redundant tier-3 figure; NET remains authoritative in the unchanged body. The existing NET 68/−2, GROSS 67/−3 and HANDICAP +1 assertions stay unchanged.

## Screenshots and observed checks
[All eight final captures](captures.png). Each uses the actual FeedCard or HomeRail/ConnectedFeaturedRoundCard/FeaturedRoundCard and shared ScorePostBody, footer, avatar, CompetitionMark and played-with UI; supplied read data is isolated fixture input, **not authenticated live round evidence**. All eight have no horizontal/card overflow, no resolved 800 weights, the correct fourth-cell/AWARDS split and the correct host footer split. Share callback and played-with sheet open/close are checked in Home feed. Browser page errors: zero. Final preview harness: build OK at 2026-11-21T09:47:35Z.

| State | 390 | 320 |
|---|---|---|
| Home feed course record | [Capture](feed-record-390.png) | [Capture](feed-record-320.png) |
| Home rail course record | [Capture](rail-record-390.png) | [Capture](rail-record-320.png) |
| Home feed birdie run | [Capture](feed-birdies-390.png) | [Capture](feed-birdies-320.png) |
| Home rail birdie run | [Capture](rail-birdies-390.png) | [Capture](rail-birdies-320.png) |

The date renders through the unchanged canonical formatter (`Fri, Nov 20`) rather than the mock's illustrative `Fri 20 Nov`. The frozen shared body, live hole-grade/NET plot algorithm and award artwork retain their actual build appearance instead of adopting mock-only drawings. Played-with faces use canonical fallbacks when fixture portraits are absent; names ellipsise at the end of the single line. The neutral shared footer is retained, rather than adopting mock-only footer colours. Authentication is external_unmanaged; genuine authenticated save/readback checks are unavailable and have not been represented by fixtures.

## Files changed
- `src/index.css`: named gold/rule tokens and featured-only CompetitionMark weight exception.
- `src/features/explore-magazine/FeaturedRoundCard.tsx`: shared Option B header/kicker, feat selection, normal identity/follow/byline, no local 800 styles or redundant header figure.
- `src/components/feed/ScorePostBody.tsx`: opt-in fourth `featCell`, identical defaults elsewhere.
- `src/components/feed/FeedCard.tsx`: reuse the normal round footer and canonical played-with components on the featured Home branch.
- `src/locales/en/courses.json`: new Record, Joint record, points-feat, signed-vs-handicap feat and Vs hcp labels; existing keys remain.
- `src/test/featuredRoundChamp.test.tsx`, `src/test/featuredRoundNet.test.tsx`: narrowly authorized presentation assertions above.
- `src/test/featuredRoundOptionB.test.tsx`: five required new cases, real providers, no react-i18next mock.
- `roadmap.md`: completed work and verification status.
- `.lovable/reports/featured-round-option-b/`: report, exact diff, complete logs, capture setup, results and final screenshots.

## Complete old → new diff
```diff
diff --git a/src/test/featuredRoundChamp.test.tsx b/src/test/featuredRoundChamp.test.tsx
index 211f696b3b..72a02c9991 100644
--- a/src/test/featuredRoundChamp.test.tsx
+++ b/src/test/featuredRoundChamp.test.tsx
@@ -1,8 +1,7 @@
 /**
- * FEATURED_ROUND_OPTION_A — the Featured round / Round of the week card is
- * the standard score post body under a champion-block header. No photograph,
- * wash, gold frame, pill or static trace; the header carries the gold ring,
- * the per-surface label, the name, "<date> · Following" and the feat figure.
+ * FEATURED_ROUND_OPTION_B — the shared score post is marked once in gold.
+ * No photograph, wash, gold frame, pill or static trace; the kicker names
+ * the feat and figure feats replace only the fourth stat cell.
  */
 import React from 'react';
 import { afterEach, describe, expect, it, vi } from 'vitest';
@@ -45,7 +44,7 @@ function mount(patch: Partial<FeaturedRound> = {}, props: Record<string, unknown
   );
 }
 
-describe('FEATURED_ROUND_OPTION_A', () => {
+describe('FEATURED_ROUND_OPTION_B', () => {
   it('renders no photograph, pill, gold frame or static trace', () => {
     const { container } = mount();
     expect(container.querySelector('img')).toBeNull();
@@ -66,23 +65,27 @@ describe('FEATURED_ROUND_OPTION_A', () => {
     expect(champ.textContent).not.toContain('courseDetail.featured.label');
   });
 
-  it('course record renders the gross figure with the COURSE RECORD unit', () => {
+  it('course record renders its kicker and gross fourth cell with the Record label', () => {
     const { container } = mount();
-    const feat = container.querySelector('[data-featured-feat-figure="true"]')!;
+    const feat = container.querySelector('[data-round-score-feat="true"]');
+    if (!feat) throw new Error('Missing featured fourth cell');
     expect(feat.textContent).toContain('74');
-    expect(feat.textContent?.toUpperCase()).toContain('COURSEDETAIL.FEATURED.COURSERECORD');
+    expect(feat.textContent).toContain('Record');
+    expect(container.querySelector('[data-featured-feat-name]')?.textContent).toBe('courseDetail.featured.courseRecord');
   });
 
-  it('hole in one renders the words alone, no unit', () => {
+  it('hole in one renders the words in the kicker, no gold cell', () => {
     const { container } = mount({ tier: 1, reason: 'hole_in_one', holes_in_one: 1 });
-    const words = container.querySelector('[data-featured-feat-words="true"]')!;
+    const words = container.querySelector('[data-featured-feat-name]');
+    if (!words) throw new Error('Missing feat kicker');
     expect(words.textContent).toBe('courseDetail.featured.holeInOne');
-    expect(container.querySelector('[data-featured-feat-figure="true"]')).toBeNull();
+    expect(container.querySelector('[data-round-score-feat="true"]')).toBeNull();
   });
 
-  it('birdie run renders the run words alone', () => {
+  it('birdie run renders the run words in the kicker', () => {
     const { container } = mount({ tier: 3, reason: 'birdie_run', birdie_run: 5 });
-    const words = container.querySelector('[data-featured-feat-words="true"]')!;
+    const words = container.querySelector('[data-featured-feat-name]');
+    if (!words) throw new Error('Missing feat kicker');
     expect(words.textContent).toBe('courseDetail.featured.birdieRun');
   });
 
diff --git a/src/test/featuredRoundNet.test.tsx b/src/test/featuredRoundNet.test.tsx
index 3dff0b232f..89b27fc029 100644
--- a/src/test/featuredRoundNet.test.tsx
+++ b/src/test/featuredRoundNet.test.tsx
@@ -58,7 +58,7 @@ function mount(patch: Partial<FeaturedRound> = {}) {
   );
 }
 
-it('danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; header feat is the net to-par −2', () => {
+it('danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; kicker is Under par without a duplicate gold cell', () => {
   h.net = { netScore: 68, courseHandicap: -1 };
   const { container } = mount();
   // The big body figure is NET, never the gross −3.
@@ -69,10 +69,9 @@ it('danny.akers1: body NET 68 −2, GROSS 67 −3, HANDICAP +1; header feat is t
   expect(gross.textContent).toContain('67');
   expect(gross.querySelector('[data-round-score-gross-topar="true"]')!.textContent).toBe('−3');
   expect(container.querySelector('[data-round-score-handicap="true"]')!.textContent).toContain('+1');
-  // Tier 3 low_round: the header feat is the NET to-par, never gross.
-  const feat = container.querySelector('[data-featured-feat-figure="true"]')!;
-  expect(feat.textContent).toContain('−2');
-  expect(feat.textContent).not.toContain('−3');
+  // Tier 3 low_round: the NET hero alone owns its figure.
+  expect(container.querySelector('[data-featured-feat-name]')?.textContent).toBe('courseDetail.featured.underPar');
+  expect(container.querySelector('[data-round-score-feat="true"]')).toBeNull();
 });
 
 it('the body line is the net line and its end point agrees with the NET cell', () => {

```
