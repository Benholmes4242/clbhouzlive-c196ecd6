import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LibraryHead } from '@/features/media-library/LibraryChrome';
import { LibraryVideoCard } from '@/features/media-library/LibraryVideoCard';
import type { CommunityLibraryItem } from '@/components/explore-tab-new/courseled/hooks/useCommunityLibrary';

const source = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

function video(overrides: Partial<CommunityLibraryItem> = {}): CommunityLibraryItem {
  return {
    key: 'video-1',
    postId: 'post-1',
    userId: 'member-1',
    createdAt: '2026-09-22T08:00:00Z',
    title: 'A deliberately long title that can occupy two lines on the page card',
    likeCount: 0,
    durationSeconds: 240,
    duration: 240,
    kind: 'video',
    thumbnail: null,
    hlsUrl: null,
    displayName: 'Morgan Reed',
    avatarUrl: null,
    courseName: 'Royal County Down',
    courseId: 'course-1',
    aspect: 16 / 9,
    post: { id: 'post-1', mediaItems: [] } as CommunityLibraryItem['post'],
    mediaIndex: 0,
    mediaId: 'media-1',
    ...overrides,
  };
}

describe('Media page three walls', () => {
  it('keeps one title and no duplicate item total in LibraryHead', () => {
    render(<LibraryHead title="Media" />);
    expect(screen.getByRole('heading', { name: 'Media' })).toBeInTheDocument();
    expect(screen.queryByText(/items?/i)).toBeNull();
  });

  it('uses the exact long-form title fallback and omits an empty creator line', () => {
    const { rerender, container } = render(<LibraryVideoCard item={video({ title: 'Title wins' })} onPress={vi.fn()} />);
    expect(screen.getByText('Title wins')).toBeInTheDocument();

    rerender(<LibraryVideoCard item={video({ title: '', courseName: 'Course wins', displayName: '' })} onPress={vi.fn()} />);
    expect(screen.getByText('Course wins')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-library-video-creator]')).toHaveLength(0);

    rerender(<LibraryVideoCard item={video({ title: '', courseName: null, displayName: 'Creator wins' })} onPress={vi.fn()} />);
    expect(screen.getAllByText('Creator wins').length).toBeGreaterThan(0);
  });

  it('keeps clip paging, totals, analytics, viewer origins, and mosaic geometry contracts', () => {
    const page = source('src/features/media-library/MediaLibraryPage.tsx');
    expect(page).toContain('const visibleClips = useMemo(() => clips.slice(0, shown)');
    expect(page).toContain('gridTemplateColumns: \'repeat(3, minmax(0, 1fr))\'');
    expect(page).toContain('gap: MOSAIC_GAP');
    expect(page).toContain('radius={MOSAIC_RADIUS}');
    expect(page).toContain('aspect={9 / 16}');
    expect(page).toContain('maxPlaying={2}');
    expect(page).toContain('clips.length > shown');
    expect(page).toContain('setShown((value) => value + PAGE)');
    expect(page).toContain("hubCounts.data?.clip_count ?? null");
    expect(page).toContain("hubCounts.data?.video_count ?? null");
    expect(page).toContain('totalQuery.data ?? null');
    expect(page).toContain("openedFrom: source === 'clip' ? 'media-library-clips' : 'media-library-videos'");
    expect(page).toContain("openedFrom: tile?.review ? 'media-library-review' : 'media-library-moment'");
    expect(page).toContain("analyticsEvents.track('media_library_tile_tapped'");
    expect(page).toContain("analyticsEvents.track('media_library_sort_changed'");
    expect(page).toContain("analyticsEvents.track('media_library_kind_changed'");
    expect(page).not.toContain('AboutSection');
  });

  it('makes MediaRailTile additions opt-in so fixed-width rail callers retain their defaults', () => {
    const tile = source('src/components/explore-tab-new/courseled/MediaRailTile.tsx');
    expect(tile).toContain('fill = false');
    expect(tile).toContain('showCaption = true');
    expect(tile).toContain('radius = r.sm');
    expect(tile).toContain("width: fill ? '100%' : width");
    expect(tile).toContain('flex: fill ? undefined : `0 0 ${width}px`');
  });
});