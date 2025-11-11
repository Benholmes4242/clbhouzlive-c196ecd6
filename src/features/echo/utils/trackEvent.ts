import { supabase } from '@/integrations/supabase/client';

/**
 * Track an analytics event to the analytics_events table
 * @param name Event name (e.g. 'echo_history_open_inline')
 * @param props Additional event properties
 */
export async function trackEvent(name: string, props: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({
      user_id: user?.id,
      name,
      props,
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}
