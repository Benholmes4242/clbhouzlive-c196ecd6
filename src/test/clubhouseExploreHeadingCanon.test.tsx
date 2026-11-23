/**
 * Brief 11: Clubhouse, Explore, Watch, composer and comments headings read the
 * canonical section title (21 / 700 / -0.035em / 1.05) and eyebrow (11 / 0.16em).
 * Structure only — text comes from real providers, never asserted as words.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../src/locales/en/common.json';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/components/ui/sheetHistory', () => ({ pushSheetEntry: () => ({}), releaseSheetEntry: () => {} }));
vi.mock('@/components/explore-tab-new/hooks/useExploreRegionChips', () => ({ useExploreRegionChips: () => ({ regions: [], isLoading: false }) }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useCourseRatingAggregates', () => ({ useCourseRatingAggregates: () => ({ data: undefined }) }));
vi.mock('@/components/posts/useReviewMedia', () => ({ useReviewMedia: () => ({ data: [] }) }));
vi.mock('@/hooks/useReviewFallback', () => ({ useReviewFallback: () => ({ data: null }) }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/explore-tab-new/courseled/RoundEngagementActions', () => ({ RoundEngagementActions: () => null }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/features/comments-v2/hooks/useCommentsV2', () => ({ useCommentsV2: () => ({
  threads: [], visibleCount: 0, hiddenCount: 0, threadFetched: true, totalCountFetched: true,
  isFetched: true, isLoading: false, hasNextPage: false,
  addComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
  editComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
  deleteComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
  toggleLike: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
  hideComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
  reportComment: { isPending: false, mutate: vi.fn(), mutateAsync: vi.fn() },
}) }));
vi.mock('@/features/comments-v2/hooks/useCommentsRealtimeV2', () => ({ useCommentsRealtimeV2: () => {} }));
vi.mock('@/features/comments-v2/hooks/useCommentsContext', () => ({ useCommentsSubject: () => ({ data: null }), useThreadStandings: () => ({ data: null }) }));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
vi.mock('@/features/comments-v2/components/CommentActionSheetV2', () => ({ CommentActionSheetV2: () => null }));
vi.mock('@/features/comments-v2/components/ReportCommentSheetV2', () => ({ ReportCommentSheetV2: () => null }));
vi.mock('@/features/comments-v2/components/CommentComposer', () => ({ CommentComposer: () => null }));

import { Section } from '@/features/explore-magazine/Section';
import RegionSheet from '@/components/explore-tab-new/RegionSheet';
import PostBottomSheet from '@/features/post-v2/components/BottomSheet';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { ReviewBottomSheet } from '@/components/posts/ReviewBottomSheet';

const i18n = createInstance();
void i18n.init({ lng: 'en', initAsync: false, resources: { en: { common } } });

function mount(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter><QueryClientProvider client={client}><I18nextProvider i18n={i18n}>{node}</I18nextProvider></QueryClientProvider></MemoryRouter>);
}

function expectTitle(el: HTMLElement | null) {
  expect(el).not.toBeNull();
  const s = (el as HTMLElement).style;
  expect([s.fontSize, s.fontWeight, s.letterSpacing, s.lineHeight]).toEqual(['21px', '700', '-0.035em', '1.05']);
}
function expectEyebrow(el: HTMLElement | null) {
  expect(el).not.toBeNull();
  const s = (el as HTMLElement).style;
  expect([s.fontSize, s.letterSpacing]).toEqual(['11px', '0.16em']);
}
const byText = (text: string) => Array.from(document.body.querySelectorAll<HTMLElement>('*')).find(n => n.children.length === 0 && n.textContent === text) ?? null;

beforeEach(() => {
  vi.spyOn(supabase as unknown as { rpc: (...a: unknown[]) => Promise<unknown> }, 'rpc').mockResolvedValue({ data: [], error: null });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.body.innerHTML = ''; });

describe('brief 11 canonical headings', () => {
  it('explore-magazine Section title and eyebrow', () => {
    mount(<Section eyebrow="eyebrow-x" contest={false} title="title-x">{null}</Section>);
    expectEyebrow(byText('eyebrow-x'));
    expectTitle(byText('title-x'));
  });

  it('explore RegionSheet title and eyebrow', () => {
    mount(<RegionSheet open onOpenChange={() => {}} activeRegion={null} onSelect={() => {}} />);
    const title = document.getElementById('explore-region-sheet-title');
    expectTitle(title);
    expectEyebrow(title?.previousElementSibling as HTMLElement);
  });

  it('post-v2 BottomSheet title', () => {
    mount(<PostBottomSheet open title="sheet-title-x" onClose={() => {}}>{null}</PostBottomSheet>);
    expectTitle(byText('sheet-title-x'));
  });

  it('CommentsSheetV2 title is canonical by default', () => {
    mount(<CommentsSheetV2 isOpen onClose={() => {}} targetType="post" targetId="p1" />);
    expectTitle(byText(common.comments.sheetTitle));
  });

  it('ReviewBottomSheet course-name title and location eyebrow', () => {
    mount(
      <ReviewBottomSheet isOpen onClose={() => {}} user={{ id: 'u1', name: 'm' }} courseId="c1" courseName="course-x"
        courseRegion="region-x" courseCountry="country-x" rating={8} reviewId="r1" reviewDate={new Date().toISOString()}
        resolvedReviewText="" resolvedBreakdown={{}} resolvedMedia={[]} onToggleReaction={() => {}} />,
    );
    expectTitle(document.getElementById('review-sheet-title'));
    expectEyebrow(document.querySelector<HTMLElement>('[data-review-kicker] > span'));
  });
});
