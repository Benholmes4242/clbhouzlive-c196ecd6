# Review Played with stop ruling — stopped at shard one

## Scope
Applied only the four exact CSS media offsets, corresponding chip/panel data attributes and caller selection, authorised bottom assertion replacements and keyboard-open fixture. `played-with.css` is imported by PostGolfTags; local ownership is documented in its header (root AGENTS.md has no available budget). Place/hole bottom 50 and fullscreen bottom auto / calc(100% + 8px) remain unchanged. No SQL, migrations, feed_config, round_pool_cap, writes or notification changes.

Media panels use the same attribute as their chips as expressly requested. The previous ordinary-post video panel default was 12px; it now shares media-video as required. No device visual equivalence is claimed. Browser and authenticated verification were not performed before the stop. Harness build OK at 2026-11-20T18:44:08Z.

## Commands and full retained output
| Command | Executed | Passed | Failed | Files | Duration | Full output |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `bunx vitest run src/test/reviewPlayedWith.test.tsx src/test/playedWithTags.test.tsx` | 36 | 36 | 0 | 2 | 7.59s | focused.log |
| `bunx vitest run --shard=1/4` | 2,293 | 2,280 | 13 | 209 | 176.38s | shard-1.log |
| `bunx vitest run --shard=2/4` | Not run | — | — | — | — | Stop rule |
| `bunx vitest run --shard=3/4` | Not run | — | — | — | — | Stop rule |
| `bunx vitest run --shard=4/4` | Not run | — | — | — | — | Stop rule |

## Inventory
Last verified full-suite pass: **9,329**. The intervening review work dc1aa2cd85 added **23 cases in reviewPlayedWith.test.tsx**, including expanded it.each cases (names in the preceding review report). Focused output confirms 23/23 review cases and 13/13 post cases pass.

Expected inventory before/after this ruling: **9,352 → 9,352**, unchanged; **9,329 + 23 = 9,352**. This is NOT a verified complete total. No tests added, deleted or renamed; no test files deleted or renamed. Only the four named cases below were modified.

## Authorised old → new changes and reasons
- `reviewPlayedWith.test.tsx > (e) review photo chip and upward panel clear the measured glass strip`: chip inline bottom `calc(var(--review-glass-h, -12px) + 18px)` → chip data-pw-offset review and exact CSS rule; panel inline bottom equality with chip → panel data-pw-offset review. Reason: jsdom drops inline calc/var. Rows and strip assertions unchanged.
- `reviewPlayedWith.test.tsx > (e) review video chip clears the mute tap area by eight pixels`: inline bottom `calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)` → data-pw-offset review-video and exact CSS rule. Same jsdom limitation.
- `reviewPlayedWith.test.tsx > (i) tagged viewer gets Remove me on the review and deletes their review tag`: pointerDown with button 0/ctrlKey false → trigger.focus() and keyDown Enter. All assertions/findByRole/removal action unchanged. Reason: Radix keyboard open works without PointerEvent; case passes.
- `playedWithTags.test.tsx > (d) stacking with a place chip > place chip lifts to bottom 50 above the played-with chip`: played-with inline bottom 12px → data-pw-offset media and exact media CSS rule. Reason: bottom now belongs to CSS. `expect(chip.style.bottom).toBe('50px')` for the place chip unchanged. No other Played with inline bottom assertion exists in this file.

