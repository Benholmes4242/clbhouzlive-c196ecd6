# DEFAULT_B1 — complete

## Scope and files
- `src/features/chrome-v2/registry.ts`: only DEFAULT_SPEC gains `scrim: 'soft'` and `condense: true`; adjacent fallback comments corrected. Explicit registry entries verified byte-identical against the pre-edit copy.
- `src/test/headerB1.test.tsx`: authorised obsolete case replaced by three rule cases, plus one NotFound render/fold case; required imports added.
- `src/test/tourOverviewBand.test.tsx`: authorised obsolete case replaced by three rule cases; registry imports added.
- `roadmap.md`: task and completed verification.
- `DEFAULT_B1_REPORT.md`: this report.
- Project memory: `mem://features/chrome/default-b1.md` added and `mem://index.md` linked, recording the user's fallback and legacy-code preservation requirements.

No other product code changed. Unreachable non-condense branches remain. No guest-browsing, review-wizard, news-page, round-plot, SQL, migration, migration-file, deployed RPC/edge-function, feed_config, native or Median changes; round_pool_cap remains 30. No publication.

## Every replaced case and quoted diffs
1. `headerB1.test.tsx`: **GI1 non-condense guest capsule remains byte-identical through nav changes** replaced because `/settings` now takes the shared fallback; the old radius/glass/transition and byte-identity expectations encoded an unreachable route state. Replacement independently checks the unregistered default, all explicit island rules, and no-island `/messages`.
2. `tourOverviewBand.test.tsx`: **other routes have no opt-in fade and retain canonical glass** replaced for the same fallback change; replacement independently checks those same three rules.

No additional existing test was rewritten, renamed or deleted. Both complete diffs (including imports and the new NotFound case) follow.

### headerB1.test.tsx
```diff
--- headerB1.before
+++ headerB1.after
@@ -1,7 +1,7 @@
 import React from 'react';
 import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
 import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
-import { MemoryRouter, useLocation } from 'react-router-dom';
+import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
 import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
 
 vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
@@ -32,6 +32,8 @@
 import { useIslandsCondensed } from '@/features/chrome-v2/useIslandsCondensed';
 import { renderHook } from '@testing-library/react';
 import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
+import { CHROME_REGISTRY, resolveChrome } from '@/features/chrome-v2/registry';
+import NotFound from '@/pages/NotFound';
 import { readFileSync } from 'node:fs';
 
 
@@ -91,12 +93,44 @@
     expect(guest?.style.padding).toBe('0px 6px 0px 16px'); expect(guest?.style.gap).toBe('12px');
     expect(join.style.borderRadius).toBe('12px'); expect(join.style.height).toBe('34px'); expect(join.style.padding).toBe('0px 16px');
   });
-  it('GI1 non-condense guest capsule remains byte-identical through nav changes', async () => {
-    mocks.guest = true; mount('/settings');
-    const guest = document.querySelector<HTMLElement>('[data-guest-island]'); const before = guest?.outerHTML;
-    expect(guest?.style.borderRadius).toBe('23px'); expect(guest?.style.background).toBe('rgba(14, 14, 16, 0.84)');
-    expect(guest?.style.transition).toBe(''); expect(screen.getByRole('button', { name: 'Join free' }).style.borderRadius).toBe('17px');
-    await move(150); expect(guest?.outerHTML).toBe(before);
+  it('DEFAULT_B1 unregistered paths resolve to the soft condensing logo default', () => {
+    expect(resolveChrome('/no-such-page', new URLSearchParams())).toEqual({
+      chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: false, scrim: 'soft', condense: true,
+    });
+  });
+  it('DEFAULT_B1 every explicit island rule retains soft condensing chrome', () => {
+    const islands = CHROME_REGISTRY.filter(rule => rule.spec.chrome === 'island');
+    expect(islands.length).toBeGreaterThan(0);
+    for (const rule of islands) expect(rule.spec).toMatchObject({ scrim: 'soft', condense: true });
+  });
+  it('DEFAULT_B1 messages renders neither an island nor a soft fade', () => {
+    expect(resolveChrome('/messages', new URLSearchParams()).chrome).toBe('none');
+    mount('/messages');
+    expect(document.querySelector('[data-chrome="island"]')).toBeNull();
+    expect(document.querySelector('[data-chrome="island-scrim-soft"]')).toBeNull();
+  });
+  it('DEFAULT_B1 NotFound renders a soft-fade logo squircle and folds on scroll', async () => {
+    // NotFound intentionally logs a 404; keep that expected diagnostic local.
+    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
+    try {
+      render(<QueryClientProvider client={client()}><MemoryRouter initialEntries={['/no-such-page']}><ChromeIsland /><Routes><Route path="*" element={<NotFound />} /></Routes></MemoryRouter></QueryClientProvider>);
+      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
+      const left = screen.getByRole('button', { name: 'Go to home' });
+      const right = document.querySelector<HTMLElement>('[data-island-right]');
+      const wordmark = left.querySelector<HTMLImageElement>('img[src*="wordmark"]');
+      const search = screen.getByRole('button', { name: 'Search' });
+      expect(document.querySelectorAll('[data-chrome="island-scrim-soft"]')).toHaveLength(1);
+      expect(left.style.borderRadius).toBe('16px'); expect(right?.style.borderRadius).toBe('16px');
+      expect(left.style.background).toBe('rgba(14, 14, 16, 0.55)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.55)');
+      expect(wordmark?.style.maxWidth).toBe('64px');
+      await move(150);
+      expect(wordmark?.style.maxWidth).toBe('0'); expect(search).toHaveAttribute('aria-hidden', 'true');
+      expect(left.style.padding).toBe('0px 7px'); expect(left.style.height).toBe('46px');
+      expect(left.style.borderRadius).toBe('16px'); expect(right?.style.borderRadius).toBe('16px');
+      expect(left.style.background).toBe('rgba(14, 14, 16, 0.84)'); expect(right?.style.background).toBe('rgba(14, 14, 16, 0.84)');
+      expect(document.querySelectorAll('[data-chrome="island-scrim-soft"]')).toHaveLength(1);
+      await move(130); expect(wordmark?.style.maxWidth).toBe('64px'); expect(search).not.toHaveAttribute('aria-hidden');
+    } finally { diagnostic.mockRestore(); }
   });
   it('GI1 Log in restores after upward scroll and retains auth navigation', async () => {
     const Location = () => <output data-testid="location">{useLocation().pathname}</output>;
```

