import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '../../public/locales/en/common.json';
import { TeamInvitesSection } from '@/components/business/TeamInvitesSection';
import { agoBucket, cardInvites, untilBucket, INVITE_ACCEPT_BASE } from '@/components/business/teamInvites';
import type { BusinessInvite, BusinessMember, BusinessRole } from '@/hooks/useBusinessTeam';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), invoke: vi.fn(), from: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn(), invites: [] as BusinessInvite[], write: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.rpc, from: mocks.from, functions: { invoke: mocks.invoke } } }));
vi.mock('@/lib/toast', () => ({ toast: { error: mocks.error, success: mocks.success, info: mocks.info } }));

const i18n = createInstance();
await i18n.init({ lng: 'en', resources: { en: { common: en } }, defaultNS: 'common', interpolation: { escapeValue: false } });
const NOW = new Date(2026, 9, 24, 12);
const day = (n: number, h = 10) => new Date(2026, 9, 24 + n, h).toISOString();
const member = (id: string, role: BusinessRole, name: string): BusinessMember => ({ id, user_profile_id: id, role, created_at: day(-100), is_public: true, job_title: null, user_profile: { id, display_name: name, username: id, profile_photo_url: null } });
const team = [member('olivia', 'owner', 'Olivia Smith'), member('adam', 'admin', 'Adam Jones')];
const inv = (id: string, extra: Partial<BusinessInvite> = {}): BusinessInvite => ({ id, business_id: 'biz', invited_by: 'olivia', invitee_email: `${id}@example.test`, invitee_user_id: id, role: 'editor', status: 'pending', created_at: day(-1), expires_at: day(13), token: `tok ${id}/+`, invitee_profile: { id, display_name: `${id[0].toUpperCase()}${id.slice(1)} Holmes`, username: id, profile_photo_url: null }, ...extra });
const emailInv = (id: string, extra: Partial<BusinessInvite> = {}) => inv(id, { invitee_user_id: null, invitee_profile: null, role: 'admin', ...extra });

function Harness({ canManage, viewerId }: { canManage: boolean; viewerId: string }) {
  const q = useQuery({ queryKey: ['business-invites', 'biz'], queryFn: async () => mocks.invites.map(i => ({ ...i })) });
  return <TeamInvitesSection businessId="biz" businessName="Royal Example" team={team} invites={q.data} canManage={canManage} viewerId={viewerId} />;
}
function mount(canManage = true, viewerId = 'olivia') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<I18nextProvider i18n={i18n}><QueryClientProvider client={client}><Harness canManage={canManage} viewerId={viewerId} /></QueryClientProvider></I18nextProvider>);
}
const row = (id: string) => document.querySelector(`[data-invite-row="${id}"]`) as HTMLElement;
const findRow = (id: string) => waitFor(() => { expect(row(id)).toBeTruthy(); return row(id); });
const openMenu = async (id: string) => { fireEvent.click((await findRow(id)).querySelector('[data-invite-more]') as HTMLElement); return screen.getByRole('dialog'); };

beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW);
  mocks.invites = [];
  mocks.rpc.mockResolvedValue({ data: { success: true, send_email: true }, error: null });
  mocks.invoke.mockResolvedValue({ data: null, error: null });
  mocks.from.mockImplementation(() => ({ update: (patch: { status: BusinessInvite['status'] }) => ({ eq: async (_c: string, id: string) => { mocks.write(id, patch); mocks.invites = mocks.invites.map(i => i.id === id ? { ...i, ...patch } : i); return { error: null }; } }) }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('CB77 which invites show', () => {
  it('hides accepted, revoked, old expired and now-member invites; live by soonest expiry, then expired by most recent', () => {
    const list = [
      inv('late', { expires_at: day(10) }), inv('soon', { expires_at: day(2) }),
      inv('acc', { status: 'accepted' }), inv('rev', { status: 'revoked' }),
      inv('old', { status: 'expired', expires_at: day(-20) }),
      inv('adam', { status: 'expired', expires_at: day(-2) }),
      inv('exp5', { status: 'expired', expires_at: day(-5) }), inv('exp1', { expires_at: day(-1) }),
    ];
    expect(cardInvites(list, team, NOW).map(r => r.invite.id)).toEqual(['soon', 'late', 'exp1', 'exp5']);
  });
  it('renders nothing for editors and analysts', async () => {
    mocks.invites = [inv('ed')];
    mount(false);
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-team-invites]')).toBeNull();
  });
  it('renders nothing when the list is empty', async () => {
    mocks.invites = [inv('acc', { status: 'accepted' })];
    mount();
    await new Promise(r => setTimeout(r, 0));
    expect(document.querySelector('[data-team-invites]')).toBeNull();
  });
});

describe('CB77 row lines', () => {
  it('line 1 falls back display name, @username, email', async () => {
    mocks.invites = [inv('a'), inv('b', { invitee_profile: { id: 'b', display_name: null, username: 'bee', profile_photo_url: null } }), emailInv('c')];
    mount();
    await findRow('c');
    expect(['a', 'b', 'c'].map(id => row(id).querySelector('[data-invite-name]')?.textContent)).toEqual(['A Holmes', '@bee', 'c@example.test']);
  });
  it('envelope tile only for email-only invites', async () => {
    mocks.invites = [inv('a'), emailInv('c')];
    mount();
    await findRow('c');
    expect(row('c').querySelector('[data-invite-envelope]')).toBeTruthy();
    expect(row('a').querySelector('[data-invite-envelope]')).toBeNull();
  });
  it('" by {first}" only when another team member sent it', async () => {
    mocks.invites = [inv('mine'), inv('adams', { invited_by: 'adam' }), inv('gone', { invited_by: 'stranger' })];
    mount();
    await findRow('gone');
    const line = (id: string) => row(id).querySelector('[data-invite-role-line]')?.textContent;
    expect(line('mine')).toBe('Invited as Editor');
    expect(line('adams')).toBe('Invited as Editor by Adam');
    expect(line('gone')).toBe('Invited as Editor');
  });
  it.each([[0, 'today'], [-1, 'yesterday'], [-5, '5 days ago'], [-14, '2 weeks ago']])('sent %s days is "%s"', (d, text) => {
    const a = agoBucket(day(d), NOW);
    expect('count' in a ? i18n.t(`business.team.sectionThree.ago.${a.key}`, { count: a.count }) : i18n.t(`business.team.sectionThree.ago.${a.key}`)).toBe(text);
  });
  it.each([[0, 'today'], [1, 'tomorrow'], [13, 'in 13 days']])('expires in %s days is "%s"', (d, text) => {
    const u = untilBucket(day(d, 20), NOW);
    expect('count' in u ? i18n.t(`business.team.sectionThree.expiry.${u.key}`, { count: u.count }) : i18n.t(`business.team.sectionThree.expiry.${u.key}`)).toBe(text);
  });
  it('live and expired line 3', async () => {
    mocks.invites = [inv('live', { created_at: day(-5), expires_at: day(13) }), inv('dead', { status: 'expired', expires_at: day(-3) })];
    mount();
    await findRow('dead');
    expect(row('live').querySelector('[data-invite-when]')?.textContent).toBe('Sent 5 days ago · expires in 13 days');
    expect(row('dead').querySelector('[data-invite-when]')?.textContent).toBe('Expired 3 days ago');
  });
});

describe('CB77 resend', () => {
  it('calls the RPC, sends the email when send_email, toasts', async () => {
    mocks.invites = [inv('ed')];
    mount();
    fireEvent.click((await findRow('ed')).querySelector('[data-invite-resend]') as HTMLElement);
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Invite sent to Ed again'));
    expect(mocks.rpc).toHaveBeenCalledWith('resend_business_invite', { p_invite_id: 'ed' });
    expect(mocks.invoke).toHaveBeenCalledWith('send-business-invite', { body: { inviteId: 'ed' } });
  });
  it('skips the email when send_email is false; email invite toasts the address', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: true, send_email: false }, error: null });
    mocks.invites = [emailInv('mail')];
    mount();
    fireEvent.click((await findRow('mail')).querySelector('[data-invite-resend]') as HTMLElement);
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Invite sent to mail@example.test again'));
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('success:false toasts the message and changes nothing', async () => {
    mocks.rpc.mockResolvedValue({ data: { success: false, error: 'Not allowed' }, error: null });
    mocks.invites = [inv('ed')];
    mount();
    const r = await findRow('ed');
    const before = r.textContent;
    fireEvent.click(r.querySelector('[data-invite-resend]') as HTMLElement);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Not allowed'));
    expect(mocks.invoke).not.toHaveBeenCalled(); expect(mocks.success).not.toHaveBeenCalled();
    expect(row('ed').textContent).toBe(before);
  });
});

