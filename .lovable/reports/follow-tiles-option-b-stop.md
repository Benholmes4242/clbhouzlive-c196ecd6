# Option B follow tiles — stopped verification

Implemented the shared 186×300 media-first tiles, poster-only video glyph, canonical photo fade, small/large avatars, figures/Posted stat selection, and batched viewer-scoped media hook. Media and covers settle before source selection, and failed images fall through. Follow/dismiss/session timers, headers and ordering were preserved. The generated get_follow_tile_media type was already present and was not edited. No SQL or migration was written.

## STOP
Command: `bunx vitest run src/test/followTilesB.test.tsx src/test/activeRing.test.tsx src/test/wfFixRail.test.tsx src/test/wf2FeedRail.test.tsx src/test/kindRails.test.tsx --maxWorkers=2`

100 passed, 1 failed, 101 executed, five files.

`src/test/kindRails.test.tsx:212:42`, `follow goes through useToggleFollow`:

```text
AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ]
Number of calls: 0
```

No change or rerun after this unexpected failure. Four full-suite shards were not run. The unchanged test clicks `card.querySelector('button:last-of-type')`; the new nested bottom block means this selector can select a different button. This is a suspected cause only, not a verified repair.

Full-suite baseline: 8,534. Expected inventory after: 8,554 (+20 new cases in followTilesB.test.tsx); not full-suite verified. No tests deleted; eight existing cases renamed/updated for the explicitly authorised tile DOM/stat replacement.

Preview build log: `build OK` at 2026-11-13T19:07:24Z. `git diff --check` passed. Real member/device checks and 390/320 comparisons were not run.

## New test names (20)
- `media beats cover for person`
- `cover beats nothing for person`
- `no media or cover shows no-image avatar for person`
- `media beats cover for business`
- `cover beats nothing for business`
- `no media or cover shows no-image avatar for business`
- `media beats cover for pro`
- `cover beats nothing for pro`
- `no media or cover shows no-image avatar for pro`
- `image errors fall from media to cover to nothing`
- `video is a poster with a play glyph and never a video element`
- `media read error settles and permits cover fallback`
- `makes one media call per mounted rail surface`
- `caps ids at 100 per kind in display order`
- `sorted keys reuse the same cache when ids reorder`
- `waits for both reads when get_follow_tile_media is pending`
- `waits for both reads when get_suggestion_covers is pending`
- `does not call media for signed-out`
- `does not call media for anonymous`
- `does not call media for no-ids`

## Changed test names and exact old assertions

Each hunk below identifies the old and new case names and quotes every removed assertion. Why: the brief explicitly replaces the old tile dimensions, avatar arrangement and activity slot with Option B source-dependent stats and bottom-block structure. All unrelated assertions are retained.

