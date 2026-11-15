# Admin Command centre v3 — stopped at focused verification

## Status
Implementation is saved, but NOT fully verified. No assertions were edited after the failures. Full shards were not started under the stop rule. Admin screenshots were not attempted, as instructed.

## Unexpected failures (tool wording)
Command: `bunx vitest run src/test/adminCommandCentreV3.test.tsx src/features/admin/AdminShell.test.tsx --maxWorkers=2`
35 executed: 32 passed, 3 failed. V3: 30 collected, 27 passed, 3 failed. Unchanged AdminShell: 5 passed.

1. `src/test/adminCommandCentreV3.test.tsx:77:292`, helper `:38:54`, “shows only six club rows and removes the revenue strip”:
   `TestingLibraryElementError: Found multiple elements with the text: Clubs`
2. `src/test/adminCommandCentreV3.test.tsx:78:653`, “links the first four clubhouse posts and renders true-minus under-par colour”:
   `AssertionError: expected '' to be 'var(--cc3-under)' // Object.is equality`
3. `src/test/adminCommandCentreV3.test.tsx:84:535`, helper `:38:54`, “keeps v2 panels when only engine fails and suppresses stale live active and retention figures”:
   `TestingLibraryElementError: Found multiple elements with the text: Clubs`

The first and third checks use a title selector matching both the Clubs top card and panel. The colour assertion observes an empty jsdom style value. These are reported, not silently repaired. Log: `/tmp/cc3-focused.log`.

## Count reconciliation
The brief's 8,383 baseline predates intervening builds. Latest verified full-suite baseline: **8,797** (Tour slot final-round follow-up). Authorised deletion: 16 cases in `src/test/adminCommandCentreV2.test.tsx`. Added: 30 cases in `src/test/adminCommandCentreV3.test.tsx`. Expected inventory: **8,811 = 8,797 − 16 + 30**, not a verified passing full-suite total. Full-suite shards unrun. No known intermittent or pre-existing named failures appeared in this focused run.

## Files
Changed:
- `src/features/admin/pages/DashboardPage.tsx`: dense v3 panel order, October six-chip status, shared delta, engine cards, collapsed task/body lists, linked stats/posts, cohort rules; inherited system font; AdminShell unchanged.
- `src/index.css`: scoped semantic CC3 token definitions; adminTheme unchanged.
- `roadmap.md`: request and stop state.
Added:
- `src/features/admin/hooks/useCcEngine.ts`: typed admin RPC reader, 60s cache, previous-window placeholder, refresh listener.
- `src/features/admin/pages/cc3Rules.ts`: shared comparisons, duration/sample guards, coverage grouping and leak calculation.
- `src/features/admin/pages/commandCentreV3.css`: page-scoped mock geometry and responsive wrapping, no font declaration.
- `src/test/adminCommandCentreV3.test.tsx`: 30 replacement cases.
- `.lovable/reports/admin-command-centre-v3-stop.md`: this report.
Deleted:
- `src/test/adminCommandCentreV2.test.tsx`: explicitly authorised v2 layout suite, 16 cases listed below.

## Checks and limits
- Harness latest: `build OK`, `2026-11-15T17:01:33Z`.
- `git diff --check` passed.
- Existing v2 hook, AdminShell, Supabase generated types and adminTheme unchanged.
- No SQL, migrations, deployed RPC/edge function changes, feed_config or round_pool_cap changes.
- No guest/review/news/round-plot/native changes.
- Admin access, real data readback, on-device rendering and 320px overflow are unverified. Ben will check on device.
- Semantic token values are defined in global CSS and referenced by page-local constants rather than hardcoded feature colours, to preserve the project token rules.

## Authorised deleted tests and original assertions
Each case was deleted only because clause 17 explicitly replaces the entire v2 layout suite with v3; corresponding v3 coverage follows the revised layout/data rules. No existing passing test was otherwise modified.

