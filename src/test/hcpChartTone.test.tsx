import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { TrendCard } from '@/features/profile-sheet-v2/components/HcpStrip';
import { HcpTrendChart } from '@/components/profile/handicap/whs/charts/HcpTrendChart';
import { A } from '@/features/courses/components/holes/analytical/tokens';

beforeAll(() => {
  (globalThis as any).ResizeObserver = class {
    cb: any; constructor(cb: any) { this.cb = cb; }
    observe(el: any) { this.cb([{ contentRect: { width: 300 }, target: el }]); }
    disconnect() {} unobserve() {}
  };
});

const pts = (a: number, b: number) => [
  { t: '2026-09-01', v: a }, { t: '2026-09-15', v: (a + b) / 2 }, { t: '2026-10-01', v: b },
];

function tones(points: { t: string; v: number }[]) {
  const { container } = render(
    <TrendCard points={points} windowDays={30} onWindow={() => {}} fallbackIndex={null} onNavigate={() => {}} />,
  );
  const chip = container.querySelector('[data-hcp-chip]') as HTMLElement;
  const chart = container.querySelector('[data-hcp-chart="simplified"]')!;
  const stroke = [...chart.querySelectorAll('path')].map((p) => p.getAttribute('stroke')).find(Boolean);
  const stops = [...chart.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color'));
  const low = chart.querySelector('[data-mark="low"]')?.getAttribute('fill');
  const probe = document.createElement('span');
  return { chip: chip.style.color, stroke, stops, low, norm: (c: string) => { probe.style.color = c; return probe.style.color; } };
}

describe('HCP chart tone follows the chip', () => {
  it('index rose: chart and chip are the SAME value (A.DRIFTED)', () => {
    const t = tones(pts(1.4, 1.8));
    expect(t.norm(t.stroke!)).toBe(t.chip);
    t.stops.forEach((s) => expect(t.norm(s!)).toBe(t.chip));
    expect(t.norm(t.low!)).toBe(t.chip);
    expect(t.stroke).toBe(A.DRIFTED);
  });
  it('index fell: both A.IMPROVED', () => {
    const t = tones(pts(1.8, 1.2));
    expect(t.norm(t.stroke!)).toBe(t.chip);
    expect(t.stroke).toBe(A.IMPROVED);
  });
  it('flat: chip A.DIM, chart A.MUTE', () => {
    const t = tones(pts(1.5, 1.5));
    expect(t.chip).toBe(t.norm(A.DIM));
    expect(t.stroke).toBe(A.MUTE);
    t.stops.forEach((s) => expect(s).toBe(A.MUTE));
  });
  it('without the prop the chart is unchanged (A.IMPROVED)', () => {
    const { container } = render(<HcpTrendChart points={pts(1.4, 1.8) as any} width={300} height={96} simplified />);
    const stroke = [...container.querySelectorAll('path')].map((p) => p.getAttribute('stroke')).find(Boolean);
    expect(stroke).toBe(A.IMPROVED);
  });
});
