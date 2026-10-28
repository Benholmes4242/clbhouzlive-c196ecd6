import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CreateBusinessResult } from '@/features/business-create/createBusiness';
const s = vi.hoisted(() => ({ create: vi.fn(), fetch: vi.fn(), toast: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/features/business-create/createBusiness', () => ({ createBusiness: s.create }));
vi.mock('@/features/business/claimClub', () => ({ fetchGolfClub: s.fetch, clubRowToSelected: (row: unknown) => row }));
vi.mock('@/lib/toast', () => ({ toast: { error: s.toast } }));
vi.mock('@/features/business-create/BusinessCreateStep2', () => ({ BusinessCreateStep2: ({ draft }: { draft: { selectedClub?: { id: string } | null } }) => <output data-testid="picked-club">{draft.selectedClub?.id}</output> }));
import BusinessCreate from '@/pages/BusinessCreate';
function Status() { const loc = useLocation(); const type = useNavigationType(); return <output data-testid="history">{type}:{(loc.state as { bizStep?: number } | null)?.bizStep}:{loc.pathname}</output>; }
function setup(step = 4, search = '') {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/before', { pathname: '/business/create', search, state: { bizStep: step } }]} initialIndex={1}><Status /><Routes><Route path="/business/create" element={<BusinessCreate />} /><Route path="/before" element={<p data-testid="before" />} /><Route path="/profile" element={<p data-testid="profile" />} /></Routes></MemoryRouter></QueryClientProvider>);
}
beforeEach(() => { s.create.mockReset(); s.create.mockResolvedValue({ id: 'new', slug: 'new', claim: 'none', partials: [] }); s.fetch.mockReset(); s.fetch.mockResolvedValue({ id: 'club', name: 'Park Golf Club', country: 'United Kingdom', region: 'South East', sub_country: 'Kent', club_key: 'park', latitude: 51.4, longitude: 0.03 }); s.toast.mockReset(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('BC5 creating and history', () => {
  it('disables create, Back and Skip during pending save', async () => {
    let resolve: ((result: CreateBusinessResult) => void) | undefined;
    s.create.mockImplementation(() => new Promise<CreateBusinessResult>(r => { resolve = r; })); setup();
    fireEvent.click(screen.getByRole('button', { name: 'Create my profile' }));
    expect((screen.getByRole('button', { name: 'Creating…' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Skip' }) as HTMLButtonElement).disabled).toBe(true);
    resolve?.({ id: 'new', slug: 'new', claim: 'none', partials: [] }); await screen.findByTestId('bizc-finish');
  });
  it('failed save keeps step 4 and complete draft', async () => {
    s.create.mockRejectedValue(new Error('Refused')); setup(); fireEvent.change(screen.getByRole('textbox', { name: 'About' }), { target: { value: 'Our story' } }); fireEvent.change(screen.getByRole('textbox', { name: 'Year founded' }), { target: { value: '2014' } }); fireEvent.click(screen.getByRole('button', { name: 'Create my profile' }));
    await waitFor(() => expect(s.toast).toHaveBeenCalledWith("Couldn't create the business: Refused")); expect(screen.getByTestId('bizc-step-4')).toBeTruthy(); expect((screen.getByRole('textbox', { name: 'About' }) as HTMLTextAreaElement).value).toBe('Our story'); expect((screen.getByRole('textbox', { name: 'Year founded' }) as HTMLInputElement).value).toBe('2014');
  });
  it.each(['Create my profile', 'Skip'])('%s creates once and replaces finish history', async action => {
    setup(); fireEvent.click(screen.getByRole('button', { name: action })); await screen.findByTestId('bizc-finish'); expect(s.create).toHaveBeenCalledOnce(); expect(screen.getByTestId('history').textContent).toBe('REPLACE:5:/business/create'); expect(screen.queryByRole('button', { name: 'Back' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
  });
  it('passes URL source course to claim creation', async () => {
    setup(4, '?clubId=club&sourceCourseId=course'); fireEvent.click(screen.getByRole('button', { name: 'Skip' })); await screen.findByTestId('bizc-finish'); expect(s.create.mock.calls[0][1]).toMatchObject({ sourceCourseId: 'course', userId: 'me' });
  });
  it('ownerless creation remains on persistent recovery notice', async () => {
    s.create.mockResolvedValue({ id: 'new', slug: 'new', claim: 'none', partials: [], ownerless: { name: 'Academy', id: 'new', target: '/profile' } }); setup(); fireEvent.click(screen.getByRole('button', { name: 'Skip' })); await screen.findByRole('alertdialog'); expect(screen.queryByTestId('bizc-finish')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: "I've noted it" })); await screen.findByTestId('profile');
  });
  it('dirty step 1 asks before leaving and Discard exits', async () => {
    setup(1); fireEvent.click(document.querySelector('[data-value="Creator"]') as HTMLButtonElement); fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByRole('alertdialog')).toBeTruthy(); fireEvent.click(screen.getByRole('button', { name: 'Keep editing' })); expect(screen.queryByTestId('before')).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Back' })); fireEvent.click(screen.getByRole('button', { name: 'Discard' })); await screen.findByTestId('before');
  });
  it('empty step 1 leaves silently', async () => { setup(1); fireEvent.click(screen.getByRole('button', { name: 'Back' })); await screen.findByTestId('before'); expect(screen.queryByRole('alertdialog')).toBeNull(); });
  it('canonical claim URL starts step 2 with the fetched club', async () => {
    s.fetch.mockResolvedValue({ id: 'club' }); render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/business/create?category=golf_club&clubId=club&sourceCourseId=course']}><BusinessCreate /></MemoryRouter></QueryClientProvider>); await waitFor(() => expect(screen.getByTestId('picked-club').textContent).toBe('club')); expect(s.fetch).toHaveBeenCalledWith('club');
  });
});