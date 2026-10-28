# Account tile — STOP report

## Result
The mobile avatar now opens AccountGlance on GlanceShell, with actor identity/switching, white unread counts, personal/business actions and two-tap sign out. The desktop dropdown is unchanged. The old sheet and its exclusive components are removed; sheetState.ts and YourCourseAnalyticsSheet.tsx remain.

**STOP: five new failures. No assertion or app correction was made after the run.**

Command: `bunx vitest run`
Last reported green baseline: **4,007 tests / 429 files** (from the preceding wordmark report).
This run: **4,004 executed; 3,999 passed; 5 failed / 429 files (427 passed, 2 failed)**.
No pre-existing failures appeared in this run.

Reconciliation: 4,007 − 11 profileSheetRebuild − 10 sheetTopV5 − 3 profileSheetViewProfileWhite − 4 sheetHandicapRow + 18 accountGlance + 7 accountGlanceWiring = **4,004**.
Files: 429 − 2 deleted test files + 2 new test files = **429**.
profileSheetV3.test.tsx remains unchanged (five cases) because all cases exercise retained shared readers/chart rather than the removed sheet.
canvasSurfaceToken.test.ts count is unchanged: removed only the deleted sheet path from its dark-skeleton inventory; assertion `expect(readFileSync(resolve(process.cwd(), path), 'utf8'), path).not.toContain('clb-shimmer-light')` remains for every surviving path.

## Exact new failures
- ` src/test/accountGlance.test.tsx > signed-off account tile behavior > identity uses the personal destination`
  - `src/test/accountGlance.test.tsx:28:55`
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Ben View profile"`
- ` src/test/accountGlance.test.tsx > signed-off account tile behavior > identity uses the business destination`
  - `src/test/accountGlance.test.tsx:33:28`
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Club Golf club · View page"`
- ` src/test/accountGlance.test.tsx > signed-off account tile behavior > three actors expand a list with the non-active sum and collapse on switching`
  - `src/test/accountGlance.test.tsx:52:24`
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Shop 4 unread"`
- ` src/test/accountGlanceWiring.test.tsx > avatar account wiring > closes before navigating to the personal profile`
  - `src/test/accountGlanceWiring.test.tsx:48:28`
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Ben View profile"`
- ` src/test/accountGlanceWiring.test.tsx > avatar account wiring > closes before navigating to the active business slug`
  - `src/test/accountGlanceWiring.test.tsx:53:28`
  - `TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Club Golf club · View page"`

The runner reports accessible button names with a leading `?` from the real SquircleAvatar fallback: `? Ben View profile`, `? Club Golf club · View page`, and `? Shop 4 unread`. The five new exact-name queries do not match those names. These failures have not been corrected; authorization is needed before changing their queries. No component was modified to accommodate a mock.

## Checks and limitations
Latest automatic diagnostic entry: `build 2026-10-28T16:00:30Z — build OK`. No manual build/typecheck was run. Authenticated real-account navigation, switching persistence and signed-off visual comparison remain unverified: browser auth status is `external_unmanaged`. No credentials requested. No further browser checks after the test stop.
No SQL, migrations, migration files, deployed RPC/edge changes, feed_config edits, cap changes or native/Median changes. round_pool_cap remains untouched at 30.

## Changed / added files
- src/features/chrome-v2/AccountGlance.tsx — new tile, confirmation timer, one-event-per-open tracking.
- src/features/chrome-v2/account-glance.css — scoped geometry and semantic colour/ring tokens.
- src/features/chrome-v2/GlanceShell.tsx — broaden anchor type to HTMLElement for existing header anchors; lifecycle unchanged.
- src/features/chrome-v2/ChromeIsland.tsx — expanded avatar state and open ring.
- src/components/header/PostingAsMenu.tsx — mobile tile wiring, actor-aware routes, existing counts, close-first course/invite callbacks; retained analytics sheet.
- src/test/accountGlance.test.tsx — 18 new cases.
- src/test/accountGlanceWiring.test.tsx — seven new cases.
- src/test/profileSheetRebuild.test.tsx — retained three shared-reader cases verbatim; removed 11 retired-surface cases below.
- src/test/sheetTopV5.test.tsx — retained two global vocabulary cases verbatim; removed ten retired-surface cases below.
- src/test/canvasSurfaceToken.test.ts — deleted sheet removed from path inventory only; no case delta.
- AGENTS.md — obsolete HcpStrip ownership pointer replaced by AccountGlance ownership pointer.
- roadmap.md — recorded this task and stop.
- ACCOUNT_TILE_STOP_REPORT.md — this report.
- Project memory index and signed-off account-tile design memory — saved brief constraints.

