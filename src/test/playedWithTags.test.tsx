/** PLAYED WITH OPTION C — post tags on every post, in every state. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';

const seeded = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '', i18n: { language: 'en' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: null }) }));
vi.mock('@/store/clubhouseStore', () => ({ useClubhouseStore: (sel: (s: unknown) => unknown) => sel({ carouselPositions: new Map(), carouselPositionsByTab: {} }) }));
vi.mock('@/stores/reviewSheetStore', () => ({ useReviewSheetStore: () => vi.fn() }));
vi.mock('@/hooks/useReviewerStats', () => ({ useReviewerStats: () => ({ data: null }) }));
vi.mock('@/hooks/useManageableBusinessIds', () => ({ useManageableBusinessIds: () => new Set(), useTeamBusinessIds: () => new Set() }));
vi.mock('@/lib/impressions/useImpressionObserver', () => ({ useImpressionObserver: () => {} }));
vi.mock('@/components/feed/FeedActorPicker', () => ({ FeedActorPicker: () => null }));
vi.mock('@/components/likes/LikedByRow', () => ({ LikedByRow: () => null }));
vi.mock('@/components/feed/MediaCarousel', () => ({ MediaCarousel: () => <div data-carousel /> }));
vi.mock('@/components/feed/InlineVideo', () => ({ InlineVideo: () => null }));
vi.mock('@/components/feed/CourseStatsSheet', () => ({ CourseStatsSheet: () => null }));
vi.mock('@/components/feed/PostCourseBand', () => ({ PostCourseBand: () => null }));
vi.mock('@/components/feed/FeedCommentPreview', () => ({ FeedCommentPreview: () => null }));
vi.mock('@/components/feed/FeedFollowPill', () => ({ FeedFollowPill: () => null }));
vi.mock('@/components/feed/HeartBurst', () => ({ HeartBurst: () => null }));
vi.mock('@/components/posts/PostOwnerMenu', () => ({ PostOwnerMenu: () => null }));
vi.mock('@/features/explore-magazine/FeaturedRoundCard', () => ({ FeaturedRoundCard: () => null }));
vi.mock('@/features/post-v2/lib/postWith', async (orig) => ({ ...(await orig<object>()), readPostWith: async () => seeded.rows }));
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const k of ['select', 'eq', 'or', 'in', 'order']) chain[k] = () => chain;
  (chain as { then: unknown }).then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
  return { supabase: { from: () => chain, rpc: async () => ({ data: null, error: null }) } };
});

import { FeedCard, type FeedCardProps } from '@/components/feed/FeedCard';
import { withLine } from '@/features/post-v2/lib/golfPostRules';
import { PlayedWithViewerChip, type PlayedWithPerson } from '@/components/feed/PostGolfTags';
import { usePostGolfTags } from '@/hooks/feed/usePostGolfTags';

const src = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const PEOPLE: PlayedWithPerson[] = [
  { userId: 'a', name: 'Thomas Holmes', username: 'thomasholmes', avatarUrl: null },
  { userId: 'b', name: 'Danny Holmes', username: 'dannyholmes', avatarUrl: null },
  { userId: 'c', name: 'Mike Mitchell', username: 'mikem84', avatarUrl: null },
  { userId: 'd', name: 'Sam Lee', username: null, avatarUrl: null },
];
const base = (over: Partial<FeedPost> = {}): FeedPost => ({ id: 'p1', userId: 'u', actorType: 'personal', actorId: 'u', username: 'ben', displayName: 'Benjamin Holmes', avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: 'Cracking morning', createdAt: '2026-11-07T12:00:00Z', likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false, mediaItems: [{ id: 'm0', type: 'image', imageUrl: 'https://images.test/0.jpg', thumbnailUrl: 'https://images.test/0.jpg', width: 800, height: 1000 }], ...over } as FeedPost);

function Where() { const l = useLocation(); return <div data-where={l.pathname} />; }
const mount = (p: FeedPost, props: Partial<FeedCardProps> = {}) => {
  const h = { onLike: vi.fn(), onOpenMedia: vi.fn() };
  const v = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Routes><Route path="*" element={<><FeedCard post={p} liked={false} likeCount={0} commentCount={0} onLike={h.onLike} onComment={vi.fn()} onShare={vi.fn()} onProfile={vi.fn()} onOpenMedia={h.onOpenMedia} layout="mediaFirst" {...props} /><Where /></>} /></Routes></MemoryRouter></QueryClientProvider>);
  return { ...v, h };
};
const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;
afterEach(() => { cleanup(); seeded.rows = []; vi.useRealTimers(); });

describe('(a) copy', () => {
  it('1, 2, 3 and 5 people', () => {
    expect(withLine(['Thomas Holmes'])).toBe('with Thomas');
    expect(withLine(['Thomas Holmes', 'Danny Holmes'])).toBe('with Thomas and Danny');
    expect(withLine(['Thomas Holmes', 'Danny Holmes', 'Mike Mitchell'])).toBe('with Thomas, Danny and Mike');
    expect(withLine(['Thomas', 'Danny', 'Mike', 'Sam', 'Jo'])).toBe('with Thomas, Danny and 3 others');
  });
});

describe('(b) photo chip and panel', () => {
  it('chip shows three faces max; tap opens names and handles; row navigates', () => {
    const v = mount(base(), { playedWith: PEOPLE });
    const chip = q(v.container, '[data-testid="played-with-chip"]')!;
    expect(chip).not.toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(chip.querySelectorAll('[data-played-with-face]')).toHaveLength(3);
    fireEvent.click(chip);
    const panel = q(v.container, '[role="dialog"]')!;
    expect(panel.textContent).toContain('Thomas Holmes');
    expect(panel.textContent).toContain('@thomasholmes');
    expect(panel.querySelectorAll('[data-played-with-row]')).toHaveLength(4);
    fireEvent.click(panel.querySelectorAll('[data-played-with-row]')[1]);
    expect(q(v.container, '[data-where]')!.getAttribute('data-where')).toContain('b');
    expect(q(v.container, '[data-where]')!.getAttribute('data-where')).not.toBe('/');
  });
  it('no post_with rows and business posts render nothing new; PostWithLine is gone', () => {
    expect(q(mount(base()).container, '[data-testid="played-with-chip"]')).toBeNull();
    cleanup();
    expect(q(mount(base({ actorType: 'business' } as Partial<FeedPost>), { playedWith: PEOPLE }).container, '[data-testid="played-with-chip"]')).toBeNull();
    expect(src('src/components/feed/PostGolfTags.tsx')).not.toMatch(/PostWithLine/);
    expect(src('src/components/feed/FeedCard.tsx')).not.toMatch(/PostWithLine/);
  });
});

describe('(c) closing and tap isolation', () => {
  const open = () => { const v = mount(base(), { playedWith: PEOPLE }); fireEvent.click(q(v.container, '[data-testid="played-with-chip"]')!); return v; };
  it('closes on ×', () => { const v = open(); fireEvent.click(q(v.container, '[data-testid="played-with-close"]')!); expect(q(v.container, '[role="dialog"]')).toBeNull(); });
  it('closes on Escape', () => { const v = open(); fireEvent.keyDown(document, { key: 'Escape' }); expect(q(v.container, '[role="dialog"]')).toBeNull(); });
  it('outside tap on the media closes and opens nothing', async () => {
    const v = open();
    fireEvent.click(q(v.container, 'button[data-post-id]')!);
    expect(q(v.container, '[role="dialog"]')).toBeNull();
    await new Promise((r) => setTimeout(r, 300));
    expect(v.h.onOpenMedia).not.toHaveBeenCalled();
  });
  it('taps inside the panel do not like or open full screen', async () => {
    const v = open();
    const panel = q(v.container, '[role="dialog"]')!;
    fireEvent.click(panel); fireEvent.click(panel);
    await new Promise((r) => setTimeout(r, 300));
    expect(v.h.onLike).not.toHaveBeenCalled();
    expect(v.h.onOpenMedia).not.toHaveBeenCalled();
    expect(q(v.container, '[role="dialog"]')).not.toBeNull();
  });
});

describe('(d) stacking with a place chip', () => {
  it('place chip lifts to bottom 50 above the played-with chip', () => {
    const p = base();
    const tags = new Map([['url:https://images.test/0.jpg', { place: 'clubhouse' as never }]]);
    const v = mount(p, { playedWith: PEOPLE, slideTags: tags as never });
    const chip = q(v.container, '[data-testid="slide-tag-chip"]')!;
    expect(chip.style.bottom).toBe('50px');
    expect(q(v.container, '[data-testid="played-with-chip"]')!.getAttribute('data-pw-offset')).toBe('media');
    expect(src('src/components/feed/played-with.css')).toContain('[data-pw-offset="media"]{bottom:12px}');
  });
});

const ROUND = { whsScoreId: 'score-1', totalHoles: 18, grossScore: 89, netScore: 81, courseHandicap: 8, coursePar: 68, deltaIndex: null, playDate: '2026-10-11', birdies: 1, eagles: 0, albatrosses: 0, holesInOne: 0, cleanCard: false, holeShape: null, whsCourseName: null } as unknown as PostRound;

describe('(e) no-media posts', () => {
  it('text post shows name-row faces and the with… byline; tap opens the sheet', async () => {
    const v = mount(base({ mediaItems: [] }), { playedWith: PEOPLE.slice(0, 3) });
    expect(q(v.container, '[data-testid="played-with-chip"]')).toBeNull();
    expect(q(v.container, '[data-testid="played-with-name-faces"]')!.querySelectorAll('[data-played-with-face]')).toHaveLength(3);
    const by = q(v.container, '[data-testid="played-with-byline"]')!;
    expect(by.querySelectorAll('b')).toHaveLength(3);
    fireEvent.click(by.querySelector('[data-played-with-open]')!);
    await waitFor(() => expect(document.querySelector('[data-testid="played-with-sheet"]')).not.toBeNull());
  });
  it('round card shows the faces and byline; faces tap opens the sheet without a round tap', async () => {
    const onRoundTap = vi.fn();
    const v = mount(base({ mediaItems: [], caption: '' }), { playedWith: PEOPLE.slice(0, 2), postRound: ROUND, onRoundTap });
    expect(q(v.container, '[data-feed-round-card]')).not.toBeNull();
    expect(q(v.container, '[data-testid="played-with-byline"]')).not.toBeNull();
    fireEvent.click(q(v.container, '[data-testid="played-with-name-faces"]')!);
    await waitFor(() => expect(document.querySelector('[data-testid="played-with-sheet"]')).not.toBeNull());
    expect(onRoundTap).not.toHaveBeenCalled();
  });
});

describe('(f) full-screen viewer', () => {
  it('chip sits in the pill row before the member line; no caption; panel opens', () => {
    const s = src('src/components/fullscreen-feed/FullscreenBottomStack.tsx');
    const row = s.indexOf('data-fullscreen-pill-row');
    const chip = s.indexOf('<PlayedWithViewerChip');
    const member = s.indexOf('data-fullscreen-member');
    expect(row).toBeGreaterThan(-1);
    expect(chip).toBeGreaterThan(row);
    expect(member).toBeGreaterThan(chip);
    expect(src('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx')).not.toContain('<CaptionBlock');
    const v = render(<PlayedWithViewerChip people={PEOPLE} onOpenProfile={vi.fn()} />);
    const btn = q(v.container, '[data-testid="played-with-chip"]')!;
    expect(btn.style.position).toBe('relative');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(q(v.container, '[role="dialog"]')).not.toBeNull();
  });
});

describe('(g) one batched read per feed and per viewer', () => {
  it('usePostGolfTags is called once in each host and never in a card or slide', () => {
    const count = (p: string) => (src(p).match(/usePostGolfTags\(/g) ?? []).length;
    expect(count('src/components/feed/CardFeed.tsx')).toBe(1);
    expect(count('src/components/posts-tab/LightCardFeed.tsx')).toBe(1);
    expect(count('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx')).toBe(1);
    expect(src('src/components/fullscreen-feed/FullscreenFeedOverlay.tsx')).toMatch(/usePostGolfTags\(golfTagPosts, 'fullscreen'\)/);
    expect(count('src/components/feed/FeedCard.tsx')).toBe(0);
    expect(count('src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx')).toBe(0);
  });
});

describe('(h) existing rows show with no other action', () => {
  it('seeded post_with rows render the chip', async () => {
    seeded.rows = [{ postId: 'p1', userId: 'a', name: 'Thomas Holmes', username: 'thomasholmes', avatarUrl: null }];
    const p = base();
    function Host() { const t = usePostGolfTags([p], 'test'); return <FeedCard post={p} liked={false} likeCount={0} commentCount={0} onLike={vi.fn()} onComment={vi.fn()} onShare={vi.fn()} onProfile={vi.fn()} onOpenMedia={vi.fn()} layout="mediaFirst" playedWith={t.withByPost.get(p.id)} slideTags={t.slideTags} />; }
    const v = render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Host /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(q(v.container, '[data-testid="played-with-chip"]')).not.toBeNull());
    expect(q(v.container, '[data-testid="played-with-chip"]')!.textContent).toContain('with Thomas');
  });
});
