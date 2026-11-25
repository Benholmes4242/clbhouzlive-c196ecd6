/** Brief 24B — golf clubs stay private until their claim is approved. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import profileEn from '../../src/locales/en/profile.json';
import commonEn from '../../src/locales/en/common.json';

const h = vi.hoisted(() => ({ share: vi.fn(), note: 'The email address doesn\'t match the club\'s domain.' as string | null }));
vi.mock('@/lib/business/shareBusinessProfile', () => ({ shareBusinessProfile: h.share, businessProfileShareUrl: (id: string) => `https://example.com/business/${id}` }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('@/hooks/useBusinessTeamActivity', () => ({ useBusinessTeamActivity: () => ({ isSuccess: true, data: [] }) }));
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const k of ['select', 'eq', 'order', 'limit']) chain[k] = () => chain;
  chain.maybeSingle = async () => ({ data: { admin_note: h.note, created_at: '2026-11-20' }, error: null });
  return { supabase: { from: () => chain, rpc: vi.fn() } };
});
vi.mock('@/components/moderation/ReportSheet', () => ({ ReportSheet: () => null }));
vi.mock('@/hooks/messaging/useMessagingActor', () => ({ useMessagingActor: () => ({ actorType: 'business', actorId: 'biz' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => ({ data: null }), useAllScores: () => ({ data: [] }) }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));

import { initialDraft } from '@/features/business-create/createRules';
import { BusinessCreateFinish } from '@/features/business-create/BusinessCreateFinish';
import { ClubProfileHero } from '@/components/business/hero/ClubProfileHero';
import { ListingStatusCard } from '@/features/business-listing/ListingStatusCard';
import AccountGlance, { type AccountGlanceProps } from '@/features/chrome-v2/AccountGlance';
import { TeamListSection } from '@/components/business/TeamListSection';
import type { BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';
import { MessageBubble } from '@/pages/messaging-v2/MessageBubble';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { profile: profileEn, common: commonEn } }, defaultNS: 'common', interpolation: { escapeValue: false } });
afterEach(() => { cleanup(); vi.clearAllMocks(); usePostStudioStore.getState().closePostStudio(); });

const Loc = () => { const l = useLocation(); return <output data-testid="location">{l.pathname}</output>; };
function wrap(node: React.ReactNode, path = '/x') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <Routes><Route path={path} element={<>{node}<Loc /></>} /><Route path="*" element={<Loc />} /></Routes>
  </MemoryRouter></QueryClientProvider></I18nextProvider>);
}
function finish(category: string) {
  const draft = { ...initialDraft(new URLSearchParams()), category, businessName: 'Rochester & Cobham Park Golf Club', selectedClub: category === 'Golf Club' ? { id: 'club', name: 'Rochester & Cobham Park Golf Club', club_key: 'r', country: 'United Kingdom', region: 'Kent', sub_country: 'Kent', latitude: 51, longitude: 0 } : null } as never;
  wrap(<BusinessCreateFinish draft={draft} result={{ id: 'new', slug: 'rcp', claim: 'filed', partials: [] }} userId="me" />);
}

describe('Brief 24B A — set-up finish', () => {
  it('a Golf Club renders the pending finish', () => {
    finish('Golf Club');
    expect(screen.getByText('Claim sent')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("We're checking your claim.");
    expect(screen.getByText("Your profile stays private until Rochester & Cobham Park Golf Club is approved. We'll message you as soon as it is.")).toBeInTheDocument();
    expect(screen.getByTestId('bizc-review-pill')).toHaveTextContent('Under review');
    expect(screen.getByText('While we check')).toBeInTheDocument();
    expect(screen.getByText('Unlocks when approved')).toBeInTheDocument();
    expect(within(screen.getByTestId('bizc-claim-status')).getByText("Only you can see your profile until it's approved.")).toBeInTheDocument();
    expect(screen.queryByText(/is live\./)).toBeNull();
    expect(screen.queryByRole('button', { name: 'View my profile' })).toBeNull();
  });
  it('three locked rows do nothing', () => {
    finish('Golf Club');
    const rows = screen.getByTestId('bizc-locked-rows').querySelectorAll('[aria-disabled="true"]');
    expect(rows).toHaveLength(3);
    rows.forEach(r => fireEvent.click(r));
    expect(screen.getByTestId('location').textContent).toBe('/x');
    expect(usePostStudioStore.getState().isOpen).toBe(false);
    expect(h.share).not.toHaveBeenCalled();
  });
  it('Back to Clubhouse replaces to the Clubhouse route', () => {
    finish('Golf Club');
    fireEvent.click(screen.getByRole('button', { name: 'Back to Clubhouse' }));
    expect(screen.getByTestId('location').textContent).toBe('/');
  });
  it('a Golf Shop keeps today\'s page', () => {
    finish('Golf Shop');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('is live.');
    expect(screen.getByRole('button', { name: 'View my profile' })).toBeInTheDocument();
    expect(screen.queryByTestId('bizc-review-pill')).toBeNull();
  });
});

const hero = (locked: boolean) => wrap(<ClubProfileHero name="Club" placeLine="Kent" onShare={vi.fn()} renderMore={(t) => t}
  team={{ onInsights: vi.fn(), onPost: vi.fn(), onEdit: vi.fn() }} isFollowing={false} onFollowToggle={vi.fn()} onBookTeeTime={vi.fn()} onMessage={vi.fn()} listingLocked={locked || undefined} />);

describe('Brief 24B B — owner view', () => {
  it('pending: locked Post and Share with badges, Edit live, no Insights', () => {
    hero(true);
    for (const k of ['post', 'share']) {
      const b = document.querySelector(`[data-locked-action="${k}"]`) as HTMLButtonElement;
      expect(b).toBeDisabled(); expect(b.querySelector('[data-lock-badge]')).not.toBeNull();
    }
    expect(document.querySelector('[data-insights-pill]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit business profile' })).not.toBeDisabled();
  });
  it('live: today\'s team row', () => {
    hero(false);
    expect(document.querySelector('[data-insights-pill]')).not.toBeNull();
    expect(document.querySelector('[data-locked-action]')).toBeNull();
  });
  it('pending status card', () => {
    wrap(<ListingStatusCard status="pending" businessId="b" onFix={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('listing-status-card')).toHaveAttribute('data-status', 'pending');
    expect(screen.getByText("We're checking your claim")).toBeInTheDocument();
    expect(screen.queryByTestId('listing-fix')).toBeNull();
  });
  it('rejected card quotes the admin note verbatim with both buttons', async () => {
    const onFix = vi.fn(), onDelete = vi.fn();
    wrap(<ListingStatusCard status="rejected" businessId="b" onFix={onFix} onDelete={onDelete} />);
    await waitFor(() => expect(screen.getByTestId('listing-status-body').textContent).toBe(`\u201C${h.note}\u201D Fix your details and send it again, or delete the profile.`));
    fireEvent.click(screen.getByTestId('listing-fix')); fireEvent.click(screen.getByTestId('listing-delete'));
    expect(onFix).toHaveBeenCalledOnce(); expect(onDelete).toHaveBeenCalledOnce();
  });
  it('account switcher shows Under review for a pending club', () => {
    const me = { id: 'p', type: 'personal' as const, name: 'Ben' };
    const club = { id: 'b', type: 'business' as const, name: 'Club', meta: { listingStatus: 'pending' } };
    const shop = { id: 's', type: 'business' as const, name: 'Shop', meta: { listingStatus: 'live' } };
    const ref = React.createRef<HTMLButtonElement>();
    const props: AccountGlanceProps = { open: true, onClose: vi.fn(), anchorRef: ref, currentActor: me, profiles: [me, club, shop], onSwitchProfile: vi.fn(), onNavigate: vi.fn(), viewProfileRoute: '/profile', settingsRoute: '/s', isAdmin: false, countFor: () => 0, unreadMessages: 0, unreadNotifications: 0, onOpenCourses: vi.fn(), onInviteFriends: vi.fn() };
    wrap(<><button ref={ref}>Avatar</button><AccountGlance {...props} /></>);
    fireEvent.click(screen.getByRole('button', { name: /Switch account/ }));
    const pending = document.querySelectorAll('[data-listing-status="pending"]');
    expect(pending).toHaveLength(1);
    expect(pending[0]).toHaveTextContent('Under review');
  });
});

const member = (role: BusinessRole): BusinessMember => ({ id: role, user_profile_id: 'me', role, created_at: '2026-01-01T00:00:00Z', is_public: true, job_title: null, user_profile: { id: 'me', display_name: 'Ben', username: 'ben', profile_photo_url: null } } as BusinessMember);
const team = (role: BusinessRole, locked = false) => wrap(<TeamListSection businessId="biz" businessName="Club" team={[member(role)]} viewerRole={role} viewerId="me" loading={false} failed={false} onRetry={vi.fn()} inviteLocked={locked} />, '/business/biz/team');

describe('Brief 24B C — team invite row', () => {
  it.each(['owner', 'admin'] as const)('%s sees the invite row and it opens invite', role => {
    team(role);
    const row = document.querySelector('[data-team-invite-row]') as HTMLElement;
    expect(row).toHaveTextContent('Invite someone'); expect(row).toHaveTextContent('Admin, editor or analyst');
    fireEvent.click(row);
    expect(screen.getByTestId('location').textContent).toBe('/business/biz/team/invite');
  });
  it.each(['editor', 'analyst'] as const)('%s has no invite row', role => {
    team(role);
    expect(document.querySelector('[data-team-invite-row]')).toBeNull();
  });
  it('locked when the business is not live', () => {
    team('owner', true);
    const row = document.querySelector('[data-team-invite-row]') as HTMLElement;
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveTextContent('Unlocks when your claim is approved');
    fireEvent.click(row);
    expect(screen.getByTestId('location').textContent).toBe('/business/biz/team');
  });
});

describe('Brief 24B D — copy and messages', () => {
  it('step 4 heading', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync('src/features/business-create/BusinessCreateStep4.tsx', 'utf8')).toContain('<h1>Your business profile.</h1>');
  });
  it('welcome action renders in a business thread', () => {
    const msg = { id: 'w', conversation_id: 'c', sender_actor_type: 'personal', sender_actor_id: 'clbhouz', sender_user_id: 'clbhouz', sender_name: 'clbhouz', sender_avatar_url: null, sender_username: 'clbhouz', sender_verified: null, type: 'action', body: 'Welcome to clbhouz.', attachments: null, metadata: { action: { label: 'Open your profile', route: '/business/rcp' } }, reply_to_id: null, created_at: '2026-11-25T00:00:00Z', edited_at: null, deleted_at: null, reactions: [] };
    wrap(<MessageBubble message={msg as never} isOutgoing={false} isFirstOfRun isLastOfRun showTicks={false} />);
    fireEvent.click(screen.getByText('Open your profile'));
    expect(screen.getByTestId('location').textContent).toBe('/business/rcp');
  });
});