## Deleted application files
- `src/features/profile-sheet-v2/ProfileSheetV2.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/ActorCards.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/IdentityHeader.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/QuickActionsRow.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/SheetCards.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/PreIndexCards.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/HcpStrip.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/SheetNavGroup.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/sheetCardParts.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.
- `src/features/profile-sheet-v2/components/SignOutRow.tsx` — only production consumer was the retired sheet (including dependencies inside that group); consumer scan completed before deletion.

## Deleted / rewritten test case inventory
Quoted assertions below are from the pre-edit source. All removals are authorized by the brief’s removal of the account-sheet surface, cards, previews and handicap row; shared-reader behavior is preserved.

### profileSheetRebuild.test.tsx
Rewritten only to retain shared/global cases.

- Removed `(a) hidden: no handicap, connect, form or courses card` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(a) hidden: no handicap, connect, form or courses card', () => {
    const s = deriveSheetHcpState({ ...base, hidden: true, connection: { provider: 'england_golf' }, egHandicapIndex: 1.6 });
    expect(s.kind).toBe('hidden');
    const has = cards(s);
    for (const c of ['handicap', 'connect', 'manual', 'syncing', 'failing', 'form', 'courses']) expect(has(c)).toBe(false);
  });
```

- Removed `(b) none: connect card only` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(b) none: connect card only', () => {
    const has = cards(deriveSheetHcpState(base));
    expect(has('connect')).toBe(true);
    expect(has('form') || has('courses') || has('handicap')).toBe(false);
  });
```

- Removed `(c) manual: manual card only, never form or courses` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(c) manual: manual card only, never form or courses', () => {
    const s = deriveSheetHcpState({ ...base, manualHandicapIndex: 14 });
    expect(s).toEqual({ kind: 'manual', index: 14 });
    const has = cards(s);
    expect(has('manual')).toBe(true);
    expect(has('form') || has('courses') || has('connect')).toBe(false);
  });
```

- Removed `(d) connected, no index, no error: syncing; manual figure ignored` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(d) connected, no index, no error: syncing; manual figure ignored', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, manualHandicapIndex: 14 });
    expect(s.kind).toBe('syncing');
    const has = cards(s);
    expect(has('syncing')).toBe(true);
    expect(has('manual') || has('connect') || has('form') || has('courses')).toBe(false);
  });
```

- Removed `(d) connected, no index, sync error: not-syncing card, not the connect card` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(d) connected, no index, sync error: not-syncing card, not the connect card', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf', last_sync_error: 'timeout', last_synced_at: '2026-09-02' } });
    expect(s.kind).toBe('failing');
    const has = cards(s);
    expect(has('failing')).toBe(true);
    expect(has('connect') || has('syncing') || has('form')).toBe(false);
  });
```

- Removed `(e) whs with index: no connected card or form` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('(e) whs with index: no connected card or form', () => {
    const has = cards(deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, egHandicapIndex: 1.6 }));
    expect(has('handicap') || has('form')).toBe(false);
    expect(has('courses')).toBe(false);
    expect(has('connect')).toBe(false);
  });
```

- Removed `unsettled renders nothing` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('unsettled renders nothing', () => {
    const has = cards(deriveSheetHcpState({ ...base, settled: false }));
    expect(has('connect')).toBe(false);
  });
```

