# HEADER_B1 / B1.1 — verified tests and Chromium fixture

Implemented the three-route opt-in soft fade, nav-signal folds, accessibility gating and route-only glass with the user-ruled brief padding and 300ms geometry /200ms opacity. Guest right source and bottom navigation remain untouched. The historical CSS-variable stop is resolved by the user-authorized B1.1 code shape.

## Historical stop (resolved)
Command: `bunx vitest run src/test/headerB1.test.tsx src/test/tourOverviewBand.test.tsx src/test/islandsRound2.test.tsx src/test/tourIsland.test.tsx src/test/islandsNav.test.tsx --maxWorkers=2`
Result: **55 passed /57 executed, 2 failures /5 files**. No separate Vitest unhandled-error result. Full output `/tmp/header-b1/focused.log`.
- `src/test/headerB1.test.tsx:70:35`: `AssertionError: expected '' to be 'var(--island-rest-glass)' // Object.is equality`
- `src/test/tourOverviewBand.test.tsx:45:34`: `AssertionError: expected '' to be 'calc(var(--sat, 0px) + 96px)' // Object.is equality`
These new assertions inspect CSS-variable styles that this jsdom environment discards. No assertions were loosened or rerun after the completed-edit failures. All other55 cases pass. No pre-existing test failure observed in the focused scope; full suite unrun.

## Counts
Before **6,234 /556 files**. Candidate inventory **6,244 /557**, NOT a passing total. `headerB1.test.tsx` adds10 cases. `tourOverviewBand.test.tsx` stays6 (4 authorized replacements; last2 unchanged). `islandsRound2.test.tsx` stays8 (1 authorized replacement; other7 unchanged). No test deletions or file renames. B1.1 rerun passes all four shards, recorded below.

## Files
- src/features/chrome-v2/registry.ts: three flags, remove unused legacy scrim/scrolledWordmark types; other rules unchanged.
- src/features/chrome-v2/ChromeIsland.tsx: remove unused legacy fades/band; route-opted glass/wordmark/search/divider folds. HcpCell owns optional divider fold so query/visibility/taps remain canonical.
- src/features/chrome-v2/useIslandsCondensed.ts (new): consumes existing nav snapshot and route opt-in; no added listener. Standalone TourIsland without router remains expanded for compatibility.
- src/features/tourhub/components/TourIsland.tsx: caption/label/chevron fold, same picker anchor and aria-label.
- src/index.css: semantic fade/rest-glass and split-transition tokens.
- src/test/headerB1.test.tsx (new)
- src/test/tourOverviewBand.test.tsx
- src/test/islandsRound2.test.tsx
- roadmap.md, HEADER_B1_REPORT.md; memory header-b1 and index.
Local architecture ownership documented in hook and ChromeIsland headers; root AGENTS remains unchanged at its size budget.

## Authorized replaced tests — original assertions

### `at rest: hero fade at 1 with its existing values, band at 0`
```tsx
expect(hero.style.opacity).toBe('1');
expect(hero.style.height).toBe('140px');
expect(hero.style.pointerEvents).toBe('none');
expect(layer('island-scrim-band')!.style.opacity).toBe('0');
expect(layer('island-scrim')).toBeNull();
```
Why: HEADER_B1 explicitly replaces legacy band/rest fades and flips the scrolled-only wordmark into nav-direction condensation.

### `scrolled: band at 1 with the Clubhouse values, fade at 0; reverses back`
```tsx
expect(band.style.opacity).toBe('1');
expect(band.style.position).toBe('fixed');
expect(band.style.background).toBe('rgba(10, 10, 12, 0.88)');
expect(band.style.borderBottom.replace(/\s/g, '')).toBe('1pxsolidrgba(255,255,255,0.06)');
expect(band.style.pointerEvents).toBe('none');
expect(layer('island-scrim-hero')!.style.opacity).toBe('0');
expect(layer('island-scrim-hero')!.style.opacity).toBe('1');
expect(layer('island-scrim-band')!.style.opacity).toBe('0');
```
Why: HEADER_B1 explicitly replaces legacy band/rest fades and flips the scrolled-only wordmark into nav-direction condensation.

