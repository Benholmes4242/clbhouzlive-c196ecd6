import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { composerVisibility, useComposerVisibility } from '@/features/post-v2/hooks/useComposerVisibility';
import { holeLine } from '@/features/post-v2/lib/golfPostRules';

describe('business composer visibility', () => {
  it('business hole shots never offer an audience action even with a stale followers value', () => {
    expect(holeLine('Kingsbarns', 2, 'followers', false)?.visibilityAction).toBeUndefined();
    expect(holeLine('Kingsbarns', 2, 'private', false)?.visibilityAction).toBeUndefined();
  });
  it('business create, scheduled and shot payload audience is always anyone', () => {
    const { result } = renderHook(() => useComposerVisibility('business'));
    act(() => result.current.setVisibility('followers'));
    expect(result.current.visibility).toBe('anyone');
    act(() => result.current.setVisibility('private'));
    expect(result.current.visibility).toBe('anyone');
  });
  it('personal followers choice resets on business switch and stays anyone on switching back', () => {
    const { result, rerender } = renderHook(({ type }) => useComposerVisibility(type), { initialProps: { type: 'personal' } });
    act(() => result.current.setVisibility('followers'));
    expect(result.current.visibility).toBe('followers');
    rerender({ type: 'business' });
    expect(result.current.visibility).toBe('anyone');
    rerender({ type: 'personal' });
    expect(result.current.visibility).toBe('anyone');
  });
  it('old business edit followers value loads as anyone and remains anyone for saving', () => {
    const { result } = renderHook(() => useComposerVisibility('business'));
    act(() => result.current.setVisibility('followers'));
    expect(result.current.visibility).toBe('anyone');
  });
  it('business draft restoration normalises a private stored choice', () => {
    expect(composerVisibility('business', 'private')).toBe('anyone');
    expect(composerVisibility('business', 'followers')).toBe('anyone');
  });
  it('personal retains all three choices unchanged', () => {
    const { result } = renderHook(() => useComposerVisibility('personal'));
    for (const choice of ['anyone', 'followers', 'private'] as const) {
      act(() => result.current.setVisibility(choice));
      expect(result.current.visibility).toBe(choice);
    }
  });
});