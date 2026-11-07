import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VideoAboutSheet } from '@/features/video-details/VideoAboutSheet';
import { VideoTeaser } from '@/features/video-details/VideoTeaser';
import { normalizeVideoDetails } from '@/features/video-details/videoDetailsModel';
import type { FeedPost } from '@/components/media-system/types/media';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const post = { id: 'p', caption: 'Intro at 1:12 and https://example.com', createdAt: '2026-09-25T12:00:00Z', courseId: 'course', courseName: 'Course Name', courseRegion: 'Kent', mediaItems: [] } as unknown as FeedPost;
const details = normalizeVideoDetails({ post_id: 'p', title: 'A long video title', credits: [{ profile_id: 'person', name: 'Added Person', role: 'host' }], links: [{ url: 'https://example.com', label: 'Website' }], thanks: [{ business_id: 'club', name: 'Added Club', category: 'Golf club' }], gear: ['Driver'] });
const chapters = [{ seconds: 0, time: '0:00', label: 'Intro' }, { seconds: 72, time: '1:12', label: 'Challenge' }];
const wrap = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
function mount(overrides: Partial<React.ComponentProps<typeof VideoAboutSheet>> = {}) { const onClose = vi.fn(), onTime = vi.fn(), onNavigate = vi.fn(); const view = render(<VideoAboutSheet open post={post} details={details} chapters={chapters} likes={1100} onClose={onClose} onTime={onTime} onNavigate={onNavigate} {...overrides} />, { wrapper: wrap }); return { ...view, onClose, onTime, onNavigate }; }
describe('PF3B shared About sheet', () => {
  it('sections appear in the signed-off order without views', () => { mount(); const sheet = screen.getByRole('dialog'); expect([...sheet.querySelectorAll('[data-video-section]')].map(e => e.getAttribute('data-video-section'))).toEqual(['Chapters', 'Filmed at', 'In this video', 'Links', 'Thanks to', 'Gear in this video']); expect(sheet.textContent?.toLowerCase()).not.toContain('views'); });
  it('empty sections are absent', () => { mount({ post: { ...post, courseId: undefined }, details: null, chapters: [] }); expect(screen.getByRole('dialog').querySelectorAll('[data-video-section]')).toHaveLength(0); });
  it('chapter taps seek and close', () => { const v = mount(); fireEvent.click(screen.getByRole('button', { name: '1:12 Challenge' })); expect(v.onTime).toHaveBeenCalledWith(72); expect(v.onClose).toHaveBeenCalledOnce(); });
  it('description timestamps seek and close', () => { const v = mount(); fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '1:12', exact: true })); expect(v.onTime).toHaveBeenCalledWith(72); expect(v.onClose).toHaveBeenCalledOnce(); });
  it('credits open the profile and close', () => { const v = mount(); fireEvent.click(screen.getByRole('button', { name: /Added Person/ })); expect(v.onNavigate).toHaveBeenCalledWith('/profile/person'); expect(v.onClose).toHaveBeenCalledOnce(); });
  it('filmed-at opens the course', () => { const v = mount(); fireEvent.click(screen.getByRole('button', { name: /Course Name/ })); expect(v.onNavigate).toHaveBeenCalledWith('/courses/course'); });
  it('thanks opens the business', () => { const v = mount(); fireEvent.click(screen.getByRole('button', { name: /Added Club/ })); expect(v.onNavigate).toHaveBeenCalledWith('/business/club'); });
  it('external addresses keep safe targets', () => { mount(); const links = screen.getAllByRole('link'); expect(links.every(l => l.getAttribute('target') === '_blank' && l.getAttribute('rel') === 'noopener noreferrer')).toBe(true); });
});
describe('PF3B teaser doors', () => {
  it('title and more open the same sheet', () => { const open = vi.fn(); render(<VideoTeaser title="Title" description="Description" hasMore onOpen={open} />); fireEvent.click(screen.getByRole('button', { name: 'Title' })); fireEvent.click(screen.getByRole('button', { name: 'more' })); expect(open).toHaveBeenCalledTimes(2); });
  it('a chapter is a sheet door and empty titles are omitted', () => { const open = vi.fn(); const v = render(<VideoTeaser title="" description="Fits" hasMore={false} chapter={chapters[1]} onOpen={open} />); expect(v.container.querySelector('.video-title')).toBeNull(); expect(screen.queryByRole('button', { name: 'more' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: /Challenge/ })); expect(open).toHaveBeenCalledOnce(); });
});