import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BUSINESS_COVER_ASPECT } from '@/lib/tokens/coverAspect';
import { businessSecondPill } from '@/lib/business/businessHero';
import { initialDraft, type BusinessCreateDraft } from '@/features/business-create/createRules';
import { draftHeroIdentity, foundedYearError } from '@/features/business-create/step4Rules';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' }, loading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/features/business/claimClub', () => ({ fetchGolfClub: vi.fn(), clubRowToSelected: vi.fn() }));
vi.mock('@/features/business-create/BusinessCreateStep2', () => ({ BusinessCreateStep2: () => null }));
vi.mock('@/components/profile/edit-v2/ImageCropperModal', () => ({ getCroppedImg: vi.fn(async () => new Blob(['cropped'], { type: 'image/jpeg' })) }));
vi.mock('react-easy-crop', () => ({ default: (p: { aspect: number; onCropComplete: (a: unknown, b: unknown) => void }) => <div data-testid="bc4-crop-engine" data-aspect={p.aspect}><button onClick={() => p.onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 })}>Position photo</button></div> }));

import { BusinessCreateStep4 } from '@/features/business-create/BusinessCreateStep4';
import BusinessCreate from '@/pages/BusinessCreate';

let serial = 0;
const createUrl = vi.fn(() => `blob:bc4-${++serial}`);
const revokeUrl = vi.fn();
beforeEach(() => { vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl })); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

function fixture(patch: Partial<BusinessCreateDraft> = {}): BusinessCreateDraft {
  return { ...initialDraft(new URLSearchParams()), category: 'Retailer / Pro Shop', businessName: 'Kestrel', address: { label: 'Bromley', city: 'Bromley', precision: 'address' }, ...patch };
}
function Harness({ draft: initial = fixture() }: { draft?: BusinessCreateDraft }) {
  const [draft, setDraft] = useState(initial);
  return <div className="bizc-shell"><BusinessCreateStep4 draft={draft} setDraft={setDraft} onFinish={vi.fn()} /><output data-testid="draft-file">{draft.cover.pendingFile?.name ?? ''}|{draft.logo.pendingFile?.name ?? ''}|{draft.cover.localPreview ?? ''}</output></div>;
}
const choose = (kind: string) => fireEvent.change(screen.getByTestId(`bizc-${kind}-picker`), { target: { files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] } });

describe('BC4 hero identity', () => {
  it('uses the draft name and BC1 display category with address city', () => {
    expect(draftHeroIdentity(fixture())).toEqual({ name: 'Kestrel', line: 'Retailer / Pro Shop · Bromley' });
  });
  it('omits the separator without a place', () => {
    expect(draftHeroIdentity(fixture({ address: null })).line).toBe('Retailer / Pro Shop');
  });
  it('uses the selected club name and sub-country before region', () => {
    expect(draftHeroIdentity(fixture({ category: 'Golf Club', selectedClub: { id: 'club', name: 'Park', country: 'United Kingdom', sub_country: 'Kent', region: 'South East', club_key: 'park', latitude: 51.4, longitude: 0.03 } })).line).toBe('Golf Club · Kent');
  });
  it('uses the selected college name', () => {
    expect(draftHeroIdentity(fixture({ category: 'University / College', selectedCollege: { id: 'uni', college_name: 'College', normalized_name: 'college' } })).name).toBe('College');
  });
  it.each(['book', 'call', 'email', 'website', 'directions'] as const)('reuses live hero label for %s', action => {
    const draft = fixture({ primaryAction: action }); render(<Harness draft={draft} />);
    const live = businessSecondPill({ category: draft.category, primary_action: action, booking_url: action === 'book' ? 'https://book.example' : null, phone: '123', email: 'a@b.com', website: 'https://example.com', location: 'Bromley' }, (_k, fallback) => fallback);
    expect(screen.getByTestId('bizc-mini-action').textContent).toBe(live?.label);
  });
  it('shows only Follow when no main action is chosen', () => {
    render(<Harness />); expect(screen.queryByTestId('bizc-mini-action')).toBeNull();
    expect(document.querySelectorAll('.bizc-mini-pill')).toHaveLength(1);
  });
});

