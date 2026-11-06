import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({
  tables: {} as Record<string, unknown[]>,
  writes: [] as { table: string; op: string; payload?: unknown; filters: unknown[] }[],
  writeError: null as null | { message: string },
  guest: null as unknown,
  toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('sonner', () => ({ toast: { error: h.toastError, success: vi.fn() } }));
vi.mock('@/features/guest/guestGateStore', () => ({ getGuestUser: () => h.guest }));
vi.mock('@/hooks/useDebouncedValue', () => ({ useDebouncedValue: (v: unknown) => v }));
vi.mock('@/integrations/supabase/client', () => {
  const from = (table: string) => {
    let op = 'select'; let payload: unknown; const filters: unknown[] = [];
    let ilike = '';
    const b: Record<string, unknown> = {};
    const chain = (name: string) => (...args: unknown[]) => { filters.push([name, ...args]); if (name === 'ilike') ilike = String(args[1]).split('%').join('').toLowerCase(); return b; };
    ['select', 'eq', 'in', 'limit', 'ilike', 'order'].forEach(n => { b[n] = chain(n); });
    b.insert = (p: unknown) => { op = 'insert'; payload = p; return b; };
    b.update = (p: unknown) => { op = 'update'; payload = p; return b; };
    b.delete = () => { op = 'delete'; return b; };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
      if (op !== 'select') { h.writes.push({ table, op, payload, filters }); return Promise.resolve({ data: null, error: h.writeError }).then(res, rej); }
      let rows = h.tables[table] ?? [];
      if (table === 'business_accounts') {
        const ins = filters.find(f => (f as unknown[])[0] === 'in') as unknown[] | undefined;
        if (ins) rows = rows.filter(r => (ins[2] as string[]).includes((r as { id: string }).id));
        if (ilike) rows = rows.filter(r => (r as { name: string }).name.toLowerCase().includes(ilike));
      }
      return Promise.resolve({ data: rows, error: null }).then(res, rej);
    };
    return b;
  };
  return { supabase: { from } };
});

import { ProCollectionSections } from '@/features/pro-profile/ProCollectionSections';

const base = { user_id: 'pro1', created_at: '2026-01-01T00:00:00Z', sort: 0 };
const LIVE = { id: 'biz-live', name: 'Titleist', logo_url: null, category: 'Equipment', city: 'London', region: null };
const bag = [
  { ...base, id: 'b1', slot: 'driver', brand: 'Titleist', model: 'GT3', detail: '9°', business_id: 'biz-live' },
  { ...base, id: 'b2', slot: 'putter', brand: 'Gone', model: null, detail: null, business_id: 'biz-dead' },
];
const partners = [
  { ...base, id: 'p1', name: 'Titleist', business_id: 'biz-live' },
  { ...base, id: 'p2', name: 'Kent Autos', business_id: null },
];
const moments = [{ ...base, id: 'm1', year: 2020, text: 'Turned pro', is_win: false }];

function Where() { const l = useLocation(); return <div data-testid="where">{l.pathname}</div>; }
function mount(owner: boolean) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><MemoryRouter initialEntries={['/u/pro1']}><Routes>
    <Route path="/u/pro1" element={<ProCollectionSections userId="pro1" owner={owner} first="Mason" events={[]} eventsReady />} />
    <Route path="*" element={<Where />} />
  </Routes></MemoryRouter></QueryClientProvider>);
}
const fill = () => { h.tables = { pro_bag_items: bag, pro_partners: partners, pro_career_moments: moments, business_accounts: [LIVE] }; };
const empty = () => { h.tables = { pro_bag_items: [], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE] }; };

beforeEach(() => { h.writes = []; h.writeError = null; h.guest = null; h.toastError.mockReset(); });

