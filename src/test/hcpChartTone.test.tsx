import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { HcpTrendChart } from '@/components/profile/handicap/whs/charts/HcpTrendChart';
import { A } from '@/features/courses/components/holes/analytical/tokens';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 });
  (globalThis as any).ResizeObserver = class {
    cb: any; constructor(cb: any) { this.cb = cb; }
    observe(el: any) { this.cb([{ contentRect: { width: 300 }, target: el }]); }
    disconnect() {} unobserve() {}
  };
});

const pts = (a: number, b: number) => [
  { t: '2026-09-01', v: a }, { t: '2026-09-15', v: (a + b) / 2 }, { t: '2026-10-01', v: b },
];

describe('HCP chart tone follows the chip', () => {



  it('level window renders exactly ONE mark (current)', () => {
    const { container } = render(<HcpTrendChart points={pts(1.52, 1.54) as any} width={300} height={96} simplified tone={A.MUTE} />);
    const marks = container.querySelectorAll('circle');
    expect(marks).toHaveLength(1);
    expect(marks[0].getAttribute('data-mark')).toBe('current');
  });
  it('a window with real movement renders three marks', () => {
    const { container } = render(<HcpTrendChart points={pts(1.4, 1.8) as any} width={300} height={96} simplified tone={A.DRIFTED} />);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });
  it('without the prop the chart is unchanged (A.IMPROVED)', () => {
    const { container } = render(<HcpTrendChart points={pts(1.4, 1.8) as any} width={300} height={96} simplified />);
    const stroke = [...container.querySelectorAll('path')].map((p) => p.getAttribute('stroke')).find(Boolean);
    expect(stroke).toBe(A.IMPROVED);
  });
});
