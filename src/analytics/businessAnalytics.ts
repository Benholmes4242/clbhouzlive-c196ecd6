import { supabase } from '@/integrations/supabase/client';

export type BusinessEventType = 
  | 'profile_view' 
  | 'directory_impression'
  | 'website_click' 
  | 'click_website'
  | 'click_email'
  | 'click_phone'
  | 'message_click'
  | 'post_view'
  | 'post_engagement'
  | 'mentioned_in_post';

export type EventSource = 'profile' | 'directory' | 'feed' | 'search' | 'post_caption' | 'comment';

interface LogBusinessEventParams {
  businessId: string;
  eventType: BusinessEventType;
  eventSource?: EventSource | string;
  context?: Record<string, unknown>;
}

/**
 * Log a business profile analytics event
 * Only logs events for business profiles
 */
export async function trackBusinessEvent(
  businessId: string,
  eventType: BusinessEventType,
  options?: { path?: string; source?: EventSource | string; context?: Record<string, unknown> }
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

/**
 * Enhanced business event logging with context
 */
export async function logBusinessEvent({
  businessId,
  eventType,
  eventSource,
  context = {},
}: LogBusinessEventParams) {
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
        path: eventSource ?? window.location.pathname,
      });

    if (error) {
      console.warn('[logBusinessEvent] failed', error);
    }
  } catch (err) {
    console.warn('[logBusinessEvent] error', err);
  }
}

/**
 * Log business profile view
 */
export function logBusinessProfileView(businessId: string, actorUserId?: string | null) {
  return logBusinessEvent({
    businessId,
    eventType: 'profile_view',
    eventSource: 'profile',
  });
}

/**
 * Log directory impression
 */
export function logDirectoryImpression(
  businessId: string, 
  context?: { page?: number; position?: number; search?: string; category?: string; location?: string }
) {
  return logBusinessEvent({
    businessId,
    eventType: 'directory_impression',
    eventSource: 'directory',
    context,
  });
}

/**
 * Log website click
 */
export function logWebsiteClick(businessId: string, url?: string) {
  return logBusinessEvent({
    businessId,
    eventType: 'click_website',
    eventSource: 'profile',
    context: { url },
  });
}

/**
 * Log email click
 */
export function logEmailClick(businessId: string, email?: string) {
  return logBusinessEvent({
    businessId,
    eventType: 'click_email',
    eventSource: 'profile',
    context: { email },
  });
}

/**
 * Log phone click
 */
export function logPhoneClick(businessId: string, phone?: string) {
  return logBusinessEvent({
    businessId,
    eventType: 'click_phone',
    eventSource: 'profile',
    context: { phone },
  });
}

/**
 * Log business post view
 */
export function logBusinessPostView(businessId: string, postId: string) {
  return logBusinessEvent({
    businessId,
    eventType: 'post_view',
    eventSource: 'feed',
    context: { post_id: postId },
  });
}

/**
 * Log business post engagement (like, comment, share)
 */
export function logBusinessPostEngagement(
  businessId: string, 
  postId: string, 
  action: 'like' | 'comment' | 'share'
) {
  return logBusinessEvent({
    businessId,
    eventType: 'post_engagement',
    eventSource: 'feed',
    context: { post_id: postId, action },
  });
}

/**
 * Log business mention in post
 */
export function logBusinessMention(businessId: string, postId: string, source: 'post_caption' | 'comment') {
  return logBusinessEvent({
    businessId,
    eventType: 'mentioned_in_post',
    eventSource: source,
    context: { post_id: postId },
  });
}
