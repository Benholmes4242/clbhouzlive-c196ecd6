/**
 * G2 — THE CARD NEVER LIES, NEVER DROPS CONTENT, AND SETTLES ONCE.
 *
 * The subject is uncapped; the supporting blocks are capped but never dropped.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  CARD_OPEN_CAP_MS,
  SETTLE_WINDOW_MS,
  CARD_ENTRANCE_MS,
  useCardOpenGate,
  useCoalescedBlocks,
} from '@/hooks/useCardOpenGate';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useCardOpenGate', () => {
  it('opens in the same tick when the subject is seeded and support is warm', () => {
    const { result } = renderHook(() =>
      useCardOpenGate('t', true, { subject: true, supporting: { media: true } }),
    );
    expect(result.current.visible).toBe(true);
    expect(result.current.capHit).toBe(false);
  });

  it('never opens without its subject, however long the cap has passed', () => {
    const { result } = renderHook(() =>
      useCardOpenGate('t', true, { subject: false, supporting: { media: true } }),
    );
    act(() => { vi.advanceTimersByTime(CARD_OPEN_CAP_MS * 10); });
    expect(result.current.visible).toBe(false);
  });

  it('opens at the cap with the subject in hand and support outstanding', () => {
    const { result } = renderHook(() =>
      useCardOpenGate('t', true, { subject: true, supporting: { media: false } }),
    );
    expect(result.current.visible).toBe(false);
    act(() => { vi.advanceTimersByTime(CARD_OPEN_CAP_MS); });
    expect(result.current.visible).toBe(true);
    expect(result.current.capHit).toBe(true);
  });
});

describe('useCoalescedBlocks', () => {
  it('passes readiness straight through before the card is up', () => {
    const { result } = renderHook(() => useCoalescedBlocks({ media: true }, false));
    expect(result.current).toEqual({ media: true });
  });

  it('applies a late block once, after the entrance and the window', () => {
    const { result, rerender } = renderHook(
      ({ ready }: { ready: boolean }) => useCoalescedBlocks({ media: ready }, true),
      { initialProps: { ready: false } },
    );
    rerender({ ready: true });
    expect(result.current.media).toBe(false);
    act(() => { vi.advanceTimersByTime(CARD_ENTRANCE_MS); });
    expect(result.current.media).toBe(false);
    act(() => { vi.advanceTimersByTime(SETTLE_WINDOW_MS); });
    expect(result.current.media).toBe(true);
  });
});
