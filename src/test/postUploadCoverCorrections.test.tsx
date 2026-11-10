import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { StageMediaItem } from '@/features/post-v2/hooks/useStageComposer';

const poster = vi.hoisted(() => vi.fn(async (_key: string, _url: string, time: number) => `/frame-${time}.jpg`));
vi.mock('@/features/post-v2/lib/videoPoster', () => ({ extractPoster: poster }));
vi.mock('@/features/post-v2/components/BottomSheet', () => ({ default: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div role="dialog">{children}</div> : null }));
import { VideoCoverChapters } from '@/features/post-v2/components/video/VideoComposerFields';
import CoverFrameSheet from '@/features/post-v2/components/CoverFrameSheet';
import { emptyVideoDetails, videoCoverSelection } from '@/features/post-v2/lib/videoDetails';

const source = (path: string) => readFileSync(path, 'utf8');
const item: StageMediaItem = { id: 'v', type: 'video', frame: 'original', previewUrl: '/video.mp4', duration: 21, posterTimestamp: 19.75 };
afterEach(() => { cleanup(); poster.mockClear(); });

describe('posting upload and cover corrections', () => {
  it('in-progress upload spinner/fill use pf-ink and track uses pf-track without changing review Star', () => {
    const banner = source('src/components/uploads/UploadProgressBanner.tsx');
    expect(banner).toContain('<Loader2 className="h-4 w-4 text-[var(--pf-ink)] animate-spin"');
    expect(banner).toContain('isUploading ? "bg-[var(--pf-track)]" : "bg-muted"');
    expect(banner).toContain('isComplete ? "bg-green-500" : isFailed ? "bg-destructive" : "bg-[var(--pf-ink)]"');
    expect(banner).toContain('<Star className="h-4 w-4 text-primary animate-pulse"');
    const tokens = source('src/index.css');
    expect(tokens).toContain('--pf-ink: #F8FAFC');
    expect(tokens).toContain('--pf-track: rgba(255,255,255,.10)');
  });
  it('VIDEO compound section selector matches the course section spacing', () => {
    const css = source('src/features/post-v2/components/video/videoCreator.css');
    expect(css).toContain('.video-creator.vc-section{padding:22px 16px 0}');
    expect(css).not.toContain('.video-creator .vc-section');
    expect(css).toMatch(/\.vc-heading\{[^}]*margin-bottom:10px/);
    const golf = source('src/features/post-v2/components/golf/composerGolf.css');
    expect(golf).toContain('margin:22px 16px 0');
    expect(golf).toMatch(/\.composer-golf-head\{[^}]*margin-bottom:10px/);
  });
  it('custom 19.75s choice replaces only the first tile and is the only pressed extracted frame', async () => {
    const view = render(<VideoCoverChapters item={item} details={emptyVideoDetails()} description="" long={false} onChange={() => {}} onFrame={() => {}} onCover={() => {}} />);
    const frames = [...view.container.querySelectorAll('.vc-frame')];
    expect(frames).toHaveLength(4);
    expect(frames.map(frame => frame.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false']);
    await waitFor(() => expect(frames[0].querySelector('img')?.getAttribute('src')).toBe('/frame-19.75.jpg'));
    expect(poster).toHaveBeenCalledWith('v:cover:19.75', '/video.mp4', 19.75);
    expect(frames.map(frame => frame.getAttribute('aria-label'))).toEqual(['Cover frame at 19.8 seconds', 'Cover frame at 7.3 seconds', 'Cover frame at 12.6 seconds', 'Cover frame at 17.8 seconds']);
  });
  it('pressed tile draws a white overlay ring instead of a suppressed outline', () => {
    const css = source('src/features/post-v2/components/video/videoCreator.css');
    expect(css).toMatch(/\.vc-frame\[aria-pressed=true\]::after\{[^}]*box-shadow:inset 0 0 0 2px var\(--video-ink\)/);
    expect(css).toContain('--video-ink:#F8FAFC');
    expect(css).not.toContain('outline-offset:-2px');
  });
  it('sheet opens on 19.75s and seeks the video after metadata and on reopening', () => {
    const props = { item, chosenTime: 19.75, onClose: vi.fn(), onApply: vi.fn() };
    const view = render(<CoverFrameSheet open {...props} />);
    expect(screen.getByText('Poster time: 19.75s')).toBeInTheDocument();
    const video = view.container.querySelector('video');
    if (!video) throw new Error('missing cover video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 21 });
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBe(19.75);
    expect(screen.getByRole('slider')).toHaveValue('19.75');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
    view.rerender(<CoverFrameSheet open={false} {...props} />);
    view.rerender(<CoverFrameSheet open {...props} />);
    expect(view.container.querySelector('video')?.currentTime).toBe(19.75);
  });
  it('suggestion/default choices retain their selection and posterTimestamp wins metadata', () => {
    expect(videoCoverSelection({ duration: 21 }, null).selectedIndex).toBe(0);
    expect(videoCoverSelection({ duration: 21 }, 12.6).selectedIndex).toBe(2);
    expect(videoCoverSelection(item, 12.6).chosen).toBe(19.75);
    expect(videoCoverSelection({ duration: 30, trimStart: 5, trimEnd: 25 }, null).chosen).toBe(7);
  });
});