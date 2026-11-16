// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const f = vi.hoisted(() => ({ tables: [] as string[], rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    const data = table === 'public_profiles'
      ? [{ id: 'holder', display_name: 'Danny', profile_photo_url: '/danny.jpg' }]
      : [];
    const res = Promise.resolve({ data, error: null });
    const q: any = { select: () => q, in: () => q, eq: () => q, is: () => q, then: res.then.bind(res) };
    return q;
  };
  return { supabase: {
    rpc: f.rpc,
    from: (table: string) => { f.tables.push(table); return chain(table); },
  } };
});
import { useCourseRecordHolders } from '@/components/courses/useCourseRecordHolders';
import { useTop100Enrichment } from '@/hooks/top100/useTop100Enrichment';
import { hideKeyboardAccessoryOnce, __resetKeyboardAccessoryForTest } from '@/utils/median/keyboardAccessory';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

beforeEach(() => {
  f.tables.length = 0;
  f.rpc.mockImplementation((name: string) => Promise.resolve({ error: null, data: name === 'get_course_record_holders'
    ? [{ course_id: 'c1', holder_id: 'holder', holder_name: 'Danny', record_gross: 70 }]
    : [{ course_id: 'c1', player_ids: ['holder'] }] }));
});

describe('record and face avatars read public_profiles', () => {
  it('useCourseRecordHolders gives an unconnected holder their photo', async () => {
    const { result } = renderHook(() => useCourseRecordHolders(['c1']), { wrapper });
    await waitFor(() => expect(result.current.map.get('c1')?.photoUrl).toBe('/danny.jpg'));
    expect(f.tables).toContain('public_profiles');
    expect(f.tables).not.toContain('user_profiles');
  });
  it('useTop100Enrichment faces carry photos from public_profiles', async () => {
    const { result } = renderHook(() => useTop100Enrichment(['c1'], undefined, 'test'), { wrapper });
    await waitFor(() => expect(result.current.data.get('c1')?.players[0]?.photoUrl).toBe('/danny.jpg'));
    expect(f.tables).toContain('public_profiles');
    expect(f.tables).not.toContain('user_profiles');
  });
});

describe('iOS keyboard accessory bar', () => {
  afterEach(() => { delete window.median; __resetKeyboardAccessoryForTest(); });
  it('calls showAccessoryView(false) once when median.keyboard exists', () => {
    const show = vi.fn();
    window.median = { keyboard: { showAccessoryView: show } };
    expect(hideKeyboardAccessoryOnce()).toBe(true);
    hideKeyboardAccessoryOnce();
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith(false);
  });
  it('is a safe no-op when median is undefined or has no keyboard', () => {
    expect(() => hideKeyboardAccessoryOnce()).not.toThrow();
    expect(hideKeyboardAccessoryOnce()).toBe(false);
    window.median = {};
    expect(hideKeyboardAccessoryOnce()).toBe(false);
    window.median = { keyboard: { showAccessoryView: () => { throw new Error('x'); } } };
    expect(() => hideKeyboardAccessoryOnce()).not.toThrow();
  });
});
