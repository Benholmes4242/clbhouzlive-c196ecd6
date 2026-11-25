/** Brief 25 B — pending-club follow-ups to Brief 24B. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import profileEn from '../../src/locales/en/profile.json';
import commonEn from '../../src/locales/en/common.json';

const h = vi.hoisted(() => ({ status: 'pending' as string, claim: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const k of ['select', 'eq', 'order', 'limit']) chain[k] = () => chain;
  chain.maybeSingle = async () => ({ data: { admin_note: 'Wrong domain.', created_at: '2026-11-20' }, error: null });
  return { supabase: { from: () => chain, rpc: vi.fn() } };
});
vi.mock('@/hooks/useBusinessProfile', () => ({ useBusinessProfile: (id?: string) => ({ data: id ? { id, listing_status: h.status } : undefined }) }));
vi.mock('@/components/business/ClaimYourCourseSheet', () => ({ ClaimYourCourseSheet: (p: { open: boolean; businessId: string }) => { h.claim(p); return p.open ? <div data-testid="claim-sheet" data-business={p.businessId} /> : null; } }));
vi.mock('@/lib/business/shareBusinessProfile', () => ({ shareBusinessProfile: vi.fn(), businessProfileShareUrl: (id: string) => `https://example.com/business/${id}` }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { NotLiveBusinessRedirect } from '@/features/business-listing/NotLiveBusinessRedirect';
import { ListingStatusPanel } from '@/features/business-listing/ListingStatusPanel';
import { notLiveErrorMessage } from '@/features/business-listing/listingStatus';
import AccountGlance, { type AccountGlanceProps } from '@/features/chrome-v2/AccountGlance';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { profile: profileEn, common: commonEn } }, defaultNS: 'common', interpolation: { escapeValue: false } });
afterEach(() => { cleanup(); vi.clearAllMocks(); h.status = 'pending'; });
const Loc = () => <output data-testid="location">{useLocation().pathname}</output>;
function wrap(node: React.ReactNode, path = '/x', pattern = path) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <Routes><Route path={pattern} element={<>{node}<Loc /></>} /><Route path="*" element={<Loc />} /></Routes>
  </MemoryRouter></QueryClientProvider></I18nextProvider>);
}

describe('Brief 25 B1 — Your courses hidden while not live', () => {
  it('a pending club shows no Your courses or Insights pill', () => {
    wrap(<ClubProfileHero name="Club" placeLine="Kent" onShare={vi.fn()} renderMore={(t) => t}
      team={{ onYourCourses: vi.fn(), onInsights: vi.fn(), onPost: vi.fn(), onEdit: vi.fn() }} isFollowing={false} onFollowToggle={vi.fn()} onBookTeeTime={vi.fn()} onMessage={vi.fn()} listingLocked />);
    const actions = document.querySelector('[data-club-actions="team"]')!;
    expect(actions.textContent).not.toContain('Your courses');
    expect(actions.querySelectorAll('button')).toHaveLength(3);
    expect(actions.querySelector('[data-insights-pill]')).toBeNull();
  });
});

describe('Brief 25 B5 — not-live routes redirect', () => {
  it.each(['/business/b1/insights', '/business/b1/course'])('%s replaces to the profile', (path) => {
    wrap(<NotLiveBusinessRedirect><p data-testid="page" /></NotLiveBusinessRedirect>, path, '/business/:id/*');
    expect(screen.getByTestId('location').textContent).toBe('/business/b1');
    expect(screen.queryByTestId('page')).toBeNull();
  });
  it('team invite uses :businessId', () => {
    wrap(<NotLiveBusinessRedirect><p data-testid="page" /></NotLiveBusinessRedirect>, '/business/b1/team/invite', '/business/:businessId/team/invite');
    expect(screen.getByTestId('location').textContent).toBe('/business/b1');
  });
  it('a live club stays', () => {
    h.status = 'live';
    wrap(<NotLiveBusinessRedirect><p data-testid="page" /></NotLiveBusinessRedirect>, '/business/b1/insights', '/business/:id/insights');
    expect(screen.getByTestId('page')).toBeInTheDocument();
  });
  it('the not-live database messages reach the toast; others do not', () => {
    expect(notLiveErrorMessage({ code: '42501', message: 'This club is still being checked. It opens once the claim is approved.' })).toBe('This club is still being checked. It opens once the claim is approved.');
    expect(notLiveErrorMessage({ code: '42501', message: "This club isn't open yet. Only its team can follow it." })).toBe("This club isn't open yet. Only its team can follow it.");
    expect(notLiveErrorMessage({ code: '42501', message: 'permission denied for table posts' })).toBeNull();
    expect(notLiveErrorMessage({ code: '23505', message: 'This club is still being checked.' })).toBeNull();
  });
});

describe('Brief 25 B4 — account switcher', () => {
  const me = { id: 'p', type: 'personal' as const, name: 'Ben' };
  const club = { id: 'b', type: 'business' as const, name: 'Club', meta: { listingStatus: 'pending' } };
  const ref = React.createRef<HTMLButtonElement>();
  const props = (current: typeof me | typeof club, profiles: Array<typeof me | typeof club>): AccountGlanceProps => ({ open: true, onClose: vi.fn(), anchorRef: ref, currentActor: current, profiles, onSwitchProfile: vi.fn(), onNavigate: vi.fn(), viewProfileRoute: '/profile', settingsRoute: '/s', isAdmin: false, countFor: () => 0, unreadMessages: 0, unreadNotifications: 0, onOpenCourses: vi.fn(), onInviteFriends: vi.fn() });
  it('the current pending club line keeps View page after the status', () => {
    wrap(<><button ref={ref}>Avatar</button><AccountGlance {...props(club, [club, me])} /></>);
    expect(document.querySelector('[data-current-status-line]')).toHaveTextContent('Under review · View page');
  });
  it('the single Switch to button shows the status of a pending club', () => {
    wrap(<><button ref={ref}>Avatar</button><AccountGlance {...props(me, [me, club])} /></>);
    const btn = screen.getByRole('button', { name: /Switch to Club/ });
    expect(btn.querySelector('[data-listing-status="pending"]')).toHaveTextContent('Under review');
  });
});

describe('Brief 25 B7 — Fix and send again', () => {
  it('a rejected club opens the claim sheet for that business', async () => {
    h.status = 'rejected';
    wrap(<ListingStatusPanel status="rejected" businessId="biz-7" businessName="Club" userId="me" onDelete={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('listing-fix')).toBeInTheDocument());
    expect(screen.queryByTestId('claim-sheet')).toBeNull();
    fireEvent.click(screen.getByTestId('listing-fix'));
    expect(screen.getByTestId('claim-sheet').getAttribute('data-business')).toBe('biz-7');
  });
});
