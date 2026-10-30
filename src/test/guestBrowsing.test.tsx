/**
 * GUEST BROWSING Stage 1 tests. The switch (guestConfig) is mocked ON here;
 * one test reads the source to prove Stage 3 is on everywhere outside tests.
 * react-i18next mock copied in full per project rule.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  inMedian: false,
}));

vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: true }));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'guest-1', is_anonymous: true }, loading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      // Fire the listener once with the guest session so the store's
      // non-React mirror (getGuestUser) sees the anonymous user.
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        cb('INITIAL_SESSION', { user: { id: 'guest-1', is_anonymous: true } });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  },
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: mocks.track } }));
vi.mock('@/utils/median/isMedianApp', () => ({ isMedianApp: () => mocks.inMedian }));

import { isGuestUser } from '@/features/guest/useIsGuest';
import {
  courseSurfaceKey,
  getGuestCardRequest,
  isSurfaceLocked,
  lockSurface,
  openGuestCard,
  resetGuestGateState,
  setGuestCourseContext,
  setGuestTourContext,
  surfaceForPath,
} from '@/features/guest/guestGateStore';
import { guestActionCopy, guestSurfaceCopy, GUEST_ISLAND_COPY } from '@/features/guest/guestCopy';
import { gateGuestActionNow } from '@/features/guest/useGuestActionGate';
import { isGuestAllowedPath, GuestRouteGuard } from '@/features/guest/guestRoutes';
import { GuestGateHost } from '@/features/guest/GuestGateHost';
import { GuestJoinCard } from '@/features/guest/GuestJoinCard';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="path">{`${location.pathname}${location.search}`}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.inMedian = false;
  resetGuestGateState();
});
afterEach(cleanup);

describe('the switch', () => {
  it('ships on everywhere outside test mode without module-load host detection', () => {
    const src = readFileSync('src/features/guest/guestConfig.ts', 'utf8');
    expect(src).toContain("GUEST_BROWSING_ENABLED = import.meta.env.MODE !== 'test'");
    expect(src).not.toContain('isNativeAppSync');
    expect(src).not.toContain('isPreviewHost()');
  });
});

describe('the one guest definition', () => {
  it('is user.is_anonymous === true, nothing else', () => {
    expect(isGuestUser({ is_anonymous: true } as never)).toBe(true);
    expect(isGuestUser({ is_anonymous: false } as never)).toBe(false);
    expect(isGuestUser(null)).toBe(false);
    expect(isGuestUser(undefined)).toBe(false);
  });
});

describe('surface mapping', () => {
  it('maps the free-look surfaces and keys each course page by id', () => {
    expect(surfaceForPath('/')).toBe('clubhouse');
    expect(surfaceForPath('/clubhouse')).toBe('clubhouse');
    expect(surfaceForPath('/amateur')).toBe('explore');
    expect(surfaceForPath('/courses')).toBe('courses');
    expect(surfaceForPath('/courses/abc')).toBe('course:abc');
    expect(surfaceForPath('/courses/abc/holes')).toBe('course:abc');
    expect(surfaceForPath('/tourhub')).toBe('tour');
    expect(surfaceForPath('/tourhub/schedule')).toBe('tour');
    expect(surfaceForPath('/profile/ben')).toBeNull();
    expect(surfaceForPath('/settings')).toBeNull();
    expect(courseSurfaceKey('x1')).toBe('course:x1');
  });
});

describe('route rules', () => {
  it('allows the free-look surfaces, deep links, auth and legal pages', () => {
    for (const p of ['/', '/amateur', '/courses', '/courses/abc', '/courses/abc/rounds', '/tourhub', '/tourhub/players', '/post/xyz', '/auth', '/delete-account']) {
      expect(isGuestAllowedPath(p)).toBe(true);
    }
  });
  it('blocks everything else', () => {
    for (const p of ['/welcome', '/signup', '/profile/ben', '/settings', '/messages', '/manage/handicap', '/media', '/watch']) {
      expect(isGuestAllowedPath(p)).toBe(false);
    }
  });
});

describe('surface locks', () => {
  it('lock once and stay locked for the session', () => {
    expect(isSurfaceLocked('explore')).toBe(false);
    expect(lockSurface('explore')).toBe(true);
    expect(lockSurface('explore')).toBe(false);
    expect(isSurfaceLocked('explore')).toBe(true);
    resetGuestGateState();
    expect(isSurfaceLocked('explore')).toBe(false);
  });
});

describe('copy table', () => {
  it('course copy uses the short name as kicker and live rounds in the headline', () => {
    expect(guestSurfaceCopy('clubhouse').kicker).toBe('Join the community');
    setGuestCourseContext({ courseId: 'c1', shortName: 'St Andrews', roundsTracked: 1234 });
    const copy = guestSurfaceCopy('course:c1');
    expect(copy.kicker).toBe('St Andrews');
    expect(copy.headline.map((p) => p.text).join('')).toBe('1,234 rounds measured here, hole by hole.');
    expect(copy.headline[0].amber).toBe(true);
  });
  it('course copy falls back below one round', () => {
    setGuestCourseContext({ courseId: 'c2', shortName: 'St Andrews', roundsTracked: 0 });
    expect(guestSurfaceCopy('course:c2').headline.map((p) => p.text).join('')).toBe('See what golfers make of St Andrews.');
  });
  it('tour copy names the live event when there is one', () => {
    setGuestTourContext({ liveEventName: 'The Open' });
    const copy = guestSurfaceCopy('tour');
    expect(copy.headline.map((p) => p.text).join('')).toBe('Follow every shot of The Open.');
    setGuestTourContext({ liveEventName: null });
    expect(guestSurfaceCopy('tour').headline.map((p) => p.text).join('')).toContain('Every tour');
  });
  it('action copy celebrates by first name and names the post kind', () => {
    const like = guestActionCopy('like', { firstName: 'Ben', postKind: 'round' });
    expect(like.headline.map((p) => p.text).join('')).toBe('Celebrate Ben’s round and leave a comment.');
    expect(guestActionCopy('follow', { firstName: 'Ben' }).headline.map((p) => p.text).join('')).toBe('Follow Ben and see every round they post.');
    expect(guestActionCopy('post').headline.map((p) => p.text).join('')).toContain('Post your rounds');
    expect(guestActionCopy('own_profile').headline.map((p) => p.text).join('')).toContain('Build your profile');
    expect(guestActionCopy('report').headline.map((p) => p.text).join('')).toBe('Join clbhouz to do that.');
  });
});

describe('the action gate', () => {
  it('opens the action card, tracks it and stops the caller', () => {
    expect(gateGuestActionNow('like', { firstName: 'Ben' })).toBe(true);
    const req = getGuestCardRequest();
    expect(req?.kind).toBe('action');
    expect(mocks.track).toHaveBeenCalledWith('guest_gate_shown', expect.objectContaining({ trigger: 'action', action: 'like' }));
  });
});

describe('the join card', () => {
  const copy = guestSurfaceCopy('clubhouse');
  it('shows email always; Apple and Google only where AuthHeroScreen shows them', () => {
    render(<GuestJoinCard copy={copy} closable onChoice={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Continue with email' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull();
  });
  it('shows Apple first, then Google, in the Median app', () => {
    mocks.inMedian = true;
    render(<GuestJoinCard copy={copy} closable onChoice={() => {}} onClose={() => {}} />);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons.indexOf('Continue with Apple')).toBeLessThan(buttons.indexOf('Continue with Google'));
    expect(buttons.indexOf('Continue with Google')).toBeLessThan(buttons.indexOf('Continue with email'));
  });
  it('keeps its rise/fade behind a reduced-motion guard', () => {
    const css = readFileSync('src/features/guest/guestGate.css', 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none');
  });
  it('suppresses the container focus ring and keeps the button ring keyboard-only', () => {
    const css = readFileSync('src/features/guest/guestGate.css', 'utf8');
    // The card container (the tabIndex={-1} focus target) never shows an outline.
    expect(css).toMatch(/\.guest-gate-card \{[\s\S]*?outline: none;/);
    // A tap focus draws no ring; only keyboard focus draws the approved one.
    expect(css).toContain('.guest-gate-card button:focus:not(:focus-visible) {\n  outline: none;\n}');
    expect(css).toContain(
      '.guest-gate-card button:focus-visible {\n  outline: 2px solid rgba(248, 250, 252, 0.6);\n  outline-offset: 2px;\n}',
    );
  });
});

describe('the gate host', () => {
  function Host({ initial = '/' }: { initial?: string }) {
    return (
      <MemoryRouter initialEntries={[initial]}>
        <GuestGateHost />
        <LocationProbe />
      </MemoryRouter>
    );
  }

  it('renders nothing before any trigger', () => {
    render(<Host />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('the scroll-triggered card has no close button', () => {
    render(<Host />);
    act(() => openGuestCard({ kind: 'scroll', surface: 'clubhouse' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('the action card is closable and closes on the X', () => {
    render(<Host />);
    act(() => openGuestCard({ kind: 'action', surface: 'clubhouse', action: 'like', firstName: 'Ben' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Ben');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mocks.track).toHaveBeenCalledWith('guest_gate_choice', expect.objectContaining({ choice: 'close' }));
  });

  it('email hands off to /auth with the start intent', () => {
    render(<Host />);
    act(() => openGuestCard({ kind: 'join_button', surface: 'clubhouse' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue with email' }));
    expect(screen.getByTestId('path').textContent).toBe('/auth?guest=1&start=email');
  });

  it('the login row goes to the normal /auth', () => {
    render(<Host />);
    act(() => openGuestCard({ kind: 'join_button', surface: 'clubhouse' }));
    fireEvent.click(screen.getByRole('button', { name: 'ALREADY A MEMBER? LOG IN' }));
    expect(screen.getByTestId('path').textContent).toBe('/auth');
  });

  it('returning to a locked surface re-shows the scroll card at the top', () => {
    lockSurface('explore');
    render(<Host initial="/amateur" />);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

describe('the route guard', () => {
  it('sends a guest on a blocked route back to the Clubhouse with the card open', () => {
    render(
      <MemoryRouter initialEntries={['/profile/ben']}>
        <GuestRouteGuard />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('path').textContent).toBe('/');
    expect(getGuestCardRequest()?.kind).toBe('action');
  });
  it('leaves free-look routes alone', () => {
    render(
      <MemoryRouter initialEntries={['/courses']}>
        <GuestRouteGuard />
        <LocationProbe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('path').textContent).toBe('/courses');
    expect(getGuestCardRequest()).toBeNull();
  });
});

describe('island copy', () => {
  it('reads Log in and Join free', () => {
    expect(GUEST_ISLAND_COPY.login).toBe('Log in');
    expect(GUEST_ISLAND_COPY.join).toBe('Join free');
  });
});
