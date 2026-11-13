import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => ({ members: [] as Record<string, unknown>[], businesses: [] as Record<string, unknown>[], calls: [] as { table: string; payload: unknown }[], limits: [] as { table: string; limit: number }[], upload: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: async (name: string) => ({ data: name === 'create_post_v2' ? { post_id: 'post' } : [], error: null }),
  from: (table: string) => {
    const query = {
      select: () => query, or: () => query, ilike: () => query, eq: () => query,
      limit: async (limit: number) => { h.limits.push({ table, limit }); return { data: table === 'user_profiles' ? h.members : h.businesses, error: null }; },
      upsert: async (payload: unknown) => { h.calls.push({ table, payload }); return { error: null }; },
      insert: async (payload: unknown) => { h.calls.push({ table, payload }); return { error: null }; },
      update: (payload: unknown) => ({ eq: async () => { h.calls.push({ table, payload }); return { error: null }; } }),
    };
    return query;
  },
} }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'me', type: 'personal' } }) }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'me' } }) }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: h.upload }));
vi.mock('@/features/post-v2/lib/postWith', () => ({ writePostWith: async () => [] }));

import { PlayedWithSection } from '@/features/post-v2/components/golf/GolfPostSections';
import { searchMembers } from '@/features/post-v2/lib/golfPostReads';
import { VideoTitleDescription } from '@/features/post-v2/components/video/VideoComposerFields';
import { emptyVideoDetails, restoreVideoDetails } from '@/features/post-v2/lib/videoDetails';
import { useStageComposer } from '@/features/post-v2/hooks/useStageComposer';
import { usePostSubmit } from '@/features/post-v2/hooks/usePostSubmit';
import { serializeMention } from '@/lib/mentions/format';

const id = '11111111-1111-4111-8111-111111111111';
const businessId = '22222222-2222-4222-8222-222222222222';
const mention = serializeMention({ display: 'Thomas Holmes', entityType: 'user', entityId: id });
const person = { id, name: 'Thomas Holmes', avatarUrl: null, sameRound: false, lastInteraction: '' };
beforeEach(() => { h.members = [{ id, display_name: person.name, username: 'thomas', profile_photo_url: null }]; h.businesses = []; h.calls = []; h.limits = []; h.upload.mockClear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}>{node}</QueryClientProvider></MemoryRouter>);
}
function Title({ initial = '' }: { initial?: string }) {
  const [details, set] = useState({ ...emptyVideoDetails(), title: initial });
  return <><VideoTitleDescription details={details} description="" long={false} currentUserId="me" onChange={patch => set(current => ({ ...current, ...patch }))} onDetails={() => {}} /><output data-testid="markup">{details.titleMarkup}</output><output data-testid="plain">{details.title}</output></>;
}
function typeTitle(value: string) {
  const input = screen.getByRole('textbox', { name: 'Video title' });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value, selectionStart: value.length, selectionEnd: value.length } });
  return input;
}

