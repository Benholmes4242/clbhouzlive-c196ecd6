import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
import { VideoTeaser, markupPrefix } from '@/features/video-details/VideoTeaser';
import { SlideTagChip } from '@/components/feed/PostGolfTags';
import { FeedHoleChip } from '@/components/feed/PostGolfContext';
import { fullscreenStackBottom, SCRUBBER_ROW_BOTTOM } from '@/components/fullscreen-feed/fullscreenCanon';
import { readFileSync } from 'node:fs';

const ID = '11111111-2222-3333-4444-555555555555';
const M = `@[Ann Lee](u:${ID})`;

describe('§2(4) teaser mentions', () => {
  it('markupPrefix keeps whole mentions that fit and drops a split one', () => {
    expect(markupPrefix(`Round with ${M} today`, 100)).toBe(`Round with ${M} today`);
    expect(markupPrefix(`Round with ${M} today`, 13)).toBe('Round with');
  });
  it('a mention renders bold and tappable without opening the sheet', () => {
    const open = vi.fn();
    const v = render(<MemoryRouter><VideoTeaser title="T" description={`With ${M}`} hasMore={false} onOpen={open} /></MemoryRouter>);
    const mention = v.container.querySelector('.video-teaser-description [role="link"], .video-teaser-description button, .video-teaser-description a, .video-teaser-description strong, .video-teaser-description b, .video-teaser-description span[style*="font-weight"]');
    expect(mention).not.toBeNull();
    fireEvent.click(mention!);
    expect(open).not.toHaveBeenCalled();
  });
});

describe('§2(5) place chip position', () => {
  it('sits top-left with the hole chip geometry', () => {
    const v = render(<SlideTagChip tag={{ place: 'clubhouse' } as never} lifted />);
    const s = (v.container.firstElementChild as HTMLElement).style;
    expect([s.left, s.top, s.height, s.borderRadius]).toEqual(['12px', '12px', '28px', '9px']);
  });
});

describe('§2(1) duration hides while the hole card is open', () => {
  it('reports open and closed', () => {
    const changes: boolean[] = [];
    const v = render(<QueryClientProvider client={new QueryClient()}><FeedHoleChip holeNo={4} courseId={null} onOpenChange={o => changes.push(o)} /></QueryClientProvider>);
    fireEvent.click(v.getByTestId('post-hole-chip'));
    fireEvent.click(v.getByTestId('post-hole-card'));
    expect(changes).toEqual([false, true, false]);
  });
  it('the stylesheet hides the duration under the open flag', () => {
    expect(readFileSync('src/index.css', 'utf8')).toContain('[data-feed-hole-open] [data-inline-video-duration] { visibility: hidden; }');
  });
});

describe('§3(1)/(7) fullscreen stack gaps', () => {
  it('14px above the pills, plus a reserved 12px scrubber row and 14px when any video', () => {
    expect(fullscreenStackBottom(false)).toContain('+ 58px');
    expect(fullscreenStackBottom(true)).toContain('+ 84px');
    expect(SCRUBBER_ROW_BOTTOM).toContain('+ 48px');
  });
  it('the gallery reserves by run, not by slide', () => {
    expect(readFileSync('src/components/fullscreen-feed/CourseGalleryChrome.tsx', 'utf8')).toContain('fullscreenStackBottom(runHasVideo)');
  });
});
