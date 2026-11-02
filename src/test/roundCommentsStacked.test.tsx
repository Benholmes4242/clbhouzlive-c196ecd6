import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import common from '../../public/locales/en/common.json';

const history = vi.hoisted(() => ({ entries: [] as { close: () => void }[] }));
vi.mock('@/components/ui/sheetHistory', () => ({
  pushSheetEntry: (close: () => void) => { const e = { close }; history.entries.push(e); return e; },
  releaseSheetEntry: (e: { close: () => void } | null) => { history.entries = history.entries.filter(x => x !== e); },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/lib/whs/hooks', () => ({
  useRoundDetail: () => ({ data: null, isFetched: true }),
  useWhsCourseId: () => ({ data: null }), useWhsConnection: () => ({ data: null }),
}));
vi.mock('@/lib/whs/useRoundCourseContext', () => ({ useRoundCourseContext: () => ({ data: null, isFetched: true }) }));
vi.mock('@/hooks/gam/useCourseHoleField', () => ({ useCourseHoleField: () => ({ data: null, isFetched: true }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: null }) }));
vi.mock('@/hooks/gam/useFeatRarity', () => ({ useRoundFeatRarity: () => null }));
vi.mock('@/hooks/gam/useRoundAwards', () => ({ useRoundAwards: () => ({ data: null }) }));
vi.mock('@/hooks/useCardOpenGate', () => ({ useCardOpenGate: () => ({ visible: true }), useCoalescedBlocks: (s: unknown) => s }));
vi.mock('@/hooks/feed/useFeedCommentPreview', () => ({ useFeedCommentPreview: () => ({ map: new Map(), isSettled: () => true }) }));
vi.mock('@/features/stories/useStoryEngagement', () => ({ useStoryEngagement: () => ({ isSettled: true, engagementFor: () => ({ commentCount: 0 }) }) }));
vi.mock('@/components/explore-tab-new/courseled/hooks/useContentReactions', () => ({ useContentReactions: () => ({ isSettled: true, viewerId: 'member', stateFor: () => ({ count: 0, mine: false }), toggle: vi.fn() }) }));
vi.mock('@/features/comments-v2/hooks/useCommentsV2', () => ({ useCommentsV2: () => ({
  threads: [], visibleCount: 0, hiddenCount: 0, threadFetched: true, totalCountFetched: true,
  isFetched: true, isLoading: false, hasNextPage: false,
  addComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
  editComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
  deleteComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
  toggleLike: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
  hideComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
  reportComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) },
}) }));
vi.mock('@/features/comments-v2/hooks/useCommentsRealtimeV2', () => ({ useCommentsRealtimeV2: () => {} }));
vi.mock('@/features/comments-v2/hooks/useCommentsContext', () => ({ useCommentsSubject: () => ({ data: null }), useThreadStandings: () => ({ data: null }) }));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
vi.mock('@/features/comments-v2/components/CommentActionSheetV2', () => ({ CommentActionSheetV2: () => null }));
vi.mock('@/features/comments-v2/components/ReportCommentSheetV2', () => ({ ReportCommentSheetV2: () => null }));
vi.mock('@/features/comments-v2/components/CommentComposer', () => ({ CommentComposer: ({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) => <input aria-label="Draft" onChange={e => onDirtyChange(!!e.target.value)} /> }));
vi.mock('@/features/courses/_shared/scorecard/CardScorecardSheet', async () => {
  const { ScorecardGlassOverlay } = await import('@/features/courses/_shared/scorecard/ScorecardGlassOverlay');
  return { CardScorecardSheet: (p: React.ComponentProps<typeof ScorecardGlassOverlay> & { engagement?: { comment: { onOpen: () => void } } }) =>
    <ScorecardGlassOverlay {...p}><button onClick={e => { e.stopPropagation(); p.engagement?.comment.onOpen(); }}>Open comments</button></ScorecardGlassOverlay> };
});

import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { Z } from '@/config/zIndex';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, resources: { en: { common } } });
function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter initialEntries={['/activity', '/round/score?openComments=1']}><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{node}</I18nextProvider></QueryClientProvider></MemoryRouter>);
}
function el(selector: string): HTMLElement {
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}
const card = () => el('[data-scorecard-glass-card]');
const backdrop = () => el('[data-comments-backdrop]');
const hasComments = () => document.querySelector('[data-comments-sheet]') !== null;
function back() { act(() => { history.entries.pop()?.close(); }); }
const horizontal = { onStart: vi.fn(), onMove: vi.fn(), onEnd: vi.fn() };
function host(initial = true) {
  const close = vi.fn();
  function Host() {
    const [open, setOpen] = useState(true);
    return open ? <RoundDetailSheet open scoreId="score" initialCommentsOpen={initial} onHorizontalDrag={horizontal} onClose={() => { close(); setOpen(false); }} /> : <div data-return="activity" />;
  }
  mount(<Host />);
  return close;
}
async function ready() { await waitFor(() => expect(history.entries).toHaveLength(2)); }
function swipe(dx: number, dy: number) {
  fireEvent.touchStart(card(), { touches: [{ clientX: 20, clientY: 20 }] });
  fireEvent.touchMove(card(), { touches: [{ clientX: 20 + dx, clientY: 20 + dy }] });
  fireEvent.touchEnd(card());
}
beforeEach(() => { history.entries = []; vi.clearAllMocks(); });
afterEach(() => { cleanup(); history.entries = []; });

