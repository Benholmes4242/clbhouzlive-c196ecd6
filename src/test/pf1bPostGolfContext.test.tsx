// PF1B — usePostGolfContext batching/guest rules, the hole chip / round row /
// round pill components, the add_to_hole_guide posts patch, the scheduled
// text-only result, and the grep-level proof that no client course_hole_media
// write remains.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync, existsSync } from 'node:fs';

const rpcMock = vi.hoisted(() => vi.fn());
const updateCapture = vi.hoisted(() => ({ patch: null as Record<string, unknown> | null }));
const sessionState = vi.hoisted(() => ({ user: { id: 'u1' } as { id: string } | null, isGuest: false }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
    from: () => ({
      update: (patch: Record<string, unknown>) => {
        updateCapture.patch = patch;
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: sessionState.user }) }));
vi.mock('@/features/guest/useIsGuest', () => ({ useIsGuest: () => sessionState.isGuest, isGuestUser: () => sessionState.isGuest }));
vi.mock('@/context/ActiveActorContext', () => ({
  useActiveActor: () => ({ activeActor: { id: 'u1', type: 'personal', name: 'Ben', avatarUrl: null } }),
}));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ profile: { id: 'u1' } }) }));
vi.mock('@/features/post-v2/lib/postUploadController', () => ({ startPostUpload: vi.fn() }));
vi.mock('@/lib/mentions/format', () => ({ extractMentions: () => [] }));

import { usePostGolfContext, GOLF_CONTEXT_BATCH, golfRoundToPar, type PostGolfContext } from '@/hooks/feed/usePostGolfContext';
import { HoleChip, FeedRoundRow, FullscreenRoundPill, FullscreenHoleChipSlot, holeChipText } from '@/components/feed/PostGolfContext';
import { golfPostPatch } from '@/features/post-v2/lib/composerGolfRules';
import { usePostSubmit } from '@/features/post-v2/hooks/usePostSubmit';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

const CTX: PostGolfContext = {
  postId: 'p1',
  courseId: 'c1',
  holeNo: 15,
  shotTags: ['view'],
  roundScoreId: 'sc1',
  roundGross: 73,
  roundPar: 71,
  roundPlayDate: '2026-11-06',
  roundHoles: 18,
};

const shape18: HoleShape = {
  coursePar: 71,
  series: [0],
  beads: [],
  played: 18,
  birdies: 1,
  holes: Array.from({ length: 18 }, (_, i) => ({
    holeNo: i + 1,
    par: i === 14 ? 3 : 4,
    strokes: i === 14 ? 2 : 4,
    sheetStrokes: i === 14 ? 2 : 4,
  })),
};

beforeEach(() => {
  rpcMock.mockReset();
  updateCapture.patch = null;
  sessionState.user = { id: 'u1' };
  sessionState.isGuest = false;
});

describe('usePostGolfContext', () => {
  it('batches ids into calls of at most 100', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const ids = Array.from({ length: 205 }, (_, i) => `p${i}`);
    const { result } = renderHook(() => usePostGolfContext(ids), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(rpcMock).toHaveBeenCalledTimes(3);
    const sizes = rpcMock.mock.calls.map((c) => (c[1] as { p_post_ids: string[] }).p_post_ids.length);
    expect(sizes).toEqual([GOLF_CONTEXT_BATCH, GOLF_CONTEXT_BATCH, 5]);
    for (const call of rpcMock.mock.calls) expect(call[0]).toBe('get_post_golf_context');
  });

  it('never sends excluded (round post) ids', async () => {
    rpcMock.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => usePostGolfContext(['p1', 'p2', 'p3'], new Set(['p2'])), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    const sent = (rpcMock.mock.calls[0][1] as { p_post_ids: string[] }).p_post_ids;
    expect(sent).toEqual(['p1', 'p3']);
  });

  it('stays disabled for guests and the signed-out', async () => {
    sessionState.isGuest = true;
    const guest = renderHook(() => usePostGolfContext(['p1']), { wrapper });
    await waitFor(() => expect(guest.result.current).toBeNull());
    sessionState.isGuest = false;
    sessionState.user = null;
    const signedOut = renderHook(() => usePostGolfContext(['p1']), { wrapper });
    await waitFor(() => expect(signedOut.result.current).toBeNull());
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('resolves to an empty map on RPC error instead of throwing', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'not authenticated' } });
    const { result } = renderHook(() => usePostGolfContext(['p1']), { wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.size).toBe(0);
  });

  it('maps returned rows by post id with absent figures kept null', async () => {
    rpcMock.mockResolvedValue({
      data: [{ post_id: 'p1', hole_no: 15, shot_tags: ['view'], course_id: 'c1', round_score_id: null, round_gross: null, round_par: null, round_play_date: null, round_holes: null }],
      error: null,
    });
    const { result } = renderHook(() => usePostGolfContext(['p1']), { wrapper });
    await waitFor(() => expect(result.current?.size).toBe(1));
    const ctx = result.current?.get('p1');
    expect(ctx?.holeNo).toBe(15);
    expect(ctx?.roundScoreId).toBeNull();
    expect(ctx?.roundGross).toBeNull();
  });
});

