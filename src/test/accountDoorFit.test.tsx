import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import AccountGlance, { type AccountGlanceProps } from '@/features/chrome-v2/AccountGlance';
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const me = { id: 'p', type: 'personal' as const, name: 'Ben' };
function setup() {
  const ref = React.createRef<HTMLButtonElement>();
  const props: AccountGlanceProps = { open: true, onClose: vi.fn(), anchorRef: ref, currentActor: me, profiles: [me], onSwitchProfile: vi.fn(), onNavigate: vi.fn(), viewProfileRoute: '/profile', settingsRoute: '/edit-profile?tab=settings', isAdmin: false, countFor: () => 0, unreadMessages: 0, unreadNotifications: 0, onOpenCourses: vi.fn(), onInviteFriends: vi.fn() };
  render(<MemoryRouter><button ref={ref}>Avatar</button><AccountGlance {...props} /></MemoryRouter>);
}
afterEach(cleanup);

describe('account door small-phone fit', () => {
  it('door buttons can shrink and clip overflow; labels ellipsize as a last resort', () => {
    setup();
    const notifications = screen.getByRole('button', { name: 'Notifications' });
    expect(notifications).toHaveClass('account-door');
    const label = within(notifications).getByText('Notifications');
    expect(label).toHaveClass('account-door-label');
    const css = readFileSync('src/features/chrome-v2/account-glance.css', 'utf8');
    const door = css.match(/\.account-glance button\.account-door \{([^}]*)\}/)?.[1] ?? '';
    expect(door).toContain('flex: 1 1 0');
    expect(door).toContain('min-width: 0');
    expect(door).toContain('overflow: hidden');
    expect(door).toContain('padding: 0 10px');
    expect(door).toContain('gap: 9px');
    const labelRule = css.match(/\.account-door-label \{([^}]*)\}/)?.[1] ?? '';
    expect(labelRule).toContain('min-width: 0');
    expect(labelRule).toContain('overflow: hidden');
    expect(labelRule).toContain('text-overflow: ellipsis');
    expect(labelRule).toContain('white-space: nowrap');
    expect(labelRule).toContain('font-size: 13px');
  });
  it('doors container queries shrink gap and label to 12px at 300px and below', () => {
    const css = readFileSync('src/features/chrome-v2/account-glance.css', 'utf8');
    expect(css).toContain('.account-doors { display: flex; margin-top: 12px; gap: 8px; container-type: inline-size; }');
    const block = css.match(/@container \(max-width: 300px\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(block).toContain('.account-glance button.account-door { gap: 8px; }');
    expect(block).toContain('.account-door-label { font-size: 12px; }');
  });
});
