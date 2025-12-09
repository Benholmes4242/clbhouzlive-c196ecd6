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

// Expanded activity types
export type ActivityType = 
  // Social / person-to-person
  | 'follow'
  | 'friend_request'
  | 'friend_accepted'
  | 'mention'
  | 'tag'
  | 'like'
  | 'like_post'
  | 'comment'
  | 'comment_post'
  | 'mention_post'
  // Messages
  | 'message'
  | 'message_received'
  | 'dm'
  // Clubs & Courses
  | 'club_invite'
  | 'club_follow'
  | 'club_event'
  | 'club_announcement'
  | 'club_update'
  | 'course_review'
  | 'course_like'
  | 'course_follow'
  | 'course_update'
  | 'event'
  // Achievements
  | 'achievement'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'new_post'
  // System
  | 'system'
  | 'app_update'
  | 'tip';

// Actor types for normalized model
export type ActorType = 'user' | 'club' | 'course' | 'system';

// Target types
export type TargetType = 'post' | 'comment' | 'message' | 'profile' | 'club' | 'course' | 'achievement';

export interface ActivityNotification {
  id: string;
  created_at: string;
  is_read: boolean;
  type: ActivityType | string;
  title: string;
  message: string | null;
  
  // Actor info (who triggered the event)
  actor_id: string | null;
  actor_type: ActorType;
  actor_display_name: string;
  actor_username: string;
  actor_avatar_url: string | null;
  
  // Target info (what the event is about)
  entity_type: string | null;
  entity_id: string | null;
  target_type: TargetType | null;
  data: any;
  
  // Derived flags for filtering
  is_unread: boolean;
  is_mention: boolean;
  is_from_following: boolean;
  is_club_or_course: boolean;
  is_message: boolean;
  is_mock: boolean;
  
  // Computed display fields
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

export type ChipFilterKind = 'new' | 'mentions' | 'follows' | 'clubs' | 'messages' | null;

// Types that count as mentions
const MENTION_TYPES = new Set(['mention', 'mention_post', 'tag', 'comment_mention']);

// Types that count as follows
const FOLLOW_TYPES = new Set(['follow', 'friend_request', 'friend_accepted']);

// Types that count as messages
const MESSAGE_TYPES = new Set(['message', 'message_received', 'dm']);

// Types that are club/course related
const CLUB_COURSE_TYPES = new Set([
  'club_invite', 'club_follow', 'club_event', 'club_announcement', 'club_update',
  'course_review', 'course_like', 'course_follow', 'course_update', 'event'
]);

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
  const { type, entity_type, entity_id, data, actor_id } = notification;
  
  if (entity_type === 'post' && entity_id) {
    return `/post/${entity_id}`;
  }
  if (entity_type === 'comment' && data?.post_id) {
    return `/post/${data.post_id}`;
  }
  if (FOLLOW_TYPES.has(type)) {
    return actor_id ? `/profile/${actor_id}` : '/';
  }
  if (MESSAGE_TYPES.has(type)) {
    return '/messages';
  }
  if (entity_type === 'course' && entity_id) {
    return `/courses/${entity_id}`;
  }
  if (entity_type === 'club' && entity_id) {
    return `/clubs/${entity_id}`;
  }
  
  return '/';
}

function getContextLabel(notification: any): string {
  const { type, entity_type } = notification;
  
  if (entity_type === 'post') return 'Post';
  if (entity_type === 'comment') return 'Comment';
  if (entity_type === 'course') return 'Course';
  if (entity_type === 'club') return 'Club';
  if (MESSAGE_TYPES.has(type)) return 'Message';
  if (type === 'follow') return 'Profile';
  if (FOLLOW_TYPES.has(type)) return 'Friends';
  if (CLUB_COURSE_TYPES.has(type)) return 'Course';
  if (type === 'system' || type === 'app_update') return 'Update';
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') return 'Achievement';
  
  return 'Activity';
}

function deriveActorType(notification: any): ActorType {
  const { type, data } = notification;
  
  // System notifications
  if (type === 'system' || type === 'app_update' || type === 'tip') {
    return 'system';
  }
  
  // Club/course as actor
  if (type === 'club_announcement' || type === 'club_update' || type === 'club_event') {
    return 'club';
  }
  if (type === 'course_update') {
    return 'course';
  }
  
  // Check data for actor type override
  if (data?.actor_type) {
    return data.actor_type as ActorType;
  }
  
  return 'user';
}

function deriveTargetType(notification: any): TargetType | null {
  const { entity_type, type } = notification;
  
  if (entity_type === 'post') return 'post';
  if (entity_type === 'comment') return 'comment';
  if (entity_type === 'course') return 'course';
  if (entity_type === 'club') return 'club';
  if (MESSAGE_TYPES.has(type)) return 'message';
  if (FOLLOW_TYPES.has(type)) return 'profile';
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') return 'achievement';
  
  return null;
}

