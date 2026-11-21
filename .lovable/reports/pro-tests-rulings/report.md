# Pro-profile test rulings — verification report

Applied the supplied patch **unchanged** at `994805b44d`: the exact added/removed lines match the actual diff across the seven authorised files. No other application file, test name or assertion changed. The sole application change doubles `.pro-finish-row` specificity without changing declarations.

## Four separate sequential commands
| Command | Tests passed | Files passed |
|---|---:|---:|
| `bunx vitest run --shard=1/4` | 2,315 | 212 |
| `bunx vitest run --shard=2/4` | 2,308 | 212 |
| `bunx vitest run --shard=3/4` | 2,390 | 212 |
| `bunx vitest run --shard=4/4` | 2,463 | 212 |

**9,476 / 9,476 passed, 848 files.** No failures or count differences. Full output retained in shard-1.log through shard-4.log beside this report. Preview harness: `build OK`, 2026-11-21T11:35:23Z. No manual build or typecheck run.

## Before / after counts
Before this patch: **9,476 tests / 848 files** (inventory, not previously verified full pass). After: **9,476 / 848 fully passing**. Delta zero; no added/deleted cases. Four cases renamed exactly as authorised.

Last verified full-suite baseline: 9,411 / 844. The intervening three briefs added +12 fallback/menu cases, +22 owner-redesign cases and +31 proSeasonForm cases: +65 cases / +4 files. Those names and assertions are retained in their original reports. This patch adds none and resolves the three previous pro-profile verification stops.

## Phone-width captures
Fourteen captures cover owner, menu open, completion card, Career header Add, form strip, result rows and the opened Career Add sheet, each at **390px and 320px**. Actual ProProfileBuildOne/owner/season components rendered using isolated sample query inputs; owner-menu JSX was extracted verbatim from ProfilePageV2 and rendered through original menu components. Both widths have ten form chips and **no horizontal overflow**; long tournament names ellipsize in their cells. Owner menu shows Copy link / Settings / Switch to business. Career Add opens its real sheet. Final capture runs have no page errors; screenshots inspected.

**These are isolated presentation captures, not signed-in live-profile verification.** Live authenticated readback remains unavailable (`external_unmanaged`). No credential, guest account, SQL, migration, deployment or real data write used. Capture-script JSX/import-version faults were corrected only under /tmp; no application/test changes for them.

## Affected test names and rationale
Every rewritten/renamed case is named below. The complete unchanged diff following this list quotes every old/new assertion and fixture change; sheet-flow/menu assertions remain unchanged unless explicitly shown.

### src/test/allHeroesMatch.test.tsx
- `the pro name is 26px at normal spacing and the club line is gone`: Signed-off 700 weight and season size rulings.

### src/test/proAskSection.test.tsx
- `off shows the See how card` → `off renders no Ask section for the owner`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `five steps word for word, Turn on calls the RPC, Not now closes`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `Turn on invalidates both ask keys, toasts, closes and the section shows the empty card`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `a turn-on error toasts the message and the sheet stays open`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `Not now closes without calling the RPC`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.

### src/test/proCollectionSections.test.tsx
- `own empty view shows the three add cards with signed-off subs` → `own empty view hides bag and partners and shows the career Add with its helper line`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `own empty bag has no Edit in its header and shows the add card` → `own empty bag renders no bag section`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `own empty partners has no Edit in its header and shows the add card` → `own empty partners renders no partners section`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `partner logo uses the 34% squircle with a 1px traced hairline`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `Add by name adds the scheme and saves the website with the name`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `an invalid website toasts and does not save`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `bag: slot is required, brand search links business_id, editing the brand clears it`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `bag: typing after a match clears business_id`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `cap error from the server shows as a toast`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `partners: Add links a business, Added for existing, Add by name stores no business`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.
- `career: save with the win switch, then edit and remove`: Authorised replacement of retired empty prompts / actual completion-row sheet entrypoints.

### src/test/proProfileBuildOneB.test.tsx
- `OWGR row ignores dormant course par and stored to-par`: Authorised selector matches round-strokes structure and excludes avatar wrapper.
- `four counter labels use compact tracking`: Authorised selector matches round-strokes structure and excludes avatar wrapper.
- `two counter labels keep default tracking`: Authorised selector matches round-strokes structure and excludes avatar wrapper.

### src/test/proProfileOwnerMenu.test.tsx
- `owner business %s keeps ordered account actions and no moderation`: Authorised keyboard trigger; menu assertions unchanged.
- `visitor keeps Copy link Report and Block without owner actions`: Authorised keyboard trigger; menu assertions unchanged.