The exact test diff quotes all replaced and new assertions:
```diff
diff --git a/src/test/playedWithTags.test.tsx b/src/test/playedWithTags.test.tsx
index f7867d3cb1..ce24dae692 100644
--- a/src/test/playedWithTags.test.tsx
+++ b/src/test/playedWithTags.test.tsx
@@ -123,7 +123,8 @@ describe('(d) stacking with a place chip', () => {
     const v = mount(p, { playedWith: PEOPLE, slideTags: tags as never });
     const chip = q(v.container, '[data-testid="slide-tag-chip"]')!;
     expect(chip.style.bottom).toBe('50px');
-    expect(q(v.container, '[data-testid="played-with-chip"]')!.style.bottom).toBe('12px');
+    expect(q(v.container, '[data-testid="played-with-chip"]')!.getAttribute('data-pw-offset')).toBe('media');
+    expect(src('src/components/feed/played-with.css')).toContain('[data-pw-offset="media"]{bottom:12px}');
   });
 });
 
diff --git a/src/test/reviewPlayedWith.test.tsx b/src/test/reviewPlayedWith.test.tsx
index 91224bb3e3..917b281998 100644
--- a/src/test/reviewPlayedWith.test.tsx
+++ b/src/test/reviewPlayedWith.test.tsx
@@ -1,6 +1,7 @@
 /** Review tags reuse the post UI, write only after publication, and notify only
  * through the server's tag/mention triggers. Real composer/providers retained. */
 import React from 'react';
+import { readFileSync } from 'node:fs';
 import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
 import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter, Route, Routes } from 'react-router-dom';
@@ -93,6 +94,7 @@ const people = [{ userId: 'a', name: 'Thomas Holmes', username: 'a', avatarUrl:
 const candidate: WithCandidate = { id: 'b', name: 'Danny Holmes', username: 'b', avatarUrl: null, sameRound: false, lastInteraction: '' };
 const failure = { code: '23503', message: 'Foreign key refused', details: 'Member key missing', hint: 'Check identity' };
 const markup = '@[Thomas](u:11111111-1111-1111-1111-111111111111)';
+const pwCss = readFileSync('src/components/feed/played-with.css', 'utf8');
 const required = (root: ParentNode, selector: string): HTMLElement => { const node = root.querySelector<HTMLElement>(selector); if (!node) throw new Error(`Missing ${selector}`); return node; };
 const providers = (node: React.ReactNode, client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })) => <QueryClientProvider client={client}><MemoryRouter>{node}</MemoryRouter></QueryClientProvider>;
 beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); h.actor = 'personal'; h.reviewRows = []; h.postRows = []; h.withError = null; h.deleteError = null; h.newMedia = false;
@@ -158,12 +160,14 @@ describe('review Played with', () => {
     await waitFor(() => expect(h.mentions).toHaveBeenCalledWith({ sourceType: 'review', sourceId: 'review-new', content: markup, mentionerId: 'author' }));
   });
   it('(e) review photo chip and upward panel clear the measured glass strip', () => {
-    const view = card(); const chip = required(view.container, '[data-testid="played-with-chip"]'); expect(chip.style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px)');
-    fireEvent.click(chip); const panel = required(view.container, '[data-testid="played-with-panel"]'); expect(panel.style.bottom).toBe(chip.style.bottom);
+    const view = card(); const chip = required(view.container, '[data-testid="played-with-chip"]'); expect(chip).toHaveAttribute('data-pw-offset', 'review');
+    expect(pwCss).toContain('[data-pw-offset="review"]{bottom:calc(var(--review-glass-h, -12px) + 18px)}');
+    fireEvent.click(chip); const panel = required(view.container, '[data-testid="played-with-panel"]'); expect(panel).toHaveAttribute('data-pw-offset', 'review');
     expect(panel.querySelectorAll('[data-played-with-row]')).toHaveLength(2); expect(view.container.querySelector('[data-review-score-strip]')).not.toBeNull();
   });
   it('(e) review video chip clears the mute tap area by eight pixels', () => {
-    const view = card(post(true, true)); expect(required(view.container, '[data-testid="played-with-chip"]').style.bottom).toBe('calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)');
+    const view = card(post(true, true)); expect(required(view.container, '[data-testid="played-with-chip"]')).toHaveAttribute('data-pw-offset', 'review-video');
+    expect(pwCss).toContain('[data-pw-offset="review-video"]{bottom:calc(var(--review-glass-h, -12px) + 18px + 44px + 8px)}');
   });
   it('(f) review without media opens the sheet from both faces and byline', async () => {
     const view = card(post(false)); expect(view.container.querySelector('[data-testid="played-with-chip"]')).toBeNull();
@@ -182,7 +186,7 @@ describe('review Played with', () => {
     expect(result.withByReview.get('review-1')).toEqual([{ reviewId: 'review-1', userId: 'a', name: 'Thomas Holmes', username: 'a', avatarUrl: null }]);
   });
   it('(i) tagged viewer gets Remove me on the review and deletes their review tag', async () => {
-    const view = card(post(), { currentUserId: 'a' }); const trigger = screen.getByRole('button', { name: 'Post options' }); fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
+    const view = card(post(), { currentUserId: 'a' }); const trigger = screen.getByRole('button', { name: 'Post options' }); trigger.focus(); fireEvent.keyDown(trigger, { key: 'Enter' });
     fireEvent.click(await screen.findByRole('menuitem', { name: 'Remove me' }));
     await waitFor(() => expect(h.deleted).toHaveBeenCalledWith('review_with', [['review_id', 'review-1'], ['user_id', 'a']]));
     expect(view.container.querySelector('[data-review-post-card]')).not.toBeNull();
```