describe('round comments close above the scorecard', () => {
  it('Activity arrival opens comments, first backdrop closes only comments, second closes the card', async () => {
    const close = host(); await ready();
    expect(hasComments()).toBe(true);
    fireEvent.click(backdrop());
    expect(hasComments()).toBe(false); expect(card()).toBeInTheDocument(); expect(close).not.toHaveBeenCalled();
    fireEvent.click(el('[data-scorecard-overlay]'));
    expect(close).toHaveBeenCalledOnce(); expect(el('[data-return="activity"]')).toBeInTheDocument();
  });
  it.each(['card', 'escape', 'back', 'swipe'] as const)('%s dismisses only comments while open', async path => {
    const close = host(); await ready();
    if (path === 'card') fireEvent.click(card());
    if (path === 'escape') fireEvent.keyDown(document, { key: 'Escape' });
    if (path === 'back') back();
    if (path === 'swipe') swipe(0, 150);
    expect(hasComments()).toBe(false); expect(card()).toBeInTheDocument(); expect(close).not.toHaveBeenCalled();
    expect(history.entries).toHaveLength(1);
  });
  it.each(['card', 'backdrop', 'escape', 'back', 'swipe'] as const)('%s still closes the scorecard with comments closed', path => {
    const close = host(false);
    if (path === 'card') fireEvent.click(card());
    if (path === 'backdrop') fireEvent.click(el('[data-scorecard-overlay]'));
    if (path === 'escape') fireEvent.keyDown(document, { key: 'Escape' });
    if (path === 'back') back();
    if (path === 'swipe') swipe(0, 150);
    expect(close).toHaveBeenCalledOnce();
  });
  it('the own comment button opens the same stacked comments', async () => {
    host(false); fireEvent.click(screen.getByRole('button', { name: 'Open comments' })); await ready();
    expect(el('[data-comments-sheet="stacked"]')).toBeInTheDocument();
  });
  it('horizontal drag is ignored while comments are open and restored after dismissal', async () => {
    host(); await ready(); swipe(150, 0);
    expect(horizontal.onStart).not.toHaveBeenCalled(); expect(horizontal.onMove).not.toHaveBeenCalled(); expect(horizontal.onEnd).not.toHaveBeenCalled();
    fireEvent.click(backdrop()); swipe(150, 0);
    expect(horizontal.onStart).toHaveBeenCalledOnce(); expect(horizontal.onMove).toHaveBeenCalledWith(150); expect(horizontal.onEnd).toHaveBeenCalledOnce();
  });
  it.each(['backdrop', 'card', 'escape', 'back'] as const)('%s asks before closing typed comments', async path => {
    const close = host(); await ready(); fireEvent.change(screen.getByRole('textbox', { name: 'Draft' }), { target: { value: 'Keep this' } });
    if (path === 'backdrop') fireEvent.click(backdrop());
    if (path === 'card') fireEvent.click(card());
    if (path === 'escape') fireEvent.keyDown(document, { key: 'Escape' });
    if (path === 'back') back();
    expect(screen.getByRole('dialog', { name: common.draftGuard.question })).toBeInTheDocument();
    expect(hasComments()).toBe(true); expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: common.draftGuard.keepEditing }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Keep this');
    fireEvent.click(card()); fireEvent.click(screen.getByRole('button', { name: common.draftGuard.discard }));
    expect(hasComments()).toBe(false); expect(card()).toBeInTheDocument(); expect(close).not.toHaveBeenCalled();
  });
});

describe('comments layer opt-in', () => {
  it.each([['base', 12002, 12003], ['stacked', 12004, 12005]] as const)('%s uses the specified backdrop and sheet layers', (layer, dim, sheet) => {
    mount(<CommentsSheetV2 isOpen layer={layer} targetType="round" targetId="score" onClose={vi.fn()} />);
    expect(backdrop().style.zIndex).toBe(String(dim)); expect(el('[data-comments-sheet]').style.zIndex).toBe(String(sheet));
  });
  it('default callers retain base layers and no history registration', async () => {
    mount(<CommentsSheetV2 isOpen targetType="post" targetId="post" onClose={vi.fn()} />);
    expect(backdrop().style.zIndex).toBe(String(Z.sheetBackdrop)); expect(el('[data-comments-sheet]').style.zIndex).toBe(String(Z.sheet));
    await act(async () => { await new Promise(resolve => requestAnimationFrame(resolve)); });
    expect(history.entries).toHaveLength(0);
  });
});