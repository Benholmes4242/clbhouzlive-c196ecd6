import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const conn = vi.hoisted(() => ({ current: { isError: false } as { isError: boolean } }));
vi.mock('@/lib/whs/hooks', () => ({ useWhsConnection: () => conn.current }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { analyticsEvents } from '@/utils/analyticsEvents';
import { UnknownConnectionFallback } from '@/features/explore-magazine/UnknownConnectionFallback';

beforeEach(() => vi.mocked(analyticsEvents.track).mockClear());

describe('CB46 — rounds_gate_unknown_fallback', () => {
  it('fires once with gate_state unknown when the read has settled as failed', () => {
    conn.current = { isError: true };
    const { rerender } = render(<UnknownConnectionFallback userId="u1" />);
    rerender(<UnknownConnectionFallback userId="u1" />);
    expect(vi.mocked(analyticsEvents.track).mock.calls).toEqual([
      ['rounds_gate_unknown_fallback', { gate_state: 'unknown' }],
    ]);
  });

  it('does not fire again or correct when the read recovers in the same mount', () => {
    conn.current = { isError: true };
    const { rerender } = render(<UnknownConnectionFallback userId="u1" />);
    conn.current = { isError: false };
    rerender(<UnknownConnectionFallback userId="u1" />);
    conn.current = { isError: true };
    rerender(<UnknownConnectionFallback userId="u1" />);
    expect(analyticsEvents.track).toHaveBeenCalledTimes(1);
  });

  it('never fires on a settled or pending read, or signed out', () => {
    conn.current = { isError: false };
    render(<UnknownConnectionFallback userId="u1" />);
    conn.current = { isError: true };
    render(<UnknownConnectionFallback userId={undefined} />);
    expect(analyticsEvents.track).not.toHaveBeenCalled();
  });
});
