import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { startOfDay, subDays, startOfWeek } from 'date-fns';

// ⚡ DEV FLAG: Mock notifications for testing (auto-disabled in production)
const isProd = typeof window !== 'undefined' && 
  (import.meta.env.MODE === 'production' || window.location.hostname === 'clbhouz.com');
const SHOW_MOCK_ACTIVITY = !isProd && true; // flip inner `true` to `false` to disable mocks

export type ActivityTabId = 'all' | 'following' | 'clubs' | 'messages' | 'system';

export const ACTIVITY_TABS: { id: ActivityTabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'following', label: 'Following' },
  { id: 'clubs', label: 'Clubs & Courses' },
  { id: 'messages', label: 'Messages' },
];

// Map notification types to categories (removed "you" tab - everything goes to "all")
const TYPE_TO_CATEGORY: Record<string, ActivityTabId> = {
  // Interactions on your content - now part of "all"
  like: 'all',
  comment: 'all',
  mention: 'all',
  tag: 'all',
  follow: 'all',
  friend_request: 'all',
  friend_accepted: 'all',
  
  // "Following" category - activity from people you follow
  new_post: 'following',
  achievement: 'following',
  
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

// DEV-ONLY: Fetch real users for mock notifications
async function fetchRealUsersForMocks(currentUserId: string): Promise<Array<{
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
}>> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .neq('id', currentUserId)
    .not('display_name', 'is', null)
    .limit(20);
  
  if (error) {
    console.warn('[fetchRealUsersForMocks] error', error);
    return [];
  }
  
  return data || [];
}

// DEV-ONLY: Generate mock activity data using real users from DB
async function generateMockActivityWithRealUsers(currentUserId: string): Promise<ActivityNotification[]> {
  const realUsers = await fetchRealUsersForMocks(currentUserId);
  
  // If no real users, fall back to empty (or could use hardcoded names)
  if (realUsers.length === 0) {
    console.warn('[generateMockActivityWithRealUsers] No real users found for mocks');
    return [];
  }

  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  // Helper to get a user by index (wraps around if needed)
  const getUser = (index: number) => realUsers[index % realUsers.length];

  // Mock notification templates using real users
  const mockTemplates: Array<{
    type: ActivityType;
    title: string;
    message: string | null;
    created_at: string;
    is_read: boolean;
    entity_type?: string;
    entity_id?: string;
    userIndex: number;
  }> = [
    // NEW / Unread items
    { type: 'follow', title: 'started following you', message: null, created_at: minutesAgo(3), is_read: false, userIndex: 0 },
    { type: 'mention', title: 'mentioned you', message: 'Great round! You crushed it on the back 9 🔥', created_at: minutesAgo(18), is_read: false, entity_type: 'post', entity_id: 'mock-post-1', userIndex: 1 },
    { type: 'like', title: 'liked your moment', message: null, created_at: hoursAgo(1), is_read: false, entity_type: 'post', userIndex: 2 },
    { type: 'comment', title: 'commented on your moment', message: 'Incredible shot! Which club did you use?', created_at: hoursAgo(2), is_read: false, entity_type: 'comment', userIndex: 3 },
    
    // TODAY items
    { type: 'friend_request', title: 'sent you a friend request', message: null, created_at: hoursAgo(4), is_read: false, userIndex: 4 },
    { type: 'follow', title: 'started following you', message: null, created_at: hoursAgo(6), is_read: true, userIndex: 5 },
    { type: 'like', title: 'liked your moment', message: null, created_at: hoursAgo(8), is_read: true, entity_type: 'post', userIndex: 6 },
    { type: 'friend_accepted', title: 'accepted your friend request', message: null, created_at: hoursAgo(10), is_read: true, userIndex: 7 },
    
    // THIS WEEK items
    { type: 'tag', title: 'tagged you in a moment', message: null, created_at: daysAgo(1), is_read: true, entity_type: 'post', userIndex: 8 },
    { type: 'mention', title: 'mentioned you', message: 'Playing with @you next week – can\'t wait!', created_at: daysAgo(2), is_read: true, entity_type: 'post', userIndex: 9 },
    { type: 'follow', title: 'started following you', message: null, created_at: daysAgo(2), is_read: true, userIndex: 10 },
    { type: 'like', title: 'liked your moment', message: null, created_at: daysAgo(3), is_read: true, entity_type: 'post', userIndex: 11 },
    { type: 'comment', title: 'commented on your moment', message: 'That\'s a beautiful course! Adding to my bucket list', created_at: daysAgo(4), is_read: true, entity_type: 'comment', userIndex: 12 },
    
    // EARLIER items
    { type: 'follow', title: 'started following you', message: null, created_at: daysAgo(8), is_read: true, userIndex: 13 },
    { type: 'like', title: 'liked your moment', message: null, created_at: daysAgo(10), is_read: true, entity_type: 'post', userIndex: 14 },
    { type: 'friend_accepted', title: 'accepted your friend request', message: null, created_at: daysAgo(12), is_read: true, userIndex: 15 },
    { type: 'mention', title: 'mentioned you', message: 'Best playing partner I\'ve had all year!', created_at: daysAgo(14), is_read: true, entity_type: 'post', userIndex: 16 },
  ];

  // Build mock notifications with real user data
  return mockTemplates.map((template, index) => {
    const user = getUser(template.userIndex);
    const displayName = user.display_name || user.username || 'Someone';
    
    return {
      id: `mock-${index + 1}`,
      created_at: template.created_at,
      is_read: template.is_read,
      type: template.type,
      title: template.title,
      message: template.message,
      actor_id: user.id,
      entity_type: template.entity_type || null,
      entity_id: template.entity_id || null,
      data: null,
      actor_display_name: displayName,
      actor_username: user.username || '',
      actor_avatar_url: user.profile_photo_url || null,
      
      category: TYPE_TO_CATEGORY[template.type] || 'system',
      context_url: getContextUrl({ ...template, actor_id: user.id }),
      context_label: getContextLabel(template),
      time_ago: getTimeAgo(template.created_at),
    };
  });
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

      // DEV FLAG: Always append mock data when flag is true (for testing)
      if (SHOW_MOCK_ACTIVITY && user?.id) {
        const mockItems = await generateMockActivityWithRealUsers(user.id);
        console.log('[useActivityFeed] SHOW_MOCK_ACTIVITY=true, appending', mockItems.length, 'mock items with real users');
        enrichedNotifications = [...enrichedNotifications, ...mockItems];
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

      const result: ActivityFeedResult = {
        buckets: {
          new: newItems,
          ...dateBuckets,
        },
        counts,
        allItems: filtered,
      };

      console.log('[useActivityFeed] Returning result:', {
        bucketsNew: result.buckets.new.length,
        bucketsToday: result.buckets.today.length,
        bucketsYesterday: result.buckets.yesterday.length,
        bucketsThisWeek: result.buckets.thisWeek.length,
        bucketsEarlier: result.buckets.earlier.length,
        countsNew: result.counts.new,
        allItemsCount: result.allItems.length,
      });

      return result;
    },
    staleTime: 30 * 1000, // 30 seconds
    // Always run the query - even without user, we return mock data
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