- Removed `actor block absent for a single-actor member` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('actor block absent for a single-actor member', () => {
    const { container } = render(<ActorCards currentActor={{ id: '1', type: 'personal' }}
      profiles={[{ id: '1', type: 'personal', name: 'Ben' }]} onSwitchProfile={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
```

- Removed `count only for the non-active actor` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('count only for the non-active actor', () => {
    const { getAllByLabelText } = render(<ActorCards currentActor={{ id: '1', type: 'personal' }}
      profiles={[{ id: '1', type: 'personal', name: 'Ben' }, { id: '2', type: 'business', name: 'clbhouz' }]} onSwitchProfile={() => {}} />);
    expect(getAllByLabelText('3 unread')).toHaveLength(1);
  });
```

- Removed `V.2 trend current resolves ready without a connected card` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('V.2 trend current resolves ready without a connected card', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, trendCurrent: 3.4 });
    expect(s).toEqual({ kind: 'ready', index: 3.4 });
    const { container } = render(
      <SheetCards state={s} history90={[]} bars={bars}
        onNavigate={() => {}} now={Date.parse('2026-10-12')} />,
    );
    expect(container.querySelector('[data-card="handicap"]')).toBeNull();
    expect(container.querySelector('[data-card="syncing"]')).toBeNull();
  });
```

- Removed `connected Handicap row opens the same handicap destination` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('connected Handicap row opens the same handicap destination', () => {
    const go = vi.fn();
    const { container } = render(
      <SheetNavGroup gutter={20} currentActor={{ id: 'p', type: 'personal' }} isAdmin={false}
        businessNames={[]} onNavigate={go} handicap={handicapNavValue({ kind: 'ready', index: 1.6 }, history)} />,
    );
    const first = container.querySelector('button');
    expect(first).not.toBeNull();
    first?.click();
    expect(go).toHaveBeenCalledWith('/handicap');
  });
```

### profileSheetViewProfileWhite.test.tsx
Deleted entire file: exclusively tests removed UI/helper.

- Removed `reads ink, not amber` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('reads ink, not amber', () => {
    const pill = renderPill();
    const actual = norm(pill.style.color || getComputedStyle(pill).color);
    expect([norm(A.INK), norm(hexToRgb(A.INK))]).toContain(actual);
    expect(actual).not.toContain(norm(A.AMBER));
    expect(actual).not.toContain('247');
  });
```

- Removed `is edged with the canonical dark hairline, not the amber border` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('is edged with the canonical dark hairline, not the amber border', () => {
    const pill = renderPill();
    expect(norm(pill.style.border)).toBe(norm(`1px solid ${DARK_HAIRLINE}`));
    expect(norm(pill.style.border)).not.toContain('247');
  });
```

- Removed `keeps its frozen typography, shape and pass-through behaviour` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('keeps its frozen typography, shape and pass-through behaviour', () => {
    const pill = renderPill();
    expect(pill.style.fontSize).toBe('11.5px');
    expect(pill.style.fontWeight).toBe('800');
    expect(pill.style.letterSpacing).toBe('0.04em');
    expect(pill.style.borderRadius).toBe('999px');
    expect(pill.style.padding).toBe('5px 10px 5px 11px');
    expect(pill.style.whiteSpace).toBe('nowrap');
    expect(pill.style.pointerEvents).toBe('none');
  });
```

### sheetHandicapRow.test.tsx
Deleted entire file: exclusively tests removed UI/helper.

- Removed `falling ninety-day history retains the latest index and movement` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('falling ninety-day history retains the latest index and movement', () => {
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, history(3, 1.5)))
      .toEqual({ index: 1.5, subLabel: 'Down 1.5 in ninety days', direction: 'down' });
  });
```

- Removed `rising ninety-day history retains the existing movement` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('rising ninety-day history retains the existing movement', () => {
    expect(handicapNavValue({ kind: 'ready', index: 3 }, history(1.5, 3)))
      .toEqual({ index: 3, subLabel: 'Up 1.5 in ninety days', direction: 'up' });
  });
```

- Removed `fewer than two history points keeps the value without a movement claim` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('fewer than two history points keeps the value without a movement claim', () => {
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, []))
      .toEqual({ index: 1.5, subLabel: undefined, direction: undefined });
    expect(handicapNavValue({ kind: 'ready', index: 1.5 }, history(3, 1.5).slice(1)))
      .toEqual({ index: 1.5, subLabel: undefined, direction: undefined });
  });
```

- Removed `unsettled and unconnected states never expose the handicap row` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('unsettled and unconnected states never expose the handicap row', () => {
    expect(handicapNavValue({ kind: 'unsettled' }, history(3, 1.5))).toBeNull();
    expect(handicapNavValue({ kind: 'none' }, history(3, 1.5))).toBeNull();
    expect(handicapNavValue({ kind: 'manual', index: 14 }, history(3, 1.5))).toBeNull();
  });
```

### sheetTopV5.test.tsx
Rewritten only to retain shared/global cases.

- Removed `absent with one actor` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('absent with one actor', () => {
    const { container } = render(<ActorCards currentActor={me} profiles={[me]} onSwitchProfile={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
```

- Removed `two actors: names the other, shows its count in white, switches` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('two actors: names the other, shows its count in white, switches', () => {
    const sw = vi.fn();
    const { getByText, getByLabelText, queryByText } = render(<ActorCards currentActor={me} profiles={[me, b1]} onSwitchProfile={sw} />);
    expect(getByText('Switch to clbhouz')).toBeTruthy();
    expect(queryByText('Ben')).toBeNull();
    const c = getByLabelText('3 unread') as HTMLElement;
    expect(c.style.background).toBe(render(<span style={{ background: A.INK }} />).container.firstElementChild!.getAttribute('style')!.replace('background: ', '').replace(';', ''));
    fireEvent.click(getByText('Switch to clbhouz'));
    expect(sw).toHaveBeenCalledWith('b1');
  });
```

- Removed `three actors: "Switch actor", summed count, opens list rather than switching` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('three actors: "Switch actor", summed count, opens list rather than switching', () => {
    const sw = vi.fn();
    const { getByText, getByLabelText } = render(<ActorCards currentActor={me} profiles={[me, b1, b2]} onSwitchProfile={sw} />);
    expect(getByLabelText('7 unread')).toBeTruthy();
    fireEvent.click(getByText('Switch actor'));
    expect(sw).not.toHaveBeenCalled();
    expect(getByText('Shop')).toBeTruthy();
  });
```

- Removed `message row picks newest unread and opens its thread` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('message row picks newest unread and opens its thread', () => {
    convs = [conv('old', 2, '2026-10-10T10:00:00Z'), conv('read', 0, '2026-10-12T09:00:00Z'), conv('new', 1, '2026-10-11T10:00:00Z')];
    const { container, nav } = mount();
    const row = container.querySelector('[data-wait-row="message"]')!;
    expect(row.textContent).toContain('new');
    fireEvent.click(row);
    expect(nav).toHaveBeenCalledWith('/messages/new');
  });
```

- Removed `nothing unread: quiet pair only` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('nothing unread: quiet pair only', () => {
    const { container } = mount();
    expect(container.querySelector('[data-wait-row]')).toBeNull();
    expect(container.querySelectorAll('[data-plain-door]')).toHaveLength(2);
  });
```

- Removed `notifications only: notifications row full, Messages as plain door` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('notifications only: notifications row full, Messages as plain door', () => {
    notifications = 4;
    const { container } = mount();
    expect(container.querySelector('[data-wait-row="notifications"]')).not.toBeNull();
    expect(container.querySelector('[data-wait-row="message"]')).toBeNull();
    const doors = container.querySelectorAll('[data-plain-door]');
    expect(doors).toHaveLength(1);
    expect(doors[0].getAttribute('data-plain-door')).toBe('Messages');
  });
```

- Removed `notifications label pluralises at one` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('notifications label pluralises at one', () => {
    expect(notificationsLabel(1)).toBe('1 new notification');
    expect(notificationsLabel(4)).toBe('4 new notifications');
  });
```

- Removed `waiting head has no Inbox link; bell tile is amber` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('waiting head has no Inbox link; bell tile is amber', () => {
    notifications = 1;
    const { container, queryByText } = render(<QuickActionsRow gutter={20} actorType="personal" actorId="p" onNavigate={() => {}} />);
    expect(queryByText(/Inbox/)).toBeNull();
    expect(container.querySelector('[data-wait-row="notifications"]')!.textContent).toContain('1 new notification');
  });
```

- Removed `message only: Messages door absent, Notifications door present` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('message only: Messages door absent, Notifications door present', () => {
    convs = [conv('x', 1, '2026-10-11T10:00:00Z')];
    const { container } = render(<QuickActionsRow gutter={20} actorType="personal" actorId="p" onNavigate={() => {}} />);
    const doors = container.querySelectorAll('[data-plain-door]');
    expect(doors).toHaveLength(1);
    expect(doors[0].getAttribute('data-plain-door')).toBe('Notifications');
  });
```

- Removed `nav list first row is Your courses and opens course analytics` — its tested sheet/preview/card/pill/row no longer exists.
```tsx
  it('nav list first row is Your courses and opens course analytics', async () => {
    const { default: SheetNavGroup } = await import('@/features/profile-sheet-v2/components/SheetNavGroup');
    const open = vi.fn();
    const { container } = render(<SheetNavGroup gutter={20} currentActor={{ id: 'p', type: 'personal' }} isAdmin={false}
      onNavigate={() => {}} onInviteFriends={() => {}} onOpenCourses={open} businessNames={[]} />);
    const first = container.querySelector('[data-sheet-nav] button')!;
    expect(first.textContent).toContain('Your courses');
    fireEvent.click(first);
    expect(open).toHaveBeenCalled();
  });
```
