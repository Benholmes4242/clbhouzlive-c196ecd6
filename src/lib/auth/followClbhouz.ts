import { supabase } from '@/integrations/supabase/client';

/**
 * The clbhouz BUSINESS account id — the app's own publication channel
 * (business_accounts.id). Not a third-party business competing for feed space:
 * the Wednesday publication cannot reach anybody from an account nobody
 * follows, so every new member is followed onto it at signup. One tap unfollows.
 *
 * All 94 pre-existing members were backfilled by hand; this keeps the audience
 * growing from here.
 */
export const CLBHOUZ_BUSINESS_ID = 'b54c35bf-caa8-4d4f-bd38-e0de8c80ecd7';

/**
 * Follow clbhouz on behalf of a brand-new member. NON-FATAL BY CONTRACT: a
 * failure here must never block a signup, so everything is caught and logged.
 * The insert is idempotent — a duplicate (23505) is a success.
 */
export async function followClbhouzOnSignup(userId: string): Promise<void> {
  try {
    const { error } = await supabase.from('follows').insert({
      follower_actor_type: 'personal',
      follower_actor_id: userId,
      follower_user_id: userId,
      following_actor_type: 'business',
      following_actor_id: CLBHOUZ_BUSINESS_ID,
    });
    if (error && (error as { code?: string }).code !== '23505') {
      console.warn('[signup] clbhouz follow failed:', error.message);
    }
  } catch (err) {
    console.warn('[signup] clbhouz follow threw:', err);
  }
}
