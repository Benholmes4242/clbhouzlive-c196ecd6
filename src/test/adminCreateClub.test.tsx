import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rpc = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

function chain(result: unknown) {
  const b: any = {};
  for (const m of ['select', 'eq', 'ilike', 'limit']) b[m] = () => b;
  b.maybeSingle = () => Promise.resolve(result);
  return b;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...a: unknown[]) => rpc(...a),
    from: () => chain({ data: { id: 'x', name: 'Golfclub Königshof Sittensen' }, error: null }),
  },
}));
vi.mock('@/lib/toast', () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) } }));

import CourseClubControl from '@/features/admin/components/CourseClubControl';

function setup(clubId: string | null) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const inv = vi.spyOn(qc, 'invalidateQueries');
  render(<QueryClientProvider client={qc}><CourseClubControl courseId="course-1" clubId={clubId} /></QueryClientProvider>);
  return inv;
}

const actionName = 'Create a club from this course';

beforeEach(() => { rpc.mockReset(); toastSuccess.mockReset(); toastError.mockReset(); });

describe('ADMIN_CREATE_CLUB', () => {
  it('shows the action only when the course has no club', () => {
    setup('club-1');
    expect(screen.queryByRole('button', { name: actionName })).toBeNull();
  });

  it('confirm calls the RPC once with the course id and invalidates', async () => {
    rpc.mockResolvedValue({ data: 'new-club', error: null });
    const inv = setup(null);
    fireEvent.click(screen.getByRole('button', { name: actionName }));
    fireEvent.click(await screen.findByRole('button', { name: 'Create club' }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    const calls = rpc.mock.calls.filter(c => c[0] === 'admin_create_club_for_course');
    expect(calls).toEqual([['admin_create_club_for_course', { p_course_id: 'course-1' }]]);
    expect(inv).toHaveBeenCalledWith({ queryKey: ['admin-v2', 'courses'] });
    expect(inv).toHaveBeenCalledWith({ queryKey: ['club-course-analytics'] });
  });

  it('an error shows a toast and invalidates nothing', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'Admins only' } });
    const inv = setup(null);
    fireEvent.click(screen.getByRole('button', { name: actionName }));
    fireEvent.click(await screen.findByRole('button', { name: 'Create club' }));
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Admins only'));
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(inv).not.toHaveBeenCalled();
  });

  it('club search uses search_golf_clubs', async () => {
    vi.useFakeTimers();
    rpc.mockResolvedValue({ data: [{ id: 'c1', name: 'Königshof', country: 'Germany' }], error: null });
    setup(null);
    fireEvent.change(screen.getByPlaceholderText('Search clubs'), { target: { value: ' kon ' } });
    await act(async () => { vi.advanceTimersByTime(300); });
    vi.useRealTimers();
    expect(rpc).toHaveBeenCalledWith('search_golf_clubs', { p_query: 'kon', p_limit: 10 });
  });
});
