import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { ActiveActor } from '@/types/actor';

const ME: ActiveActor = { type: 'personal', id: 'me', name: 'Me' };
const BIZ: ActiveActor = { type: 'business', id: 'biz-1', name: 'Biz' };
const DRAFT_BIZ: ActiveActor = { type: 'business', id: 'biz-2', name: 'Biz 2' };

const ctx = {
  activeActor: ME as ActiveActor,
  availableActors: [ME, BIZ, DRAFT_BIZ],
  setActiveActor: vi.fn(),
};
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ctx }));

const stageProps: Array<Record<string, unknown>> = [];
vi.mock('@/features/post-v2/StageComposer', () => ({
  default: (p: Record<string, unknown>) => { stageProps.push(p); return null; },
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/stores/fullScreenSurfaceStore', () => ({ useFullScreenSurface: () => {} }));

import { useComposerActor } from '@/features/post-v2/hooks/useComposerActor';
import { GlobalPostComposer } from '@/components/post-composer/GlobalPostComposer';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { dbLocationPrecision } from '@/components/business/AddressAutocomplete';

beforeEach(() => { ctx.activeActor = ME; ctx.setActiveActor.mockClear(); stageProps.length = 0; });

describe('CB65 §1 composer opens as the requested actor', () => {
  it('selects an available business actor for this post', () => {
    const { result } = renderHook(() => useComposerActor({ initialActorType: 'business', initialActorId: 'biz-1' }));
    expect(result.current.activeActor).toBe(BIZ);
  });

  it('falls back to the global actor when the requested one is unavailable', () => {
    const { result } = renderHook(() => useComposerActor({ initialActorType: 'business', initialActorId: 'analyst-biz' }));
    expect(result.current.activeActor).toBe(ME);
  });

  it('leaves the global active actor unchanged through open and close', () => {
    const { result, unmount } = renderHook(() => useComposerActor({ initialActorType: 'business', initialActorId: 'biz-1' }));
    expect(result.current.activeActor).toBe(BIZ);
    unmount();
    expect(ctx.setActiveActor).not.toHaveBeenCalled();
    expect(ctx.activeActor).toBe(ME);
  });

  it("a restored draft keeps its own actor over the initial actor", () => {
    const { result } = renderHook(() => useComposerActor({ initialActorType: 'business', initialActorId: 'biz-1' }));
    act(() => result.current.applyDraftActor('business', 'biz-2'));
    expect(result.current.activeActor).toBe(DRAFT_BIZ);
  });

  it('GlobalPostComposer passes the store initial actor to StageComposer', () => {
    act(() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: 'biz-1' }));
    render(<GlobalPostComposer />);
    const last = stageProps[stageProps.length - 1];
    expect(last.initialActorType).toBe('business');
    expect(last.initialActorId).toBe('biz-1');
    act(() => usePostStudioStore.getState().closePostStudio());
  });
});

describe('CB65 §2 claim sheet keys resolve', () => {
  const src = readFileSync(resolve(__dirname, '../components/business/ClaimYourCourseSheet.tsx'), 'utf8');
  const keys = [...src.matchAll(/\bt\('(business\.[^']+)'/g)].map((m) => m[1]);
  for (const locale of ['en', 'en-XA']) {
    it(`every key the sheet reads is a string in ${locale}`, () => {
      const json = JSON.parse(readFileSync(resolve(__dirname, `../../public/locales/${locale}/common.json`), 'utf8'));
      expect(keys.length).toBeGreaterThan(0);
      for (const k of keys) {
        const v = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], json);
        expect(typeof v, k).toBe('string');
      }
    });
  }
});

describe('CB65 §3 location precision', () => {
  it("maps 'unknown' to null and keeps allowed values", () => {
    expect(dbLocationPrecision('unknown')).toBeNull();
    expect(dbLocationPrecision('pin')).toBe('pin');
    expect(dbLocationPrecision(undefined)).toBeNull();
  });
});