### src/test/proProfileScale.test.tsx
- `result rows match the golfer scale`: Signed-off 700 weight and season size rulings.
- `live card figures follow the golfer headline scale`: Signed-off 700 weight and season size rulings.

## Exact assertion quotes and patch
```diff
diff --git a/src/features/pro-profile/pro-profile.css b/src/features/pro-profile/pro-profile.css
index 4678e0e..0b2e257 100644
--- a/src/features/pro-profile/pro-profile.css
+++ b/src/features/pro-profile/pro-profile.css
@@ -298,7 +298,7 @@
 .pro-finish-header>b { font-size:11px; font-weight:700; color:var(--pro-profile-dim); }
 .pro-finish h3 { margin:8px 0 0; font-size:16px; font-weight:700; color:var(--pro-profile-ink); }
 .pro-finish>p { margin:3px 0 0; font-size:12px; font-weight:400; line-height:1.4; color:var(--pro-profile-mute); }
-.pro-finish-row { display:flex; align-items:center; gap:12px; width:100%; height:auto; padding:11px 0; border:0; border-top:1px solid var(--pro-profile-hair); border-radius:0; background:transparent; color:var(--pro-profile-ink); text-align:left; white-space:normal; }
+.pro-finish-row.pro-finish-row { display:flex; align-items:center; gap:12px; width:100%; height:auto; padding:11px 0; border:0; border-top:1px solid var(--pro-profile-hair); border-radius:0; background:transparent; color:var(--pro-profile-ink); text-align:left; white-space:normal; }
 .pro-finish>p+.pro-finish-row { margin-top:10px; }
 .pro-finish-row>i { flex:none; width:28px; height:28px; border-radius:34%; border:1px dashed var(--pro-finish-add-edge); display:flex; align-items:center; justify-content:center; font-style:normal; font-size:15px; color:var(--pro-profile-soft); }
 .pro-finish-main { flex:1; min-width:0; }
diff --git a/src/test/allHeroesMatch.test.tsx b/src/test/allHeroesMatch.test.tsx
index bd36930..b352d06 100644
--- a/src/test/allHeroesMatch.test.tsx
+++ b/src/test/allHeroesMatch.test.tsx
@@ -144,7 +144,7 @@ describe('ALL_HEROES_MATCH pro profile shell', () => {
   });
   it('the pro name is 26px at normal spacing and the club line is gone', () => {
     const css = src('features/pro-profile/pro-profile.css');
-    expect(css).toContain('.pro-hero-name { margin:0; font-size:26px; font-weight:800; line-height:1.1; letter-spacing:0;');
+    expect(css).toContain('.pro-hero-name { margin:0; font-size:26px; font-weight:700; line-height:1.1; letter-spacing:0;');
     expect(css).not.toContain('.pro-hero-club');
     expect(css).not.toContain('max-width:359px) { .pro-hero-name');
     expect(css).toContain('.pro-hero-profession { font-size:12.5px; font-weight:600;');
diff --git a/src/test/proAskSection.test.tsx b/src/test/proAskSection.test.tsx
index 3632a34..5dc770a 100644
--- a/src/test/proAskSection.test.tsx
+++ b/src/test/proAskSection.test.tsx
@@ -47,6 +47,7 @@ vi.mock('@/integrations/supabase/client', () => {
 });
 
 import { ProAskSection } from '@/features/pro-profile/ProAskSection';
+import { ProOwnerSections } from '@/features/pro-profile/ProOwnerSections';
 import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
 
 const QA = [
@@ -66,6 +67,14 @@ function mount(owner: boolean, entry = '/u/pro1') {
   </Routes></MemoryRouter></QueryClientProvider>);
 }
 
+function mountOwner() {
+  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
+  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/u/pro1']}><Routes>
+    <Route path="/u/pro1" element={<><ProOwnerSections userId="pro1" owner first="Mason" events={[]} eventsReady showCareer viewerId="pro1" /><Where /></>} />
+    <Route path="*" element={<Where />} />
+  </Routes></MemoryRouter></QueryClientProvider>);
+}
+
 beforeEach(() => {
   h.answers = payload(); h.inbox = { waiting: [], answered: [] };
   h.profile = { home_club: 'Sundridge Park', home_club_visibility: 'public' };
@@ -153,11 +162,14 @@ describe('pro ask — visitor view', () => {
 });
 
 describe('pro ask — his own view', () => {
-  it('off shows the See how card', async () => {
+  it('off renders no Ask section for the owner', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
-    mount(true);
-    expect(await screen.findByText('Answer questions from members')).toBeTruthy();
-    expect(screen.getByRole('button', { name: 'See how' })).toBeTruthy();
+    const { container } = mount(true);
+    await waitFor(() => expect(h.rpcCalls.some((c) => c.fn === 'get_pro_answers')).toBe(true));
+    await new Promise((r) => setTimeout(r, 30));
+    expect(container.querySelector('[data-pro-ask]')).toBeNull();
+    expect(screen.queryByText('Answer questions from members')).toBeNull();
+    expect(screen.queryByRole('button', { name: 'See how' })).toBeNull();
   });
   it('on with nothing shows the dashed info card with no button', async () => {
     h.answers = payload({ total: 0, waiting: 0, answers: [] });
@@ -188,10 +200,10 @@ describe('pro ask — his own view', () => {
 describe('pro ask — explainer sheet', () => {
   it('five steps word for word, Turn on calls the RPC, Not now closes', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
-    mount(true);
-    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    mountOwner();
+    fireEvent.click(await screen.findByRole('button', { name: /Answer member questions/ }));
     expect(await screen.findByText('Members ask you questions')).toBeTruthy();
-    expect(screen.getByText('You choose which to answer')).toBeTruthy();
+    expect(within(screen.getByRole('dialog')).getByText('You choose which to answer')).toBeTruthy();
     expect(screen.getByText('Your answers show on your profile')).toBeTruthy();
     expect(screen.getByText('Askers stay private')).toBeTruthy();
     expect(screen.getByText('Turn it off any time')).toBeTruthy();
@@ -201,8 +213,8 @@ describe('pro ask — explainer sheet', () => {
   });
   it('Turn on invalidates both ask keys, toasts, closes and the section shows the empty card', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
-    mount(true);
-    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    mountOwner();
+    fireEvent.click(await screen.findByRole('button', { name: /Answer member questions/ }));
     h.answers = payload({ total: 0, waiting: 0, answers: [] });
     fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
     await waitFor(() => expect(h.toastSuccess).toHaveBeenCalledWith('Ask Mason is on.'));
@@ -212,8 +224,8 @@ describe('pro ask — explainer sheet', () => {
   it('a turn-on error toasts the message and the sheet stays open', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
     h.rpcError = { message: 'Only verified tour pros can turn on Ask' };
-    mount(true);
-    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    mountOwner();
+    fireEvent.click(await screen.findByRole('button', { name: /Answer member questions/ }));
     fireEvent.click(screen.getByRole('button', { name: 'Turn on Ask Mason' }));
     await waitFor(() => expect(h.toastError).toHaveBeenCalledWith('Only verified tour pros can turn on Ask'));
     expect(screen.getByText('Members ask you questions')).toBeTruthy();
@@ -221,8 +233,8 @@ describe('pro ask — explainer sheet', () => {
   });
   it('Not now closes without calling the RPC', async () => {
     h.answers = payload({ enabled: false, total: 0, waiting: 0, answers: [] });
-    mount(true);
-    fireEvent.click(await screen.findByRole('button', { name: 'See how' }));
+    mountOwner();
+    fireEvent.click(await screen.findByRole('button', { name: /Answer member questions/ }));
     fireEvent.click(await screen.findByRole('button', { name: 'Not now' }));
     await waitFor(() => expect(screen.queryByText('Members ask you questions')).toBeNull());
     expect(h.rpcCalls.some((c) => c.fn === 'set_pro_ask_enabled')).toBe(false);
diff --git a/src/test/proCollectionSections.test.tsx b/src/test/proCollectionSections.test.tsx
index 537672a..4ea2953 100644
--- a/src/test/proCollectionSections.test.tsx
+++ b/src/test/proCollectionSections.test.tsx
@@ -17,6 +17,14 @@ vi.mock('sonner', () => ({ toast: { error: h.toastError, success: vi.fn() } }));
 vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => h.guest }));
 vi.mock('@/utils/median/openExternalUrl', () => ({ openExternalUrl: h.openExternal }));
 vi.mock('@/hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: unknown) => v }));
+vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => () => false }));
+vi.mock('@/features/pro-profile/useProAsk', () => ({
+  askKey: (id: string) => ['pro-profile', 'ask', id],
+  useProAnswers: () => ({ data: { enabled: false, total: 0, waiting: 0, answers: [], my_waiting: [] }, isSuccess: true, isError: false }),
+  useProAskWrite: () => vi.fn(async () => true),
+  useProInbox: () => ({ data: [], isSuccess: true, isError: false }),
+  useMyAskerLabel: () => ({ data: { club: null, public: false }, isSuccess: true, isError: false }),
+}));
 vi.mock('@/integrations/supabase/client', () => {
   const from = (table: string) => {
     let op = 'select'; let payload: unknown; const filters: unknown[] = [];
@@ -43,6 +51,7 @@ vi.mock('@/integrations/supabase/client', () => {
 });
 
 import { ProCollectionSections } from '@/features/pro-profile/ProCollectionSections';
+import { ProOwnerSections } from '@/features/pro-profile/ProOwnerSections';
 
 const base = { user_id: 'pro1', created_at: '2026-01-01T00:00:00Z', sort: 0 };
 const LIVE = { id: 'biz-live', name: 'Titleist', logo_url: null, category: 'Equipment', city: 'London', region: null };
@@ -65,6 +74,13 @@ function mount(owner: boolean) {
     <Route path="*" element={<Where />} />
   </Routes></MemoryRouter></QueryClientProvider>);
 }
+function mountOwner() {
+  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
+  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/u/pro1']}><Routes>
+    <Route path="/u/pro1" element={<ProOwnerSections userId="pro1" owner first="Mason" events={[]} eventsReady showCareer viewerId="pro1" />} />
+    <Route path="*" element={<Where />} />
+  </Routes></MemoryRouter></QueryClientProvider>);
+}
 const fill = () => { h.tables = { pro_bag_items: bag, pro_partners: partners, pro_career_moments: moments, business_accounts: [LIVE] }; };
 const empty = () => { h.tables = { pro_bag_items: [], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE] }; };
 
@@ -85,34 +101,34 @@ describe('pro collections — visitor and own views', () => {
     await new Promise(r => setTimeout(r, 30));
     expect(container.querySelector('[data-pro-bag],[data-pro-partners],[data-pro-career]')).toBeNull();
   });
-  it('own empty view shows the three add cards with signed-off subs', async () => {
-    empty(); mount(true);
-    expect(await screen.findByText('Driver to ball. Brands on clbhouz link to their page.')).toBeTruthy();
-    expect(screen.getByText('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.')).toBeTruthy();
-    expect(screen.getByText('Turning pro, amateur titles, tour cards. Wins show in gold.')).toBeTruthy();
+  it('own empty view hides bag and partners and shows the career Add with its helper line', async () => {
+    empty(); const { container } = mount(true);
+    expect(await screen.findByText('Turning pro, amateur titles, tour cards. Wins show in gold.')).toBeTruthy();
+    expect(within(container.querySelector('[data-pro-career]') as HTMLElement).getByRole('button', { name: 'Add' })).toBeTruthy();
+    expect(container.querySelector('[data-pro-bag],[data-pro-partners],.pro-profile-add')).toBeNull();
   });
   it('own filled view shows Edit on each section', async () => {
     fill(); mount(true);
     await waitFor(() => expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBe(3));
   });
-  it('own empty bag has no Edit in its header and shows the add card', async () => {
+  it('own empty bag renders no bag section', async () => {
     h.tables = { pro_bag_items: [], pro_partners: partners, pro_career_moments: moments, business_accounts: [LIVE] };
     const { container } = mount(true);
-    await waitFor(() => expect(container.querySelector('[data-pro-bag]')).not.toBeNull());
-    expect(container.querySelector('[data-pro-bag] .pro-collection-edit')).toBeNull();
-    expect(container.querySelector('[data-pro-bag] .pro-profile-add')).not.toBeNull();
+    await waitFor(() => expect(container.querySelector('[data-pro-partners]')).not.toBeNull());
+    expect(container.querySelector('[data-pro-bag]')).toBeNull();
+    expect(container.querySelector('.pro-profile-add')).toBeNull();
   });
   it('own bag with one item shows Edit', async () => {
     h.tables = { pro_bag_items: [bag[0]], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE] };
     const { container } = mount(true);
     await waitFor(() => expect(container.querySelector('[data-pro-bag] .pro-collection-edit')).not.toBeNull());
   });
-  it('own empty partners has no Edit in its header and shows the add card', async () => {
+  it('own empty partners renders no partners section', async () => {
     h.tables = { pro_bag_items: bag, pro_partners: [], pro_career_moments: moments, business_accounts: [LIVE] };
     const { container } = mount(true);
-    await waitFor(() => expect(container.querySelector('[data-pro-partners]')).not.toBeNull());
-    expect(container.querySelector('[data-pro-partners] .pro-collection-edit')).toBeNull();
-    expect(container.querySelector('[data-pro-partners] .pro-profile-add')).not.toBeNull();
+    await waitFor(() => expect(container.querySelector('[data-pro-bag]')).not.toBeNull());
+    expect(container.querySelector('[data-pro-partners]')).toBeNull();
+    expect(container.querySelector('.pro-profile-add')).toBeNull();
   });
   it('own partners with one item shows Edit', async () => {
     h.tables = { pro_bag_items: [], pro_partners: [partners[0]], pro_career_moments: [], business_accounts: [LIVE] };
@@ -161,10 +177,15 @@ describe('pro collections — visitor and own views', () => {
 });
 
 describe('pro collections — sheet flows', () => {
-  const openAdd = async (sub: string) => { const card = (await screen.findByText(sub)).closest('.pro-profile-add') as HTMLElement; fireEvent.click(within(card).getByRole('button', { name: 'Add' })); };
+  const openAdd = async (sub: string) => {
+    if (sub.startsWith('Turning pro')) { await screen.findByText(sub); fireEvent.click(within(document.querySelector('[data-pro-career]') as HTMLElement).getByRole('button', { name: 'Add' })); return; }
+    const key = sub.startsWith('Driver') ? 'bag' : 'partners';
+    await waitFor(() => expect(document.querySelector(`[data-pro-completion-row="${key}"]`)).not.toBeNull());
+    fireEvent.click(document.querySelector(`[data-pro-completion-row="${key}"]`) as HTMLElement);
+  };
 
   it('Add by name adds the scheme and saves the website with the name', async () => {
-    empty(); mount(true);
+    empty(); mountOwner();
     await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
     expect((screen.getByLabelText('WEBSITE (OPTIONAL)') as HTMLInputElement).placeholder).toBe('e.g. kentautos.co.uk');
     fireEvent.change(screen.getByLabelText('PARTNER NAME'), { target: { value: 'Kent Autos' } });
@@ -174,7 +195,7 @@ describe('pro collections — sheet flows', () => {
     expect(h.writes[0].payload).toMatchObject({ name: 'Kent Autos', business_id: null, website: 'https://kentautos.co.uk' });
   });
   it('an invalid website toasts and does not save', async () => {
-    empty(); mount(true);
+    empty(); mountOwner();
     await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
     fireEvent.change(screen.getByLabelText('PARTNER NAME'), { target: { value: 'Kent Autos' } });
     fireEvent.change(screen.getByLabelText('WEBSITE (OPTIONAL)'), { target: { value: 'http://' } });
@@ -184,7 +205,7 @@ describe('pro collections — sheet flows', () => {
   });
 
   it('bag: slot is required, brand search links business_id, editing the brand clears it', async () => {
-    empty(); mount(true);
+    empty(); mountOwner();
     await openAdd('Driver to ball. Brands on clbhouz link to their page.');
     const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
     fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Tit' } });
@@ -197,7 +218,7 @@ describe('pro collections — sheet flows', () => {
     expect(h.writes[0]).toMatchObject({ table: 'pro_bag_items', op: 'insert', payload: { slot: 'driver', brand: 'Titleist', business_id: 'biz-live' } });
   });
   it('bag: typing after a match clears business_id', async () => {
-    empty(); mount(true);
+    empty(); mountOwner();
     await openAdd('Driver to ball. Brands on clbhouz link to their page.');
     fireEvent.click(screen.getByRole('radio', { name: 'Putter' }));
     fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Tit' } });
@@ -208,7 +229,7 @@ describe('pro collections — sheet flows', () => {
     expect((h.writes[0].payload as { business_id: unknown }).business_id).toBeNull();
   });
   it('cap error from the server shows as a toast', async () => {
-    empty(); h.writeError = { message: 'Cap reached' }; mount(true);
+    empty(); h.writeError = { message: 'Cap reached' }; mountOwner();
     await openAdd('Driver to ball. Brands on clbhouz link to their page.');
     fireEvent.click(screen.getByRole('radio', { name: 'Ball' }));
     fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Pro V1' } });
@@ -217,7 +238,7 @@ describe('pro collections — sheet flows', () => {
   });
   it('partners: Add links a business, Added for existing, Add by name stores no business', async () => {
     h.tables = { pro_bag_items: [], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE, { ...LIVE, id: 'biz-2', name: 'Titan Golf' }] };
-    const { unmount } = mount(true);
+    const { unmount } = mountOwner();
     await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
     expect(screen.getByText('Not on clbhouz?')).toBeTruthy();
     expect((screen.getByLabelText('PARTNER NAME') as HTMLInputElement).placeholder).toBe('e.g. Kent Autos');
@@ -228,7 +249,7 @@ describe('pro collections — sheet flows', () => {
     expect(h.writes[0]).toMatchObject({ table: 'pro_partners', op: 'insert', payload: { business_id: 'biz-live' } });
     unmount();
     h.tables.pro_partners = [partners[0]]; h.writes = [];
-    mount(true);
+    mountOwner();
     await waitFor(() => expect(document.querySelector('[data-pro-partners] .pro-collection-edit')).not.toBeNull());
     fireEvent.click(document.querySelector('[data-pro-partners] .pro-collection-edit')!);
     fireEvent.click(screen.getByRole('button', { name: 'Add a partner' }));
@@ -240,7 +261,7 @@ describe('pro collections — sheet flows', () => {
     expect(h.writes[0].payload).toMatchObject({ name: 'Kent Autos', business_id: null });
   });
   it('career: save with the win switch, then edit and remove', async () => {
-    empty(); const { unmount } = mount(true);
+    empty(); const { unmount } = mountOwner();
     await openAdd('Turning pro, amateur titles, tour cards. Wins show in gold.');
     expect(screen.getByText('Shows in gold')).toBeTruthy();
     fireEvent.change(screen.getByLabelText('WHAT HAPPENED'), { target: { value: 'Won the Kent Open' } });
@@ -251,7 +272,7 @@ describe('pro collections — sheet flows', () => {
     expect(h.writes[0]).toMatchObject({ table: 'pro_career_moments', op: 'insert', payload: { year: 2019, text: 'Won the Kent Open', is_win: true } });
     unmount(); h.writes = [];
     h.tables.pro_career_moments = moments;
-    mount(true);
+    mountOwner();
     const careerEdit = () => document.querySelector('[data-pro-career] .pro-collection-edit') as HTMLElement;
     await waitFor(() => expect(careerEdit()).not.toBeNull());
     fireEvent.click(careerEdit());
diff --git a/src/test/proProfileBuildOneB.test.tsx b/src/test/proProfileBuildOneB.test.tsx
index c19cecc..7b2ba9a 100644
--- a/src/test/proProfileBuildOneB.test.tsx
+++ b/src/test/proProfileBuildOneB.test.tsx
@@ -39,7 +39,7 @@ describe('Pro profile build 1b mounted',()=>{
  it.each([[3,3],[4,4],[2,2],[5,4]])('result sheet with %i rounds uses %i columns',(count,columns)=>{const base=event();const rounds=Array.from({length:count},(_,i)=>({...base.rounds[0],round_no:i+1,strokes:70+i}));mount(<ResultDetail event={{...base,rounds}} close={vi.fn()}/>);const grid=screen.getByRole('dialog').querySelector('.pro-profile-rounds');expect(grid).toHaveStyle({gridTemplateColumns:`repeat(${columns}, 1fr)`});expect(grid?.children).toHaveLength(count);});
  it('320px result sheet keeps all four round columns without auto-fit',()=>{const width=window.innerWidth;try{Object.defineProperty(window,'innerWidth',{configurable:true,value:320});const base=event();mount(<ResultDetail event={{...base,rounds:Array.from({length:4},(_,i)=>({...base.rounds[0],round_no:i+1,strokes:70+i}))}} close={vi.fn()}/>);const grid=screen.getByRole('dialog').querySelector('.pro-profile-rounds');expect(grid).toHaveStyle({gridTemplateColumns:'repeat(4, 1fr)'});expect(grid?.children).toHaveLength(4);}finally{Object.defineProperty(window,'innerWidth',{configurable:true,value:width});}});
 
- it('OWGR row ignores dormant course par and stored to-par',()=>{const fixture={...event(),course_par:72,course_par_set_by:'pro',to_par:3};mount(<ProSeasonSection events={[fixture]} first="Mason" year={2026} linked={false}/>);const row=screen.getByRole('button',{name:/T31 Hulencourt/});expect(within(row).getByText('219')).toBeInTheDocument();expect(within(row).queryByText('+3')).toBeNull();expect(row.querySelector('.pro-profile-score')?.children).toHaveLength(1);});
+ it('OWGR row ignores dormant course par and stored to-par',()=>{const fixture={...event(),course_par:72,course_par_set_by:'pro',to_par:3};mount(<ProSeasonSection events={[fixture]} first="Mason" year={2026} linked={false}/>);const row=screen.getByRole('button',{name:/T31 Hulencourt/});expect(within(row).getByText('219')).toBeInTheDocument();expect(within(row).queryByText('+3')).toBeNull();expect(row.querySelectorAll('.pro-profile-score b')).toHaveLength(1);expect(row.querySelector('.pro-profile-score .pro-result-round-strokes')).not.toBeNull();});
  it.each(['visitor','owner','admin'])('no par controls for %s',view=>{s.events=[{...event(),course_par:72} as ProEvent];mount(<ProProfileBuildOne {...props} owner={view==='owner'} viewerId={view==='admin'?'admin':'viewer'}/>);expect(screen.queryByText(/Add (the course )?par/i)).toBeNull();fireEvent.click(screen.getByRole('button',{name:/T31 Hulencourt/}));expect(screen.queryByText(/Add (the course )?par/i)).toBeNull();});
  it.each([['Hulencourt',219,[71,75,73]],['Bordoni',140,[69,71]]] as const)('Mason %s strokes and rounds',(name,total,rounds)=>{const fixture={...event(),event_name:name,total_strokes:total,course_par:72,rounds:rounds.map((strokes,i)=>({...event().rounds[0],round_no:i+1,strokes}))};mount(<ResultDetail event={fixture} close={vi.fn()}/>);expect(screen.getByText('STROKES')).toBeInTheDocument();expect(screen.getByText(String(total))).toBeInTheDocument();for(const strokes of rounds)expect(screen.getByText(String(strokes))).toBeInTheDocument();const footnote=document.querySelector('.pro-profile-footnote');expect(footnote).toHaveTextContent('Strokes as published by the Official World Golf Ranking. 0.02 ranking points earned.');expect(footnote).not.toHaveTextContent(/par|added by/i);expect(document.querySelectorAll('.pro-profile-round small')).toHaveLength(0);});
  it.each(['pro','tour'])('nonOWGR %s keeps signed to-par and red under par',source=>{mount(<ProSeasonSection events={[event({source,to_par:-2})]} first="Mason" year={2026} linked={source==='tour'}/>);expect(screen.getByText('−2')).toHaveClass('pro-profile-under');fireEvent.click(screen.getByRole('button',{name:/T31 Hulencourt/}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByText('TO PAR')).toBeInTheDocument();expect(within(dialog).getByText('−2')).toHaveClass('pro-profile-under');});
@@ -50,6 +50,6 @@ describe('Pro profile build 1b mounted',()=>{
 describe('Tour-pro hero fallback and compact counters', () => {
  it('a null cover renders fallback artwork', () => {const {container}=mount(<ProProfileBuildOne {...props} cover={null}/>);expect(container.querySelector('[data-fallback-cover]')).not.toBeNull();});
  it('a cover URL renders its image without fallback artwork', () => {const {container}=mount(<ProProfileBuildOne {...props} cover="cover.jpg"/>);expect(container.querySelector('section > [aria-hidden] > img')?.getAttribute('src')).toBe('cover.jpg');expect(container.querySelector('[data-fallback-cover]')).toBeNull();});
- it('four counter labels use compact tracking', () => {s.events=[event({finish:'T9'})];const {container}=mount(<ProProfileBuildOne {...props}/>);const labels=container.querySelectorAll('section > div:not([aria-hidden]) > div > button > div:last-child');expect(labels).toHaveLength(4);for(const label of labels)expect(label).toHaveStyle({letterSpacing:'0.08em'});});
- it('two counter labels keep default tracking', () => {const {container}=mount(<ProProfileBuildOne {...props}/>);const labels=container.querySelectorAll('section > div:not([aria-hidden]) > div > button > div:last-child');expect(labels).toHaveLength(2);for(const label of labels)expect(label).toHaveStyle({letterSpacing:'0.12em'});});
+ it('four counter labels use compact tracking', () => {s.events=[event({finish:'T9'})];const {container}=mount(<ProProfileBuildOne {...props}/>);const hero=within(container.querySelector('section') as HTMLElement);const labels=['EVENTS','TOP 10S','FOLLOWERS','FRIENDS'].map(t=>hero.getByText(t));expect(labels).toHaveLength(4);for(const label of labels)expect(label).toHaveStyle({letterSpacing:'0.08em'});});
+ it('two counter labels keep default tracking', () => {const {container}=mount(<ProProfileBuildOne {...props}/>);const hero=within(container.querySelector('section') as HTMLElement);expect(hero.queryByText('EVENTS')).toBeNull();const labels=['FOLLOWERS','FRIENDS'].map(t=>hero.getByText(t));expect(labels).toHaveLength(2);for(const label of labels)expect(label).toHaveStyle({letterSpacing:'0.12em'});});
 });
diff --git a/src/test/proProfileOwnerMenu.test.tsx b/src/test/proProfileOwnerMenu.test.tsx
index 0731fd9..74f05df 100644
--- a/src/test/proProfileOwnerMenu.test.tsx
+++ b/src/test/proProfileOwnerMenu.test.tsx
@@ -91,7 +91,8 @@ describe('Tour-pro owner menu', () => {
     if (kind !== 'none') h.businesses = [{business: {slug, id: 'biz-id'}}];
     mountPage();
     const trigger = await screen.findByRole('button', {name: 'Profile options'});
-    fireEvent.pointerDown(trigger, {button: 0, ctrlKey: false, pointerType: 'mouse'});
+    trigger.focus();
+    fireEvent.keyDown(trigger, {key: 'Enter'});
     const items = await screen.findAllByRole('menuitem');
     expect(items).toHaveLength(kind === 'none' ? 2 : 3);
     expect(items[0]).toHaveTextContent('Copy link');
@@ -114,7 +115,8 @@ describe('Tour-pro owner menu', () => {
     h.owner = false;
     mountPage();
     const trigger = await screen.findByRole('button', {name: 'Profile options'});
-    fireEvent.pointerDown(trigger, {button: 0, ctrlKey: false, pointerType: 'mouse'});
+    trigger.focus();
+    fireEvent.keyDown(trigger, {key: 'Enter'});
     expect(await screen.findAllByRole('menuitem')).toHaveLength(3);
     expect(screen.getByRole('menuitem', {name: 'Copy link'})).toBeInTheDocument();
     expect(screen.getByRole('menuitem', {name: 'Report'})).toBeInTheDocument();
diff --git a/src/test/proProfileScale.test.tsx b/src/test/proProfileScale.test.tsx
index 51070b8..dbe3a99 100644
--- a/src/test/proProfileScale.test.tsx
+++ b/src/test/proProfileScale.test.tsx
@@ -34,15 +34,19 @@ describe('FIX3 pro profile section scale', () => {
   it('result rows match the golfer scale', () => {
     expect(rule('.pro-profile-row')).toContain('padding:10px 2px');
     const finish = rule('.pro-profile-finish');
-    expect(finish).toContain('width:40px');
-    expect(finish).toContain('font-size:13px');
+    expect(finish).toContain('width:36px');
+    expect(finish).toContain('height:36px');
+    expect(finish).toContain('border-radius:34%');
+    expect(finish).toContain('font-size:12.5px');
+    expect(finish).toContain('font-weight:700');
+    expect(rule('.pro-profile-finish.pro-finish-out')).toContain('font-size:11px');
     expect(rule('.pro-profile-eliminated')).toContain('font-size:11.5px');
     const event = rule('.pro-profile-event b');
     expect(event).toContain('font-size:13px');
     expect(event).toContain('font-weight:700');
     expect(rule('.pro-profile-event small')).toContain('font-size:11px');
     expect(rule('.pro-profile-score b')).toContain('font-size:13.5px');
-    expect(rule('.pro-profile-score b.pro-profile-gross')).toContain('font-size:13px');
+    expect(rule('.pro-profile-score b.pro-profile-gross')).toContain('font-size:13.5px');
     expect(rule('.pro-profile-row .lucide')).toContain('width:14px');
     expect(rule('.pro-profile-all')).toContain('font-size:12px');
   });
@@ -72,10 +76,10 @@ describe('FIX3 pro profile section scale', () => {
     expect(rule('.pro-profile-live-position strong')).toContain('font-size:40px');
     const score = rule('.pro-profile-live-score b');
     expect(score).toContain('font-size:19px');
-    expect(score).toContain('font-weight:800');
+    expect(score).toContain('font-weight:700');
     const h3 = rule('.pro-profile-card h3');
     expect(h3).toContain('font-size:15px');
-    expect(h3).toContain('font-weight:800');
+    expect(h3).toContain('font-weight:700');
     expect(h3).toContain('line-height:1.25');
     expect(rule('.pro-profile-live-position small')).toContain('font-size:12px');
     expect(rule('.pro-profile-footnote')).toContain('font-size:11.5px');

```
