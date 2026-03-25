import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useActiveActor } from '@/context/ActiveActorContext';
import { startOfDay, subDays, startOfWeek } from 'date-fns';

// ⚡ DEV FLAG: Mock notifications for testing (auto-disabled in production)
const isProd = typeof window !== 'undefined' &&
  (import.meta.env.MODE === 'production' || window.location.hostname === 'clbhouz.com');
const SHOW_MOCK_ACTIVITY = !isProd && false; // Set second operand to true to enable in dev only

// Content existence check for deleted content navigation guard
export async function checkContentExists(type: string, id: string): Promise<boolean> {
  const tables = {
    post: 'posts',
    comment: 'post_comments',
    course_rating: 'course_ratings',
    course: 'golf_courses',
    club: 'golf_clubs',
  } as const;

  type TableKey = keyof typeof tables;
  
  if (!(type in tables)) return true;
  
  const table = tables[type as TableKey];

  try {
    const { data, error } = await supabase
      .from(table as any)
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error) return true;
    return !!data;
  } catch {
    return true;
  }
}

export type ActivityTabId = 'all' | 'friends';

export const ACTIVITY_TABS: { id: ActivityTabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'friends', label: 'Friends' },
];

// Expanded activity types
export type ActivityType = 
  // Social / person-to-person
  | 'follow'
  | 'friend_request'
  | 'friend_request_sent'
  | 'friend_accept'
  | 'friend_accepted'
  | 'friend_declined'
  | 'friend_cancelled'
  | 'mention'
  | 'tag'
  | 'like'
  | 'like_post'
  | 'comment'
  | 'comment_post'
  | 'mention_post'
  // Clubs & Courses
  | 'club_invite'
  | 'club_follow'
  | 'club_event'
  | 'club_announcement'
  | 'club_update'
  | 'course_review'
  | 'friend_course_review'
  | 'course_like'
  | 'course_follow'
  | 'course_update'
  | 'event'
  // Games & Trips
  | 'game_request'
  | 'game_request_accepted'
  | 'game_request_declined'
  | 'game_cancelled'
  | 'rsvp_update'
  | 'game_reminder_24h'
  | 'game_reminder_2h'
  | 'game_updated'
  | 'game_completed'
  | 'trip_request'
  | 'trip_request_accepted'
  | 'trip_request_declined'
  | 'trip_invite'
  | 'trip_cancelled'
  | 'trip_created'
  | 'trip_game_added'
  | 'trip_reminder'
  // Achievements
  | 'achievement'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'new_post'
  // System
  | 'system'
  | 'app_update'
  | 'tip'
  // Admin
  | 'admin_invite';

// Actor types for normalized model
export type ActorType = 'user' | 'club' | 'course' | 'system';

// Target types
export type TargetType = 'post' | 'comment' | 'profile' | 'club' | 'course' | 'achievement';

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
  is_from_friend: boolean;
  is_club_or_course: boolean;
  is_message: boolean;
  is_review: boolean;
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
  friends: number;
  messages: number;
}

export type ChipFilterKind = 'new' | 'mentions' | 'friends' | 'messages' | null;

// Types that count as mentions
const MENTION_TYPES = new Set(['mention', 'mention_post', 'tag', 'comment_mention']);

// Types that count as follows
const FOLLOW_TYPES = new Set(['follow', 'friend_request', 'friend_request_sent', 'friend_accept', 'friend_accepted', 'friend_declined', 'friend_cancelled']);

// Types that are club/course related
const CLUB_COURSE_TYPES = new Set([
  'club_invite', 'club_follow', 'club_event', 'club_announcement', 'club_update',
  'course_review', 'course_like', 'course_follow', 'course_update', 'event'
]);