### `one shared band element in source, with env()/blur values and the reduced-motion transition`
```tsx
expect(src.match(/data-chrome="island-scrim-band"/g)).toHaveLength(1);
expect(src).toContain("(spec.scrim === true || spec.scrim === 'hero') && (");
expect(src).toContain("height: 'calc(var(--sat, 0px) + 68px)'");
expect(src).toContain("background: 'linear-gradient(180deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.25) 55%, rgba(10,10,12,0) 100%)'");
expect(src).toContain("height: 'calc(var(--sat, 0px) + 80px)'");
expect(src).toContain("background: 'linear-gradient(180deg, rgba(10,10,12,0.95) 0%, rgba(10,10,12,0.75) 45%, rgba(10,10,12,0) 100%)'");
expect(src).toContain("backdropFilter: 'blur(20px) saturate(150%)'");
expect(src).toContain("WebkitBackdropFilter: 'blur(20px) saturate(150%)'");
expect(src).toContain("const scrimTransition = REDUCED_MOTION ? 'none' : 'opacity 180ms linear';");
expect(src.match(/transition: scrimTransition/g)?.length).toBe(3);
```
Why: HEADER_B1 explicitly replaces legacy band/rest fades and flips the scrolled-only wordmark into nav-direction condensation.

### `/clubhouse and / keep their rest and band layers`
```tsx
expect(rest.style.opacity).toBe('1');
expect(layer('island-scrim-band')!.style.opacity).toBe('0');
expect(layer('island-scrim-hero')).toBeNull();
```
Why: HEADER_B1 explicitly replaces legacy band/rest fades and flips the scrolled-only wordmark into nav-direction condensation.

### `shows the white wordmark beside the mark only once scrolled`
```tsx
expect(wordmark()).toBeDefined();
expect(image.getAttribute('src')).toBe('/brand/clbhouz-wordmark-white@3x.png');
expect(image.style.height).toBe('20px');
expect(image.style.opacity).toBe('0');
expect(image.style.maxWidth).toBe('0');
expect(view.container.textContent).not.toContain('Clubhouse');
expect(capsule.style.padding).toBe('0px 7px');
expect(capsule.style.gap).toBe('0');
expect(mark?.parentElement).toBe(capsule);
expect(mark?.style.width).toBe('30px');
expect(mark?.style.height).toBe('30px');
expect(capsule.querySelector('span')).toBeNull();
expect(image.style.opacity).toBe('1');
expect(image.style.maxWidth).toBe('64px');
expect(capsule.style.padding).toBe('0px 15px 0px 11px');
expect(capsule.style.gap).toBe('9px');
expect(image.style.opacity).toBe('0');
expect(image.style.maxWidth).toBe('0');
expect(capsule.style.padding).toBe('0px 7px');
```
Why: HEADER_B1 explicitly replaces legacy band/rest fades and flips the scrolled-only wordmark into nav-direction condensation.

Replacement names (same total):
- all three opted routes have one persistent soft fade and no legacy band
- soft fade token holds the signed-off safe-area stops without a transition
- other routes have no opt-in fade and retain canonical glass
- legacy band and fades have no remaining route consumers or rendered layers
- shows the white wordmark at rest and folds it on nav condensation

## Unverified
- Browser mock script failed before reaching either phone: `Locator.screenshot: Timeout 30000ms exceeded`, waiting for `#ph-club` on the file URL. No mock-scroll success claimed. Browser apparatus path `/tmp/browser/header-b1/check_mock.py`; fix script/file delivery rather than product.
- Live browser comparison, connected-index fold case, reduced-motion dedicated regression case and four full shards remain incomplete. Existing reduced-motion branch switches all folds/glass instantly; not browser-verified.
- Authenticated readback remains unavailable for external_unmanaged project. No credentials or bypass requested.
- No SQL, migrations, RPC/edge edits, guest browsing changes, review wizard, news, round plots, feed_config or native/Median changes; round_pool_cap remains30.


