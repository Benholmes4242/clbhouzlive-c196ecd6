import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { initialDraft } from '@/features/business-create/createRules';
import { BusinessCreateFinish, partialPhotoCopy } from '@/features/business-create/BusinessCreateFinish';
import BusinessCreateRedirect from '@/features/business-create/BusinessCreateRedirect';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
const s = vi.hoisted(() => ({ share: vi.fn() }));
vi.mock('@/lib/business/shareBusinessProfile', () => ({ shareBusinessProfile: s.share, businessProfileShareUrl: (id: string) => `https://example.com/business/${id}?src=share` }));
afterEach(() => { cleanup(); vi.clearAllMocks(); usePostStudioStore.getState().closePostStudio(); });
const loc = () => { const l = useLocation(); return <output data-testid="location">{l.pathname}{l.search}</output>; };
function setup(category: 'Golf Club' | 'Golf Academy' | 'Coach / Instructor' | 'Creator' = 'Golf Academy', claim: 'none' | 'filed' | 'failed' = 'none') {
  const draft = { ...initialDraft(new URLSearchParams()), category, businessName: 'Kestrel Academy', selectedClub: category === 'Golf Club' ? { id: 'club', name: 'Park Golf Club', club_key: 'park', country: 'United Kingdom', region: 'Kent', sub_country: 'Bromley', latitude: 51.4, longitude: 0.03 } : null };
  render(<MemoryRouter><Routes><Route path="/" element={<BusinessCreateFinish draft={draft} result={{ id: 'new', slug: 'kestrel', claim, partials: [] }} userId="me" />} /><Route path="/business/*" Component={loc} /></Routes></MemoryRouter>);
}
describe('BC5 finish destinations', () => {
  it.each(['Golf Academy', 'Coach / Instructor'] as const)('includes coach line for %s', category => { setup(category); expect(document.querySelector('.bizc-finish-note')).not.toBeNull(); });
  it('omits coach line for Creator', () => { setup('Creator'); expect(document.querySelector('.bizc-finish-note')).toBeNull(); });
  it('club filed row is informational, not tappable', () => { setup('Golf Club', 'filed'); expect(screen.queryByRole('button', { name: /Club claim under review/ })).toBeNull(); expect(document.querySelectorAll('.bizc-next-row')).toHaveLength(4); });
  it('failed claim opens Edit', () => { setup('Golf Club', 'failed'); fireEvent.click(screen.getByRole('button', { name: /Your club claim/ })); expect(screen.getByTestId('location').textContent).toBe('/business/new/edit'); });
  it('verification opens the saved business', () => { setup(); fireEvent.click(screen.getByRole('button', { name: /Get verified/ })); expect(screen.getByTestId('location').textContent).toBe('/business/new/verification'); });
  it('invite opens team invite', () => { setup(); fireEvent.click(screen.getByRole('button', { name: /Invite your team/ })); expect(screen.getByTestId('location').textContent).toBe('/business/new/team/invite'); });
  it('post opens studio as saved business', () => { setup(); fireEvent.click(screen.getByRole('button', { name: /Post your first update/ })); expect(usePostStudioStore.getState()).toMatchObject({ isOpen: true, initialActorType: 'business', initialActorId: 'new' }); });
  it('share reuses profile helper', () => { s.share.mockResolvedValue(undefined); setup(); fireEvent.click(screen.getByRole('button', { name: /Share your profile/ })); expect(s.share).toHaveBeenCalledWith({ businessId: 'new', name: 'Kestrel Academy', userId: 'me', url: 'https://example.com/business/kestrel?src=share' }); });
  it('View profile opens slug', () => { setup(); fireEvent.click(screen.getByRole('button', { name: 'View my profile' })); expect(screen.getByTestId('location').textContent).toBe('/business/kestrel'); });
  it.each([[['logo'], 'Your logo didn\'t upload. Add it from Edit profile.'], [['cover photo'], 'Your cover photo didn\'t upload. Add it from Edit profile.'], [['logo', 'cover photo'], 'Your photos didn\'t upload. Add them from Edit profile.']] as const)('partials %j use correct singular/plural', (partials, copy) => { expect(partialPhotoCopy([...partials])).toBe(copy); });
  it('alias keeps claim query', () => { render(<MemoryRouter initialEntries={['/business/create-v2?category=golf_club&clubId=club&sourceCourseId=course']}><Routes><Route path="/business/create-v2" element={<BusinessCreateRedirect />} /><Route path="/business/create" Component={loc} /></Routes></MemoryRouter>); expect(screen.getByTestId('location').textContent).toBe('/business/create?category=golf_club&clubId=club&sourceCourseId=course'); });
});