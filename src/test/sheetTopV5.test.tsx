import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const counts: Record<string, number> = { b1: 3, b2: 4 };
let convs: any[] = [];
let notifications = 0;
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: (_t: string, id: string) => counts[id] ?? 0 }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span />, DARK_HAIRLINE: 'x' }));
vi.mock('@/hooks/messaging/useConversations', () => ({ useConversations: () => ({ conversations: convs }) }));
vi.mock('@/hooks/useUnreadNotifications', () => ({ useUnreadNotifications: () => ({ unreadCount: notifications }) }));

import ActorCards from '@/features/profile-sheet-v2/components/ActorCards';
import QuickActionsRow, { notificationsLabel } from '@/features/profile-sheet-v2/components/QuickActionsRow';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const me = { id: 'p', type: 'personal' as const, name: 'Ben' };
const b1 = { id: 'b1', type: 'business' as const, name: 'clbhouz' };
const b2 = { id: 'b2', type: 'business' as const, name: 'Shop' };
const conv = (id: string, unread: number, at: string) => ({ conversation_id: id, title: id, avatar_url: null, last_message_at: at, last_message_preview: 'hi', unread_count: unread });

describe('switch line', () => {
  it('absent with one actor', () => {
    const { container } = render(<ActorCards currentActor={me} profiles={[me]} onSwitchProfile={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
  it('two actors: names the other, shows its count in white, switches', () => {
    const sw = vi.fn();
    const { getByText, getByLabelText, queryByText } = render(<ActorCards currentActor={me} profiles={[me, b1]} onSwitchProfile={sw} />);
    expect(getByText('Switch to clbhouz')).toBeTruthy();
    expect(queryByText('Ben')).toBeNull();
    const c = getByLabelText('3 unread') as HTMLElement;
    expect(c.style.background).toBe(render(<span style={{ background: A.INK }} />).container.firstElementChild!.getAttribute('style')!.replace('background: ', '').replace(';', ''));
    fireEvent.click(getByText('Switch to clbhouz'));
    expect(sw).toHaveBeenCalledWith('b1');
  });
  it('three actors: "Switch actor", summed count, opens list rather than switching', () => {
    const sw = vi.fn();
    const { getByText, getByLabelText } = render(<ActorCards currentActor={me} profiles={[me, b1, b2]} onSwitchProfile={sw} />);
    expect(getByLabelText('7 unread')).toBeTruthy();
    fireEvent.click(getByText('Switch actor'));
    expect(sw).not.toHaveBeenCalled();
    expect(getByText('Shop')).toBeTruthy();
  });
});

describe('waiting block', () => {
  beforeEach(() => { convs = []; notifications = 0; });
  const mount = (nav = vi.fn()) => ({ nav, ...render(<QuickActionsRow gutter={20} actorType="personal" actorId="p" onNavigate={nav} />) });
  it('message row picks newest unread and opens its thread', () => {
    convs = [conv('old', 2, '2026-10-10T10:00:00Z'), conv('read', 0, '2026-10-12T09:00:00Z'), conv('new', 1, '2026-10-11T10:00:00Z')];
    const { container, nav } = mount();
    const row = container.querySelector('[data-wait-row="message"]')!;
    expect(row.textContent).toContain('new');
    fireEvent.click(row);
    expect(nav).toHaveBeenCalledWith('/messages/new');
  });
  it('nothing unread: quiet pair only', () => {
    const { container } = mount();
    expect(container.querySelector('[data-wait-row]')).toBeNull();
    expect(container.querySelectorAll('[data-plain-door]')).toHaveLength(2);
  });
  it('notifications only: notifications row full, Messages as plain door', () => {
    notifications = 4;
    const { container } = mount();
    expect(container.querySelector('[data-wait-row="notifications"]')).not.toBeNull();
    expect(container.querySelector('[data-wait-row="message"]')).toBeNull();
    const doors = container.querySelectorAll('[data-plain-door]');
    expect(doors).toHaveLength(1);
    expect(doors[0].getAttribute('data-plain-door')).toBe('Messages');
  });
  it('notifications label pluralises at one', () => {
    expect(notificationsLabel(1)).toBe('1 new notification');
    expect(notificationsLabel(4)).toBe('4 new notifications');
  });
});

describe('the word is Notifications', () => {
  it('no user-facing string in src says "Alerts"', async () => {
    const { execSync } = await import('node:child_process');
    const out = execSync(`rg -n --glob '*.tsx' --glob '!**/test/**' -e '>\\s*Alerts\\s*<' -e '["\\x27\`]Alerts["\\x27\`]' src || true`, { encoding: 'utf8' });
    expect(out.trim()).toBe('');
  });
});
