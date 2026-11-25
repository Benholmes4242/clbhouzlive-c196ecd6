import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { readFileSync } from 'node:fs';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: vi.fn() }));
vi.mock('@/features/creator/profileCreator', async importOriginal => { const actual = await importOriginal<typeof import('@/features/creator/profileCreator')>(); return { ...actual, useProfileVideos: () => ({ data: { pages: [[
  { post_id: 'long', stream_id: '', width: 1920, height: 1080, caption: 'Long caption', created_at: '2026-09-25', duration_seconds: 600, course_name: 'Old Course' },
  { post_id: 'short', stream_id: '', width: 1080, height: 1920, caption: 'Short caption', created_at: '2026-09-25', duration_seconds: 30 },
  { post_id: 'long2', stream_id: '', width: 1920, height: 1080, caption: 'Second long', created_at: '2026-09-24', duration_seconds: 300 },
]] }, isPending: false, isError: false, hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn(), refetch: vi.fn() }) }; });
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } }));
import { ProfileVideosTab } from '@/features/creator/ProfileVideosTab';
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={new QueryClient()}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>;
afterEach(cleanup);
const css = readFileSync('src/features/creator/profile-creator.css', 'utf8');
describe('Brief 21 I — Profile Videos grid', () => {
  it('a long-form row renders no title or age text and every cell is the same tile', () => {
    const v = render(<ProfileVideosTab userId="owner" viewerId="viewer" summary={{ is_creator: true, videos: 3, shorts: 1, long_form: 2 }} />, { wrapper });
    const grid = v.container.querySelector('.profile-video-grid') as HTMLElement;
    const cells = Array.from(grid.children);
    expect(cells).toHaveLength(3);
    expect(cells.every(c => c.classList.contains('profile-video-tile'))).toBe(true);
    expect(grid.querySelector('.profile-video-long, .profile-video-long-title, .profile-video-long-age')).toBeNull();
    expect(grid.textContent).not.toMatch(/Long caption|Second long|ago/i);
    expect(grid.querySelector('.profile-video-course')?.textContent).toBe('Old Course');
    expect(grid.querySelectorAll('.profile-video-duration')).toHaveLength(3);
  });
  it('every grid row is 172px tall in a 3-column grid with a 2px gap', () => {
    expect(css).toMatch(/\.profile-video-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:2px/);
    expect(css).toMatch(/\.profile-video-tile\.profile-video-tile,\.profile-video-loading\{[^}]*height:172px/);
  });
});
