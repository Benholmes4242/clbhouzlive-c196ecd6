import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('@/components/profile/handicap/whs/charts', () => ({ HcpTrendChart: () => <div data-chart /> }));
vi.mock('@/hooks/useActorUnreadCounts', () => ({ useActorUnreadCounts: () => ({ countFor: () => 3 }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span />, DARK_HAIRLINE: 'x' }));

import SheetCards from '@/features/profile-sheet-v2/components/SheetCards';
import ActorCards from '@/features/profile-sheet-v2/components/ActorCards';
import FormCard from '@/features/profile-sheet-v2/components/FormCard';
import CoursesCard from '@/features/profile-sheet-v2/components/CoursesCard';
import {
  deriveSheetHcpState, isSyncFailing, handicapSentence, formBars, courseFigures, type SheetHcpState,
} from '@/features/profile-sheet-v2/sheetState';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class { observe() {} disconnect() {} };
});

const bars = [
  { id: 'a', date: '2026-09-06', value: -0.9, movement: -0.2 },
  { id: 'b', date: '2026-09-14', value: 2.1, movement: 0.1 },
  { id: 'c', date: '2026-09-21', value: -1.9, movement: -0.3 },
];
const courses = courseFigures([{ course_name: 'Knebworth', rounds_count: 4, last_played: '2026-05-01', avg_to_par: 2.1 }]);
const history = [
  { observed_at: '2026-08-01', handicap_index: 2.2 },
  { observed_at: '2026-09-01', handicap_index: 1.6 },
];

function cards(state: SheetHcpState) {
  const { container } = render(
    <SheetCards state={state} history90={history} bars={bars} courses={courses}
      onNavigate={() => {}} onOpenCourseAnalytics={() => {}} now={Date.parse('2026-10-12')} />,
  );
  return (name: string) => !!container.querySelector(`[data-card="${name}"]`);
}

const base = { isBusiness: false, settled: true, hidden: false, connection: null, egHandicapIndex: null, manualHandicapIndex: null };

describe('profile sheet states (S.2)', () => {
  it('(a) hidden: no handicap, connect, form or courses card', () => {
    const s = deriveSheetHcpState({ ...base, hidden: true, connection: { provider: 'england_golf' }, egHandicapIndex: 1.6 });
    expect(s.kind).toBe('hidden');
    const has = cards(s);
    for (const c of ['handicap', 'connect', 'manual', 'syncing', 'failing', 'form', 'courses']) expect(has(c)).toBe(false);
  });
  it('(b) none: connect card only', () => {
    const has = cards(deriveSheetHcpState(base));
    expect(has('connect')).toBe(true);
    expect(has('form') || has('courses') || has('handicap')).toBe(false);
  });
  it('(c) manual: manual card only, never form or courses', () => {
    const s = deriveSheetHcpState({ ...base, manualHandicapIndex: 14 });
    expect(s).toEqual({ kind: 'manual', index: 14 });
    const has = cards(s);
    expect(has('manual')).toBe(true);
    expect(has('form') || has('courses') || has('connect')).toBe(false);
  });
  it('(d) connected, no index, no error: syncing; manual figure ignored', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, manualHandicapIndex: 14 });
    expect(s.kind).toBe('syncing');
    const has = cards(s);
    expect(has('syncing')).toBe(true);
    expect(has('manual') || has('connect') || has('form') || has('courses')).toBe(false);
  });
  it('(d) connected, no index, sync error: not-syncing card, not the connect card', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf', last_sync_error: 'timeout', last_synced_at: '2026-09-02' } });
    expect(s.kind).toBe('failing');
    const has = cards(s);
    expect(has('failing')).toBe(true);
    expect(has('connect') || has('syncing') || has('form')).toBe(false);
  });
  it('(e) whs with index: handicap, form and courses', () => {
    const has = cards(deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, egHandicapIndex: 1.6 }));
    expect(has('handicap') && has('form') && has('courses')).toBe(true);
    expect(has('connect')).toBe(false);
  });
  it('unsettled renders nothing', () => {
    const has = cards(deriveSheetHcpState({ ...base, settled: false }));
    expect(has('connect')).toBe(false);
  });
});