describe('pro collections — visitor and own views', () => {
  it('visitor sees bag, partners and career without Edit or add cards', async () => {
    fill(); const { container } = mount(false);
    await waitFor(() => expect(container.querySelector('[data-pro-bag]')).not.toBeNull());
    expect(container.querySelector('[data-pro-partners]')).not.toBeNull();
    await waitFor(() => expect(container.querySelector('[data-pro-career]')).not.toBeNull());
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(container.querySelector('.pro-profile-add')).toBeNull();
    expect(container.querySelectorAll('[data-career-entry]').length).toBe(1);
  });
  it('visitor sees nothing when every collection is empty', async () => {
    empty(); const { container } = mount(false);
    await new Promise(r => setTimeout(r, 30));
    expect(container.querySelector('[data-pro-bag],[data-pro-partners],[data-pro-career]')).toBeNull();
  });
  it('own empty view shows the three add cards with signed-off subs', async () => {
    empty(); mount(true);
    expect(await screen.findByText('Driver to ball. Brands on clbhouz link to their page.')).toBeTruthy();
    expect(screen.getByText('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.')).toBeTruthy();
    expect(screen.getByText('Turning pro, amateur titles, tour cards. Wins show in gold.')).toBeTruthy();
  });
  it('own filled view shows Edit on each section', async () => {
    fill(); mount(true);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Edit' }).length).toBe(3));
  });
  it('own empty bag has no Edit in its header and shows the add card', async () => {
    h.tables = { pro_bag_items: [], pro_partners: partners, pro_career_moments: moments, business_accounts: [LIVE] };
    const { container } = mount(true);
    await waitFor(() => expect(container.querySelector('[data-pro-bag]')).not.toBeNull());
    expect(container.querySelector('[data-pro-bag] .pro-collection-edit')).toBeNull();
    expect(container.querySelector('[data-pro-bag] .pro-profile-add')).not.toBeNull();
  });
  it('own bag with one item shows Edit', async () => {
    h.tables = { pro_bag_items: [bag[0]], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE] };
    const { container } = mount(true);
    await waitFor(() => expect(container.querySelector('[data-pro-bag] .pro-collection-edit')).not.toBeNull());
  });
  it('own empty partners has no Edit in its header and shows the add card', async () => {
    h.tables = { pro_bag_items: bag, pro_partners: [], pro_career_moments: moments, business_accounts: [LIVE] };
    const { container } = mount(true);
    await waitFor(() => expect(container.querySelector('[data-pro-partners]')).not.toBeNull());
    expect(container.querySelector('[data-pro-partners] .pro-collection-edit')).toBeNull();
    expect(container.querySelector('[data-pro-partners] .pro-profile-add')).not.toBeNull();
  });
  it('own partners with one item shows Edit', async () => {
    h.tables = { pro_bag_items: [], pro_partners: [partners[0]], pro_career_moments: [], business_accounts: [LIVE] };
    const { container } = mount(true);
    await waitFor(() => expect(container.querySelector('[data-pro-partners] .pro-collection-edit')).not.toBeNull());
  });
  it('guests see no Edit or add cards even when owner is passed', async () => {
    empty(); h.guest = { id: 'pro1', is_anonymous: true }; const { container } = mount(true);
    await new Promise(r => setTimeout(r, 30));
    expect(container.querySelector('.pro-profile-add')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  });
  it('links only live linked businesses', async () => {
    fill(); const { container } = mount(false);
    await waitFor(() => expect(container.querySelectorAll('button.pro-bag-row').length).toBe(1));
    expect(container.querySelectorAll('div.pro-bag-row').length).toBe(1);
    expect(container.querySelectorAll('button.pro-partner-tile').length).toBe(1);
    expect(container.querySelectorAll('.pro-partner-unlinked').length).toBe(1);
    fireEvent.click(container.querySelector('button.pro-bag-row')!);
    expect(screen.getByTestId('where').textContent).toBe('/business/biz-live');
  });
  it('partner logo uses the 34% squircle with a 1px traced hairline', async () => {
    fill(); const { container } = mount(false);
    await waitFor(() => expect(container.querySelector('button.pro-partner-tile')).not.toBeNull());
    const ring = container.querySelector('button.pro-partner-tile [aria-hidden]') as HTMLElement;
    expect(ring.style.borderRadius).toBe('34%');
    expect(ring.style.border.startsWith('1px solid')).toBe(true);
  });
});

