import { supabase } from '@/integrations/supabase/client';

export type BusinessEventType = 'profile_view' | 'website_click' | 'message_click';

export async function trackBusinessEvent(
  businessId: string,
  eventType: BusinessEventType,
  options?: { path?: string }
) {
  try {
    if (!businessId) return;

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { error } = await supabase
      .from('business_profile_events')
      .insert({
        business_id: businessId,
        user_id: userId,
        event_type: eventType,
        path: options?.path ?? window.location.pathname,
      });

    if (error) {
      console.warn('[trackBusinessEvent] failed', error);
    }
  } catch (err) {
    console.warn('[trackBusinessEvent] error', err);
  }
}