### tourOverviewBand.test.tsx
```diff
--- tourOverviewBand.before
+++ tourOverviewBand.after
@@ -26,6 +26,7 @@
 vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
 
 import { ChromeIsland } from '@/features/chrome-v2/ChromeIsland';
+import { CHROME_REGISTRY, resolveChrome } from '@/features/chrome-v2/registry';
 import { readFileSync } from 'node:fs';
 
 /* BRIEF_TOUR_OVERVIEW_BAND — '/tourhub' fade at rest, shared band past 24px. */
@@ -62,12 +63,21 @@
     mount('/tourhub');
     expect(layer('island-scrim-soft')?.style.transition).toBe('');
   });
-  it('other routes have no opt-in fade and retain canonical glass', () => {
-    mount('/settings');
+  it('DEFAULT_B1 unregistered paths resolve to the soft condensing logo default', () => {
+    expect(resolveChrome('/no-such-page', new URLSearchParams())).toEqual({
+      chrome: 'island', left: { kind: 'logo' }, tone: 'dark', bleed: false, scrim: 'soft', condense: true,
+    });
+  });
+  it('DEFAULT_B1 every explicit island rule retains soft condensing chrome', () => {
+    const islands = CHROME_REGISTRY.filter(rule => rule.spec.chrome === 'island');
+    expect(islands.length).toBeGreaterThan(0);
+    for (const rule of islands) expect(rule.spec).toMatchObject({ scrim: 'soft', condense: true });
+  });
+  it('DEFAULT_B1 messages renders neither an island nor a soft fade', () => {
+    expect(resolveChrome('/messages', new URLSearchParams()).chrome).toBe('none');
+    mount('/messages');
+    expect(layer('island')).toBeNull();
     expect(layer('island-scrim-soft')).toBeNull();
-    const left = document.querySelector<HTMLElement>('[aria-label="Go to home"]');
-    expect(left?.style.background).toBe('rgba(14, 14, 16, 0.84)');
-    expect(left?.style.transition).toBe('');
   });
   it('legacy band and fades have no remaining route consumers or rendered layers', () => {
     const src = readFileSync('src/features/chrome-v2/ChromeIsland.tsx', 'utf8');
```

