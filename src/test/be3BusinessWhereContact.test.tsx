import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCountryCode, getCountryDisplayName } from '@/components/business/CountrySelector';
import { AddressAutocomplete, isPreciseEnough, type AddressValue } from '@/components/business/AddressAutocomplete';
import { addressPayload, pinPlace, savedPhone, websiteDisplay } from '@/components/business/editor/businessContactRules';
import * as permissions from '@/components/business/editor/editorPermissions';
import BusinessProfileEditor from '@/pages/BusinessProfileEditor';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const fixture = vi.hoisted(() => ({ business: { id: 'b1', name: 'Sample business', category: 'Other', country: 'England', club_id: null as string | null, address_label: '60 Cannon Street, London EC4N 6NP', address_line1: 'Cannon St', city: 'London', lat: 51.51 as number | null, lng: -0.09 as number | null, location_precision: 'address', phone: '', email: '', website: '' }, role: 'editor', fail: false, update: vi.fn(), map: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ update: (payload: unknown) => { fixture.update(payload); return { eq: async () => ({ error: fixture.fail ? new Error('denied') : null }) }; } }) } }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: () => ({ data: fixture.business, isLoading: false }) }));
vi.mock('@/hooks/useBusinessMembership', () => ({ useBusinessMembership: () => ({ data: { role: fixture.role }, isLoading: false }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessImageUpload', () => ({ useBusinessImageUpload: () => ({ uploadLogo: vi.fn(), uploadCover: vi.fn(), removeLogo: vi.fn(), removeCover: vi.fn() }) }));
vi.mock('@/components/business/editor/FacilitiesSection', () => ({ FacilitiesSection: ({ amenities, setAmenities }: { amenities: string[]; setAmenities: (value: string[]) => void }) => <input aria-label="Facilities" value={amenities.join(',')} onChange={e => setAmenities([e.target.value])} /> }));
vi.mock('@/components/business/editor/PrimaryActionSection', () => ({ PrimaryActionSection: () => null }));
vi.mock('@/components/business/editor/OpeningHoursSection', () => ({ OpeningHoursSection: () => null }));
vi.mock('@/components/business/editor/SocialSection', () => ({ SocialSection: () => null }));
vi.mock('@/components/business/RequestAccessModal', () => ({ RequestAccessModal: () => null }));
vi.mock('@/components/business/RequestClubModal', () => ({ RequestClubModal: () => null }));
vi.mock('@/components/map/MapPreview', () => ({ MapPreview: (props: unknown) => { fixture.map(props); return <div data-testid="be3-map" />; } }));
vi.mock('@/components/business/PinDropModal', () => ({ PinDropModal: ({ open, onConfirm, onOpenChange }: { open: boolean; onConfirm: (value: AddressValue) => void; onOpenChange: (value: boolean) => void }) => open ? <div role="dialog" aria-label="Pin drop"><button onClick={() => { onConfirm({ label: 'Door, London', addressLine1: 'Door', city: 'London', country: 'United Kingdom', lat: 0, lng: 0, precision: 'pin' }); onOpenChange(false); }}>Confirm pin</button></div> : null }));
vi.mock('@/lib/toast', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }) }));