describe('profile sheet parts', () => {
  it('actor block absent for a single-actor member', () => {
    const { container } = render(<ActorCards currentActor={{ id: '1', type: 'personal' }}
      profiles={[{ id: '1', type: 'personal', name: 'Ben' }]} onSwitchProfile={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
  it('count only for the non-active actor', () => {
    const { getAllByLabelText } = render(<ActorCards currentActor={{ id: '1', type: 'personal' }}
      profiles={[{ id: '1', type: 'personal', name: 'Ben' }, { id: '2', type: 'business', name: 'clbhouz' }]} onSwitchProfile={() => {}} />);
    expect(getAllByLabelText('3 unread')).toHaveLength(1);
  });
  it('negative form bar hangs below the line, positive rises above, true minus', () => {
    const { container } = render(<FormCard bars={bars} onNavigate={() => {}} />);
    const els = container.querySelectorAll('[data-form-bar]');
    expect(els[0].getAttribute('data-below')).toBe('true');
    expect(els[1].getAttribute('data-below')).toBe('false');
    expect(els[0].textContent).toBe('\u22120.9');
  });
  it('form card absent below two rounds', () => {
    const { container } = render(<FormCard bars={[bars[0]]} onNavigate={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
  it('form uses differential minus index played off, excludes nine-hole, oldest first', () => {
    const out = formBars([
      { id: 'n', play_date: '2026-10-01', handicap_differential: 1, handicap_index_at_time: 2, is_nine_hole: true },
      { id: 'b', play_date: '2026-09-20', handicap_differential: 3.5, handicap_index_at_time: 1.4, is_nine_hole: false },
      { id: 'a', play_date: '2026-09-10', handicap_differential: 0.5, handicap_index_at_time: 1.4, is_nine_hole: false },
    ]);
    expect(out.map((b) => [b.id, b.value])).toEqual([['a', -0.9], ['b', 2.1]]);
  });
  it('handicap sentence drops the high clause when the series has no high above now', () => {
    const rising = [{ t: '2026-08-01', v: 1.0 }, { t: '2026-09-01', v: 1.4 }];
    const text = handicapSentence(rising, 90)!.map((s) => s.text).join('');
    expect(text.startsWith('Up 0.4 in ninety days.')).toBe(true);
    expect(text).not.toContain('high');
    expect(handicapSentence([{ t: '2026-08-01', v: 1 }], 90)).toBeNull();
  });
  it('courses card absent with no courses', () => {
    expect(courseFigures([])).toBeNull();
    const { container } = render(<CoursesCard figures={null} onOpen={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('profile sheet corrections (V)', () => {
  it('V.2 no eg index but a trend current figure renders the index card, not syncing', () => {
    const s = deriveSheetHcpState({ ...base, connection: { provider: 'england_golf' }, trendCurrent: 3.4 });
    expect(s).toEqual({ kind: 'ready', index: 3.4 });
    const { container } = render(
      <SheetCards state={s} history90={[]} bars={bars} courses={courses}
        onNavigate={() => {}} onOpenCourseAnalytics={() => {}} now={Date.parse('2026-10-12')} />,
    );
    expect(container.querySelector('[data-card="handicap"]')).not.toBeNull();
    expect(container.querySelector('[data-card="syncing"]')).toBeNull();
  });

  it('V.1 the form door and the index door resolve to different routes', () => {
    const go = vi.fn();
    const { getByText } = render(
      <SheetCards state={{ kind: 'ready', index: 1.6 }} history90={history} bars={bars} courses={courses}
        onNavigate={go} onOpenCourseAnalytics={() => {}} now={Date.parse('2026-10-12')} />,
    );
    getByText('Your rounds').click();
    getByText('View handicap').click();
    expect(go.mock.calls[0][0]).toBe('/profile?tab=rounds');
    expect(go.mock.calls[1][0]).toBe('/handicap');
    expect(go.mock.calls[0][0]).not.toBe(go.mock.calls[1][0]);
  });

  it('V.3 sync failure matches the written statuses exactly', () => {
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'timeout' })).toBe(true);
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'partial' })).toBe(false);
    expect(isSyncFailing({ provider: 'england_golf', last_sync_status: 'ok' })).toBe(false);
  });
});
