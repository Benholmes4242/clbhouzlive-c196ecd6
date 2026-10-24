import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/common.json';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(),
  session: { session: { user: { id: 'olivia' } } as any, user: { id: 'olivia' } as any, loading: false },
  membership: { data: undefined as any, isPending: true },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from, functions: { invoke: vi.fn() }, channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })), removeChannel: vi.fn() } }));

import { TeamActivityCard, TeamRoleTable } from '@/components/business/TeamRolesActivity';
import { feedLines, feedTime, ROLE_TABLE, type FeedEvent } from '@/components/business/teamFeed';
import { canEditBusinessProfile, protectBusinessPayload } from '@/components/business/editor/editorPermissions';
import type { BusinessRole } from '@/hooks/useBusinessTeam';

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { common: en } }, defaultNS: 'common', interpolation: { escapeValue: false } });
const NOW = new Date(2026, 9, 24, 12);
const at = (days: number, h = 10) => new Date(2026, 9, 24 + days, h).toISOString();
const ev = (kind: string, extra: Partial<FeedEvent> = {}): FeedEvent => ({ kind, at: at(-1), actor_id: 'adam', actor_name: 'Adam Jones', actor_avatar_url: null, target_name: 'Jay Kelly', role: 'editor', ...extra });

const wrap = (node: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><MemoryRouter initialEntries={['/business/biz/team']}><Routes>
    <Route path="/business/biz/team" element={node} />
    <Route path="/business/biz/activity" element={<div data-activity-page />} />
  </Routes></MemoryRouter></QueryClientProvider></I18nextProvider>);
};
const mountFeed = (events: FeedEvent[] | Error, canManage = true) => {
  mocks.rpc.mockImplementation(async () => events instanceof Error ? { data: null, error: events } : { data: events, error: null });
  return wrap(<TeamActivityCard businessId="biz" businessName="Royal Example" canManage={canManage} viewerId="olivia" />);
};
const lines = () => [...document.querySelectorAll('[data-feed-line]')].map(l => l.querySelector('.team-s4-tx')?.textContent);

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('CB78 Part A: editors can edit the profile', () => {
  it('owners, admins and editors may open the editor; analysts and non-members may not', () => {
    expect(['owner', 'admin', 'editor'].map(canEditBusinessProfile)).toEqual([true, true, true]);
    expect(canEditBusinessProfile('analyst')).toBe(false);
    expect(canEditBusinessProfile(undefined)).toBe(false);
  });
  it("an editor's save payload never carries name, category, club fields, slug or notification_preferences", () => {
    const payload = { name: 'X', category: 'Golf Club', club_id: 'c', club_key: 'k', club_name: 'n', slug: 's', notification_preferences: {}, description: 'd', website: 'w' };
    const sent = protectBusinessPayload(payload, 'editor');
    for (const k of ['name', 'category', 'club_id', 'club_key', 'club_name', 'slug', 'notification_preferences']) expect(sent).not.toHaveProperty(k);
    expect(sent).toMatchObject({ description: 'd', website: 'w' });
    expect(protectBusinessPayload(payload, 'admin')).toHaveProperty('name', 'X');
  });
});

describe('CB78 role table', () => {
  it('rows and marks exactly as listed', () => {
    const marks = (b: boolean[]) => b.map(x => (x ? '✓' : '–')).join(' ');
    expect(ROLE_TABLE.map(r => `${r.ability} ${marks(r.marks)}`)).toEqual([
      'post ✓ ✓ ✓ –', 'edit ✓ ✓ ✓ –', 'insights ✓ ✓ ✓ ✓', 'reply ✓ ✓ – –', 'team ✓ ✓ – –', 'verify ✓ ✓ – –', 'delete ✓ – – –',
    ]);
    wrap(<TeamRoleTable businessName="Royal Example" viewerRole="owner" />);
    expect(document.querySelectorAll('[data-ability]')).toHaveLength(7);
    expect(document.querySelectorAll('[data-ability="insights"] [data-mark="yes"]')).toHaveLength(4);
    expect(document.querySelectorAll('[data-ability="delete"] [data-mark="no"]')).toHaveLength(3);
  });
  it.each(['owner', 'admin', 'editor', 'analyst'] as BusinessRole[])("highlights the %s viewer's own column", role => {
    wrap(<TeamRoleTable businessName="Royal Example" viewerRole={role} />);
    const bright = [...document.querySelectorAll('th.team-s4-you')];
    expect(bright).toHaveLength(1);
    expect(bright[0].getAttribute('data-role-col')).toBe(role);
  });
  it('the note shows for editors and analysts only', () => {
    for (const [role, shown] of [['owner', false], ['admin', false], ['editor', true], ['analyst', true]] as const) {
      wrap(<TeamRoleTable businessName="Royal Example" viewerRole={role} />);
      expect(!!document.querySelector('[data-team-role-note]')).toBe(shown);
      cleanup();
    }
  });
});