const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/business/b1/edit']}><Routes><Route path="/business/:id/edit" element={<BusinessProfileEditor />} /></Routes></MemoryRouter></QueryClientProvider>);
const open = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name} `) }));
const done = () => fireEvent.click(screen.getByRole('button', { name: 'Done' }));
beforeEach(() => { Object.assign(fixture.business, { country: 'England', club_id: null, address_label: '60 Cannon Street, London EC4N 6NP', address_line1: 'Cannon St', city: 'London', lat: 51.51, lng: -0.09, location_precision: 'address', phone: '', email: '', website: '' }); fixture.role = 'editor'; fixture.fail = false; fixture.update.mockClear(); fixture.map.mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('BE3 country and precision rules', () => {
  it.each(['England', 'Scotland', 'Wales', 'Northern Ireland', 'UK', 'Great Britain', 'United Kingdom'])('resolves %s to GB without changing the stored country', value => { expect(getCountryCode(value)).toBe('GB'); expect(getCountryDisplayName(value)).toBe('United Kingdom'); });
  it('unknown country is empty', () => expect(getCountryCode('Unknown place')).toBe(''));
  it.each(['address', 'poi', 'postcode', 'pin'] as const)('%s is precise', value => expect(isPreciseEnough(value)).toBe(true));
  it.each(['city', 'region', 'country', 'unknown'] as const)('%s displays the neutral note and pin command', precision => {
    const pin = vi.fn(); render(<AddressAutocomplete value={{ label: 'London', precision }} countryCode="GB" bare onChange={vi.fn()} onDropPinClick={pin} />);
    const note = screen.getByTestId('business-precision-note'); expect(note.querySelector('.lucide-triangle-alert')).toBeNull();
    fireEvent.click(within(note).getByRole('button')); expect(pin).toHaveBeenCalledOnce();
  });
  it('postcode has no broad-location note', () => { render(<AddressAutocomplete value={{ label: 'EC4N 6NP', precision: 'postcode' }} countryCode="GB" bare onChange={vi.fn()} />); expect(screen.queryByTestId('business-precision-note')).toBeNull(); });
  it('parses a saved UK phone without losing its local digits', () => expect(savedPhone('+442079460000', 'England')).toEqual({ dialCode: '+44', localNumber: '2079460000', fullNumber: '+442079460000' }));
  it('trims only display protocol and trailing slash', () => { expect(websiteDisplay('https://clbhouz.co.uk/')).toBe('clbhouz.co.uk'); expect(websiteDisplay('http://clbhouz.co.uk/')).toBe('clbhouz.co.uk'); });
});

describe('BE3 Where and Contact sheets', () => {
  it('England shows the GB country flag, United Kingdom and enabled address search', () => {
    mount(); open('Address'); expect(screen.getByRole('button', { name: /United Kingdom/ })).toBeInTheDocument(); expect(screen.getByPlaceholderText('Start typing a street or postcode')).toBeEnabled(); expect(fixture.update).not.toHaveBeenCalled();
    expect(fixture.map).toHaveBeenCalledWith(expect.objectContaining({ height: 150, markerColor: '#F8FAFC' }));
  });
  it('England defaults the phone code to +44', () => { mount(); open('Phone'); expect(screen.getByRole('button', { name: /\+44/ })).toBeInTheDocument(); expect(screen.getByRole('textbox', { name: 'Number' })).toHaveValue(''); });
  it('saves the full address field set through protection and advances the baseline', async () => {
    const protect = vi.spyOn(permissions, 'protectBusinessPayload'); mount(); open('Address'); fireEvent.click(screen.getByRole('button', { name: 'Move pin' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm pin' })); done();
    await waitFor(() => expect(fixture.update).toHaveBeenCalledWith({ location: 'Door, London', address_label: 'Door, London', address_line1: 'Door', address_line2: null, city: 'London', region: null, postcode: null, country: 'United Kingdom', lat: 0, lng: 0, mapbox_place_id: null, location_precision: 'pin', location_updated_at: expect.any(String) }));
    expect(protect).toHaveBeenCalledWith(expect.objectContaining({ lat: 0, lng: 0, country: 'United Kingdom' }), 'editor');
    await waitFor(() => expect(screen.queryByTestId('be3-contact-sheet')).toBeNull()); expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
  it('address display-only country normalization never rewrites England', async () => { mount(); open('Address'); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledWith(expect.objectContaining({ country: 'England' }))); });
  it('club-linked Address is read-only and has no Map pin row', () => { fixture.business.club_id = 'club'; const v = mount(); expect(screen.queryByRole('button', { name: /^Address / })).toBeNull(); expect(screen.queryByRole('button', { name: /^Map pin / })).toBeNull(); const row = v.container.querySelector('.be3-groups .ep-row'); expect(row?.querySelector('.lucide-chevron-right')).toBeNull(); expect(row?.querySelector('.be3-lock')).not.toBeNull(); });
  it('Map pin uses street before town and accepts zero coordinates', () => { expect(pinPlace({ label: 'Label', addressLine1: 'Cannon St', city: 'London', precision: 'address' })).toBe('Cannon St'); expect(pinPlace({ label: 'Label', city: 'London', precision: 'city' })).toBe('London'); mount(); expect(screen.getByRole('button', { name: 'Map pin Placed on Cannon St' })).toBeInTheDocument(); });
  it('Map pin is Not placed without coordinates and opens the existing pin drop', () => { fixture.business.lat = null; fixture.business.lng = null; mount(); fireEvent.click(screen.getByRole('button', { name: 'Map pin Not placed' })); expect(screen.getByRole('dialog', { name: 'Pin drop' })).toBeInTheDocument(); });
  it('direct pin confirmation saves the address immediately', async () => { mount(); open('Map pin'); fireEvent.click(screen.getByRole('button', { name: 'Confirm pin' })); await waitFor(() => expect(fixture.update).toHaveBeenCalledWith(expect.objectContaining({ location_precision: 'pin', lat: 0, lng: 0 }))); expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull(); });
  it('Place the pin opens the pin drop from a broad location', () => { fixture.business.location_precision = 'city'; mount(); open('Address'); fireEvent.click(screen.getByRole('button', { name: 'Place the pin' })); expect(screen.getByRole('dialog', { name: 'Pin drop' })).toBeInTheDocument(); });
  it('Done stays disabled while address query text is unresolved', () => { vi.stubGlobal('fetch', vi.fn()); mount(); open('Address'); fireEvent.change(screen.getByPlaceholderText('Start typing a street or postcode'), { target: { value: 'Ca' } }); expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled(); });
  it.each([['Email', 'email', 'support@clbhouz.co.uk'], ['Website', 'website', 'https://clbhouz.co.uk/']] as const)('%s saves only its field and advances the snapshot', async (label, key, value) => {
    mount(); open(label); fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value } }); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledExactlyOnceWith({ [key]: value })); await waitFor(() => expect(screen.queryByTestId('be3-contact-sheet')).toBeNull()); expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
  it.each([['Email', 'email'], ['Website', 'website']] as const)('%s invalid blocks Done and empty clears it', async (label, key) => { mount(); open(label); fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value: 'bad' } }); expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled(); fireEvent.change(screen.getByRole('textbox', { name: label }), { target: { value: '' } }); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledExactlyOnceWith({ [key]: null })); });
  it('Phone saves only the full number and advances the snapshot', async () => { mount(); open('Phone'); fireEvent.change(screen.getByRole('textbox', { name: 'Number' }), { target: { value: '20 7946 0000' } }); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledExactlyOnceWith({ phone: '+442079460000' })); await waitFor(() => expect(screen.queryByTestId('be3-contact-sheet')).toBeNull()); expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull(); });
  it('Phone empty clears the saved number', async () => { fixture.business.phone = '+442079460000'; mount(); open('Phone'); fireEvent.change(screen.getByRole('textbox', { name: 'Number' }), { target: { value: '' } }); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledExactlyOnceWith({ phone: null })); });
  it('Website row trims the displayed URL', () => { fixture.business.website = 'https://clbhouz.co.uk/'; mount(); expect(screen.getByRole('button', { name: 'Website clbhouz.co.uk' })).toBeInTheDocument(); });
  it.each([['Add a phone number', 'Number'], ['Add your website', 'Website']] as const)('%s chip opens the matching sheet', (chip, input) => { mount(); fireEvent.click(screen.getByRole('button', { name: chip })); expect(screen.getByRole('textbox', { name: input })).toBeInTheDocument(); });
  it('Pin your address chip opens Address', () => { fixture.business.lat = null; fixture.business.lng = null; mount(); fireEvent.click(screen.getByRole('button', { name: 'Pin your address' })); expect(screen.getByPlaceholderText('Start typing a street or postcode')).toBeInTheDocument(); });
  it('Facilities sheet saves only amenities and omits immediate contact fields', async () => { mount(); open('Facilities'); fireEvent.click(screen.getByRole('button', { name: 'Parking' })); done(); await waitFor(() => expect(fixture.update).toHaveBeenCalledExactlyOnceWith({ amenities: ['Parking'] })); const payload = fixture.update.mock.calls[0][0]; for (const key of ['phone', 'email', 'website', 'location', 'country', 'name', 'description']) expect(payload).not.toHaveProperty(key); });
  it('addressPayload retains client unknown as null precision', () => expect(addressPayload({ label: 'Unknown', precision: 'unknown' }, 'fixed').location_precision).toBeNull());
});