// Types that are game/trip related
const GAME_TRIP_TYPES = new Set([
  'game_request', 'game_request_accepted', 'game_request_declined',
  'game_cancelled', 'rsvp_update', 'game_reminder_24h', 'game_reminder_2h',
  'game_updated', 'game_completed', 
  'trip_request', 'trip_request_accepted', 'trip_request_declined',
  'trip_invite', 'trip_cancelled', 'trip_created', 'trip_game_added', 'trip_reminder'
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
  
  // Game notifications route to /game/:id
  if (GAME_TRIP_TYPES.has(type) && data?.game_id) {
    return `/game/${data.game_id}`;
  }
  // Trip notifications route to /hub/trip/:id
  if (type.startsWith('trip_') && data?.trip_id) {
    return `/hub?trip=${data.trip_id}`;
  }
  
  if (entity_type === 'post' && entity_id) {
    return `/post/${entity_id}`;
  }
  if (entity_type === 'comment' && data?.post_id) {
    return `/post/${data.post_id}`;
  }
  // Follow notifications
  if (FOLLOW_TYPES.has(type)) {
    return actor_id ? `/profile/${actor_id}` : '/';
  }
  // Friend/business course review
  if ((type === 'friend_course_review' || type === 'course_review' || type === 'business_course_review') && data?.course_id) {
    const reviewId = data?.review_id || entity_id;
    return `/courses/${data.course_id}?tab=reviews&review=${reviewId}`;
  }
  // Review response
  if (type === 'review_response' && data?.course_id) {
    const reviewId = data?.review_id || entity_id;
    return `/courses/${data.course_id}?tab=reviews&review=${reviewId}`;
  }
  if (entity_type === 'course' && entity_id) {
    return `/courses/${entity_id}`;
  }
  if (entity_type === 'club' && entity_id) {
    return `/clubs/${entity_id}`;
  }
  if (entity_type === 'top_ten') {
    const targetId = data?.target_user_id ?? notification.user_id;
    return `/profile/${targetId}?tab=courses`;
  }
  // Business member/access navigation
  if (type === 'business_member_added' || type === 'business_access_approved') {
    const dataObj = (typeof data === 'object' && data !== null && !Array.isArray(data)) 
      ? (data as Record<string, any>) 
      : {};
    const businessSlug = dataObj.business_slug || dataObj.business_id || entity_id;
    if (businessSlug) return `/business/${businessSlug}`;
  }
  
  // Tag and mention notifications — post_id lives in the data JSONB
  if (
    (type === 'tag' || type === 'mention' || type === 'mention_post' || type === 'comment_mention') &&
    data?.post_id
  ) {
    return `/post/${data.post_id}`;
  }

  return '/';
}

function getContextLabel(notification: any): string {
  const { type, entity_type } = notification;
  
  // Game/Trip labels
  if (type.startsWith('game_') || type === 'rsvp_update') return 'Game';
  if (type.startsWith('trip_')) return 'Trip';
  
  if (entity_type === 'post') return 'Post';
  if (entity_type === 'comment') return 'Comment';
  if (entity_type === 'course') return 'Course';
  if (entity_type === 'club') return 'Club';
  if (type === 'follow') return 'Profile';
  if (FOLLOW_TYPES.has(type)) return 'Friends';
  if (CLUB_COURSE_TYPES.has(type)) return 'Course';
  if (type === 'system' || type === 'app_update') return 'Update';
  if (type === 'achievement' || type === 'achievement_unlocked' || type === 'milestone_reached') return 'Achievement';
  
  return 'Activity';
}

function deriveActorType(notification: any): ActorType {
  const { type, data } = notification;
  
  if (type === 'system' || type === 'app_update' || type === 'tip') {
    return 'system';
  }
  if (type === 'club_announcement' || type === 'club_update' || type === 'club_event') {
    return 'club';
  }
  if (type === 'course_update') {
    return 'course';
  }
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
    mentions: items.filter(i => i.is_mention && i.is_unread).length,
    friends: items.filter(i => i.is_from_friend && i.is_unread).length,
    messages: 0,
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
    case 'friends':
      return items.filter(i => i.is_from_friend);
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
    request_id?: string;
    target_user_name?: string;
  }> = [
    { type: 'friend_request', message: null, created_at: minutesAgo(2), is_read: false, userIndex: 0, request_id: 'mock-fr-1' },
    { type: 'follow', message: null, created_at: minutesAgo(5), is_read: false, userIndex: 1 },
    { type: 'mention', message: 'Great round! You crushed it on the back 9 🔥', created_at: minutesAgo(18), is_read: false, entity_type: 'post', entity_id: 'mock-post-1', userIndex: 2 },
    { type: 'like', message: null, created_at: hoursAgo(1), is_read: false, entity_type: 'post', userIndex: 3 },
    { type: 'comment', message: 'Incredible shot! Which club did you use?', created_at: hoursAgo(2), is_read: false, entity_type: 'comment', userIndex: 4 },
    { type: 'friend_request', message: null, created_at: hoursAgo(4), is_read: false, userIndex: 5, request_id: 'mock-fr-2' },
    { type: 'friend_request_sent', message: null, created_at: hoursAgo(5), is_read: true, userIndex: 6, target_user_name: 'James Wilson' },
    { type: 'follow', message: null, created_at: hoursAgo(6), is_read: true, userIndex: 7 },
    { type: 'like', message: null, created_at: hoursAgo(8), is_read: true, entity_type: 'post', userIndex: 8 },
    { type: 'friend_accepted', message: null, created_at: hoursAgo(10), is_read: true, userIndex: 9 },
    { type: 'friend_cancelled', message: null, created_at: daysAgo(1), is_read: true, userIndex: 10, target_user_name: 'Emma Thompson' },
    { type: 'tag', message: null, created_at: daysAgo(1), is_read: true, entity_type: 'post', userIndex: 11 },
    { type: 'mention', message: 'Playing with @you next week – can\'t wait!', created_at: daysAgo(2), is_read: true, entity_type: 'post', userIndex: 12 },
    { type: 'follow', message: null, created_at: daysAgo(2), is_read: true, userIndex: 13 },
    { type: 'like', message: null, created_at: daysAgo(3), is_read: true, entity_type: 'post', userIndex: 14 },
    { type: 'comment', message: 'That\'s a beautiful course! Adding to my bucket list', created_at: daysAgo(4), is_read: true, entity_type: 'comment', userIndex: 15 },
    { type: 'follow', message: null, created_at: daysAgo(8), is_read: true, userIndex: 16 },
    { type: 'like', message: null, created_at: daysAgo(10), is_read: true, entity_type: 'post', userIndex: 17 },
    { type: 'friend_accepted', message: null, created_at: daysAgo(12), is_read: true, userIndex: 18 },
    { type: 'mention', message: 'Best playing partner I\'ve had all year!', created_at: daysAgo(14), is_read: true, entity_type: 'post', userIndex: 19 },
  ];

  return mockTemplates.map((template, index) => {
    const user = getUser(template.userIndex);
    const displayName = user.display_name || user.username || 'Golfer';
    const isFromFollowing = followingUserIds.has(user.id);
    
    const notification: ActivityNotification = {
      id: `mock-${index + 1}`,
      created_at: template.created_at,
      is_read: template.is_read,
      type: template.type,
      title: '',
      message: template.message,
      
      actor_id: user.id,
      actor_type: 'user',
      actor_display_name: displayName,
      actor_username: user.username || '',
      actor_avatar_url: user.profile_photo_url || null,
      
      entity_type: template.entity_type || null,
      entity_id: template.entity_id || null,
      target_type: deriveTargetType(template),
      data: {
        ...(template.request_id ? { request_id: template.request_id } : {}),
        ...(template.target_user_name ? { target_user_name: template.target_user_name } : {}),
      },
      
      is_unread: !template.is_read,
      is_mention: MENTION_TYPES.has(template.type),
      is_from_following: isFromFollowing,
      is_from_friend: false,
      is_club_or_course: CLUB_COURSE_TYPES.has(template.type),
      is_message: false,
      is_review: template.type === 'friend_course_review' || template.type === 'course_review',
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
    return new Set();
  }
  
  return new Set(data.map(f => f.following_id));
}

// Fetch user's accepted friends for is_from_friend derivation
async function fetchFriendUserIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');

  if (error || !data) {
    return new Set();
  }

  return new Set(
    data.map(friendship => 
      friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    )
  );
}

export interface ActivityFeedResult {
  buckets: ActivityBuckets;
  counts: ActivityCounts;
  allItems: ActivityNotification[];
}

// Fetch user's mute preferences for filtering
async function fetchMutePreferences(userId: string): Promise<{ mutedTypes: string[]; mutedUserIds: string[] }> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('muted_types, muted_user_ids')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { mutedTypes: [], mutedUserIds: [] };
  }

  return {
    mutedTypes: data.muted_types || [],
    mutedUserIds: data.muted_user_ids || [],
  };
}

