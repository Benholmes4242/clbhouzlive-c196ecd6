import { describe, expect, it } from 'vitest';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import { routeForNotif } from '../../supabase/functions/_shared/notifRoute';

const base = { notif_id: 'n1', created_at: '2026-11-26T10:00:00Z', is_read: false, actor_user_id: 'actor' };
const withPostId = { ...base, notif_type: 'top_ten_update', entity_type: 'top_ten', entity_id: null, data: { target_user_id: 'owner', post_id: 'p1' } };
const withEntity = { ...base, notif_type: 'top_ten_update', entity_type: 'post', entity_id: 'p2', data: { target_user_id: 'owner' } };
const noPost = { ...base, notif_type: 'top_ten_update', entity_type: 'top_ten', entity_id: null, data: { target_user_id: 'owner' } };

describe('Brief 39 inbox: top_ten_update opens the post', () => {
  it('routes data.post_id to /?post=p1', () => expect(getActivityLink(withPostId as never)).toBe('/?post=p1'));
  it('routes a post entity to /?post=p2', () => expect(getActivityLink(withEntity as never)).toBe('/?post=p2'));
  it('falls back to the profile link without a post id', () => expect(getActivityLink(noPost as never)).toBe('/profile/owner?tab=courses'));
});

describe('Brief 39 push: top_ten_update opens the post', () => {
  it('routes data.post_id to /?post=p1', () => expect(routeForNotif(withPostId as never)).toBe('/?post=p1'));
  it('routes a post entity to /?post=p2', () => expect(routeForNotif(withEntity as never)).toBe('/?post=p2'));
  it('falls back to the profile link without a post id', () => expect(routeForNotif(noPost as never)).toBe('/profile/owner?tab=courses'));
});
