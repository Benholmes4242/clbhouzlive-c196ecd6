import React from 'react';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mapJourneys, type AnalyticsJourneys, type FunnelStep } from '@/features/admin/hooks/useAnalyticsLenses';

let data: AnalyticsJourneys;
vi.mock('@/features/admin/hooks/useAnalyticsLenses', async (orig) => {
  const real = await orig<typeof import('@/features/admin/hooks/useAnalyticsLenses')>();
  return { ...real, useAnalyticsJourneys: () => ({ data, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }) };
});
import JourneysLens, { biggestDrop, TrackingGap } from '@/features/admin/components/analytics/JourneysLens';
import { CC3 } from '@/features/admin/components/InboxPanels';

const steps = (ns: number[], labels = ns.map((_, i) => `Step ${i}`)): FunnelStep[] => ns.map((n, i) => ({ n, label: labels[i], wait: null }));
const setSteps = (s: FunnelStep[]) => { data = mapJourneys({ gap: { joined: 0, signup_starts: 0 }, funnels: [{ key: 'golfer', title: 'Becoming a golfer', sub: 'Every member', steps: s }] }); };

describe('ANALYTICS_V3_3_JOURNEYS', () => {
  beforeEach(() => setSteps(steps([137, 34, 32, 15, 10], ['Joined', 'Connected a handicap', 'First round analysed', 'Back in week two', 'Weekly golfer'])));

  it('(a) 137, 34, 32, 15, 10 picks step 1 and explains the 103 lost', () => {
    expect(biggestDrop(data.funnels[0].steps)).toBe(1);
    render(<JourneysLens />);
    expect(screen.getByText('103 lost').parentElement!.textContent).toBe('103 lost between joined and connected a handicap, 75% of those who got that far.');
    expect(screen.getAllByText('· biggest drop')).toHaveLength(1);
  });

  it('(b) 17, 14, 12 picks step 1 at 82% rather than step 2 at 86%', () => {
    setSteps(steps([17, 14, 12]));
    expect(biggestDrop(data.funnels[0].steps)).toBe(1);
    render(<JourneysLens />);
    expect(screen.getByText('82% continue')).toHaveStyle({ color: CC3.bad });
    expect(screen.getByText('86% continue')).toHaveStyle({ color: CC3.mute });
  });

  it('(c) a rounded tie chooses the earlier step and no qualifying step returns none', () => {
    expect(biggestDrop(steps([16, 8, 4]))).toBe(1);
    expect(biggestDrop(steps([1000, 824, 679]))).toBe(1);
    expect(biggestDrop(steps([]))).toBeNull();
    expect(biggestDrop(steps([0, 0, 10, 20]))).toBeNull();
    setSteps(steps([0, 0, 10, 20]));
    render(<JourneysLens />);
    expect(screen.queryByText('· biggest drop')).not.toBeInTheDocument();
    expect(screen.queryByText(/lost between/)).not.toBeInTheDocument();
  });

  it('(d) a growing step is a data fault, never the biggest drop, with its true capped bar width', () => {
    setSteps(steps([100, 50, 80, 120]));
    expect(biggestDrop(data.funnels[0].steps)).toBe(1);
    render(<JourneysLens />);
    expect(screen.getByText('160% continue · data fault')).toHaveStyle({ color: CC3.bad });
    expect(screen.getAllByText('· biggest drop')).toHaveLength(1);
    const row = screen.getByText('80').parentElement!.parentElement!;
    const fill = row.lastElementChild!.firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('80%');
    const capped = screen.getByText('120').parentElement!.parentElement!.lastElementChild!.firstElementChild as HTMLElement;
    expect(capped.style.width).toBe('100%');
  });

  it('(e) end-to-end figures use ink and words use faint, never a conversion tone', () => {
    const view = render(<JourneysLens />);
    const figure = screen.getByText('7%');
    expect(figure).toHaveStyle({ color: CC3.ink, fontWeight: 700 });
    expect(figure.parentElement).toHaveStyle({ color: CC3.faint });
    expect(figure.parentElement!.textContent).toBe('7% end to end');
    setSteps(steps([10, 10]));
    view.rerender(<JourneysLens />);
    expect(screen.getByText('100%')).toHaveStyle({ color: CC3.ink });
  });

  it('(f) the tracking gap uses bad rather than amber and keeps muted body copy', () => {
    render(<TrackingGap joined={11} starts={1} />);
    expect(screen.getByText('Tracking gap: sign-up')).toHaveStyle({ color: CC3.bad });
    const note = screen.getByRole('note');
    expect(note.style.background).toBe('rgba(255, 123, 114, 0.06)');
    expect(note.style.boxShadow).toBe('inset 0 0 0 1px rgba(255,123,114,0.45)');
    expect(note.querySelector('svg')).toHaveAttribute('stroke', CC3.bad);
    expect(screen.getByText(/11 members joined/)).toHaveStyle({ color: CC3.mute });
  });

  it('(g) source scan bans heavy or tiny type, amber and conversion tones', () => {
    const src = readFileSync('src/features/admin/components/analytics/JourneysLens.tsx', 'utf8');
    for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
    for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    expect(src).not.toMatch(/t\.(?:brand|warnText)|endTone|convTone|rgba\(249,200,116/);
  });
});
