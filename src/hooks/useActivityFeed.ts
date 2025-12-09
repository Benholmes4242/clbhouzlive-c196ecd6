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

// DEV-ONLY: Generate mock activity data for preview
function generateMockActivity(): ActivityNotification[] {
  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  const mockItems: Partial<ActivityNotification>[] = [
    // NEW / Unread items
    {
      id: 'mock-1',
      type: 'follow',
      title: 'New follower',
      message: null,
      actor_display_name: 'Rory McIlroy',
      actor_username: 'rorymcilroy',
      actor_avatar_url: null,
      created_at: minutesAgo(3),
      is_read: false,
    },
    {
      id: 'mock-2',
      type: 'mention',
      title: 'Mentioned you',
      message: 'Great round at St Andrews! @you killed it on the back 9',
      actor_display_name: 'Sarah Links',
      actor_username: 'sarahlinks',
      created_at: minutesAgo(18),
      is_read: false,
      entity_type: 'post',
      entity_id: 'post-123',
    },
    {
      id: 'mock-3',
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: 'You unlocked 50 Club – Heritage Club! 🏆',
      actor_display_name: 'clbhouz',
      actor_username: 'clbhouz',
      created_at: minutesAgo(45),
      is_read: false,
    },
    {
      id: 'mock-4',
      type: 'like',
      title: 'Liked your moment',
      message: null,
      actor_display_name: 'Tiger Woods',
      actor_username: 'tigerwoods',
      created_at: hoursAgo(1),
      is_read: false,
      entity_type: 'post',
    },
    // TODAY items
    {
      id: 'mock-5',
      type: 'club_update',
      title: 'Sundridge Park GC',
      message: 'New event: Summer Stableford – Sign up now!',
      actor_display_name: 'Sundridge Park GC',
      actor_username: 'sundridgeparkgc',
      created_at: hoursAgo(3),
      is_read: false,
    },
    {
      id: 'mock-6',
      type: 'message',
      title: 'New message',
      message: 'Hey, fancy a round at Royal County Down next week?',
      actor_display_name: 'James Faldo',
      actor_username: 'jamesfaldo',
      created_at: hoursAgo(5),
      is_read: true,
    },
    {
      id: 'mock-7',
      type: 'comment',
      title: 'Commented on your moment',
      message: 'Incredible view! Which hole was this?',
      actor_display_name: 'Phil Mickelson',
      actor_username: 'philmickelson',
      created_at: hoursAgo(7),
      is_read: true,
      entity_type: 'comment',
    },
    {
      id: 'mock-8',
      type: 'friend_accepted',
      title: 'Friend request accepted',
      message: null,
      actor_display_name: 'Jordan Spieth',
      actor_username: 'jordanspieth',
      created_at: hoursAgo(9),
      is_read: true,
    },
    // THIS WEEK items
    {
      id: 'mock-9',
      type: 'course_update',
      title: 'Royal County Down',
      message: 'Course condition update: Links in pristine shape for the weekend',
      actor_display_name: 'Royal County Down',
      actor_username: 'royalcountydown',
      created_at: daysAgo(1),
      is_read: true,
    },
    {
      id: 'mock-10',
      type: 'tag',
      title: 'Tagged you in a moment',
      message: null,
      actor_display_name: 'Brooks Koepka',
      actor_username: 'bkoepka',
      created_at: daysAgo(2),
      is_read: true,
      entity_type: 'post',
    },
    {
      id: 'mock-11',
      type: 'follow',
      title: 'New follower',
      message: null,
      actor_display_name: 'Scottie Scheffler',
      actor_username: 'scottiescheffler',
      created_at: daysAgo(2),
      is_read: true,
    },
    {
      id: 'mock-12',
      type: 'like',
      title: 'Liked your moment',
      message: null,
      actor_display_name: 'Dustin Johnson',
      actor_username: 'djohnson',
      created_at: daysAgo(3),
      is_read: true,
      entity_type: 'post',
    },
    {
      id: 'mock-13',
      type: 'achievement',
      title: 'Achievement Unlocked',
      message: 'You completed GB&I Top 100! 🎉',
      actor_display_name: 'clbhouz',
      actor_username: 'clbhouz',
      created_at: daysAgo(4),
      is_read: true,
    },
    // EARLIER items
    {
      id: 'mock-14',
      type: 'event',
      title: 'Upcoming Event',
      message: 'Monthly Medal at Sunningdale – register by Friday',
      actor_display_name: 'Sunningdale Golf Club',
      actor_username: 'sunningdalegc',
      created_at: daysAgo(8),
      is_read: true,
    },
    {
      id: 'mock-15',
      type: 'message',
      title: 'New message',
      message: 'Thanks for the game! Let\'s do it again soon.',
      actor_display_name: 'Collin Morikawa',
      actor_username: 'collinmorikawa',
      created_at: daysAgo(10),
      is_read: true,
    },
    {
      id: 'mock-16',
      type: 'follow',
      title: 'New follower',
      message: null,
      actor_display_name: 'Xander Schauffele',
      actor_username: 'xander',
      created_at: daysAgo(12),
      is_read: true,
    },
    {
      id: 'mock-17',
      type: 'club_update',
      title: 'Wentworth Club',
      message: 'Course maintenance complete – all 3 courses now open',
      actor_display_name: 'Wentworth Club',
      actor_username: 'wentworthclub',
      created_at: daysAgo(14),
      is_read: true,
    },
  ];

  // Enrich with computed fields
  return mockItems.map(item => ({
    id: item.id!,
    created_at: item.created_at!,
    is_read: item.is_read!,
    type: item.type!,
    title: item.title!,
    message: item.message || null,
    actor_id: null,
    entity_type: item.entity_type || null,
    entity_id: item.entity_id || null,
    data: null,
    actor_display_name: item.actor_display_name,
    actor_username: item.actor_username,
    actor_avatar_url: item.actor_avatar_url || null,
    category: TYPE_TO_CATEGORY[item.type!] || 'system',
    context_url: getContextUrl(item),
    context_label: getContextLabel(item),
    time_ago: getTimeAgo(item.created_at!),
  }));
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
      let enrichedNotifications: ActivityNotification[] = [];

      if (user?.id) {
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
        enrichedNotifications = (notifications || []).map(n => {
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
      }

      // DEV / PREVIEW MOCK DATA - inject when no real data exists
      if (import.meta.env.DEV && enrichedNotifications.length === 0) {
        enrichedNotifications = generateMockActivity();
      }

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