## New cases and test reconciliation
Both files gain these three replacement cases:
- **DEFAULT_B1 unregistered paths resolve to the soft condensing logo default**
- **DEFAULT_B1 every explicit island rule retains soft condensing chrome**
- **DEFAULT_B1 messages renders neither an island nor a soft fade**

`headerB1.test.tsx` additionally gains **DEFAULT_B1 NotFound renders a soft-fade logo squircle and folds on scroll**. It mounts real NotFound through a wildcard Route with real ChromeIsland, QueryClientProvider and MemoryRouter, registers the existing nav scroller, checks one persistent fade, both 16px radii, glass 0.55 → 0.84, wordmark/search folding, 46px height and upward-scroll restoration. Only NotFound's intentional console-error diagnostic is locally suppressed; restored in finally. No new translation mocks.

Before: **6,450 tests / 575 files**, the last CASE_CLASH_1 full-suite baseline.
After: **6,455 tests / 575 files**, all executed and passed, no skipped tests reported.
- `headerB1.test.tsx`: **13 → 16** (+3): one old case → three replacement cases (+2), one NotFound case (+1). The existing three-row it.each remains unchanged.
- `tourOverviewBand.test.tsx`: **6 → 8** (+2): one old case → three replacement cases.
- All other files: zero count delta. Total **+5 tests / +0 files**.

## Commands and results
Focused: `bunx vitest run src/test/headerB1.test.tsx src/test/tourOverviewBand.test.tsx --maxWorkers=2`: **24/24**, 2 files.
Full commands: `bunx vitest run --shard=N/4 --maxWorkers=2`, individually for N=1,2,3,4, stopping on failure.

| Shard | Files passed | Tests passed |
|---|---:|---:|
| 1/4 | 144 | 1,638 |
| 2/4 | 144 | 1,535 |
| 3/4 | 144 | 1,638 |
| 4/4 | 143 | 1,644 |
| Total | 575 | 6,455 |

**0 failures and 0 Vitest unhandled errors.** Full output preserved under `/tmp/default-b1/focused.log` and `shard1.log` through `shard4.log`; no failing shard occurred. Temporary logs do not persist across sandbox resets.

Automatic preview build: latest observed entry **2026-11-03T21:16:24Z — build OK**. No manual build/typecheck run per workspace policy. Runtime telemetry file unavailable; that is not a claim of fresh live-browser validation.

## Pre-existing failures and verification limits
No pre-existing failure reproduced in this full run. Historical cleared stops, not current failures:
- `roundNotificationOverlay.test.ts:11`: missing HB6 `condense` and `scrim` expectation.
- `tourPlayoffShortenedEvents.test.tsx`: three page cases (pulse-live awaiting playoff, pulse-completed awaiting playoff, ordinary finished event) lacked QueryClientProvider; “No QueryClient set, use QueryClientProvider to set one”.
- `headerB1.test.tsx:97`: obsolete `/discover` non-condense example, expected 23px, received 16px; subsequently changed to `/settings`. DEFAULT_B1 now authorises replacing that fallback expectation.
- `tourOverviewBand.test.tsx:65–66`: obsolete non-condense example, subsequently `/settings`; replaced here under explicit authority.
- `g2aCourseTabs.test.tsx:104`: jsdom discarded env() padding; already cleared by source check.
- `g2fActivityHeader.test.tsx:36/67`: “Missing observer”; already cleared by anchor targeting and observer-registration waits.
- Historical G2B bundling case-only siLadder filename clash: resolved by CASE_CLASH_1.

All affected tests pass in the complete run. No live authenticated browser or visual parity claim: external_unmanaged authentication is unavailable, and this task's folding verification used the real-component test harness.
