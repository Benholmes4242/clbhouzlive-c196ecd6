import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CoursePhotoRetagPicker, HoleTagRemoveDialog } from '@/components/course-media-tab/CourseMediaEmptyStates';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';

const video = { id: 'video', course_id: 'here', user_id: 'me', hole_no: 9, status: 'approved', media_type: 'video', media_url: '/video.mp4', poster_url: '/portrait.jpg', stream_id: null, duration_seconds: 12, exif_captured_at: null } as HolePhoto;
const css = readFileSync(resolve(process.cwd(), 'src/components/course-media-tab/media-empty.css'), 'utf8');
const rule = (selector: string) => css.split(`${selector} {`)[1]?.split('}')[0] ?? '';
const picker = (mode: 'move' | 'retag') => render(<CoursePhotoRetagPicker mode={mode} row={video} knownHoles={Array.from({ length: 18 }, (_, i) => i + 1)} pending={false} error={null} onSubmit={() => {}} onClose={() => {}} />);

describe('BRIEF_MOVE_DIALOG_VIDEO_PREVIEW', () => {
  it('Move keeps both video preview classes, all hole buttons and Cancel', () => {
    picker('move');
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByAltText('Your video').parentElement).toHaveClass('media-empty-retag-photo', 'hole-media-preview');
    for (let n = 1; n <= 18; n++) expect(within(dialog).getByRole('button', { name: `Hole ${n}` })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });
  it.each(['move', 'retag'] as const)('%s dialog opts into the scrolling safety net', mode => {
    picker(mode);
    expect(screen.getByRole('dialog')).toHaveClass('media-empty', 'media-empty-dialog');
  });
  it('Remove dialog opts into the scrolling safety net', () => {
    render(<HoleTagRemoveDialog row={video} fromPost={false} pending={false} error={null} onConfirm={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toHaveClass('media-empty', 'media-empty-dialog');
  });
  it('constrains and centres the video wrapper without changing the photo rule', () => {
    const wrapper = rule('.media-empty-retag-photo.hole-media-preview');
    for (const declaration of ['width: fit-content;', 'max-width: 100%;', 'height: 160px;', 'margin: 0 auto;', 'overflow: hidden;', 'border-radius: 8px;']) expect(wrapper).toContain(declaration);
    expect(rule('.media-empty-retag-photo')).toBe(' width: 100%; height: 160px; object-fit: contain; border-radius: 8px; ');
  });
  it('fits the poster inside its wrapper', () => {
    const poster = rule('.media-empty-retag-photo.hole-media-preview img');
    for (const declaration of ['display: block;', 'height: 100%;', 'width: auto;', 'max-width: 100%;', 'object-fit: contain;', 'border-radius: 8px;']) expect(poster).toContain(declaration);
  });
  it('limits dialog height and allows vertical scrolling', () => {
    expect(rule('.media-empty-dialog')).toContain('max-height: calc(100dvh - 48px);');
    expect(rule('.media-empty-dialog')).toContain('overflow-y: auto;');
  });
});