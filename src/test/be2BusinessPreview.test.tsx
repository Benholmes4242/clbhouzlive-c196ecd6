import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { businessCompletion, BUSINESS_COMPLETION_ITEMS } from '@/components/business/editor/businessCompletion';
import { DEFAULT_OPENING_HOURS } from '@/components/business/editor/editorTypes';
import { foundedYearError } from '@/features/business-create/step4Rules';
import { BusinessEditPreview } from '@/components/business/editor/BusinessEditPreview';
import * as editorPermissions from '@/components/business/editor/editorPermissions';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const state = vi.hoisted(() => ({ role: 'owner', fail: false, wait: null as null | Promise<void>, business: { id: 'b1', name: 'Sample business', category: 'Other', city: 'London', location: 'London', address_label: 'London', country: null, club_id: null as null | string, description: '', founded_year: null as null | number, logo_url: null as null | string, cover_image_url: null as null | string, primary_action: 'website' as string | null, phone: '', website: '', show_opening_hours: false, opening_hours: null } }));
const update = vi.hoisted(() => vi.fn());
const uploadLogo = vi.hoisted(() => vi.fn()); const uploadCover = vi.hoisted(() => vi.fn());
const removeLogo = vi.hoisted(() => vi.fn()); const removeCover = vi.hoisted(() => vi.fn());
vi.mock('@/utils/r2OnlyUpload', () => ({ uploadToR2Only: vi.fn(async () => ({ success: true, publicUrl: '/editor-logo.jpg' })) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ update: (payload: unknown) => { update(payload); return { eq: async () => { if (state.wait) await state.wait; return { error: state.fail ? new Error('denied') : null }; } }; } }) } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'viewer' }, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: state.business, isLoading: false, error: null }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: state.role }, isLoading: false }) }));
vi.mock('@/hooks/useBusinessImageUpload', () => ({ useBusinessImageUpload: () => ({ uploadLogo, uploadCover, removeLogo, removeCover }) }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), warning: vi.fn() }) }));
vi.mock('@/components/business/editor/FacilitiesSection', () => ({ FacilitiesSection: () => null }));
vi.mock('@/components/business/editor/PrimaryActionSection', () => ({ PrimaryActionSection: () => null }));
vi.mock('@/components/business/editor/SocialSection', () => ({ SocialSection: () => null }));
vi.mock('@/components/business/editor/LocationContactSection', () => ({ LocationContactSection: ({ website, setWebsite }: { website: string; setWebsite: (s: string) => void }) => <input aria-label="Legacy website" type="url" value={website} onChange={e => setWebsite(e.target.value)} /> }));
vi.mock('@/components/business/editor/OpeningHoursSection', () => ({ OpeningHoursSection: () => null }));
vi.mock('@/components/business/PinDropModal', () => ({ PinDropModal: () => null }));
vi.mock('@/components/business/RequestAccessModal', () => ({ RequestAccessModal: () => null }));
vi.mock('@/components/business/RequestClubModal', () => ({ RequestClubModal: () => null }));
vi.mock('@/features/onboarding/WelcomeCropper', () => ({ WelcomeCropper: ({ onUse, frameShape, aspect }: { onUse: (f: File) => void; frameShape: string; aspect: number }) => <div role="dialog" aria-label="Move and scale" data-frame={frameShape} data-aspect={aspect}><button onClick={() => onUse(new File(['crop'], 'cropped.jpg', { type: 'image/jpeg' }))}>Use photo</button></div> }));
import BusinessProfileEditor from '@/pages/BusinessProfileEditor';
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/business/b1/edit']}><Routes><Route path="/business/:id/edit" element={<BusinessProfileEditor />} /></Routes></MemoryRouter></QueryClientProvider>);
const open = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name} `) }));
let originalCreateObjectURL: PropertyDescriptor | undefined;
let originalRevokeObjectURL: PropertyDescriptor | undefined;
beforeEach(() => {
  originalCreateObjectURL = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  originalRevokeObjectURL = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:be2-photo') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  Object.assign(state, { role: 'owner', fail: false, wait: null }); Object.assign(state.business, { name: 'Sample business', description: '', founded_year: null, logo_url: null, cover_image_url: null, primary_action: 'website', club_id: null }); update.mockClear(); uploadLogo.mockReset().mockResolvedValue('/new-logo.jpg'); uploadCover.mockReset().mockResolvedValue('/new-cover.jpg'); removeLogo.mockReset().mockResolvedValue(undefined); removeCover.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalCreateObjectURL) Object.defineProperty(URL, 'createObjectURL', originalCreateObjectURL);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (originalRevokeObjectURL) Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectURL);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('BE2 completion rules', () => {
  const blank = { logo: null, cover: null, description: '', foundedYear: '', lat: null, lng: null, phone: '', website: '', showOpeningHours: false, openingHours: DEFAULT_OPENING_HOURS };
  const patches = [{ logo: '/logo' }, { cover: '/cover' }, { description: 'About' }, { foundedYear: '2025' }, { lat: 0, lng: 0 }, { phone: '123' }, { website: 'https://example.com' }, { showOpeningHours: true }];
  BUSINESS_COMPLETION_ITEMS.forEach(([key], index) => it(`counts ${key} only when supplied`, () => {
    expect(businessCompletion(blank).done[index]).toBe(false);
    expect(businessCompletion({ ...blank, ...patches[index] }).done[index]).toBe(true);
  }));
  it('keeps the eight missing items in the signed-off order', () => { expect(businessCompletion(blank).missing.map(item => item[0])).toEqual(['logo', 'cover', 'about', 'established', 'address', 'phone', 'website', 'hours']); expect(businessCompletion(blank).remaining).toBe(8); });
  it('has no missing items after all eight are supplied', () => { expect(businessCompletion(Object.assign({}, blank, ...patches)).remaining).toBe(0); });
  it('does not count all-closed hours', () => { expect(businessCompletion({ ...blank, showOpeningHours: true, openingHours: { Mon: { open: '08:00', close: '18:00', closed: true } } }).done[7]).toBe(false); });
  it('validates 1800 through the current year and permits clearing', () => { expect(foundedYearError('1799', 2026)).not.toBeNull(); expect(foundedYearError('1800', 2026)).toBeNull(); expect(foundedYearError('2026', 2026)).toBeNull(); expect(foundedYearError('2027', 2026)).not.toBeNull(); expect(foundedYearError('', 2026)).toBeNull(); });
});
describe('BE2 immediate editing', () => {
  it('previews identity, city and the selected main action', () => { const v = mount(); expect(v.container.querySelector('.be2-name')?.textContent).toBe('Sample business'); expect(v.container.querySelector('.be2-line')?.textContent).toBe('Other · London'); expect(v.container.querySelector('.be2-action')?.textContent).toBe('Website'); expect(screen.getByRole('button', { name: 'Add cover' })).toBeInTheDocument(); });
  it('omits the main action when absent but retains Follow', () => { state.business.primary_action = null; const v = mount(); expect(v.container.querySelector('.be2-action')).toBeNull(); expect(v.container.querySelector('.be2-follow')?.textContent).toBe('Follow'); });
  it('uses Edit cover when a saved cover exists', () => { state.business.cover_image_url = '/cover.jpg'; mount(); expect(screen.getByRole('button', { name: 'Edit cover' })).toBeInTheDocument(); });
  for (const [field, row, input, value, payload] of [['name', 'Name', 'Business name', 'New name', { name: 'New name' }], ['description', 'About', 'About', 'New about', { description: 'New about' }], ['founded_year', 'Established', 'Year', '2025', { founded_year: 2025 }]] as const) it(`saves only ${field} and advances the dirty baseline`, async () => {
    mount(); open(row); fireEvent.change(screen.getByRole('textbox', { name: input }), { target: { value } }); fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(payload)); await waitFor(() => expect(screen.queryByTestId('be2-identity-sheet')).toBeNull()); expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
  it('keeps legacy dirty values while advancing only the saved field baseline', async () => { mount(); fireEvent.change(screen.getByRole('textbox', { name: 'Legacy website' }), { target: { value: 'https://changed.test' } }); open('Name'); fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), { target: { value: 'New name' } }); fireEvent.click(screen.getByRole('button', { name: 'Done' })); await waitFor(() => expect(screen.queryByTestId('be2-identity-sheet')).toBeNull()); expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled(); });
  for (const kind of ['club', 'editor']) it(`makes Name read-only for ${kind}`, () => { if (kind === 'club') state.business.club_id = 'club'; else state.role = 'editor'; mount(); expect(screen.queryByRole('button', { name: /^Name / })).toBeNull(); expect(screen.getByText(kind === 'club' ? /from your club/ : /owners and admins/)).toBeInTheDocument(); });
  it('prevents saving an empty name', () => { mount(); open('Name'); fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), { target: { value: '  ' } }); expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled(); });
  it('disables an invalid year and permits clearing', () => { mount(); open('Established'); fireEvent.change(screen.getByRole('textbox', { name: 'Year' }), { target: { value: '1799' } }); expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled(); fireEvent.change(screen.getByRole('textbox', { name: 'Year' }), { target: { value: '' } }); expect(screen.getByRole('button', { name: 'Done' })).toBeEnabled(); });
  it('caps About at 2500 and updates the count', () => { mount(); open('About'); const input = screen.getByRole('textbox', { name: 'About' }); fireEvent.change(input, { target: { value: 'a'.repeat(2501) } }); expect(input).toHaveValue('a'.repeat(2500)); expect(screen.getByText('2,500 / 2,500')).toBeInTheDocument(); });
  for (const kind of ['logo', 'cover'] as const) it(`chooses, crops and immediately uploads ${kind}`, async () => { mount(); fireEvent.click(screen.getAllByRole('button', { name: kind === 'logo' ? 'Add a logo' : 'Add cover' })[0]); fireEvent.click(screen.getByRole('button', { name: 'Choose a photo' })); fireEvent.change(screen.getByTestId(`be2-${kind}-picker`), { target: { files: [new File(['image'], 'image.jpg', { type: 'image/jpeg' })] } }); expect(screen.getByRole('dialog', { name: 'Move and scale' })).toHaveAttribute('data-frame', kind === 'logo' ? 'squircle' : 'square'); fireEvent.click(screen.getByRole('button', { name: 'Use photo' })); await waitFor(() => expect(kind === 'logo' ? uploadLogo : uploadCover).toHaveBeenCalledWith(expect.any(File))); await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()); });
  for (const kind of ['logo', 'cover'] as const) it(`removes saved ${kind} immediately`, async () => { state.business[kind === 'logo' ? 'logo_url' : 'cover_image_url'] = '/photo.jpg'; mount(); fireEvent.click(screen.getByRole('button', { name: kind === 'logo' ? 'Edit logo' : 'Edit cover' })); fireEvent.click(screen.getByRole('button', { name: `Remove ${kind}` })); await waitFor(() => expect(kind === 'logo' ? removeLogo : removeCover).toHaveBeenCalledTimes(1)); await waitFor(() => expect(screen.queryByTestId('be2-photo-actions')).toBeNull()); });
  it('hides Remove when the photo is absent', () => { mount(); fireEvent.click(screen.getByRole('button', { name: 'Add cover' })); expect(screen.queryByRole('button', { name: 'Remove cover' })).toBeNull(); });
  it('protects the photo update payload for an editor member', async () => {
    state.role = 'editor';
    const protect = vi.spyOn(editorPermissions, 'protectBusinessPayload');
    const { useBusinessImageUpload } = await vi.importActual<typeof import('@/hooks/useBusinessImageUpload')>('@/hooks/useBusinessImageUpload');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useBusinessImageUpload('b1', { role: state.role }), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
    await act(async () => { await result.current.uploadLogo(new File(['image'], 'logo.jpg', { type: 'image/jpeg' })); });
    expect(protect).toHaveBeenCalledWith({ logo_url: '/editor-logo.jpg' }, 'editor');
    expect(update).toHaveBeenCalledExactlyOnceWith({ logo_url: '/editor-logo.jpg' });
  });
  it('does not render the things-left card when all eight checks are done', () => {
    const props = { name: 'Sample business', category: 'Other', city: 'London', primaryAction: null, clubLinked: false, editor: false, busy: false, onSave: vi.fn(), onPhoto: vi.fn(), onFocusLegacy: vi.fn() };
    const blank = { logo: null, cover: null, description: '', foundedYear: '', lat: null, lng: null, phone: '', website: '', showOpeningHours: false, openingHours: DEFAULT_OPENING_HOURS };
    const view = render(<BusinessEditPreview {...props} completion={blank} />);
    expect(screen.getByTestId('be2-completion')).toBeInTheDocument();
    view.rerender(<BusinessEditPreview {...props} completion={{ logo: '/logo.jpg', cover: '/cover.jpg', description: 'About the business', foundedYear: '2025', lat: 0, lng: 0, phone: '123', website: 'https://example.com', showOpeningHours: true, openingHours: DEFAULT_OPENING_HOURS }} />);
    expect(screen.queryByTestId('be2-completion')).toBeNull();
  });
  it('reports saving, then saved', async () => { let finish: () => void = () => {}; state.wait = new Promise<void>(resolve => { finish = resolve; }); const v = mount(); open('Name'); fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), { target: { value: 'New name' } }); fireEvent.click(screen.getByRole('button', { name: 'Done' })); expect(v.container.querySelector('.ep-saved')).toHaveTextContent('Saving…'); finish(); await waitFor(() => expect(v.container.querySelector('.ep-saved')).toHaveTextContent('All changes saved')); });
  it('retains failed values and retries the same partial save', async () => { state.fail = true; mount(); open('Name'); fireEvent.change(screen.getByRole('textbox', { name: 'Business name' }), { target: { value: 'New name' } }); fireEvent.click(screen.getByRole('button', { name: 'Done' })); await waitFor(() => expect(screen.getByRole('button', { name: "Couldn't save. Try again." })).toBeInTheDocument()); state.fail = false; fireEvent.click(screen.getByRole('button', { name: "Couldn't save. Try again." })); await waitFor(() => expect(update).toHaveBeenCalledTimes(2)); await waitFor(() => expect(screen.getByRole('button', { name: 'All changes saved' })).toBeInTheDocument()); });
});