describe('hole chip text', () => {
  it('reads "{NTH} · PAR p · y YDS" when par and yards exist', () => {
    expect(holeChipText(15, { hole_no: 15, par: 3, si: 7, yards: 166 })).toEqual({ lead: '15TH', rest: '· PAR 3 · 166 YDS' });
  });
  it('omits the yards part when absent', () => {
    expect(holeChipText(2, { hole_no: 2, par: 5, si: 1, yards: null })).toEqual({ lead: '2ND', rest: '· PAR 5' });
  });
  it('is "{NTH}" alone when there is no hole data', () => {
    expect(holeChipText(15, null)).toEqual({ lead: '15TH', rest: '' });
    const { container } = render(<HoleChip holeNo={15} hole={null} />);
    expect(container.textContent).toBe('15TH');
  });
});

describe('feed round row', () => {
  it('renders gross, to-par and an 18-bar strip with the post hole outlined', () => {
    render(<FeedRoundRow gross={73} toPar={2} shape={shape18} roundHoles={18} activeHole={15} onOpen={() => {}} />);
    const row = screen.getByTestId('post-round-row');
    expect(row.textContent).toContain('73');
    expect(row.textContent).toContain('+2');
    expect(row.textContent).toContain('ROUND');
    const strip = screen.getByTestId('post-round-strip');
    expect(strip.style.gridTemplateColumns).toBe('repeat(18, 1fr)');
    expect(strip.children).toHaveLength(18);
    const active = strip.querySelector('[data-active="true"]') as HTMLElement;
    expect(active.dataset.hole).toBe('15');
    expect(active.style.outline).toContain('1.5px');
  });

  it('uses 9 columns for a 9-hole round', () => {
    const shape9: HoleShape = { ...shape18, played: 9, holes: shape18.holes.slice(0, 9) };
    render(<FeedRoundRow gross={38} toPar={2} shape={shape9} roundHoles={9} activeHole={null} onOpen={() => {}} />);
    const strip = screen.getByTestId('post-round-strip');
    expect(strip.style.gridTemplateColumns).toBe('repeat(9, 1fr)');
    expect(strip.children).toHaveLength(9);
  });

  it('hides the strip and keeps the score when there is no hole detail', () => {
    render(<FeedRoundRow gross={73} toPar={2} shape={null} roundHoles={18} activeHole={15} onOpen={() => {}} />);
    expect(screen.queryByTestId('post-round-strip')).toBeNull();
    expect(screen.getByTestId('post-round-row').textContent).toContain('73');
  });

  it('omits to-par when the round par is absent', () => {
    expect(golfRoundToPar({ roundGross: 73, roundPar: null })).toBeNull();
    expect(golfRoundToPar({ roundGross: 73, roundPar: 71 })).toBe(2);
    expect(golfRoundToPar({ roundGross: 71, roundPar: 71 })).toBe(0);
  });

  it('opens the scorecard and never the fullscreen viewer', () => {
    const onOpen = vi.fn();
    const onCardTap = vi.fn();
    render(
      <div onClick={onCardTap}>
        <FeedRoundRow gross={73} toPar={2} shape={shape18} roundHoles={18} activeHole={15} onOpen={onOpen} />
      </div>,
    );
    fireEvent.click(screen.getByTestId('post-round-row'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onCardTap).not.toHaveBeenCalled();
  });
});

describe('fullscreen round pill and chip slot', () => {
  it('renders "Round {gross} {toPar} · Scorecard ›" and opens the scorecard', () => {
    const onOpen = vi.fn();
    render(<FullscreenRoundPill gross={73} toPar={2} onOpen={onOpen} />);
    const pill = screen.getByTestId('post-round-pill');
    expect(pill.textContent).toBe('Round 73 +2 · Scorecard ›');
    fireEvent.click(pill);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the chip on the first slide only', () => {
    const { rerender } = render(<FullscreenHoleChipSlot context={CTX} hole={{ hole_no: 15, par: 3, si: 7, yards: 166 }} activeSlide={0} />);
    expect(screen.getByTestId('post-hole-chip-fs')).toBeTruthy();
    rerender(<FullscreenHoleChipSlot context={CTX} hole={{ hole_no: 15, par: 3, si: 7, yards: 166 }} activeSlide={1} />);
    expect(screen.queryByTestId('post-hole-chip-fs')).toBeNull();
  });

  it('renders nothing without a hole or without context', () => {
    const { container } = render(<FullscreenHoleChipSlot context={{ ...CTX, holeNo: null }} hole={null} activeSlide={0} />);
    expect(container.firstChild).toBeNull();
    const { container: empty } = render(<FullscreenHoleChipSlot context={null} hole={null} activeSlide={0} />);
    expect(empty.firstChild).toBeNull();
  });
});

describe('golfPostPatch add_to_hole_guide', () => {
  const course = { id: 'c1', name: 'Machrihanish', country: 'Scotland' };
  it('ignores the legacy guide-on fields', () => {
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: true })).toEqual({ tagged_course_ids: ['c1'] });
  });
  it('ignores legacy guide-off fields while retaining course association', () => {
    // PF2_GUIDE: false is written too, so turning the guide off on an edit turns it off.
    expect(golfPostPatch({ course, holeNo: 15, addToGuide: false })).toEqual({ tagged_course_ids: ['c1'] });
    expect(golfPostPatch({ course, holeNo: null, addToGuide: true })).toEqual({ tagged_course_ids: ['c1'] });
    expect(golfPostPatch({ course: null, holeNo: 15, addToGuide: true })).toEqual({});
  });
});

