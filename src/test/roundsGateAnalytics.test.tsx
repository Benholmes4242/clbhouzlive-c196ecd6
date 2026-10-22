import React, { StrictMode } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enCourses from '../../public/locales/en/courses.json';
import { RoundsGate, roundsGateState } from '@/features/explore-magazine/RoundsGate';
import { analyticsEvents } from '@/utils/analyticsEvents';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en', fallbackLng: 'en', resources: { en: { courses: enCourses } },
    interpolation: { escapeValue: false },
  });
});
beforeEach(() => vi.clearAllMocks());

function LocationProbe() {
  return <output data-testid="destination">{useLocation().pathname}</output>;
}

// Same conditional mount as ScoresLeaderboardsPage: no reporting component
// exists until the connection read settles into the gated state.
function Page({ userId = 'viewer', isSuccess = true, data = null }: {
  userId?: string; isSuccess?: boolean; data?: unknown;
}) {
  const gate = roundsGateState(userId || undefined, { isSuccess, data });
  return <>{gate === 'gated' ? <RoundsGate><div>Live rounds</div></RoundsGate> : null}<LocationProbe /></>;
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
  it('reports once per gated mount despite StrictMode replay and settled query rerenders', () => {
    const view = render(fixture({ isSuccess: false }));
    expect(analyticsEvents.track).not.toHaveBeenCalled();
    view.rerender(fixture());
    view.rerender(fixture({ data: null }));
    view.rerender(fixture());
    expect(analyticsEvents.track).toHaveBeenCalledTimes(1);
    expect(analyticsEvents.track).toHaveBeenCalledWith('rounds_gate_viewed', { gate_state: 'gated' });
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
      ['rounds_gate_viewed', { gate_state: 'gated' }],
      ['rounds_gate_viewed', { gate_state: 'gated' }],
    ]);
  });

  it('reports the white CTA tap before retaining its connect destination', () => {
    render(fixture());
    vi.mocked(analyticsEvents.track).mockClear();
    fireEvent.click(screen.getByRole('button', { name: enCourses.amateur.gate.cta }));
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_connect_tap', { gate_state: 'gated' }],
    ]);
    expect(screen.getByTestId('destination').textContent).toBe('/manage/handicap');
  });

  it('reports the no-handicap tap once and opens the existing sheet', () => {
    render(fixture());
    vi.mocked(analyticsEvents.track).mockClear();
    openSheet();
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_no_handicap_tap', { gate_state: 'gated' }],
    ]);
    expect(screen.getByRole('button', { name: /England iGolf/ })).toBeTruthy();
  });

  it('reports the england row without identifiers and retains its external destination', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(fixture());
    openSheet();
    vi.mocked(analyticsEvents.track).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /England iGolf/ }));
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_sheet_row_tap', { gate_state: 'gated', row: 'england' }],
    ]);
    expect(open).toHaveBeenCalledWith('https://www.englandgolf.org/igolf', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('reports the club row, closes the sheet and navigates to Courses', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(fixture());
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