describe('composer tagging', () => {
  it('Played with pointerdown preserves focus; Add toggles the person and clears the query', async () => {
    const toggle = vi.fn();
    mount(<PlayedWithSection suggestions={[]} tagged={[]} search={async () => [person]} selfId="me" onToggle={toggle} />);
    const input = screen.getByRole('textbox', { name: 'Who did you play with?' });
    input.focus();
    fireEvent.change(input, { target: { value: 'thomas' } });
    const add = await screen.findByRole('button', { name: /Thomas Holmes.*Add/ });
    expect(fireEvent.pointerDown(add)).toBe(false);
    expect(input).toHaveFocus();
    fireEvent.click(add);
    expect(toggle).toHaveBeenCalledExactlyOnceWith(person);
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });
  it('Played with pending search has a status row and empty search has a no-match row', async () => {
    let resolve: (rows: typeof person[]) => void = () => {};
    const pending = new Promise<typeof person[]>(done => { resolve = done; });
    mount(<PlayedWithSection suggestions={[]} tagged={[]} search={() => pending} selfId="me" onToggle={() => {}} />);
    const input = screen.getByRole('textbox', { name: 'Who did you play with?' });
    fireEvent.focus(input); fireEvent.change(input, { target: { value: 'missing' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Searching…');
    await act(async () => { resolve([]); });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No golfers match "missing"'));
    fireEvent.blur(input, { relatedTarget: null });
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('searchMembers ranks Thomas Holmes, Al Thomas, then Ian Thomasson', async () => {
    h.members = ['Ian Thomasson', 'Thomas Holmes', 'Al Thomas'].map((display_name, i) => ({ id: `${i}`, display_name, username: null, profile_photo_url: null }));
    expect((await searchMembers('thomas', 'me')).map(p => p.name)).toEqual(['Thomas Holmes', 'Al Thomas', 'Ian Thomasson']);
  });
  it('searchMembers fetches twenty, returns at most eight, excludes self, and preserves match priority', async () => {
    h.members = ['Other', 'Al Thomas', 'Thomas Holmes', 'THOMAS', 'Username prefix', 'Exact username', 'Tail one', 'Tail two', 'Tail three', 'Self'].map((display_name, i) => ({ id: i === 9 ? 'me' : `${i}`, display_name, username: i === 4 ? 'thomas_1' : i === 5 ? 'ThOmAs' : null, profile_photo_url: null }));
    const rows = await searchMembers(' THOMAS ', 'me');
    expect(h.limits).toEqual([{ table: 'user_profiles', limit: 20 }]);
    expect(rows).toHaveLength(8);
    expect(rows.map(p => p.name)).toEqual(['THOMAS', 'Exact username', 'Thomas Holmes', 'Al Thomas', 'Username prefix', 'Other', 'Tail one', 'Tail two']);
  });
  it('typing @th and picking a member retains markup, plain title and plain counter', async () => {
    mount(<Title />);
    typeTitle('@th');
    const option = await screen.findByRole('option', { name: /Thomas Holmes/ });
    fireEvent.mouseDown(option); fireEvent.click(option);
    expect(screen.getByTestId('markup').textContent).toBe(`${mention} `);
    expect(screen.getByTestId('plain').textContent).toBe('@Thomas Holmes ');
    expect(screen.getByRole('textbox', { name: 'Video title' })).toHaveValue('@Thomas Holmes ');
    expect(screen.getByText('15/80')).toBeInTheDocument();
  });
  it('title suggestions include businesses and exclude the current member', async () => {
    h.members = [{ id: 'me', display_name: 'Thomas Self', username: 'thself' }];
    h.businesses = [{ id: businessId, name: 'Thomas Golf', logo_url: null }];
    mount(<Title />); typeTitle('@th');
    const option = await screen.findByRole('option', { name: /Thomas Golf/ });
    expect(screen.queryByRole('option', { name: /Thomas Self/ })).toBeNull();
    fireEvent.click(option);
    expect(screen.getByTestId('markup').textContent).toContain(`(b:${businessId})`);
  });
  it('title blocks a mention pick exceeding eighty plain characters', async () => {
    mount(<Title initial={'a'.repeat(70)} />);
    typeTitle(`${'a'.repeat(70)} @th`);
    fireEvent.click(await screen.findByRole('option', { name: /Thomas Holmes/ }));
    expect(screen.getByTestId('plain').textContent).toBe(`${'a'.repeat(70)} @th`);
    expect(screen.getByTestId('markup').textContent).not.toContain('(u:');
  });
  it('title truncates ordinary text to eighty plain characters', () => {
    mount(<Title />); typeTitle('a'.repeat(90));
    expect(screen.getByTestId('plain').textContent).toBe('a'.repeat(80));
  });
  it('Enter including Shift+Enter cannot insert a title newline', () => {
    mount(<Title />); const input = typeTitle('Film');
    expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })).toBe(false);
    expect(screen.getByTestId('plain').textContent).toBe('Film');
  });
  it('title paste strips newlines while retaining existing mention markup', async () => {
    mount(<Title />); typeTitle('@th');
    fireEvent.click(await screen.findByRole('option', { name: /Thomas Holmes/ }));
    const input = screen.getByRole('textbox', { name: 'Video title' }) as HTMLTextAreaElement;
    input.setSelectionRange(input.value.length, input.value.length);
    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'So\nclose\r\nyet' } })).toBe(false);
    expect(screen.getByTestId('markup').textContent).toBe(`${mention} Socloseyet`);
    expect(screen.getByTestId('plain').textContent).toBe('@Thomas Holmes Socloseyet');
  });
  it('draft restore retains titleMarkup and accepts a legacy plain title', () => {
    expect(restoreVideoDetails({ title: 'old', titleMarkup: mention })).toMatchObject({ titleMarkup: mention, title: '@Thomas Holmes' });
    expect(restoreVideoDetails({ title: 'Legacy title' })).toMatchObject({ titleMarkup: 'Legacy title', title: 'Legacy title' });
    const hook = renderHook(() => useStageComposer());
    act(() => hook.result.current.restoreDraft({ videoData: restoreVideoDetails({ titleMarkup: mention }) }));
    expect(hook.result.current.state.videoData).toMatchObject({ titleMarkup: mention, title: '@Thomas Holmes' });
  });
  it('submit inserts title mentions once across caption and title and writes a plain video title', async () => {
    const hook = renderHook(() => usePostSubmit());
    const business = serializeMention({ display: 'Club', entityType: 'business', entityId: id });
    await act(async () => { await hook.result.current.submit({ caption: mention, media: [{ id: 'v', type: 'video', previewUrl: 'blob:v', frame: 'original', duration: 30 }], course: null, scheduledAt: null, actorType: 'personal', actorId: 'me', authorName: 'Me', authorAvatarUrl: null, authorUsername: null, videoData: { ...emptyVideoDetails(), title: 'stale', titleMarkup: `So close yet so far ${mention} ${business}` } }); });
    expect(h.calls.find(c => c.table === 'mentions')?.payload).toEqual([
      { source_type: 'post', source_id: 'post', mentioned_type: 'user', mentioned_id: id, mentioner_id: 'me' },
      { source_type: 'post', source_id: 'post', mentioned_type: 'business', mentioned_id: id, mentioner_id: 'me' },
    ]);
    expect(h.calls.find(c => c.table === 'post_video_details')?.payload).toMatchObject({ title: 'So close yet so far @Thomas Holmes @Club' });
  });
});