### src/test/activeRing.test.tsx
```diff
diff --git a/src/test/activeRing.test.tsx b/src/test/activeRing.test.tsx
index 6c2b1a5df7..2df167a452 100644
--- a/src/test/activeRing.test.tsx
+++ b/src/test/activeRing.test.tsx
@@ -188,49 +188,43 @@ describe('WhoToFollowRail', () => {
       ? [{ kind: 'person', id: 'u-plain', cover_url: 'https://media.clbhouz.co.uk/cover.jpg', source: 'own' }]
       : h.rows }));
     wrap(<WhoToFollowRail slot={1} />);
-    await waitFor(() => expect(cardOf('David Lang').querySelector('[data-suggestion-cover="image"]')).toBeTruthy());
+    await waitFor(() => expect(cardOf('David Lang').querySelector('[data-follow-tile-source="cover"], .follow-tile-image')).toBeTruthy());
     expect(h.rpc.mock.calls.filter(([name]) => name === 'get_suggestion_covers')).toHaveLength(1);
     expect(h.rpc).toHaveBeenCalledWith('get_suggestion_covers', { p_user_ids: ['u-ring', 'u-plain', 'u-third'], p_business_ids: [] });
-    expect(cardOf('Danny Holmes').querySelector('[data-suggestion-cover="plain"]')).toBeTruthy();
+    expect(cardOf('Danny Holmes').getAttribute('data-follow-tile-source')).toBe('none');
     fireEvent.click(screen.getByRole('button', { name: 'Hide David Lang' }));
     await waitFor(() => expect(screen.queryByText('David Lang')).toBeNull());
     expect(screen.queryByTestId('probe')).toBeNull();
   });
 
-  it('a ringed card shows the when line and its avatar opens the post, not the profile', async () => {
+  it('a card without media keeps its figures and its avatar opens the post, not the profile', async () => {
     wrap(<WhoToFollowRail slot={1} />);
     const btn = await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
-    const when = cardOf('Danny Holmes').querySelector('[data-testid="rail-when"]') as HTMLElement;
-    expect(when.textContent).toMatch(/^Played /);
+    expect(cardOf('Danny Holmes').querySelector('[data-testid="rail-when"]')).toBeNull();
+    expect(cardOf('Danny Holmes').querySelector('[data-testid="rail-figures"]')).not.toBeNull();
     fireEvent.click(btn);
     expect(screen.getByTestId('probe').textContent).toBe('/post/post-9');
   });
-  it('an unringed card has no when line, shows its figures in a 35px slot and no avatar button; cards are 266 tall', async () => {
+  it('a card without activity shows figures and a large avatar without an avatar button', async () => {
     wrap(<WhoToFollowRail slot={1} />);
     await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
     const card = cardOf('David Lang');
     expect(card.querySelector('[data-testid="rail-when"]')).toBeNull();
     expect(card.querySelector('[data-testid="rail-figures"]')).not.toBeNull();
-    expect((card.querySelector('[data-testid="rail-slot"]') as HTMLElement).style.height).toBe('35px');
+    expect(card.querySelector('[data-follow-tile-avatar="large"]')).not.toBeNull();
+    expect(card.querySelector('[data-follow-tile-avatar="small"]')).toBeNull();
     expect(screen.queryByRole('button', { name: "Open David Lang's latest post" })).toBeNull();
-    expect(card.style.height).toBe('266px');
-    expect(cardOf('Danny Holmes').style.height).toBe('266px');
   });
-  it('a ringed card renders a two-line clamped when line, no figures, in a 35px slot; card stays 266', async () => {
+  it('a card with media shows Posted in the stat line instead of activity or figures', async () => {
+    h.rpc.mockImplementation((name: string) => Promise.resolve({ error: null, data: name === 'get_follow_tile_media'
+      ? [{ kind:'person', id:'u-ring', media_type:'image', image_url:'https://media.clbhouz.co.uk/post.jpg', aspect_ratio:1, posted_at:new Date().toISOString() }]
+      : name === 'get_recent_activity' ? h.rows : [] }));
     wrap(<WhoToFollowRail slot={1} />);
-    await screen.findByRole('button', { name: "Open Danny Holmes's latest post" });
+    await waitFor(() => expect(cardOf('Danny Holmes').getAttribute('data-follow-tile-source')).toBe('media'));
     const card = cardOf('Danny Holmes');
-    const when = card.querySelector('[data-testid="rail-when"]') as HTMLElement;
-    // jsdom drops -webkit-line-clamp, so the clamp is read from the source.
-    expect(when.style.overflow).toBe('hidden');
-    expect(when.style.lineHeight).toBe('15px');
-    const src = (await import('node:fs')).readFileSync(
-      (await import('node:path')).resolve(__dirname, '../features/find-people/WhoToFollowRail.tsx'), 'utf8');
-    expect(src).toMatch(/data-testid="rail-when"[\s\S]{0,400}WebkitLineClamp: 2/);
-    expect(when.style.whiteSpace).toBe('');
+    expect(card.querySelector('[data-testid="rail-when"]')?.textContent).toBe('Posted just now');
     expect(card.querySelector('[data-testid="rail-figures"]')).toBeNull();
-    expect((card.querySelector('[data-testid="rail-slot"]') as HTMLElement).style.height).toBe('35px');
-    expect(card.style.height).toBe('266px');
+    expect(card.querySelector('[data-follow-tile-avatar="small"]')).not.toBeNull();
   });
 });
 

```

