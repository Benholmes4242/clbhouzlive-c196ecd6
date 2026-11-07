import { describe, expect, it } from 'vitest';
import { routeForNotif } from '../../supabase/functions/_shared/notifRoute';

describe('video credit push destination', () => {
  it('opens the credited video post from post_id without an entity fallback', () => {
    expect(routeForNotif({ notif_type: 'video_credit', data: { post_id: 'credited-video' } })).toBe('/post/credited-video');
  });
  it('uses the post entity when post_id is absent', () => {
    expect(routeForNotif({ notif_type: 'video_credit', entity_type: 'post', entity_id: 'entity-video' })).toBe('/post/entity-video');
  });
  it('does not classify a video credit as a round reaction', () => {
    expect(routeForNotif({ notif_type: 'video_credit', data: { post_id: 'credited-video', is_round: true, whs_score_id: 'round-score' } })).toBe('/post/credited-video');
  });
});