describe('pro collections — sheet flows', () => {
  const openAdd = async (sub: string) => { const card = (await screen.findByText(sub)).closest('.pro-profile-add') as HTMLElement; fireEvent.click(within(card).getByRole('button', { name: 'Add' })); };

  it('bag: slot is required, brand search links business_id, editing the brand clears it', async () => {
    empty(); mount(true);
    await openAdd('Driver to ball. Brands on clbhouz link to their page.');
    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Tit' } });
    expect(save.disabled).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Driver' }));
    expect(save.disabled).toBe(false);
    fireEvent.click(await screen.findByText('On clbhouz · links to their page'));
    fireEvent.click(save);
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect(h.writes[0]).toMatchObject({ table: 'pro_bag_items', op: 'insert', payload: { slot: 'driver', brand: 'Titleist', business_id: 'biz-live' } });
  });
  it('bag: typing after a match clears business_id', async () => {
    empty(); mount(true);
    await openAdd('Driver to ball. Brands on clbhouz link to their page.');
    fireEvent.click(screen.getByRole('radio', { name: 'Putter' }));
    fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Tit' } });
    fireEvent.click(await screen.findByText('On clbhouz · links to their page'));
    fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Titleist X' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect((h.writes[0].payload as { business_id: unknown }).business_id).toBeNull();
  });
  it('cap error from the server shows as a toast', async () => {
    empty(); h.writeError = { message: 'Cap reached' }; mount(true);
    await openAdd('Driver to ball. Brands on clbhouz link to their page.');
    fireEvent.click(screen.getByRole('radio', { name: 'Ball' }));
    fireEvent.change(screen.getByLabelText('BRAND'), { target: { value: 'Pro V1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith('Cap reached'));
  });
  it('partners: Add links a business, Added for existing, Add by name stores no business', async () => {
    h.tables = { pro_bag_items: [], pro_partners: [], pro_career_moments: [], business_accounts: [LIVE, { ...LIVE, id: 'biz-2', name: 'Titan Golf' }] };
    const { unmount } = mount(true);
    await openAdd('Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.');
    expect(screen.getByText('Not on clbhouz?')).toBeTruthy();
    expect((screen.getByLabelText('PARTNER NAME') as HTMLInputElement).placeholder).toBe('e.g. Kent Autos');
    fireEvent.change(screen.getByLabelText('SEARCH CLBHOUZ'), { target: { value: 'Tit' } });
    await waitFor(() => expect(document.querySelectorAll('.pro-business-match').length).toBe(2));
    fireEvent.click(within(document.querySelectorAll('.pro-business-match')[0] as HTMLElement).getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect(h.writes[0]).toMatchObject({ table: 'pro_partners', op: 'insert', payload: { business_id: 'biz-live' } });
    unmount();
    h.tables.pro_partners = [partners[0]]; h.writes = [];
    mount(true);
    await waitFor(() => expect(document.querySelector('[data-pro-partners] .pro-collection-edit')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-pro-partners] .pro-collection-edit')!);
    fireEvent.click(screen.getByRole('button', { name: 'Add a partner' }));
    fireEvent.change(screen.getByLabelText('SEARCH CLBHOUZ'), { target: { value: 'Tit' } });
    expect((await screen.findByRole('button', { name: 'Added' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('PARTNER NAME'), { target: { value: 'Kent Autos' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add by name' }));
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect(h.writes[0].payload).toMatchObject({ name: 'Kent Autos', business_id: null });
  });
  it('career: save with the win switch, then edit and remove', async () => {
    empty(); const { unmount } = mount(true);
    await openAdd('Turning pro, amateur titles, tour cards. Wins show in gold.');
    expect(screen.getByText('Shows in gold')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('WHAT HAPPENED'), { target: { value: 'Won the Kent Open' } });
    fireEvent.change(screen.getByLabelText('YEAR'), { target: { value: '2019' } });
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect(h.writes[0]).toMatchObject({ table: 'pro_career_moments', op: 'insert', payload: { year: 2019, text: 'Won the Kent Open', is_win: true } });
    unmount(); h.writes = [];
    h.tables.pro_career_moments = moments;
    mount(true);
    const careerEdit = () => document.querySelector('[data-pro-career] .pro-collection-edit') as HTMLElement;
    await waitFor(() => expect(careerEdit()).not.toBeNull());
    fireEvent.click(careerEdit());
    fireEvent.click(screen.getByText('2020 · Turned pro'));
    fireEvent.change(screen.getByLabelText('WHAT HAPPENED'), { target: { value: 'Turned professional' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.writes.length).toBe(1));
    expect(h.writes[0]).toMatchObject({ op: 'update', payload: { text: 'Turned professional' } });
    fireEvent.click(careerEdit());
    fireEvent.click(screen.getByText('2020 · Turned pro'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(h.writes.length).toBe(2));
    expect(h.writes[1]).toMatchObject({ table: 'pro_career_moments', op: 'delete' });
  });
});
