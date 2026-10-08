import { describe, it, expect, vi, afterEach } from 'vitest';
import { mapRowToFeedPost } from './feedMapper';
import type { FeedRpcRow } from '../types/media';

const UID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

function row(over: Partial<FeedRpcRow>): FeedRpcRow {
  return {
    post_id: 'p1', post_content: null, post_created_at: new Date().toISOString(),
    post_user_id: 'u1', post_actor_type: 'personal', post_actor_id: 'u1', post_status: 'published',
    source_review_id: null, media_id: 'm1', media_type: 'video', media_url: null, poster_url: null,
    stream_id: null, duration_seconds: 10, width: 1080, height: 1920, display_order: 0,
    creator_username: null, creator_display_name: null, creator_avatar_url: null, creator_is_verified: false,
    business_name: null, business_logo_url: null, business_is_verified: false,
    like_count: 0, comment_count: 0, share_count: 0, review_rating: null, review_course_id: null,
    review_course_name: null, review_course_image: null, review_course_region: null,
    review_course_country: null, review_course_sub_country: null, review_text: null,
    review_design_score: null, review_condition_score: null, review_clubhouse_score: null,
    review_facilities_score: null, creator_relation: 'none', is_liked_by_me: false,
    is_followed_by_me: false, engagement_score: 0, post_tags: null, course_id: null, course_name: null,
    ...over,
  } as FeedRpcRow;
}

afterEach(() => vi.restoreAllMocks());

describe('feedMapper stream id', () => {
  it('uses a populated stream_id and does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mapRowToFeedPost(row({ stream_id: UID, media_url: 'stream:ffffffffffffffffffffffffffffffff' })).mediaItems[0];
    expect(m.streamId).toBe(UID);
    expect(m.hlsUrl).toContain(`/${UID}/manifest/video.m3u8`);
    expect(warn).not.toHaveBeenCalled();
  });

  it('recovers from stream:<uid> when stream_id is null and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mapRowToFeedPost(row({ media_url: `stream:${UID}` })).mediaItems[0];
    expect(m.streamId).toBe(UID);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('stream_id missing from RPC');
  });

  it('image row with a 32-hex substring gets no hlsUrl and no streamId', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mapRowToFeedPost(row({
      media_type: 'image',
      media_url: `https://x.supabase.co/storage/v1/object/public/posts/${UID}.jpg`,
    })).mediaItems[0];
    expect(m.hlsUrl).toBeUndefined();
    expect(m.streamId).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });
});