export const useActivityFeed = (tab: ActivityTabId, chipFilter: ChipFilterKind = null) => {
  const { user } = useSupabaseSession();
  const { data: userProfile } = useUserProfile(user?.id);
  const { activeActor } = useActiveActor();

  // Get last seen timestamp from user profile (read via closure, not in query key)
  const lastNotificationsSeen = userProfile?.last_notifications_seen_at ?? null;

  // Actor-aware filtering
  const recipientActorType = activeActor?.type || 'personal';
  const recipientActorId = activeActor?.id || user?.id || '';

  const query = useQuery({
    queryKey: ['activity-feed', tab, chipFilter, user?.id],
    queryFn: async (): Promise<ActivityFeedResult> => {
      if (!user?.id) {
        return {
          buckets: { new: [], today: [], yesterday: [], thisWeek: [], earlier: [] },
          counts: { new: 0, mentions: 0, friends: 0, messages: 0 },
          allItems: [],
        };
      }

      let enrichedNotifications: ActivityNotification[] = [];
      let followingUserIds = new Set<string>();
      let friendUserIds = new Set<string>();
      let mutePrefs = { mutedTypes: [] as string[], mutedUserIds: [] as string[] };

      if (user?.id) {
        const [followingIds, friendIds, fetchedMutePrefs] = await Promise.all([
          fetchFollowingUserIds(user.id),
          fetchFriendUserIds(user.id),
          fetchMutePreferences(user.id),
        ]);
        followingUserIds = followingIds;
        friendUserIds = friendIds;
        mutePrefs = fetchedMutePrefs;

        // Fetch notifications (excluding soft-deleted and messages)
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
          .eq('is_deleted', false)
          .or(`recipient_actor_type.is.null,and(recipient_actor_type.eq.${recipientActorType},recipient_actor_id.eq.${recipientActorId})`)
          .not('type', 'in', '("message","message_received","dm")')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('[useActivityFeed] error', error);
          throw error;
        }

        // Fetch actor profiles
        const actorIds: string[] = [];
        const legacyFollowerIds: string[] = [];
        
        for (const n of notifications || []) {
          if (n.actor_id) {
            actorIds.push(n.actor_id);
          }
          const dataObj = (typeof n.data === 'object' && n.data !== null && !Array.isArray(n.data)) 
            ? (n.data as Record<string, any>) 
            : {};
          if (dataObj.follower_id && typeof dataObj.follower_id === 'string') {
            legacyFollowerIds.push(dataObj.follower_id);
          }
        }
        
        const allProfileIds = [...new Set([...actorIds, ...legacyFollowerIds])];
        
        let actorProfiles: Record<string, any> = {};
        if (allProfileIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', allProfileIds);
          
          if (profiles) {
            actorProfiles = profiles.reduce((acc, p) => {
              acc[p.id] = p;
              return acc;
            }, {} as Record<string, any>);
          }
        }

        // Transform notifications to normalized model
        const lastSeenTime = lastNotificationsSeen ? new Date(lastNotificationsSeen).getTime() : 0;
        
        enrichedNotifications = (notifications || []).map(n => {
          const actorType = deriveActorType(n);
          
          const dataObj = (typeof n.data === 'object' && n.data !== null && !Array.isArray(n.data)) 
            ? (n.data as Record<string, any>) 
            : {};
          
          const isBusinessVerification = n.type.startsWith('business_verification_');
          
          const legacyFollowerId = dataObj.follower_id;
          const effectiveActorId = n.actor_id || legacyFollowerId;
          const actor = effectiveActorId ? actorProfiles[effectiveActorId] : null;
          const isFromFollowing = effectiveActorId ? followingUserIds.has(effectiveActorId) : false;
          
          const actorDisplayName = isBusinessVerification 
            ? (dataObj.entity_name || 'Your business')
            : (actor?.display_name 
                || actor?.username 
                || dataObj.follower_name 
                || dataObj.tagger_name 
                || dataObj.commenter_name
                || dataObj.liker_name
                || 'Someone');
          
          const actorUsername = actor?.username || '';
          
          const actorAvatarUrl = isBusinessVerification
            ? (dataObj.entity_avatar_url || null)
            : (actor?.profile_photo_url 
                || dataObj.follower_photo 
                || dataObj.tagger_photo
                || dataObj.commenter_photo
                || dataObj.liker_photo
                || null);
          
          const createdAtTime = new Date(n.created_at).getTime();
          const isUnseen = createdAtTime > lastSeenTime || n.is_read === false;
          
          const notification: ActivityNotification = {
            id: n.id,
            created_at: n.created_at,
            is_read: n.is_read,
            type: n.type,
            title: n.title,
            message: n.message,
            
            actor_id: effectiveActorId || null,
            actor_type: actorType,
            actor_display_name: actorDisplayName,
            actor_username: actorUsername,
            actor_avatar_url: actorAvatarUrl,
            
            entity_type: n.entity_type,
            entity_id: n.entity_id,
            target_type: deriveTargetType(n),
            data: n.data,
            
            is_unread: isUnseen,
            is_mention: MENTION_TYPES.has(n.type),
            is_from_following: isFromFollowing,
            is_from_friend: effectiveActorId ? friendUserIds.has(effectiveActorId) : false,
            is_club_or_course: CLUB_COURSE_TYPES.has(n.type) || 
              n.entity_type === 'course' || n.entity_type === 'club' ||
              actorType === 'club' || actorType === 'course',
            is_message: false,
            is_review: n.type === 'friend_course_review' || n.type === 'course_review',
            is_mock: false,
            
            context_url: getContextUrl({ ...n, actor_id: effectiveActorId }),
            context_label: getContextLabel(n),
            time_ago: getTimeAgo(n.created_at),
          };
          
          return notification;
        });
      }

      // DEV FLAG: Append mock data when flag is true
      if (SHOW_MOCK_ACTIVITY && user?.id) {
        const mockItems = await generateMockActivityWithRealUsers(user.id, followingUserIds);
        enrichedNotifications = [...enrichedNotifications, ...mockItems];
      }

      // Apply mute preferences (client-side filtering)
      if (mutePrefs.mutedTypes.length > 0 || mutePrefs.mutedUserIds.length > 0) {
        enrichedNotifications = enrichedNotifications.filter(n =>
          !mutePrefs.mutedTypes.includes(n.type as string) &&
          !(n.actor_id && mutePrefs.mutedUserIds.includes(n.actor_id))
        );
      }

      // Calculate counts from ALL items (after mute filtering, before tab filtering)
      const counts = computeCounts(enrichedNotifications);

      // Filter by tab
      let filtered: ActivityNotification[];
      switch (tab) {
        case 'friends':
          filtered = enrichedNotifications.filter(n => n.is_from_friend && n.actor_type === 'user');
          break;
        case 'all':
        default:
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
    staleTime: 30_000,
    enabled: !!user?.id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetched: query.isFetched,
    error: query.error,
  };
};
// NOTE: useUnreadNotifications from src/hooks/useUnreadNotifications.ts is the
// single source of truth for unread count. Do not add duplicate hooks here.