### src/test/kindRails.test.tsx
```diff
diff --git a/src/test/kindRails.test.tsx b/src/test/kindRails.test.tsx
index 9a3890af73..250c72cd88 100644
--- a/src/test/kindRails.test.tsx
+++ b/src/test/kindRails.test.tsx
@@ -150,7 +150,7 @@ describe('kind card copy', () => {
     expect(kindFigures(row({ followers: 1 }))?.def).toBe('1 follower');
     expect(kindFigures(row({}))).toBeNull();
   });
-  it('the slot shows amber activity first, else figures, else stays empty', async () => {
+  it('the slot shows figures without media, even with recent activity, else stays empty', async () => {
     h.kind.pro = [
       row({ user_id: 'a', display_name: 'Active Al', mutual_count: 3 }),
       row({ user_id: 'b', display_name: 'Mutual Mo', mutual_count: 3 }),
@@ -160,12 +160,13 @@ describe('kind card copy', () => {
     wrap(<KindRail kind="pro" />);
     const cardOf = (n: string) => screen.getByText(n).closest('[role="button"]') as HTMLElement;
     await screen.findByText('Active Al');
-    await waitFor(() => expect(cardOf('Active Al').querySelector('[data-testid="rail-when"]')).not.toBeNull());
-    expect(cardOf('Active Al').querySelector('[data-testid="rail-figures"]')).toBeNull();
+    await waitFor(() => expect(h.rpc.mock.calls.some(c => c[0] === 'get_follow_tile_media')).toBe(true));
+    expect(cardOf('Active Al').querySelector('[data-testid="rail-when"]')).toBeNull();
+    expect(cardOf('Active Al').querySelector('[data-testid="rail-figures"]')).not.toBeNull();
     expect(cardOf('Mutual Mo').querySelector('[data-testid="rail-figures"]')?.textContent).toBe('Followed by {{count}} you follow');
     const empty = cardOf('Empty Ed').querySelector('[data-testid="rail-slot"]') as HTMLElement;
     expect(empty.textContent).toBe('');
-    expect(empty.style.height).toBe('35px');
+    expect(empty.classList.contains('follow-tile-stat')).toBe(true);
   });
   it('pro cards carry the PRO label and no card has a Creator chip', async () => {
     const { container, unmount } = wrap(<KindRail kind="pro" />);

```

### src/test/wf2FeedRail.test.tsx
```diff
diff --git a/src/test/wf2FeedRail.test.tsx b/src/test/wf2FeedRail.test.tsx
index 0845fcf098..0165c5f28d 100644
--- a/src/test/wf2FeedRail.test.tsx
+++ b/src/test/wf2FeedRail.test.tsx
@@ -281,7 +281,7 @@ describe('WhoToFollowRail', () => {
     expect(container.firstChild).toBeNull();
   });
 
-  it('shows the rail reason lines and figures, with blank figures keeping their height', () => {
+  it('shows the rail reason lines and figures, with blank figures keeping the stat line', () => {
     h.people = [
       person({ user_id: 'u-club', display_name: 'Niall Devins' }),
       person({ user_id: 'u-played', display_name: 'Chris Leeson', reason_type: 'played_with', reason_course_name: 'Sundridge Park Golf Club (West)', handicap_index: 12.8, rounds_total: 41 }),
@@ -299,7 +299,7 @@ describe('WhoToFollowRail', () => {
     // Rob has no figures and no when line: the slot stays blank but keeps its 35px height.
     const robCard = screen.getByText('Rob Bennett').closest('[role="button"]') as HTMLElement;
     const slot = robCard.querySelector('[data-testid="rail-slot"]') as HTMLElement;
-    expect(slot.style.height).toBe('35px');
+    expect(slot.classList.contains('follow-tile-stat')).toBe(true);
     expect(slot.textContent).toBe('');
   });
 

```