function groupNotificationsByDateBucket(items: ActivityNotification[]): Omit<ActivityBuckets, 'new'> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

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
    new: items.filter(i => i.is_unread).length,
    mentions: items.filter(i => i.is_mention).length,
    follows: items.filter(i => FOLLOW_TYPES.has(i.type)).length,
    clubs: items.filter(i => i.is_club_or_course).length,
    messages: items.filter(i => i.is_message).length,
  };
}

// Apply chip filter to items (only used on All tab)
export function applyChipFilter(items: ActivityNotification[], filter: ChipFilterKind): ActivityNotification[] {
  if (!filter) return items;
  
  switch (filter) {
    case 'new':
      return items.filter(i => i.is_unread);
    case 'mentions':
      return items.filter(i => i.is_mention);
    case 'follows':
      return items.filter(i => FOLLOW_TYPES.has(i.type));
    case 'clubs':
      return items.filter(i => i.is_club_or_course);
    case 'messages':
      return items.filter(i => i.is_message);
    default:
      return items;
  }
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
async function generateMockActivityWithRealUsers(currentUserId: string, followingUserIds: Set<string>): Promise<ActivityNotification[]> {
  const realUsers = await fetchRealUsersForMocks(currentUserId);
  
  if (realUsers.length === 0) {
    console.warn('[generateMockActivityWithRealUsers] No real users found for mocks');
    return [];
  }

  const now = Date.now();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  const getUser = (index: number) => realUsers[index % realUsers.length];

  const mockTemplates: Array<{
    type: ActivityType;
    message: string | null;
    created_at: string;
    is_read: boolean;
    entity_type?: string;
    entity_id?: string;
    userIndex: number;
  }> = [
    // NEW / Unread items
    { type: 'follow', message: null, created_at: minutesAgo(3), is_read: false, userIndex: 0 },
    { type: 'mention', message: 'Great round! You crushed it on the back 9 🔥', created_at: minutesAgo(18), is_read: false, entity_type: 'post', entity_id: 'mock-post-1', userIndex: 1 },
    { type: 'like', message: null, created_at: hoursAgo(1), is_read: false, entity_type: 'post', userIndex: 2 },
    { type: 'comment', message: 'Incredible shot! Which club did you use?', created_at: hoursAgo(2), is_read: false, entity_type: 'comment', userIndex: 3 },
    
    // TODAY items
    { type: 'friend_request', message: null, created_at: hoursAgo(4), is_read: false, userIndex: 4 },
    { type: 'follow', message: null, created_at: hoursAgo(6), is_read: true, userIndex: 5 },
    { type: 'like', message: null, created_at: hoursAgo(8), is_read: true, entity_type: 'post', userIndex: 6 },
    { type: 'friend_accepted', message: null, created_at: hoursAgo(10), is_read: true, userIndex: 7 },
    
    // THIS WEEK items
    { type: 'tag', message: null, created_at: daysAgo(1), is_read: true, entity_type: 'post', userIndex: 8 },
    { type: 'mention', message: 'Playing with @you next week – can\'t wait!', created_at: daysAgo(2), is_read: true, entity_type: 'post', userIndex: 9 },
    { type: 'follow', message: null, created_at: daysAgo(2), is_read: true, userIndex: 10 },
    { type: 'like', message: null, created_at: daysAgo(3), is_read: true, entity_type: 'post', userIndex: 11 },
    { type: 'comment', message: 'That\'s a beautiful course! Adding to my bucket list', created_at: daysAgo(4), is_read: true, entity_type: 'comment', userIndex: 12 },
    
    // EARLIER items
    { type: 'follow', message: null, created_at: daysAgo(8), is_read: true, userIndex: 13 },
    { type: 'like', message: null, created_at: daysAgo(10), is_read: true, entity_type: 'post', userIndex: 14 },
    { type: 'friend_accepted', message: null, created_at: daysAgo(12), is_read: true, userIndex: 15 },
    { type: 'mention', message: 'Best playing partner I\'ve had all year!', created_at: daysAgo(14), is_read: true, entity_type: 'post', userIndex: 16 },
  ];

  return mockTemplates.map((template, index) => {
    const user = getUser(template.userIndex);
    // Prefer display_name, fallback to username, never "Someone" for mocks with real users
    const displayName = user.display_name || user.username || 'Golfer';
    const isFromFollowing = followingUserIds.has(user.id);
    
    const notification: ActivityNotification = {
      id: `mock-${index + 1}`,
      created_at: template.created_at,
      is_read: template.is_read,
      type: template.type,
      title: '', // Not used anymore
      message: template.message,
      
      actor_id: user.id,
      actor_type: 'user',
      actor_display_name: displayName,
      actor_username: user.username || '',
      actor_avatar_url: user.profile_photo_url || null,
      
      entity_type: template.entity_type || null,
      entity_id: template.entity_id || null,
      target_type: deriveTargetType(template),
      data: null,
      
      // Derived flags
      is_unread: !template.is_read,
      is_mention: MENTION_TYPES.has(template.type),
      is_from_following: isFromFollowing,
      is_club_or_course: CLUB_COURSE_TYPES.has(template.type),
      is_message: MESSAGE_TYPES.has(template.type),
      is_mock: true,
      
      context_url: getContextUrl({ ...template, actor_id: user.id }),
      context_label: getContextLabel(template),
      time_ago: getTimeAgo(template.created_at),
    };
    
    return notification;
  });
}

// Fetch user's following list for is_from_following derivation
async function fetchFollowingUserIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId);
  
  if (error || !data) {
    console.warn('[fetchFollowingUserIds] error', error);
    return new Set();
  }
  
  return new Set(data.map(f => f.following_id));
}

