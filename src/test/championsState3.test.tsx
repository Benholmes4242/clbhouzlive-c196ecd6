import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }), Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span> }));

// CHAMPIONS_STATE_3_G3: authorised actual-avatar substitution, scoped here.
const avatarCalls = vi.hoisted(() => ({ current: [] as Array<{ photoUrl: string | null; name: string; ghost?: boolean }> }));
vi.mock('@/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/profile/handicap/whs/sections/course-legends/drilldown/_shared/boardParts')>();
  return {
    ...actual,
    CourseLegendsAvatar: (p: { photoUrl: string | null; name: string; ghost?: boolean }) => {
      const id = avatarCalls.current.push(p) - 1;
      const initials = p.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
      return <span aria-hidden data-avatar-call={id}>{initials}</span>;
    },
  };
});

import { ProjectedChampions, type ProjectedChampionsProps } from '@/components/profile/handicap/whs/sections/course-legends/flat/ProjectedChampions';
import { FieldChampions } from '@/components/profile/handicap/whs/sections/course-legends/flat/FieldChampions';
import { NobodyHasPlayed } from '@/components/profile/handicap/whs/sections/course-legends/flat/NobodyHasPlayed';
import { BoardSection } from '@/components/profile/handicap/whs/sections/course-legends/flat/BoardSection';
import { CHAMPIONS_BOARD_DATA, CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import { projectedBoardRange, projectedTile } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsProjection';
import { ghostInsertionIndex } from '@/components/profile/handicap/whs/sections/course-legends/flat/ProjectionGhostRow';
import { recordProjectionForm } from '@/lib/whs/recordProjectionForm';
import { recordAgainstRange } from '@/components/courses/course-detail/you/ProjectionSection';
import { buildCourseProjection } from '@/lib/whs/coursePlay';
import type { FlatRow } from '@/components/profile/handicap/whs/sections/course-legends/flat/championsFlatBits';
import type { LegendCategory } from '@/lib/gam/types';

afterEach(cleanup);
const inputs = { index: 2, cr: 71, slope: 113, par: 71 };
const projection = { typicalGross: 73, lowGross: 71, highGross: 76, courseHcp: 2, sampleSize: 8 };
function row(value: number, name = `Member ${value}`, rank = 1): FlatRow {
  return { rank, name, photoUrl: null, value, valueDisplay: String(value), attained_at: '2026-06-01', isSelf: false, userId: name };
}
function props(): ProjectedChampionsProps {
  const grouped = new Map<LegendCategory, { rows: FlatRow[]; total: number }>();
  for (const key of CHAMPIONS_ORDER_ALL_TIME) grouped.set(key, { rows: [row(key === 'best_score_diff_all_time' ? 5.3 : key === 'best_stableford_all_time' ? 40 : 76)], total: 1 });
  grouped.delete('most_aces_all_time');
  grouped.delete('most_albatrosses_all_time');
  return { categories: CHAMPIONS_ORDER_ALL_TIME.map(key => ({ key, label: key, short: key })), grouped, courseName: 'Sunningdale', activeKey: 'lowest_gross_all_time', onSelect: vi.fn(), legendWindow: 'all_time', onWindowChange: vi.fn(), onConnect: vi.fn(), onOpenFull: vi.fn(), par: 71, fieldOverPar: 10, rounds: 10, projection, inputs, viewer: { name: 'Ben Hill', photoUrl: 'https://example.test/viewer.jpg' } };
}
function board(p: ProjectedChampionsProps, ghost = true) {
  return <BoardSection categories={p.categories} grouped={p.grouped} activeKey={p.activeKey} onSelectCategory={p.onSelect} legendWindow={p.legendWindow} canSwitchWindow onWindowChange={p.onWindowChange} coursePar={p.par} onOpenFull={p.onOpenFull} fieldOnly ghost={ghost ? { value: projection.typicalGross, name: 'Ben Hill', photoUrl: null } : undefined} />;
}

describe('CHAMPIONS_STATE_3 / CHAMPIONS_STATE_3_R / CHAMPIONS_STATE_3_T', () => {
  it('classifies canonical scoring, non-projectable and cumulative boards beside their order', () => {
    expect(CHAMPIONS_ORDER_ALL_TIME.map(key => CHAMPIONS_BOARD_DATA[key].kind)).toEqual(['projectable', 'projectable', 'not-projectable', 'cumulative', 'cumulative', 'cumulative', 'cumulative', 'cumulative', 'projectable']);
  });
  it('HC1: cumulative standings are not-started with no numeric gap', () => {
    for (const key of CHAMPIONS_ORDER_ALL_TIME.filter(key => CHAMPIONS_BOARD_DATA[key].kind === 'cumulative')) {
      expect(projectedTile(key, 12, projection, inputs)).toEqual({ state: 'not-started' });
    }
  });
  it('unclaimed cumulative feats remain never-claimed, not an invented zero', () => {
    expect(projectedTile('most_aces_all_time', null, projection, inputs)).toEqual({ state: 'never-claimed' });
  });
  it('HC2: Stableford stays held despite a lower gross projection; an absent holder stays open', () => {
    expect(projectedBoardRange('best_stableford_all_time', projection, inputs)).toBeNull();
    expect(projectedTile('best_stableford_all_time', 100, projection, inputs)).toEqual({ state: 'held' });
    expect(projectedTile('best_stableford_all_time', null, projection, inputs)).toEqual({ state: 'never-claimed' });
  });
  it('only a range reaching the standing score qualifies; missed scoring boards retain an unsigned gap', () => {
    expect(projectedTile('lowest_gross_all_time', 71, projection, inputs)).toEqual({ state: 'in-reach' });
    expect(projectedTile('lowest_gross_all_time', 69, projection, inputs)).toEqual({ state: 'held', gap: 2 });
  });
  it('the reached set contains exactly gross, net and differential for the approved sample', () => {
    const p = props();
    expect(p.categories.filter(c => projectedTile(c.key, p.grouped.get(c.key)?.rows[0]?.value ?? null, projection, inputs).state === 'in-reach').map(c => c.key)).toEqual(['lowest_gross_all_time', 'lowest_net_all_time', 'best_score_diff_all_time']);
  });
  it('GE3: seven finite differentials delegates to the exact State 2 subtree', () => {
    const p = props();
    p.projection = buildCourseProjection([1, 2, 3, 4, 5, 6, 7, NaN], inputs);
    const { container, rerender } = render(<ProjectedChampions {...p} />);
    const fallback = container.innerHTML;
    expect(container.querySelector('[data-projection-ghost]')).toBeNull();
    expect(container.querySelector('[data-state="in-reach"]')).toBeNull();
    rerender(<FieldChampions {...p} />);
    expect(container.innerHTML).toBe(fallback);
  });
  it('missing tee inputs delegates to State 2 even if a stale projection exists', () => {
    const p = props();
    p.inputs = null;
    const { container, rerender } = render(<ProjectedChampions {...p} />);
    const fallback = container.innerHTML;
    rerender(<FieldChampions {...p} />);
    expect(container.innerHTML).toBe(fallback);
  });
  it('inserts before the first worse gross score while keeping equal posted scores first', () => {
    expect(ghostInsertionIndex([row(70), row(73), row(73), row(76)], 73)).toBe(3);
    expect(ghostInsertionIndex([row(76)], 73)).toBe(0);
    expect(ghostInsertionIndex([], 73)).toBe(0);
  });
  it('GC2: real ranks and ties remain unchanged when a ghost is inserted', () => {
    const p = props();
    p.grouped.set(p.activeKey, { rows: [row(70, 'First', 1), row(70, 'Tied', 1), row(76, 'Third', 3)], total: 3 });
    const { container, rerender } = render(board(p, false));
    const ranks = () => Array.from(container.querySelectorAll('button')).filter(el => el.textContent?.includes('JUN')).map(el => el.firstElementChild?.textContent);
    const before = ranks();
    expect(before).toEqual(['T1', 'T1', '3']);
    rerender(board(p));
    expect(ranks()).toEqual(before);
    expect(container.querySelector('[data-ghost-rank]')?.textContent).toBe('');
    expect(container.querySelector('[data-projection-ghost] svg')).toBeNull();
  });
  it('CHAMPIONS_STATE_3_G: ghost loads no image even when viewer and holder both have photos', () => {
    const p = props();
    p.grouped.set(p.activeKey, { rows: [{ ...row(76, 'Alice Stone'), photoUrl: 'https://example.test/holder.jpg' }], total: 1 });
    avatarCalls.current = [];
    const { container } = render(<ProjectedChampions {...p} />);
    const ghostAvatar = container.querySelector('[data-projection-ghost] [data-avatar-call]');
    const callId = ghostAvatar?.getAttribute('data-avatar-call');
    const ghostProps = callId == null ? undefined : avatarCalls.current[Number(callId)];
    // This avatar's no-photo contract is ghost=true, not a src prop.
    expect(ghostProps?.ghost).toBe(true);
    expect(avatarCalls.current.filter(call => !call.ghost).map(call => call.photoUrl)).toContain('https://example.test/holder.jpg');
    expect({ name: ghostProps?.name, initials: ghostAvatar?.textContent }).toEqual({ name: 'Ben Hill', initials: 'BH' });
  });
  it('CHAMPIONS_STATE_3_G: ghost initials belong to the signed-in viewer, never the holder', () => {
    const p = props();
    p.grouped.set(p.activeKey, { rows: [{ ...row(76, 'Alice Stone'), photoUrl: 'https://example.test/holder.jpg' }], total: 1 });
    const { container } = render(<ProjectedChampions {...p} />);
    const ghost = container.querySelector('[data-projection-ghost]');
    expect(ghost?.textContent).toContain('Projected, not played');
    expect(ghost?.querySelector('[aria-hidden]')?.textContent).toBe('BH');
    expect(ghost?.querySelector('[aria-hidden]')?.textContent).not.toBe('AS');
  });
  it('the All count and full-list action include posted rows only', () => {
    const p = props();
    p.grouped.set(p.activeKey, { rows: [row(76)], total: 6 });
    render(board(p));
    fireEvent.click(screen.getByRole('button', { name: /All 6/ }));
    expect(p.onOpenFull).toHaveBeenCalledWith('lowest_gross_all_time');
    expect(screen.queryByRole('button', { name: /All 7/ })).toBeNull();
  });
  it('does not append a ghost below a populated or truncated real list', () => {
    const p = props();
    p.grouped.set(p.activeKey, { rows: [row(65), row(66), row(67), row(68), row(69), row(70), row(71)], total: 7 });
    const { container } = render(board(p));
    expect(container.querySelector('[data-projection-ghost]')).toBeNull();
  });
  it('only a completely empty gross list puts the ghost at its end', () => {
    const p = props();
    p.grouped.delete(p.activeKey);
    const { container } = render(board(p));
    expect(container.querySelectorAll('[data-projection-ghost]')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /All \d/ })).toBeNull();
  });
  it('net, differential and Stableford leaderboards never receive a ghost', () => {
    const p = props();
    const { container, rerender } = render(board(p));
    for (const key of ['lowest_net_all_time', 'best_score_diff_all_time', 'best_stableford_all_time'] as LegendCategory[]) {
      p.activeKey = key;
      rerender(board(p));
      expect(container.querySelector('[data-projection-ghost]')).toBeNull();
    }
  });
  it('yielding to the existing posted-card board removes the ghost even without a real row', () => {
    const p = props();
    const { container, rerender } = render(board(p));
    p.grouped.clear();
    rerender(board(p, false));
    expect(container.querySelector('[data-projection-ghost]')).toBeNull();
  });
  it('GE6: both callers select the same three range forms, with thin-field precedence', () => {
    for (const record of [69, 74, 78]) expect(recordAgainstRange(record, 71, 76)).toBe(recordProjectionForm(record, projection, false));
    expect(recordProjectionForm(78, projection, true)).toBe('rangeWithRecordThin');
    expect(recordProjectionForm(null, projection, true)).toBe('range');
  });
  it('State 1 still derives its open total from the canonical window order', () => {
    render(<NobodyHasPlayed categories={CHAMPIONS_ORDER_ALL_TIME} courseName="Sunningdale" showConnect={false} onConnect={vi.fn()} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(CHAMPIONS_ORDER_ALL_TIME.length);
    expect(screen.queryByText('Projected, not played')).toBeNull();
  });
});