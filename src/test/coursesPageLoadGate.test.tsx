import React, { useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { PageLoadGate, settled, useSectionReady } from '@/components/courses/browse/PageLoadGate';

function Section({ id, ready }: { id: string; ready: boolean }) {
  useSectionReady(id, ready);
  return <div data-testid={id} />;
}
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('Courses one-load gate', () => {
  it('keeps children mounted and hidden until every id is ready, then swaps atomically', () => {
    const paints: Array<[boolean, boolean]> = [];
    function Probe() {
      useLayoutEffect(() => {
        const child = screen.getByTestId('a');
        paints.push([!!screen.queryByTestId('fallback'), child.parentElement?.style.display !== 'none']);
      });
      return null;
    }
    const tree = (b: boolean) => <PageLoadGate expect={['a', 'b']} fallback={<div data-testid="fallback" />}><Section id="a" ready /><Section id="b" ready={b} /><Probe /></PageLoadGate>;
    const view = render(tree(false));
    expect(screen.getByTestId('fallback')).toBeVisible();
    expect(screen.getByTestId('a')).not.toBeVisible();
    view.rerender(tree(true));
    expect(screen.queryByTestId('fallback')).toBeNull();
    expect(screen.getByTestId('a')).toBeVisible();
    expect(paints.every(([fallback, visible]) => fallback !== visible)).toBe(true);
    view.rerender(tree(false));
    expect(screen.getByTestId('a')).toBeVisible();
  });
  it('reveals the hung-query safety net at 8000ms, not 7999ms', () => {
    vi.useFakeTimers();
    render(<PageLoadGate expect={['a']} fallback={<div data-testid="fallback" />}><Section id="a" ready={false} /></PageLoadGate>);
    act(() => vi.advanceTimersByTime(7999));
    expect(screen.getByTestId('a')).not.toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('a')).toBeVisible();
    expect(screen.queryByTestId('fallback')).toBeNull();
  });
  it('defaults to no fallback and reveals only ready children', () => {
    const tree = (ready: boolean) => <PageLoadGate expect={['a']}><Section id="a" ready={ready} /></PageLoadGate>;
    const view = render(tree(false));
    expect(view.container.children).toHaveLength(1);
    expect(screen.getByTestId('a')).not.toBeVisible();
    view.rerender(tree(true));
    expect(screen.getByTestId('a')).toBeVisible();
  });
  it('disabled pending queries are not settled; fetched, success and error are', () => {
    expect(settled({ isFetched: false, isError: false, status: 'pending' })).toBe(false);
    expect(settled({ isFetched: true })).toBe(true);
    expect(settled({ status: 'success' })).toBe(true);
    expect(settled({ isError: true })).toBe(true);
  });
});