### src/test/wfFixRail.test.tsx
```diff
diff --git a/src/test/wfFixRail.test.tsx b/src/test/wfFixRail.test.tsx
index 2e3abc91f1..3219fdef5c 100644
--- a/src/test/wfFixRail.test.tsx
+++ b/src/test/wfFixRail.test.tsx
@@ -109,30 +109,20 @@ afterEach(() => {
 });
 
 describe('FIX §1 — one vertical rhythm, button pinned to the bottom', () => {
-  it('golfer and business cards share the fixed height and a bottom-pinned Follow button', () => {
+  it('golfer and business cards share the fixed tile and bottom block Follow button', () => {
     renderRail();
     for (const name of ['Sundridge Park GC', 'Golfer Ann', 'Golfer Bob', 'Golfer Cat']) {
       const card = cardOf(name);
-      expect(card.style.height).toBe('266px');
-      expect(card.style.display).toBe('flex');
-      expect(card.style.flexDirection).toBe('column');
-      expect(followButtonOf(name).style.marginTop).toBe('auto');
+      expect(card.querySelector('.follow-tile-bottom')?.contains(followButtonOf(name))).toBe(true);
+      expect(card.querySelector('[data-follow-tile-avatar="large"]')).not.toBeNull();
     }
   });
 
-  it('a missing reason or figures leaves its fixed space empty', () => {
+  it('a missing reason or figures keeps the bottom block and leaves the stat line empty', () => {
     renderRail();
-    /* Golfer Bob: no handicap, no rounds → empty figures; popular Cat: no
-       club reason content difference — both blocks keep their fixed heights. */
-    const bob = cardOf('Golfer Bob');
-    const blocks = Array.from(bob.querySelectorAll('div')).map((d) => (d as HTMLElement).style);
-    expect(blocks.some((s) => s.height === '34px')).toBe(true);
-    expect(blocks.some((s) => s.height === '35px')).toBe(true);
-    const bizCard = cardOf('Sundridge Park GC');
-    const bizBlocks = Array.from(bizCard.querySelectorAll('div')).map((d) => (d as HTMLElement).style);
-    expect(bizBlocks.some((s) => s.height === '34px')).toBe(true);
-    expect(bizBlocks.some((s) => s.height === '35px')).toBe(true);
-    expect(bizCard.querySelector('[data-testid="rail-figures"]')).not.toBeNull();
+    expect(cardOf('Golfer Bob').querySelector('[data-testid="rail-slot"]')?.textContent).toBe('');
+    expect(cardOf('Golfer Bob').querySelector('.follow-tile-bottom')).not.toBeNull();
+    expect(cardOf('Sundridge Park GC').querySelector('[data-testid="rail-figures"]')).not.toBeNull();
   });
 });
 

```

## Git diff --stat (tracked implementation)
```text
 roadmap.md                                      |   5 +
 src/features/find-people/WhoToFollowRail.tsx    | 250 +++++-------------------
 src/features/find-people/useSuggestionCovers.ts |   9 +-
 src/index.css                                   |   6 +
 src/test/activeRing.test.tsx                    |  36 ++--
 src/test/kindRails.test.tsx                     |   9 +-
 src/test/wf2FeedRail.test.tsx                   |   4 +-
 src/test/wfFixRail.test.tsx                     |  24 +--
 8 files changed, 98 insertions(+), 245 deletions(-)
```

New files, not included in the tracked-only statistics above: FollowTileImage.tsx, follow-tiles.css, useFollowTileMedia.ts, followTilesB.test.tsx, and this report. Final staged statistics are captured in the commit output.
