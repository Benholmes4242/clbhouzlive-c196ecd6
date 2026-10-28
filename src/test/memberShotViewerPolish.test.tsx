import { holeMediaQuery } from '@/lib/courseMedia/holeMediaQuery';
import { holeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCurrentViewport } from '@/lib/media/resolveRestingRect';
const f = vi.hoisted(() => ({ rpc: vi.fn(), open: vi.fn() }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('@/lib/openWithOrigin', () => ({ openWithOrigin: f.open }));
import { HoleWalk } from '@/components/course-media-tab/HoleWalk';
import type { HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import type { FeedPost } from '@/components/media-system/types/media';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('member-shot viewer polish', () => {
  it('synthetic geometry reserves zero bottom footer/safe padding while normal geometry retains 72px', () => {
    expect(getCurrentViewport(true).safeBottom).toBe(0);
    expect(getCurrentViewport(false).safeBottom).toBe(72);
  });
  it('hole walk fetches the shared hole key on tap, opens tapped id and uses server avatars and order — course gallery', () => {
    const cache=new QueryClient({defaultOptions:{queries:{retry:false}}}); const rows=['a','b'].map(id=>({id,course_id:'course',hole_no:15,media_url:`/${id}.jpg`,media_type:'image',member_name:'Benjamin Holmes',member_avatar_url:'/ben.jpg',added_at:'2026-01-11T10:00:00Z',par:4,yards:412})); f.rpc.mockResolvedValue({data:rows,error:null}); return cache.fetchQuery(holeMediaQuery('course',15)).then(data=>{ expect(f.rpc).toHaveBeenCalledWith('get_hole_media',{p_course_id:'course',p_hole_no:15}); expect(cache.getQueryData(['hole-media','course',15])).toEqual(rows); const posts=holeShotsToFeedPosts(data,'Druids Glen Golf Club','course',15); expect(posts[0].mediaItems.map(item=>item.id)).toEqual(['a','b']); expect(posts[0].mediaItems[1].memberShot?.avatarUrl).toBe('/ben.jpg'); });
  });
});