### hides zero tasks, names them in Clear, fills only the first action and totals visible counts
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('hides zero tasks, names them in Clear, fills only the first action and totals visible counts', () => {
    mount(); const p = panel('Do now'); const q = within(p);
    expect(q.queryByRole('button', { name: /Clubs ready to pitch/ })).toBeNull();
    expect(p.textContent).toContain('Clear: Clubs to pitch · First rounds · Unreacted posts · Played, not connected · Inbox');
    expect(p.textContent).toContain('10 things · most urgent first');
    expect(q.getByRole('link', { name: 'MATCH' })).toHaveStyle({ background: t.ink });
    expect(q.getByRole('link', { name: 'DM' })).toHaveStyle({ background: 'transparent' });
    expect(q.getByText('Langley Park')).toBeTruthy();
  });
```

### computes members Doing 9 behind Needed 17 over 51 weeks
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('computes members Doing 9 behind Needed 17 over 51 weeks', () => {
    mount(); const q = within(panel('The target')); const doing = q.getAllByText('Doing')[0].nextElementSibling; const needed = q.getAllByText('Needed')[0].nextElementSibling;
    expect(doing?.textContent).toBe('9 a week'); expect(doing).toHaveStyle({ color: t.danger }); expect(needed?.textContent).toBe('17 a week');
  });
```

### finds Connected as the largest leak and suppresses zero not-placed
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('finds Connected as the largest leak and suppresses zero not-placed', () => {
    mount(); const p = panel('The loop'); expect(p.textContent).toContain('Biggest leak · joined → connected'); expect(p.textContent).toContain('54could connect today'); expect(p.textContent).toContain('41waiting on a handicap body'); expect(p.textContent).not.toContain("we can't place");
  });
```

### includes the third leak cell for three not-placed members
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('includes the third leak cell for three not-placed members', () => {
    if (state.data) state.data.loop.not_placed = 3; mount(); expect(panel('The loop').textContent).not.toContain("3we can't place");
  });
```

### selects 28 and 90 days for the v2 hook and persists the window
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('selects 28 and 90 days for the v2 hook and persists the window', () => {
    mount(); fireEvent.click(screen.getByRole('tab', { name: '28D' })); expect(state.calls.at(-1)).toBe(28); fireEvent.click(screen.getByRole('tab', { name: '90D' })); expect(state.calls.at(-1)).toBe(90); expect(localStorage.getItem('admin.cc.window')).toBe('90');
  });
```

### marks live and in-talks bodies without a Not known chip
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('marks live and in-talks bodies without a Not known chip', () => {
    mount(); const q = within(panel('Who can connect')); expect(q.getByText('England Golf').parentElement?.textContent).toBe('England GolfLIVE85'); expect(q.getByText('Scottish Golf').parentElement?.textContent).toBe('Scottish GolfIN TALKS14'); expect(q.getByText('No body named').parentElement?.textContent).toBe('No body named4');
  });
```

### withholds the day-30 percentage when the sample is three
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('withholds the day-30 percentage when the sample is three', () => {
    if (state.data) state.data.retention.d30_connected_n = 3; mount(); const p = panel('Retention'); expect(within(p).getByText('too few yet (3)').previousElementSibling?.textContent).toBe('—');
  });
```

### reports normal systems when all five chips are healthy
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('reports normal systems when all five chips are healthy', () => { mount(); expect(screen.getByRole('button', { name: /All systems normal/ })).toBeTruthy(); });
```

### reports one system needing attention without Echo
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('reports one system needing attention without Echo', () => { state.pushStatus = 'red'; mount(); expect(screen.getByRole('button', { name: /1 needs attention/ })).toBeTruthy(); });
```

### contains no forbidden accent tokens in changed production files
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('contains no forbidden accent tokens in changed production files', () => {
    for (const file of ['features/admin/pages/DashboardPage.tsx', 'features/admin/hooks/useCommandCentreV2.ts']) expect(readFileSync(resolve(__dirname, '..', file), 'utf8')).not.toMatch(/t\.(?:brand|warn)|#F7931E|#FFA83A/i);
  });
```