## HEADER_B1.1 completion
Changed this correction only: ChromeIsland.tsx (three literal rest backgrounds; fade inline style only zIndex); src/index.css (remove unused rest/fade variables, add one exact fade rule); headerB1.test.tsx; tourOverviewBand.test.tsx; roadmap.md and this report. No guest right, bottom-nav or other product behavior changes.

Focused command above: **57/57, five files**, zero failures. Full suite before6,234/556, after**6,244/557**; +10 exclusively new headerB1 cases from B1, B1.1 itself+0. Commands/results:
- `bunx vitest run --maxWorkers=2 --shard=1/4`: **1,581 /140 files**
- `bunx vitest run --maxWorkers=2 --shard=2/4`: **1,524 /140 files**
- `bunx vitest run --maxWorkers=2 --shard=3/4`: **1,588 /140 files**
- `bunx vitest run --maxWorkers=2 --shard=4/4`: **1,551 /137 files**
All exit0, zero failed tests and zero Vitest unhandled errors. No pre-existing test failures observed. Full outputs retained `/tmp/header-b11/focused.log`, `shard-1.log` through `shard-4.log`. Automatic build**13:31:51Z: build OK**; no manual build/typecheck run.

B1.1 authorized assertion changes (no cases renamed/deleted):
- `opted left and right glass move from rest token to canonical material`: each rest `expect(...style.background).toBe('var(--island-rest-glass)')` becomes `toBe('rgba(14, 14, 16, 0.55)')`; condensed0.84 assertions unchanged. Why: literal inline rest material specified by B1.1.
- `all three opted routes have one persistent soft fade and no legacy band`: removed inline property expectations `height calc(var(--sat, 0px) + 96px)`, `background var(--island-soft-fade)`, `position fixed`, `pointerEvents none`; now asserts exactly one fade per route and compares captured outerHTML before/after scroll. Legacy absence assertions preserved. Why: geometry/paint move to CSS; identical element assertion is no longer a same-live-reference comparison.
- `soft fade token holds the signed-off safe-area stops without a transition`: old global `--island-soft-fade` string assertion becomes exact height and exact four-stop gradient assertions within the extracted `[data-chrome="island-scrim-soft"]` rule. Why: named rule owns geometry/paint; no blank-value acceptance.

### Chromium fixture
Actual ChromeIsland with real QueryClientProvider, MemoryRouter('/') and existing nav scroll store; dependency stubs only intercept fixture requests (no app files, sessions or access bypass). Script `/tmp/browser/header-b11/check_islands.py`; output `output.log`, screenshots `rest.png` /`condensed.png` in same directory. Renderer setup/version issues were apparatus-only and resolved; final page errors**[]**.
With --sat47px, computed fade height**143px** at rest and condensed. Computed background-image identical in both:
```text
linear-gradient(rgba(10, 10, 12, 0.92) 0px, rgba(10, 10, 12, 0.8) 47px, rgba(10, 10, 12, 0.35) 95px, rgba(10, 10, 12, 0) 143px)
```
Both islands computed backgrounds: rest**rgba(14, 14, 16, 0.55)**; condensed**rgba(14, 14, 16, 0.84)**. Left width131→46px; right178→138px. Screenshot inspection: rest shows mark+wordmark and search+divider+Connect+avatar; condensed shows mark only and Connect+avatar, no search/divider. Fade is unchanged; capsules have not shifted vertically. This fixture verifies real components with disconnected member data, not an authenticated hosted member journey.
Earlier mock file-URL scroll check and dedicated reduced-motion/connected-index browser cases remain unverified; no claim of those flows. Existing tour and index regressions passed. Historical stop/limitations paragraphs above are retained as history, superseded by this completion section for shard/build/fixture results.