describe('CB78 recent team activity', () => {
  it('every kind maps to its sentence', async () => {
    const kinds: [FeedEvent, string][] = [
      [ev('post', { at: at(-1, 9) }), 'Adam posted as Royal Example'],
      [ev('review_reply', { at: at(-1, 8) }), 'Adam replied to a review'],
      [ev('team_invite_sent', { at: at(-1, 7), role: 'admin' }), 'Adam invited Jay as an Admin'],
      [ev('team_invite_resent', { at: at(-1, 6) }), "Adam resent Jay's invite"],
      [ev('team_invite_role_changed', { at: at(-1, 5), role: 'analyst' }), "Adam changed Jay's invite to Analyst"],
      [ev('team_invite_accepted', { at: at(-2) }), 'Adam joined as an Editor'],
      [ev('team_request_approved', { at: at(-3) }), 'Adam added Jay as an Editor'],
      [ev('team_request_declined', { at: at(-4) }), "Adam declined Jay's request"],
      [ev('team_role_changed', { at: at(-5) }), 'Adam made Jay an Editor'],
      [ev('team_ownership_transferred', { at: at(-6) }), 'Adam made Jay the owner'],
      [ev('team_member_removed', { at: at(-7) }), 'Adam removed Jay'],
      [ev('team_member_left', { at: at(-8) }), 'Adam left the team'],
    ];
    const all = feedLines(kinds.map(k => k[0]), 'olivia');
    expect(all).toHaveLength(12);
    mountFeed(kinds.slice(0, 8).map(k => k[0]));
    await waitFor(() => expect(lines()).toEqual(kinds.slice(0, 8).map(k => k[1])));
    cleanup();
    mountFeed(kinds.slice(8).map(k => k[0]));
    await waitFor(() => expect(lines()).toEqual(kinds.slice(8).map(k => k[1])));
  });
  it('an email invitee keeps the full address', () => {
    expect(feedLines([ev('team_invite_sent', { target_name: 'jay@example.test' })], null)[0].person).toBe('jay@example.test');
  });
  it('drops unknown kinds and lines missing a person or role', () => {
    const out = feedLines([
      ev('verification_requested'), ev('team_invite_sent', { target_name: null }), ev('team_role_changed', { role: null }),
      ev('team_member_removed', { target_name: '  ' }), ev('team_member_left'),
    ], 'olivia');
    expect(out.map(l => l.kind)).toEqual(['team_member_left']);
  });
  it('the viewer reads "You"', async () => {
    mountFeed([ev('team_member_left', { actor_id: 'olivia', actor_name: 'Olivia Smith' })]);
    await waitFor(() => expect(document.querySelector('[data-feed-actor]')?.textContent).toBe('You'));
  });
  it('folds same-actor same-day posts; posts on two days stay two lines', async () => {
    expect(feedLines([ev('post', { at: at(-1, 11) }), ev('post', { at: at(-1, 10) }), ev('post', { at: at(-1, 9) })], null).map(l => l.count)).toEqual([3]);
    expect(feedLines([ev('post', { at: at(-1) }), ev('post', { at: at(-2) })], null)).toHaveLength(2);
    mountFeed([ev('post', { at: at(-1, 11) }), ev('post', { at: at(-1, 10) }), ev('post', { at: at(-1, 9) })]);
    await waitFor(() => expect(lines()).toEqual(['Adam posted 3 times as Royal Example']));
  });
  it('shows at most 8 lines, with the footer only when there are more', async () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ev('team_member_removed', { at: at(-1 - i) }));
    mountFeed(many(8));
    await waitFor(() => expect(lines()).toHaveLength(8));
    expect(document.querySelector('[data-feed-see-all]')).toBeNull();
    cleanup();
    mountFeed(many(9));
    await waitFor(() => expect(lines()).toHaveLength(8));
    fireEvent.click(document.querySelector('[data-feed-see-all]') as HTMLElement);
    expect(document.querySelector('[data-activity-page]')).toBeTruthy();
  });
  it('time buckets', () => {
    const h = (n: number) => new Date(NOW.getTime() - n * 3_600_000).toISOString();
    expect(feedTime(h(0.5), NOW)).toEqual({ key: 'now' });
    expect(feedTime(h(3), NOW)).toEqual({ key: 'hours', count: 3 });
    expect(feedTime(new Date(2026, 9, 24, 1).toISOString(), NOW)).toEqual({ key: 'today' });
    expect(feedTime(at(-1), NOW)).toEqual({ key: 'yesterday' });
    expect(feedTime(at(-5), NOW)).toEqual({ key: 'weekday', text: new Date(at(-5)).toLocaleDateString('en-GB', { weekday: 'short' }) });
    expect(feedTime(new Date(2026, 9, 12, 10).toISOString(), NOW)).toEqual({ key: 'date', text: '12 Oct' });
    expect(feedTime(new Date(2025, 9, 12, 10).toISOString(), NOW)).toEqual({ key: 'date', text: '12 Oct 2025' });
  });
  it('no card for editors and analysts, nor when the feed is empty or fails', async () => {
    mountFeed([ev('team_member_left')], false);
    await new Promise(r => setTimeout(r, 0));
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(document.querySelector('[data-team-activity-card]')).toBeNull();
    cleanup();
    mountFeed([]);
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-team-activity-card]')).toBeNull();
    cleanup(); mocks.rpc.mockClear();
    mountFeed(new Error('42501'));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-team-activity-card]')).toBeNull();
  });
});