describe('BC4 photos', () => {
  it.each(['cover', 'logo'])('empty %s opens its picker and cropper with the canonical shape', kind => {
    render(<Harness />);
    const input = screen.getByTestId(`bizc-${kind}-picker`); const click = vi.spyOn(input, 'click');
    fireEvent.click(screen.getByRole('button', { name: kind === 'cover' ? 'Add a cover photo' : 'Add a logo' }));
    expect(click).toHaveBeenCalledOnce(); choose(kind);
    expect(screen.getByTestId('bc4-crop-engine').getAttribute('data-aspect')).toBe(String(kind === 'cover' ? BUSINESS_COVER_ASPECT : 1));
    expect(screen.getByRole('dialog').getAttribute('data-frame-shape')).toBe(kind === 'cover' ? 'square' : 'squircle');
  });
  it.each(['cover', 'logo'])('Use photo writes the %s pending file and preview', async kind => {
    render(<Harness />); choose(kind); fireEvent.click(screen.getByRole('button', { name: 'Position photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(screen.queryByTestId('bc4-crop-engine')).toBeNull());
    expect(screen.getByTestId('draft-file').textContent).toContain('profile-photo.jpg');
    const image = document.querySelector(kind === 'cover' ? '.bizc-mini-cover img' : '.bizc-mini-crest img');
    expect(image?.getAttribute('src')).toMatch(/^blob:bc4-/);
  });
  it('Cancel preserves the existing image and releases the temporary source', () => {
    render(<Harness draft={fixture({ cover: { url: null, pendingFile: null, localPreview: 'blob:existing', pendingRemove: false } })} />);
    choose('cover'); fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.querySelector('.bizc-mini-cover img')?.getAttribute('src')).toBe('blob:existing');
    expect(screen.getByTestId('draft-file').textContent).toBe('||blob:existing'); expect(revokeUrl).toHaveBeenCalled();
  });
  it.each(['cover', 'logo'])('filled %s opens actions; remove restores empty', kind => {
    render(<Harness draft={fixture({ [kind]: { url: null, pendingFile: new File(['x'], 'old.jpg'), localPreview: 'blob:existing', pendingRemove: false } })} />);
    fireEvent.click(screen.getByRole('button', { name: kind === 'cover' ? 'Change cover photo' : 'Change logo' }));
    expect(screen.getByTestId('bizc-photo-actions')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: kind === 'cover' ? 'Remove cover photo' : 'Remove logo' }));
    expect(screen.getByRole('button', { name: kind === 'cover' ? 'Add a cover photo' : 'Add a logo' })).toBeTruthy();
    expect(screen.getByTestId('draft-file').textContent).toBe('||');
  });
});

describe('BC4 text and year', () => {
  it('caps About at 2500 and updates its count', () => {
    render(<Harness />); fireEvent.change(screen.getByRole('textbox', { name: 'About' }), { target: { value: 'a'.repeat(2600) } });
    expect((screen.getByRole('textbox', { name: 'About' }) as HTMLTextAreaElement).value.length).toBe(2500);
    expect(screen.getByTestId('bizc-about-count').textContent).toBe('2500 / 2500');
  });
  it('retains only four numeric year digits and shows the range error on blur', () => {
    render(<Harness />); const input = screen.getByRole('textbox', { name: 'Year founded' });
    fireEvent.change(input, { target: { value: '17x999' } }); expect((input as HTMLInputElement).value).toBe('1799');
    expect(screen.queryByRole('alert')).toBeNull(); fireEvent.blur(input); expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.change(input, { target: { value: '2014' } }); expect(screen.queryByRole('alert')).toBeNull();
  });
  it('allows optional or valid years only within the editor bounds', () => {
    expect(foundedYearError('', 2026)).toBeNull(); expect(foundedYearError('1800', 2026)).toBeNull(); expect(foundedYearError('2026', 2026)).toBeNull();
    expect(foundedYearError('1799', 2026)).not.toBeNull(); expect(foundedYearError('2027', 2026)).not.toBeNull(); expect(foundedYearError('999', 2026)).not.toBeNull();
  });
});

describe('BC4 history', () => {
  it.each(['Create my profile', 'Skip'])('%s reaches finish; Back retains photos, About and year', async action => {
    render(<MemoryRouter initialEntries={[{ pathname: '/business/create-v2', state: { bizStep: 4 } }]}><Routes><Route path="/business/create-v2" element={<BusinessCreate />} /></Routes></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'About' }), { target: { value: 'Our story' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Year founded' }), { target: { value: '2014' } });
    choose('cover'); fireEvent.click(screen.getByRole('button', { name: 'Position photo' })); fireEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    await waitFor(() => expect(screen.queryByTestId('bc4-crop-engine')).toBeNull());
    const url = document.querySelector('.bizc-mini-cover img')?.getAttribute('src');
    fireEvent.click(screen.getByRole('button', { name: action })); expect(screen.getByTestId('bizc-finish')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back' })); expect(screen.getByTestId('bizc-step-4')).toBeTruthy();
    expect((screen.getByRole('textbox', { name: 'About' }) as HTMLTextAreaElement).value).toBe('Our story');
    expect((screen.getByRole('textbox', { name: 'Year founded' }) as HTMLInputElement).value).toBe('2014');
    expect(document.querySelector('.bizc-mini-cover img')?.getAttribute('src')).toBe(url);
  });
});