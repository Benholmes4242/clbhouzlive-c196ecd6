import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AccountGlance, { type AccountGlanceProps } from '@/features/chrome-v2/AccountGlance';
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { analyticsEvents } from '@/utils/analyticsEvents';

const me = { id: 'p', type: 'personal' as const, name: 'Ben' };
const club = { id: 'b', type: 'business' as const, name: 'Club' };
const shop = { id: 's', type: 'business' as const, name: 'Shop' };
function setup(overrides: Partial<AccountGlanceProps> = {}) {
  const ref = React.createRef<HTMLButtonElement>();
  const props: AccountGlanceProps = { open: true, onClose: vi.fn(), anchorRef: ref, currentActor: me, profiles: [me], onSwitchProfile: vi.fn(), onNavigate: vi.fn(), viewProfileRoute: '/profile', settingsRoute: '/edit-profile?tab=settings', isAdmin: false, countFor: (_type, id) => id === 'b' ? 3 : id === 's' ? 4 : 0, unreadMessages: 0, unreadNotifications: 0, onOpenCourses: vi.fn(), onInviteFriends: vi.fn(), ...overrides };
  const tree = (p: AccountGlanceProps) => <MemoryRouter><button ref={ref}>Avatar</button><AccountGlance {...p} /></MemoryRouter>;
  const view = render(tree(props));
  return { props, view, update: (p: Partial<AccountGlanceProps>) => { Object.assign(props, p); view.rerender(tree(props)); } };
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('signed-off account tile behavior', () => {
  it('opens the shared modal, with one actor and no switch bar', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Your account' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.queryByRole('button', { name: /Switch/ })).toBeNull();
  });
  it('identity uses the personal destination', () => {
    const { props } = setup(); fireEvent.click(screen.getByRole('button', { name: 'Ben View profile' }));
    expect(props.onNavigate).toHaveBeenCalledWith('/profile');
  });
  it('identity uses the business destination', () => {
    const { props } = setup({ currentActor: club, profiles: [club], viewProfileRoute: '/business/club', settingsRoute: '/business/b/edit', categoryLabel: 'Golf club' });
    fireEvent.click(screen.getByRole('button', { name: 'Club Golf club · View page' }));
    expect(props.onNavigate).toHaveBeenCalledWith('/business/club');
  });
  it('two actors switch directly without closing', async () => {
    const { props, update } = setup({ profiles: [me, club] });
    const bar = screen.getByRole('button', { name: /Switch to Club/ });
    expect(within(bar).getByLabelText('3 unread')).toBeInTheDocument();
    expect(bar).not.toHaveAttribute('aria-expanded');
    await act(async () => fireEvent.click(bar));
    expect(props.onSwitchProfile).toHaveBeenCalledWith('b'); expect(props.onClose).not.toHaveBeenCalled();
    update({ currentActor: club }); expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Switch to Ben/ })).toBeInTheDocument();
  });
  it('three actors expand a list with the non-active sum and collapse on switching', async () => {
    const { props } = setup({ profiles: [me, club, shop] });
    const bar = screen.getByRole('button', { name: /Switch account/ });
    expect(within(bar).getByLabelText('7 unread')).toBeInTheDocument();
    expect(bar).toHaveAttribute('aria-expanded', 'false'); fireEvent.click(bar);
    expect(bar).toHaveAttribute('aria-expanded', 'true'); expect(props.onSwitchProfile).not.toHaveBeenCalled();
    const row = screen.getByRole('button', { name: 'Shop 4 unread' });
    await act(async () => fireEvent.click(row));
    expect(props.onSwitchProfile).toHaveBeenCalledWith('s'); expect(bar).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  it('zero message and notification counts omit badges', () => { setup(); expect(screen.queryByLabelText(/unread/)).toBeNull(); });
  it('message and notification counts above 99 show 99+', () => {
    setup({ unreadMessages: 100, unreadNotifications: 125 });
    expect(screen.getAllByText('99+')).toHaveLength(2);
    expect(screen.getByLabelText('100 unread')).toBeInTheDocument(); expect(screen.getByLabelText('125 unread')).toBeInTheDocument();
  });
  it('switch count above 99 shows 99+ and ignores active actor count', () => {
    setup({ profiles: [me, club, shop], countFor: (_type, id) => id === 'p' ? 900 : 60 });
    const bar = screen.getByRole('button', { name: /Switch account/ });
    expect(within(bar).getByLabelText('120 unread')).toHaveTextContent('99+');
  });
  it('personal row set is ordered and admin command is absent', () => {
    setup(); const rows = screen.getByRole('dialog').querySelector('.account-rows');
    expect(Array.from(rows?.querySelectorAll('button') ?? []).map(b => b.textContent)).toEqual(['Your courses', 'Invite friends', 'Manage businesses', 'Settings']);
    expect(screen.queryByRole('button', { name: /Command centre/ })).toBeNull();
  });
  it('business row set is ordered with command centre only for admins', () => {
    const { props } = setup({ currentActor: club, profiles: [club], isAdmin: true, settingsRoute: '/business/b/edit' });
    const rows = screen.getByRole('dialog').querySelector('.account-rows');
    expect(Array.from(rows?.querySelectorAll('button') ?? []).map(b => b.textContent)).toEqual(['Manage businesses', 'Business settings', 'Command centreADMIN']);
    fireEvent.click(screen.getByRole('button', { name: 'Business settings' })); expect(props.onNavigate).toHaveBeenCalledWith('/business/b/edit');
    fireEvent.click(screen.getByRole('button', { name: 'Command centre ADMIN' })); expect(props.onNavigate).toHaveBeenCalledWith('/admin/command-center');
  });
  it('personal admin command is last', () => { setup({ isAdmin: true }); expect(screen.getByRole('dialog').querySelector('.account-rows')?.lastElementChild?.textContent).toBe('Command centreADMIN'); });
  it('messages and notifications retain their destinations', () => {
    const { props } = setup(); fireEvent.click(screen.getByRole('button', { name: 'Messages' })); expect(props.onNavigate).toHaveBeenLastCalledWith('/messages');
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' })); expect(props.onNavigate).toHaveBeenLastCalledWith('/notificationmessages');
  });
  it('course and invite actions use existing callbacks', () => {
    const { props } = setup(); fireEvent.click(screen.getByRole('button', { name: 'Your courses' })); expect(props.onOpenCourses).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Invite friends' })); expect(props.onInviteFriends).toHaveBeenCalledOnce();
  });
  it('sign out requires two taps', () => {
    const { props } = setup(); fireEvent.click(screen.getByRole('button', { name: 'SIGN OUT' })); expect(props.onNavigate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tap again to confirm' })); expect(props.onNavigate).toHaveBeenCalledWith('/logout');
  });
  it('sign out reverts at four seconds', () => {
    vi.useFakeTimers(); setup(); fireEvent.click(screen.getByRole('button', { name: 'SIGN OUT' }));
    act(() => vi.advanceTimersByTime(3999)); expect(screen.getByRole('button', { name: 'Tap again to confirm' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1)); expect(screen.getByRole('button', { name: 'SIGN OUT' })).toBeInTheDocument();
  });
  it('contains no handicap cards, row or preview structures', () => {
    setup(); const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[data-card], [data-wait-row], [data-wait-block], [data-hcp-strip]')).toBeNull();
    expect(screen.queryByRole('button', { name: /Handicap/ })).toBeNull();
    expect(dialog.querySelectorAll('.account-row')).toHaveLength(4);
  });
  it('tracks once per open rather than per actor change', () => {
    const { update } = setup(); update({ currentActor: club, isAdmin: true });
    expect(analyticsEvents.track).toHaveBeenCalledTimes(1); expect(analyticsEvents.track).toHaveBeenCalledWith('profile_hub_sheet_opened', { actor_type: 'personal', is_admin: false });
    update({ open: false }); update({ open: true }); expect(analyticsEvents.track).toHaveBeenCalledTimes(2);
  });
  it('Escape and backdrop call the shared close callback', () => {
    const { props } = setup(); fireEvent.keyDown(window, { key: 'Escape' }); expect(props.onClose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByTestId('index-glance-backdrop')); expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});