import { supabase } from '@/integrations/supabase/client';
import { AppLog } from '@/lib/logger';

export type BusinessEventType = 
  | 'profile_visit'
  | 'action'
  | 'content_impression'
  | 'content_engagement'
  | 'review_submitted'
  | 'follow';

export type ActionType = 'call' | 'website' | 'directions' | 'message';
export type SourceType = 'search' | 'content' | 'course_page' | 'share' | 'direct';

interface TrackEventParams {
  businessId: string;
  userId?: string | null;
  eventType: BusinessEventType;
  actionType?: ActionType;
  source?: SourceType;
  contentId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track a business analytics event
 */
export async function trackBusinessAnalyticsEvent(params: TrackEventParams): Promise<void> {
  try {
    // Cast to any to bypass type checking until types are regenerated
    const { error } = await supabase
      .from('business_analytics_events')
      .insert({
        business_id: params.businessId,
        user_id: params.userId || null,
        event_type: params.eventType,
        action_type: params.actionType || null,
        source: params.source || null,
        content_id: params.contentId || null,
        metadata: params.metadata || {},
      });

    if (error) {
      AppLog.error('[Analytics]', 'Failed to track event:', error);
    }
  } catch (err) {
    AppLog.error('[Analytics]', 'Error tracking event:', err);
  }
}

/**
 * Track a profile visit
 */
export function trackBusinessProfileVisit(
  businessId: string, 
  userId?: string | null, 
  source?: SourceType,
  metadata?: Record<string, unknown>
) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'profile_visit',
    source: source || 'direct',
    metadata,
  });
}

/**
 * Track a business action (call, website, directions, message)
 */
export function trackBusinessAction(
  businessId: string,
  actionType: ActionType,
  userId?: string | null
) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'action',
    actionType,
  });
}

/**
 * Track content impression
 */
export function trackContentImpression(
  businessId: string,
  contentId: string,
  userId?: string | null
) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'content_impression',
    contentId,
  });
}

/**
 * Track content engagement (like, comment, save)
 */
export function trackContentEngagement(
  businessId: string,
  contentId: string,
  userId?: string | null,
  engagementType?: string
) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'content_engagement',
    contentId,
    metadata: { engagement_type: engagementType },
  });
}

/**
 * Track new follower
 */
export function trackBusinessFollow(businessId: string, userId: string) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'follow',
  });
}

/**
 * Track review submission
 */
export function trackReviewSubmitted(businessId: string, userId: string) {
  return trackBusinessAnalyticsEvent({
    businessId,
    userId,
    eventType: 'review_submitted',
  });
}