describe('usePostSubmit', () => {
  const base = {
    caption: 'The 15th',
    media: [],
    course: { id: 'c1', name: 'Machrihanish', country: 'Scotland' },
    scheduledAt: null as Date | null,
    actorType: 'personal' as const,
    actorId: 'u1',
    authorName: 'Ben',
    authorAvatarUrl: null,
    authorUsername: 'ben',
  };

  it('shows the scheduled state when create_post_v2 returns status scheduled', async () => {
    rpcMock.mockResolvedValue({ data: { post_id: 'p1', status: 'scheduled', scheduled_at: '2026-11-08T09:00:00Z' }, error: null });
    const { result } = renderHook(() => usePostSubmit(), { wrapper });
    const res = await result.current.submit({ ...base, scheduledAt: new Date('2026-11-08T09:00:00Z') });
    expect(res.kind).toBe('scheduled');
    expect(res.isScheduled).toBe(true);
    expect(res.scheduledAt).toBe('2026-11-08T09:00:00Z');
  });

  it('stays published for an immediate text-only post', async () => {
    rpcMock.mockResolvedValue({ data: { post_id: 'p1', status: 'published' }, error: null });
    const { result } = renderHook(() => usePostSubmit(), { wrapper });
    const res = await result.current.submit(base);
    expect(res.kind).toBe('published');
    expect(res.isScheduled).toBe(false);
  });

  it('submission writes course association without legacy hole-guide fields', async () => {
    rpcMock.mockResolvedValue({ data: { post_id: 'p1', status: 'published' }, error: null });
    const { result } = renderHook(() => usePostSubmit(), { wrapper });
    await result.current.submit({ ...base, holeNo: 15, addToGuide: true });
    expect(updateCapture.patch).toEqual({ tagged_course_ids: ['c1'] });
  });
});

describe('no client hole-guide writes remain', () => {
  it('the upload controller never touches course_hole_media and the stage-1 writer is gone', () => {
    const controller = readFileSync('src/features/post-v2/lib/postUploadController.ts', 'utf8');
    expect(controller).not.toContain('course_hole_media');
    expect(controller).not.toContain('publishHoleGuide');
    expect(controller).not.toContain('watchDeferredHoleGuide');
    expect(existsSync('src/features/post-v2/lib/postHoleGuide.ts')).toBe(false);
  });
});
