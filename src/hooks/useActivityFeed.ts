import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { startOfDay, subDays, startOfWeek } from 'date-fns';

export type ActivityTabId = 'all' | 'you' | 'following' | 'clubs' | 'messages' | 'system';

export const ACTIVITY_TABS: { id: ActivityTabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'you', label: 'You' },
  { id: 'following', label: 'Following' },
  { id: 'clubs', label: 'Clubs & Courses' },
  { id: 'messages', label: 'Messages' },
];

// Map notification types to categories
const TYPE_TO_CATEGORY: Record<string, ActivityTabId> = {
  // "You" category - interactions on your content
  like: 'you',
  comment: 'you',
  mention: 'you',
  tag: 'you',
  
  // "Following" category - activity from people you follow
  new_post: 'following',
  achievement: 'following',
  follow: 'you', // someone followed you
  friend_request: 'you',
  friend_accepted: 'you',
  
  // "Clubs & Courses" category
  club_update: 'clubs',
  course_update: 'clubs',
  event: 'clubs',
  
  // "Messages" category
  message: 'messages',
  dm: 'messages',
  
  // "System" category
  system: 'system',
  app_update: 'system',
  tip: 'system',
};

export type ActivityType = 
  | 'follow'
  | 'friend_request'
  | 'friend_accepted'
  | 'mention'
  | 'tag'
  | 'like'
  | 'comment'
  | 'club_update'
  | 'course_update'
  | 'achievement'
  | 'message'
  | 'dm'
  | 'new_post'
  | 'system'
  | 'app_update'
  | 'event'
  | 'tip';

export interface ActivityNotification {
  id: string;
  created_at: string;
  is_read: boolean;
  type: ActivityType | string;
  title: string;
  message: string | null;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  data: any;
  // Joined actor data
  actor_display_name?: string;
  actor_username?: string;
  actor_avatar_url?: string | null;
  // Computed fields
  category: ActivityTabId;
  context_url: string;
  context_label: string;
  time_ago: string;
}

export interface ActivityBuckets {
  new: ActivityNotification[];
  today: ActivityNotification[];
  yesterday: ActivityNotification[];
  thisWeek: ActivityNotification[];
  earlier: ActivityNotification[];
}

export interface ActivityCounts {
  new: number;
  mentions: number;
  follows: number;
  clubs: number;
  messages: number;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getContextUrl(notification: any): string {
  const { type, entity_type, entity_id, data } = notification;
  
  // Try to build URL based on entity type
  if (entity_type === 'post' && entity_id) {
    return `/post/${entity_id}`;
  }
  if (entity_type === 'comment' && data?.post_id) {
    return `/post/${data.post_id}`;
  }
  if (type === 'follow' || type === 'friend_request' || type === 'friend_accepted') {
    return notification.actor_id ? `/profile/${notification.actor_id}` : '/';
  }
  if (type === 'message' || type === 'dm') {
    return '/messages';
  }
  
  // Fallback
  return '/';
}

function getContextLabel(notification: any): string {
  const { type, entity_type } = notification;
  
  if (entity_type === 'post') return 'Moment';
  if (entity_type === 'comment') return 'Comment';
  if (type === 'message' || type === 'dm') return 'Message';
  if (type === 'follow') return 'Profile';
  if (type === 'friend_request' || type === 'friend_accepted') return 'Friends';
  if (type === 'club_update' || type === 'course_update') return 'Course';
  if (type === 'system' || type === 'app_update') return 'Update';
  
  return 'Activity';
}

function groupNotificationsByDateBucket(items: ActivityNotification[]): Omit<ActivityBuckets, 'new'> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday

  const buckets: Omit<ActivityBuckets, 'new'> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const n of items) {
    const created = new Date(n.created_at);

    if (created >= todayStart) buckets.today.push(n);
    else if (created >= yesterdayStart) buckets.yesterday.push(n);
    else if (created >= weekStart) buckets.thisWeek.push(n);
    else buckets.earlier.push(n);
  }

  return buckets;
}

function computeCounts(items: ActivityNotification[]): ActivityCounts {
  return {
    new: items.filter(i => !i.is_read).length,
    mentions: items.filter(i => i.type === 'mention' || i.type === 'tag').length,
    follows: items.filter(i => i.type === 'follow' || i.type === 'friend_request' || i.type === 'friend_accepted').length,
    clubs: items.filter(i => i.type === 'club_update' || i.type === 'course_update' || i.type === 'event').length,
    messages: items.filter(i => i.type === 'message' || i.type === 'dm').length,
  };
}

export interface ActivityFeedResult {
  buckets: ActivityBuckets;
  counts: ActivityCounts;
  allItems: ActivityNotification[];
}

export const useActivityFeed = (tab: ActivityTabId) => {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['activity-feed', tab, user?.id],
    queryFn: async (): Promise<ActivityFeedResult> => {
      if (!user?.id) {
        return { 
          buckets: { new: [], today: [], yesterday: [], thisWeek: [], earlier: [] },
          counts: { new: 0, mentions: 0, follows: 0, clubs: 0, messages: 0 },
          allItems: []
        };
      }

      // Fetch notifications with actor profile data
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          id,
          created_at,
          is_read,
          type,
          title,
          message,
          actor_id,
          entity_type,
          entity_id,
          data
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[useActivityFeed] error', error);
        throw error;
      }

      // Fetch actor profiles for all notifications with actor_id
      const actorIds = [...new Set(notifications?.filter(n => n.actor_id).map(n => n.actor_id) || [])];
      
      let actorProfiles: Record<string, any> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', actorIds);
        
        if (profiles) {
          actorProfiles = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Transform notifications
      const enrichedNotifications: ActivityNotification[] = (notifications || []).map(n => {
        const actor = n.actor_id ? actorProfiles[n.actor_id] : null;
        const category = TYPE_TO_CATEGORY[n.type] || 'system';
        
        return {
          ...n,
          actor_display_name: actor?.display_name || 'Someone',
          actor_username: actor?.username || '',
          actor_avatar_url: actor?.profile_photo_url || null,
          category,
          context_url: getContextUrl(n),
          context_label: getContextLabel(n),
          time_ago: getTimeAgo(n.created_at),
        };
      });

      // Calculate counts from ALL items (before filtering by tab)
      const counts = computeCounts(enrichedNotifications);

      // Filter by tab
      const filtered = tab === 'all' 
        ? enrichedNotifications 
        : enrichedNotifications.filter(n => n.category === tab);

      // Group into date buckets
      const dateBuckets = groupNotificationsByDateBucket(filtered);
      
      // Add "new" bucket (unread items)
      const newItems = filtered.filter(i => !i.is_read);

      return {
        buckets: {
          new: newItems,
          ...dateBuckets,
        },
        counts,
        allItems: filtered,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to get unread count for header badges
export const useUnreadActivityCount = () => {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['activity-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('[useUnreadActivityCount] error', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
};
