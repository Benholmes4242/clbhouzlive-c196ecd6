import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
import { useImportedCounts } from '@/components/profile/handicap/whs/connect/useImportedCounts';
function wrapper({ children }: { children: React.ReactNode }) { return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>; }
beforeEach(() => { f.rpc.mockReset().mockResolvedValue({ data: [{ rounds: '0', courses: '0', friends: '0' }], error: null }); });
it('completion reads confirmed zero while legacy consumers still read null', async () => { const { result } = renderHook(() => ({ completion: useImportedCounts('c', { allowZero: true }), legacy: useImportedCounts('c') }), { wrapper }); await waitFor(() => expect(result.current.completion.isSuccess && result.current.legacy.isSuccess).toBe(true)); expect(result.current.completion.data).toEqual({ rounds: 0, courses: 0, friends: 0 }); expect(result.current.legacy.data).toBeNull(); });
it('no count row stays unresolved instead of becoming zero', async () => { f.rpc.mockResolvedValue({ data: [], error: null }); const { result } = renderHook(() => useImportedCounts('c', { allowZero: true }), { wrapper }); await waitFor(() => expect(result.current.isSuccess).toBe(true)); expect(result.current.data).toBeNull(); });