export interface ActivityFeedResult {
  buckets: ActivityBuckets;
  counts: ActivityCounts;
  allItems: ActivityNotification[];
}

export const useActivityFeed = (tab: ActivityTabId, chipFilter: ChipFilterKind = null) => {
  const { user } = useSupabaseSession();

  return useQuery({
    queryKey: ['activity-feed', tab, chipFilter, user?.id],
    queryFn: async (): Promise<ActivityFeedResult> => {
      let enrichedNotifications: ActivityNotification[] = [];
      let followingUserIds = new Set<string>();

      if (user?.id) {
        // Fetch following list for is_from_following derivation
        followingUserIds = await fetchFollowingUserIds(user.id);

        // Fetch notifications
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

        // Fetch actor profiles
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

        // Transform notifications to normalized model
        enrichedNotifications = (notifications || []).map(n => {
          const actor = n.actor_id ? actorProfiles[n.actor_id] : null;
          const actorType = deriveActorType(n);
          const isFromFollowing = n.actor_id ? followingUserIds.has(n.actor_id) : false;
          
          // Prefer display_name, fallback to username, then "Someone"
          const actorDisplayName = actor?.display_name || actor?.username || 'Someone';
          
          const notification: ActivityNotification = {
            id: n.id,
            created_at: n.created_at,
            is_read: n.is_read,
            type: n.type,
            title: n.title,
            message: n.message,
            
            actor_id: n.actor_id,
            actor_type: actorType,
            actor_display_name: actorDisplayName,
            actor_username: actor?.username || '',
            actor_avatar_url: actor?.profile_photo_url || null,
            
            entity_type: n.entity_type,
            entity_id: n.entity_id,
            target_type: deriveTargetType(n),
            data: n.data,
            
            // Derived flags
            is_unread: !n.is_read,
            is_mention: MENTION_TYPES.has(n.type),
            is_from_following: isFromFollowing,
            is_club_or_course: CLUB_COURSE_TYPES.has(n.type) || 
              n.entity_type === 'course' || n.entity_type === 'club' ||
              actorType === 'club' || actorType === 'course',
            is_message: MESSAGE_TYPES.has(n.type),
            is_mock: false,
            
            context_url: getContextUrl(n),
            context_label: getContextLabel(n),
            time_ago: getTimeAgo(n.created_at),
          };
          
          return notification;
        });
      }

      // DEV FLAG: Append mock data when flag is true
      if (SHOW_MOCK_ACTIVITY && user?.id) {
        const mockItems = await generateMockActivityWithRealUsers(user.id, followingUserIds);
        console.log('[useActivityFeed] SHOW_MOCK_ACTIVITY=true, appending', mockItems.length, 'mock items');
        enrichedNotifications = [...enrichedNotifications, ...mockItems];
      }

      // Calculate counts from ALL items (before any filtering)
      const counts = computeCounts(enrichedNotifications);

      // Filter by tab
      let filtered: ActivityNotification[];
      switch (tab) {
        case 'following':
          // Only items from users we follow
          filtered = enrichedNotifications.filter(n => n.is_from_following && n.actor_type === 'user');
          break;
        case 'clubs':
          // Only club/course related items
          filtered = enrichedNotifications.filter(n => n.is_club_or_course);
          break;
        case 'messages':
          // Only message items
          filtered = enrichedNotifications.filter(n => n.is_message);
          break;
        case 'all':
        default:
          // All items, but apply chip filter if set
          filtered = chipFilter ? applyChipFilter(enrichedNotifications, chipFilter) : enrichedNotifications;
          break;
      }

      // Group into date buckets
      const dateBuckets = groupNotificationsByDateBucket(filtered);
      
      // Add "new" bucket (unread items)
      const newItems = filtered.filter(i => i.is_unread);

      const result: ActivityFeedResult = {
        buckets: {
          new: newItems,
          ...dateBuckets,
        },
        counts,
        allItems: filtered,
      };

      return result;
    },
    staleTime: 30 * 1000,
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
