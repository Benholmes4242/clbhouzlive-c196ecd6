import React, { StrictMode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enCourses from '../../public/locales/en/courses.json';
import { RoundsGate, roundsGateState } from '@/features/explore-magazine/RoundsGate';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { __resetScrollerCache } from '@/lib/getScrollParent';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en', fallbackLng: 'en', resources: { en: { courses: enCourses } },
    interpolation: { escapeValue: false },
  });
});
function resetScroller() {
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  __resetScrollerCache();
}
beforeEach(() => { resetScroller(); vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); resetScroller(); vi.useRealTimers(); });
function lock() { act(() => vi.advanceTimersByTime(3000)); }

function LocationProbe() {
  return <output data-testid="destination">{useLocation().pathname}</output>;
}

// Same conditional mount as ScoresLeaderboardsPage: no reporting component
// exists until the connection read settles into the gated state.
function Page({ userId = 'viewer', isSuccess = true, data = null }: {
  userId?: string; isSuccess?: boolean; data?: unknown;
}) {
  const gate = roundsGateState(userId || undefined, { isSuccess, data });
  return <>{gate === 'gated' ? <RoundsGate><div data-board-row="">Live rounds</div></RoundsGate> : null}<LocationProbe /></>;
}

function fixture(props: React.ComponentProps<typeof Page> = {}) {
  return <StrictMode><MemoryRouter initialEntries={['/amateur']}><I18nextProvider i18n={i18n}>
    <Page {...props} />
  </I18nextProvider></MemoryRouter></StrictMode>;
}

function openSheet() {
  fireEvent.click(screen.getByRole('button', { name: enCourses.amateur.gate.noHandicap }));
}

describe('CB15 — gate reporting', () => {
  it('starts unlocked at 300px and reports scroll lock only beyond 80px from arrival', () => {
    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = 300;
    const view = render(fixture());
    expect(view.container.querySelector('[data-rounds-locked]')).toBeNull();
    expect(analyticsEvents.track).not.toHaveBeenCalledWith('rounds_gate_viewed', expect.anything());
    scroller.scrollTop = 380; fireEvent.scroll(window);
    expect(view.container.querySelector('[data-rounds-locked]')).toBeNull();
    expect(analyticsEvents.track).not.toHaveBeenCalledWith('rounds_gate_viewed', expect.anything());
    scroller.scrollTop = 381; fireEvent.scroll(window);
    expect(view.container.querySelector('[data-rounds-locked]')).not.toBeNull();
    expect(analyticsEvents.track).toHaveBeenCalledWith('rounds_gate_viewed', { gate_state: 'gated', trigger: 'scroll' });
  });
  it('reports viewed only on scroll lock, once per mount with the scroll trigger', () => {
    render(fixture());
    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = 80; fireEvent.scroll(window);
    expect(analyticsEvents.track).not.toHaveBeenCalledWith('rounds_gate_viewed', expect.anything());
    scroller.scrollTop = 81; fireEvent.scroll(window);
    expect(analyticsEvents.track).toHaveBeenCalledWith('rounds_gate_viewed', { gate_state: 'gated', trigger: 'scroll' });
    scroller.scrollTop = 0; fireEvent.scroll(window); lock();
    expect(vi.mocked(analyticsEvents.track).mock.calls.filter(([event]) => event === 'rounds_gate_viewed')).toHaveLength(1);
  });
  it('reports once per gated mount despite StrictMode replay and settled query rerenders', () => {
    const view = render(fixture({ isSuccess: false }));
    expect(analyticsEvents.track).not.toHaveBeenCalled();
    view.rerender(fixture());
    view.rerender(fixture({ data: null }));
    view.rerender(fixture());
    expect(analyticsEvents.track).toHaveBeenCalledTimes(1);
    expect(analyticsEvents.track).toHaveBeenCalledWith('rounds_gate_look_started', { gate_state: 'gated' });
    lock();
    expect(analyticsEvents.track).toHaveBeenCalledWith('rounds_gate_viewed', { gate_state: 'gated', trigger: 'timer' });
    act(() => vi.advanceTimersByTime(11000));
    expect(vi.mocked(analyticsEvents.track).mock.calls.filter(([event]) => event === 'rounds_gate_viewed')).toHaveLength(1);
  });

  it.each([
    ['loading', { isSuccess: false }],
    ['signedOut', { userId: '' }],
    ['connected', { data: { id: 'connection' } }],
  ] as const)('does not report in %s', (_state, props) => {
    render(fixture(props));
    expect(analyticsEvents.track).not.toHaveBeenCalled();
  });

  it('reports again on a genuine new gated mount', () => {
    const first = render(fixture());
    first.unmount();
    render(fixture());
    expect(analyticsEvents.track).toHaveBeenCalledTimes(2);
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_look_started', { gate_state: 'gated' }],
      ['rounds_gate_look_started', { gate_state: 'gated' }],
    ]);
  });

  it('reports the white CTA tap before retaining its connect destination', () => {
    render(fixture());
    lock();
    vi.mocked(analyticsEvents.track).mockClear();
    fireEvent.click(screen.getByRole('button', { name: enCourses.amateur.gate.cta }));
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_connect_tap', { gate_state: 'gated' }],
    ]);
    expect(screen.getByTestId('destination').textContent).toBe('/manage/handicap');
  });

  it('reports the no-handicap tap once and opens the glass tile', () => {
    render(fixture());
    lock();
    vi.mocked(analyticsEvents.track).mockClear();
    openSheet();
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_no_handicap_tap', { gate_state: 'gated' }],
    ]);
    expect(screen.getByRole('button', { name: /iGolf, in England/ })).toBeTruthy();
  });

  it('reports the england row without identifiers and retains its external destination', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(fixture());
    lock();
    openSheet();
    vi.mocked(analyticsEvents.track).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /iGolf, in England/ }));
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_sheet_row_tap', { gate_state: 'gated', row: 'england' }],
    ]);
    expect(open).toHaveBeenCalledWith('https://www.englandgolf.org/igolf', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('reports the club row, closes the sheet and navigates to Courses', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(fixture());
    lock();
    openSheet();
    vi.mocked(analyticsEvents.track).mockClear();
    fireEvent.click(screen.getByText(enCourses.amateur.gate.club));
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_sheet_row_tap', { gate_state: 'gated', row: 'club' }],
    ]);
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByTestId('destination').textContent).toBe('/courses');
    open.mockRestore();
  });
});