describe('CB77 copy invite link', () => {
  const writeText = vi.fn();
  beforeEach(() => { writeText.mockReset(); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true }); });
  it('hidden for expired invites', async () => {
    mocks.invites = [inv('dead', { status: 'expired', expires_at: day(-3) })];
    const dialog = await (mount(), openMenu('dead'));
    expect(dialog.querySelector('[data-invite-item="copy"]')).toBeNull();
  });
  it('writes the exact URL with the encoded token', async () => {
    writeText.mockResolvedValue(undefined);
    mocks.invites = [inv('ed')];
    mount();
    fireEvent.click((await openMenu('ed')).querySelector('[data-invite-item="copy"]') as HTMLElement);
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Link copied'));
    expect(writeText).toHaveBeenCalledWith(`${INVITE_ACCEPT_BASE}tok%20ed%2F%2B`);
    expect(INVITE_ACCEPT_BASE).toBe('https://www.clbhouz.co.uk/business/invite/accept?token=');
  });
  it('sub-line differs for golfer and email invites', async () => {
    mocks.invites = [inv('ed'), emailInv('mail')];
    mount();
    expect((await openMenu('ed')).querySelector('[data-invite-copy-sub]')?.textContent).toBe('Only works when Ed is signed in');
    cleanup(); mount();
    expect((await openMenu('mail')).querySelector('[data-invite-copy-sub]')?.textContent).toBe('Anyone with this link can join as an Admin');
  });
  it('clipboard failure toasts', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    mocks.invites = [inv('ed')];
    mount();
    fireEvent.click((await openMenu('ed')).querySelector('[data-invite-item="copy"]') as HTMLElement);
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Couldn't copy the link"));
  });
});

describe('CB77 role sheet', () => {
  it('preselects and tags the current role, waits for a change, sends lowercase role', async () => {
    mocks.invites = [inv('ed')];
    mount();
    fireEvent.click((await openMenu('ed')).querySelector('[data-invite-item="role"]') as HTMLElement);
    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-invite-role="editor"]')?.getAttribute('aria-checked')).toBe('true');
    expect(dialog.querySelector('[data-current-role="editor"]')).toBeTruthy();
    const confirm = () => dialog.querySelector('[data-invite-confirm="role"]') as HTMLButtonElement;
    expect(confirm().disabled).toBe(true); expect(confirm().textContent).toBe('Choose a new role');
    fireEvent.click(dialog.querySelector('[data-invite-role="admin"]') as HTMLElement);
    expect(confirm().disabled).toBe(false); expect(confirm().textContent).toBe('Send again as Admin');
    fireEvent.click(confirm());
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Invite sent to Ed as Admin'));
    expect(mocks.rpc).toHaveBeenCalledWith('update_business_invite_role', { p_invite_id: 'ed', p_role: 'admin' });
    expect(mocks.invoke).toHaveBeenCalledWith('send-business-invite', { body: { inviteId: 'ed' } });
  });
});

describe('CB77 cancel', () => {
  it('calls the revoke mutation and the row leaves', async () => {
    mocks.invites = [inv('ed'), inv('al')];
    mount();
    fireEvent.click((await openMenu('ed')).querySelector('[data-invite-item="cancel"]') as HTMLElement);
    fireEvent.click(screen.getByRole('dialog').querySelector('[data-invite-confirm="cancel"]') as HTMLElement);
    await waitFor(() => expect(row('ed')).toBeNull());
    expect(mocks.write).toHaveBeenCalledWith('ed', { status: 'revoked' });
    expect(mocks.success).toHaveBeenCalledWith('Invite cancelled');
    expect(row('al')).toBeTruthy();
  });
});
