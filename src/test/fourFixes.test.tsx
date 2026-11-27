import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fx = vi.hoisted(() => ({
  likers: [{ userId: 'u1', actorId: 'u1', displayName: 'Enda Lonergan', username: 'enda', avatarUrl: null, isViewer: false }] as Array<Record<string, unknown>>,
  avatarProps: [] as Array<Record<string, unknown>>,
}));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/usePostLikers', async (orig) => ({ ...(await orig<typeof import('@/hooks/usePostLikers')>()), usePostLikers: () => ({ likers: fx.likers, isLoading: false }) }));
vi.mock('@/components/ui/SquircleAvatar', async (orig) => {
  const real = await orig<typeof import('@/components/ui/SquircleAvatar')>();
  return { ...real, SquircleAvatar: (p: Record<string, unknown>) => { fx.avatarProps.push(p); return <span data-squircle="" />; } };
});
vi.mock('@/components/likes/LikesSheet', () => ({ LikesSheet: () => null }));

import { LikedByRow } from '@/components/likes/LikedByRow';
import { ReactionGlyph } from '@/lib/reactionKind';
import { navigateOverViewer } from '@/lib/fullscreen/navigateOverViewer';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

afterEach(() => { cleanup(); fx.avatarProps = []; vi.restoreAllMocks(); });

describe('FOUR_FIXES (a) stack faces are hairline', () => {
  it('no 2px border; SquircleAvatar gets hairlineRing', () => {
    render(<MemoryRouter><LikedByRow postId="p" count={1} variant="stack" /></MemoryRouter>);
    const face = document.querySelector('[data-liked-stack-face]') as HTMLElement;
    expect(face.style.border).toBe('');
    expect(face.style.boxShadow).toContain('1.5px');
    expect(fx.avatarProps[0]?.hairlineRing).toBe(true);
    expect(fx.avatarProps[0]?.ringColor).toBeUndefined();
  });
});

describe('FOUR_FIXES (b) reacted thumbs are white', () => {
  it.each(['panel', 'chrome', 'media'] as const)('%s tone reacted is #FFFFFF', (tone) => {
    const { container } = render(<ReactionGlyph reacted size={16} tone={tone} />);
    const svg = container.querySelector('svg')!;
    const white = document.createElement('i'); white.style.color = '#FFFFFF';
    const fill = svg.getAttribute('fill') ?? svg.getAttribute('color') ?? (svg as unknown as HTMLElement).style.color;
    const probe = document.createElement('i'); probe.style.color = fill ?? '';
    expect(probe.style.color).toBe(white.style.color);
  });
  it('static scan: no amber passed as a reacted, liked or active-like colour', () => {
    const files = [
      'src/components/feed/FeedPostControls.tsx', 'src/components/feed/HeartBurst.tsx',
      'src/components/explore-tab-new/courseled/ReactionAction.tsx', 'src/components/posts/ReviewBottomSheet.tsx',
      'src/features/stories/StoryRowEngagement.tsx', 'src/features/tourhub/news/WireFeedSlide.tsx',
      'src/features/explore-magazine/ExploreCard.tsx',
      'src/features/comments-v2/components/CommentCard.tsx', 'src/features/comments-v2/components/ReplyRow.tsx',
      'src/components/fullscreen-feed/ImmersiveFullscreenChrome.tsx', 'src/lib/reactionKind.ts',
    ];
    const bad = /(reactedColor|activeColor|has_liked|liked|isLiked|accent|reacted)[^\n;]{0,40}\?\s*(A\.AMBER|AMBER_ON_MEDIA|AMBER|REACTION_AMBER)\b|(activeColor|reactedColor)\s*[=:]\s*\{?\s*(A\.AMBER|AMBER_ON_MEDIA|AMBER)\b/;
    for (const f of files) expect(readFileSync(resolve(process.cwd(), f), 'utf8'), f).not.toMatch(bad);
  });
});

describe('FOUR_FIXES (c) liker taps over the viewer', () => {
  it('viewer open: navigation-aware close before navigate, lands on /profile/:username', () => {
    const order: string[] = [];
    const close = vi.fn((info?: { reason?: string }) => { order.push(`close:${info?.reason}`); });
    const realGet = useFullscreenFeedStore.getState;
    vi.spyOn(useFullscreenFeedStore, 'getState').mockImplementation(() => ({ ...realGet(), isOpen: true, close }) as ReturnType<typeof realGet>);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0; });
    const navigate = vi.fn((to: string) => { order.push(`nav:${to}`); });
    navigateOverViewer(navigate as never, '/profile/enda');
    expect(order).toEqual(['close:navigating', 'nav:/profile/enda']);
  });
  it('no viewer: navigates without touching the store', () => {
    const close = vi.fn();
    const realGet = useFullscreenFeedStore.getState;
    vi.spyOn(useFullscreenFeedStore, 'getState').mockImplementation(() => ({ ...realGet(), isOpen: false, close }) as ReturnType<typeof realGet>);
    const navigate = vi.fn();
    navigateOverViewer(navigate as never, '/profile/enda');
    expect(close).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/profile/enda', undefined);
  });
  it('LikesSheet row tap routes through navigateOverViewer to /profile/:username', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/likes/LikesSheet.tsx'), 'utf8');
    expect(src).toContain('navigateOverViewer(navigate, `/profile/${l.username}`)');
  });
});

describe('FOUR_FIXES (d) index chart left-only clip', () => {
  it('svg carries inset(-12px -12px -12px 0)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/handicap/IndexWindowChart.tsx'), 'utf8');
    expect(src).toContain("clipPath: 'inset(-12px -12px -12px 0)'");
  });
});