### keeps every panel empty rather than inventing zeros after an RPC failure
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('keeps every panel empty rather than inventing zeros after an RPC failure', () => { state.error = true; const { container } = mount(); expect(container.querySelectorAll('[aria-label="Unavailable"]')).toHaveLength(9); expect(screen.queryByText('£0')).toBeNull(); });
```

### renders plain post grammar for an unreacted post item
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('renders plain post grammar for an unreacted post item', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.do_now.unreacted = { posts: 1, items: [{ post_id: 'unreacted', name: 'Pat Green', kind: 'post', hours: 8 }] };
    mount(); const p = panel('Do now'); fireEvent.click(within(p).getByRole('button', { name: /Posts nobody has reacted to/ }));
    expect(p.textContent).toContain('post · 8h'); expect(p.textContent).not.toContain('post post');
  });
```

### limits five Clubhouse top posts to the first four rows
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('limits five Clubhouse top posts to the first four rows', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.clubhouse.top = Array.from({ length: 5 }, (_, i) => ({ post_id: `post-${i}`, name: `Member ${i}`, kind: 'post', course: null, gross: null, to_par: null, likes: i, comments: 0 }));
    mount(); const q = within(panel('Clubhouse')); expect(q.getAllByRole('button')).toHaveLength(4);
    expect(q.getByText('Member 3')).toBeTruthy(); expect(q.queryByText('Member 4')).toBeNull();
  });
```

### labels the unknown coverage row No body named without changing its source value
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('labels the unknown coverage row No body named without changing its source value', () => {
    mount(); const q = within(panel('Who can connect')); expect(q.getByText('No body named')).toBeTruthy(); expect(q.queryByText('Not known')).toBeNull(); expect(state.data?.coverage[2].body).toBe('Not known');
  });
```

### shows no one yet today for a zero hourly peak
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('shows no one yet today for a zero hourly peak', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.hours.peak = 0; mount(); const p = panel('Right now'); expect(p.textContent).toContain('no one yet today'); expect(p.textContent).not.toContain('peak today 0');
  });
```

### keeps the Joined to Connected leak at exactly two figures when not placed is positive
Reason: authorised replacement of the v2 suite; its assertions encode the old layout or its old test scaffolding.
```tsx
  it('keeps the Joined to Connected leak at exactly two figures when not placed is positive', () => {
    if (!state.data) throw new Error('Missing fixture');
    state.data.loop.not_placed = 9; mount(); const q = within(panel('The loop'));
    const grid = q.getByText('could connect today').parentElement?.parentElement;
    expect(grid?.children).toHaveLength(2); expect(q.getByText('waiting on a handicap body')).toBeTruthy(); expect(q.queryByText("we can't place")).toBeNull();
  });
```

## Added v3 cases (30)
- requests 7, 28 and 90 days from both RPCs using the local IANA zone
- shows healthy status without a six-cell grid
- shows the broken status and six October health cells
- renders Members, Golfers and Clubs figures and destinations
- marks target pace good when doing reaches needed
- changes the Golfers comparison wording with the window
- renders previous 13 to current 6 as a muted true-minus change with no arrow
- renders previous 28 to current 38 as a good rounded 36 percent
- uses level after rounding and for equal small samples
- starts every Do now row collapsed and toggles without linking stuck items
- folds zero Do now rows into lowercase Clear names
- limits task items to five and formats unreacted ages in hours or days
- renders four engine tiles with their live figures and destinations
- uses dashes for zero engine sample sizes and sent zero
- hides connection change below three samples and reaction share at zero eligible
- formats engine waits at minute, hour and day boundaries
- requires both connection samples to have three observations and colours faster/slower
- omits a sparse engine sparkline when fewer than two weeks are known
- omits Joined from loop rows and picks the largest Joined-to-Connected leak
- uses Stopped here and an empty third cell for a later leak
- starts handicap bodies collapsed then maps chips, merges plain bodies and leaves unknown last
- shows only six club rows and removes the revenue strip
- links the first four clubhouse posts and renders true-minus under-par colour
- does not invent creator links and marks zero posts
- shows dash with n so far below five day-30 observations and neutral measured figures
- leaves unreached and zero-member cohort cells empty
- contains no text sizes below 10px or amber in the changed page files
- suppresses both RPCs on error without invented zeros
- keeps v2 panels when only engine fails and suppresses stale live active and retention figures
- uses the engine hook previous-window placeholder and refetches both RPCs on the shell event