## Unexpected failures — no repair and no rerun
All 13 fail on mount in two untouched test files at the same expression, `post.mediaItems[activeMediaIndex]`. The mediaItems read was introduced in the preceding review work; this ruling changed only its offset values. No fixture or application guard was repaired after failure; shards 2–4 await a further ruling.

Verbatim tool errors, file, line, names and totals:
```text
FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (a) media review keeps course, first region and shared scores on media only; caption retains body and CTA
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (a2) region falls back to subcountry then country without joining parts
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (b) no-media and standard reviews keep underneath scores and 700 course weight
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (c) REVIEW exists in media, no-media and standard headers
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (c2) several posts use one active-membership batch, stamps only active course and reuse per-course cache
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (c3) pending membership never stamps until settled
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (c4) failed membership has no stamp
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (d) strip passes pointer events through except canonical course door
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (e) video mute and duration use measured strip offset with unchanged six-pixel fallback; dots retain ten
 FAIL  src/test/feedReviewGlass.test.tsx > feed review glass > (f) no name and no scores omit both glass and fade
 FAIL  src/test/reviewPostScoreCompact.test.tsx > review post — score row below the course > the overall figure is 26 / 700 with no negative tracking
 FAIL  src/test/reviewPostScoreCompact.test.tsx > review post — score row below the course > the overall leads from the left edge of an auto 1fr grid, behind a hairline
 FAIL  src/test/reviewPostScoreCompact.test.tsx > review post — score row below the course > the overall is white at 9.2 and 8.2
TypeError: Cannot read properties of undefined (reading '0')
 ❯ ReviewPostCard src/components/feed/ReviewPostCard.tsx:105:37
    103|   const people = post.actorType !== 'business' && playedWith?.length ?…
    104|   const [withSheetOpen, setWithSheetOpen] = useState(false);
    105|   const withBottom = post.mediaItems[activeMediaIndex]?.type === 'vide…
       |                                     ^
    106|   const mediaRef = useRef<HTMLDivElement>(null);
    107|   const glassRef = useRef<HTMLDivElement>(null);
 ❯ renderWithHooks node_modules/react-dom/cjs/react-dom.development.js:15486:18
 ❯ mountIndeterminateComponent node_modules/react-dom/cjs/react-dom.development.js:20103:13
 ❯ beginWork node_modules/react-dom/cjs/react-dom.development.js:21626:16
 ❯ beginWork$1 node_modules/react-dom/cjs/react-dom.development.js:27465:14
 ❯ performUnitOfWork node_modules/react-dom/cjs/react-dom.development.js:26599:12
 ❯ workLoopSync node_modules/react-dom/cjs/react-dom.development.js:26505:5
 ❯ renderRootSync node_modules/react-dom/cjs/react-dom.development.js:26473:7
 ❯ recoverFromConcurrentError node_modules/react-dom/cjs/react-dom.development.js:25889:20
 ❯ performConcurrentWorkOnRoot node_modules/react-dom/cjs/react-dom.development.js:25789:22

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/13]⎯


 Test Files  2 failed | 207 passed (209)
      Tests  13 failed | 2280 passed (2293)
   Start at  18:41:09
   Duration  176.38s (transform 62.45s, setup 224.54s, collect 790.76s, tests 125.60s, environment 1061.02s, prepare 166.48s)
```
