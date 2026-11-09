import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  clubs: [] as unknown[],
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  Object.assign(chain, {
    select: () => chain, eq: () => chain,
    limit: () => Promise.resolve({ data: h.clubs, error: null }),
  });
  return { supabase: { rpc: (...a: unknown[]) => h.rpc(...a), from: () => chain } };
});
vi.mock('@/lib/toast', () => ({ toast: { error: (...a: unknown[]) => h.toastError(...a), success: (...a: unknown[]) => h.toastSuccess(...a) } }));
vi.mock('@/features/admin/hooks/useCourses', () => ({ createCourse: vi.fn(() => Promise.resolve({ id: 'course-1' })) }));
vi.mock('@/features/admin/components/CourseGeographySelectors', () => ({
  CourseGeographySelectors: ({ onChange }: { onChange: (p: unknown) => void }) => (
    <button type="button" onClick={() => onChange({ country: 'United Kingdom', region_key: 'uk', continent: 'Europe', sub_country: 'England', region: '' })}>geo</button>
  ),
}));
vi.mock('@/features/admin/components/DuplicateCourseWarning', () => ({ DuplicateCourseWarning: () => null, useDuplicateCourseCheck: () => [] }));
vi.mock('@/features/admin/lib/geography', () => ({ isCanonicalCountry: () => true }));
vi.mock('@/features/admin/lib/sheetDrafts', () => ({
  saveDraft: () => {}, loadDraft: () => null, clearDraft: () => {}, draftsEqual: () => true,
  draftKeys: { courseNew: () => 'k' },
}));

import AddCourseSheet from '@/features/admin/components/AddCourseSheet';
import { clubBaseName, clubKey } from '@/features/admin/lib/clubName';

function setup(props: Partial<React.ComponentProps<typeof AddCourseSheet>> = {}) {
  const onCreated = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AddCourseSheet open onClose={() => {}} onCreated={onCreated} uploadPhoto={async () => {}} onOpenExisting={() => {}} {...props} />
    </QueryClientProvider>,
  );
  return { onCreated };
}
const courseInput = () => screen.getByPlaceholderText('e.g. Augusta National');
const createBtn = () => screen.getByRole('button', { name: 'Create course' });
const fill = (name: string) => {
  fireEvent.change(courseInput(), { target: { value: name } });
  fireEvent.click(screen.getByText('geo'));
};

beforeEach(() => { h.rpc.mockReset(); h.rpc.mockResolvedValue({ data: null, error: null }); h.clubs = []; h.toastError.mockReset(); });

describe('ADD_COURSE_CLUB_1', () => {
  it('(a) clubBaseName and clubKey', () => {
    expect(clubBaseName('Woburn Golf Club - Dukes Course')).toBe('Woburn Golf Club');
    expect(clubBaseName('Glasgow Golf Club (Killermont)')).toBe('Glasgow Golf Club');
    expect(clubBaseName('The Belfry – The Brabazon')).toBe('The Belfry');
    expect(clubBaseName('Royal Blackheath Golf Club')).toBe('Royal Blackheath Golf Club');
    expect(clubKey('Golfclub Königshof Sittensen')).toBe('golfclubknigshofsittensen');
  });

  it('(b) new club by default; name follows until edited', () => {
    setup();
    const radios = screen.getAllByRole('radio');
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    fireEvent.change(courseInput(), { target: { value: 'Woburn Golf Club - Dukes Course' } });
    const club = screen.getByLabelText('Club name') as HTMLInputElement;
    expect(club.value).toBe('Woburn Golf Club');
    fireEvent.change(club, { target: { value: 'Woburn GC' } });
    fireEvent.change(courseInput(), { target: { value: 'Woburn Golf Club - Marquess Course' } });
    expect((screen.getByLabelText('Club name') as HTMLInputElement).value).toBe('Woburn GC');
  });

  it('(c) empty club name disables Create course', () => {
    setup();
    fill('Woburn Golf Club - Dukes Course');
    expect((createBtn() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('Club name'), { target: { value: '' } });
    expect((createBtn() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Club name'), { target: { value: 'Woburn' } });
    expect((createBtn() as HTMLButtonElement).disabled).toBe(false);
  });

  it('(d) new-club submit creates the club once', async () => {
    const { onCreated } = setup();
    fill('Woburn Golf Club - Dukes Course');
    await act(async () => { fireEvent.click(createBtn()); });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(h.rpc).toHaveBeenCalledTimes(1);
    expect(h.rpc).toHaveBeenCalledWith('admin_create_club_for_course', { p_course_id: 'course-1', p_club_name: 'Woburn Golf Club' });
    expect(h.rpc.mock.calls.some((c) => c[0] === 'admin_set_course_club')).toBe(false);
  });

  it('(e) auto-match joins the existing club', async () => {
    h.clubs = [{ id: 'club-9', name: 'Woburn Golf Club', country: 'United Kingdom', sub_country: 'England' }];
    const { onCreated } = setup();
    fill('Woburn Golf Club - Dukes Course');
    await waitFor(() => expect(screen.getAllByRole('radio')[1].getAttribute('aria-checked')).toBe('true'), { timeout: 2000 });
    expect(screen.getByText('Woburn Golf Club is already on clbhouz, so this course joins it.')).toBeTruthy();
    await act(async () => { fireEvent.click(createBtn()); });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(h.rpc).toHaveBeenCalledWith('admin_set_course_club', { p_course_id: 'course-1', p_club_id: 'club-9' });
    expect(h.rpc.mock.calls.some((c) => c[0] === 'admin_create_club_for_course')).toBe(false);
  });

  it('(f) a club-step error toasts and still finishes', async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: 'Admins only' } });
    const { onCreated } = setup();
    fill('Woburn Golf Club - Dukes Course');
    await act(async () => { fireEvent.click(createBtn()); });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(h.toastError.mock.calls.some((c) => String(c[0]).includes('club step failed'))).toBe(true);
  });

  it('(g) fixedClub shows one card and makes no club call', async () => {
    const { onCreated } = setup({ fixedClub: { id: 'club-1', name: 'The Belfry' } });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByText('The Belfry')).toBeTruthy();
    expect(screen.getByText('This course is added to the club that asked for it.')).toBeTruthy();
    fill('The Belfry – The Derby');
    expect((createBtn() as HTMLButtonElement).disabled).toBe(false);
    await act(async () => { fireEvent.click(createBtn()); });
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(h.rpc).not.toHaveBeenCalled();
  });
});
