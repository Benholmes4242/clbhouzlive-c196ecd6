import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Extended friend profile with activity status
 */
export interface NetworkFriend {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
  last_activity: string | null;
  is_active_recently: boolean;
}

/**
 * Course highlight for the network carousel
 */
export interface NetworkCourseHighlight {
  course_id: string;
  course_name: string;
  image_url: string | null;
  city: string | null;
  region: string | null;
  friends_played_count: number;
  last_played: string | null;
  display_friends: string[];
  avg_network_rating: number | null;
  badge_type: 'played_by_friends' | 'new_for_network' | 'top_rated' | 'trending' | null;
  subline_text: string;
}

/**
 * Network pulse data for insights
 */
export interface NetworkPulseData {
  total_rounds: number;
  active_friends: number;
  new_courses_discovered: number;
  most_active_region: string | null;
  region_concentration: number;
}

/**
 * Complete network activity result
 */
export interface NetworkActivityResult {
  friends: NetworkFriend[];
  highlights: NetworkCourseHighlight[];
  pulse: NetworkPulseData;
  hasFriends: boolean;
  hasActivity: boolean;
}

/**
 * Fetches comprehensive network activity for the Your Network section.
 * Includes friends with activity status, course highlights, and pulse insights.
 */
export function useNetworkActivity(userId: string | undefined) {
  return useQuery<NetworkActivityResult>({
    queryKey: ['network-activity', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        return {
          friends: [],
          highlights: [],
          pulse: {
            total_rounds: 0,
            active_friends: 0,
            new_courses_discovered: 0,
            most_active_region: null,
            region_concentration: 0,
          },
          hasFriends: false,
          hasActivity: false,
        };
      }

      // Step 1: Get friend IDs from user_friends (bidirectional)
      const { data: friendships, error: friendshipError } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendshipError) {
        console.error('[useNetworkActivity] Friendships error:', friendshipError);
        throw friendshipError;
      }

      const friendIds = (friendships || [])
        .map((row) => (row.user_id === userId ? row.friend_id : row.user_id))
        .filter(Boolean) as string[];

      if (friendIds.length === 0) {
        return {
          friends: [],
          highlights: [],
          pulse: {
            total_rounds: 0,
            active_friends: 0,
            new_courses_discovered: 0,
            most_active_region: null,
            region_concentration: 0,
          },
          hasFriends: false,
          hasActivity: false,
        };
      }

      // Step 2: Get friend profiles with last activity (from course_ratings)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', friendIds)
        .is('deleted_at', null);

      if (profilesError) {
        console.error('[useNetworkActivity] Profiles error:', profilesError);
        throw profilesError;
      }

      // Fetch recent course ratings for all friends (last 60 days for highlights)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

      const { data: recentRatings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select(`
          id,
          user_id,
          course_id,
          created_at,
          rating,
          golf_courses!inner (
            id,
            name,
            country,
            sub_country,
            thumbnail_image
          )
        `)
        .in('user_id', friendIds)
        .gte('created_at', sixtyDaysAgoISO)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('[useNetworkActivity] Ratings error:', ratingsError);
        throw ratingsError;
      }

      // Build friend activity map (last activity date per friend)
      const friendActivityMap = new Map<string, string>();
      for (const rating of recentRatings || []) {
        const existing = friendActivityMap.get(rating.user_id);
        if (!existing || new Date(rating.created_at) > new Date(existing)) {
          friendActivityMap.set(rating.user_id, rating.created_at);
        }
      }

      // Also fetch recent posts by friends (last 30 days)
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('user_id, created_at')
        .in('user_id', friendIds)
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false });

      // Merge posts into activity map — keeps whichever is more recent
      for (const post of recentPosts || []) {
        const existing = friendActivityMap.get(post.user_id);
        if (!existing || new Date(post.created_at) > new Date(existing)) {
          friendActivityMap.set(post.user_id, post.created_at);
        }
      }

      // Build NetworkFriend list with activity status
      const friends: NetworkFriend[] = (profiles || [])
        .map((p) => {
          const lastActivity = friendActivityMap.get(p.id) || null;
          return {
            id: p.id,
            username: p.username,
            display_name: p.display_name,
            profile_photo_url: p.profile_photo_url,
            last_activity: lastActivity,
            is_active_recently: lastActivity ? new Date(lastActivity) >= new Date(thirtyDaysAgoISO) : false,
          };
        })
        .sort((a, b) => {
          // Sort by recent activity, then alphabetically
          if (a.last_activity && b.last_activity) {
            return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
          }
          if (a.last_activity) return -1;
          if (b.last_activity) return 1;
          return (a.display_name || a.username).localeCompare(b.display_name || b.username);
        });

      // Step 3: Build course highlights for carousel
      const courseMap = new Map<string, {
        course_id: string;
        course_name: string;
        image_url: string | null;
        city: string | null;
        region: string | null;
        friends_played: Set<string>;
        friend_usernames: string[];
        ratings: number[];
        last_played: string;
        first_network_play: string;
      }>();

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      for (const rating of recentRatings || []) {
        const course = rating.golf_courses as any;
        if (!course?.id) continue;

        const friendProfile = profileMap.get(rating.user_id);
        const friendName = friendProfile?.display_name || friendProfile?.username || 'Unknown';

        const existing = courseMap.get(course.id);
        if (!existing) {
          courseMap.set(course.id, {
            course_id: course.id,
            course_name: course.name,
            image_url: course.thumbnail_image,
            city: course.sub_country,
            region: course.country,
            friends_played: new Set([rating.user_id]),
            friend_usernames: [friendName],
            ratings: rating.rating ? [rating.rating] : [],
            last_played: rating.created_at,
            first_network_play: rating.created_at,
          });
        } else {
          existing.friends_played.add(rating.user_id);
          if (!existing.friend_usernames.includes(friendName)) {
            existing.friend_usernames.push(friendName);
          }
          if (rating.rating) {
            existing.ratings.push(rating.rating);
          }
          if (new Date(rating.created_at) > new Date(existing.last_played)) {
            existing.last_played = rating.created_at;
          }
          if (new Date(rating.created_at) < new Date(existing.first_network_play)) {
            existing.first_network_play = rating.created_at;
          }
        }
      }

      // Convert to highlights array with scoring and badge logic
      const highlights: NetworkCourseHighlight[] = Array.from(courseMap.values())
        .map((c) => {
          const friendsCount = c.friends_played.size;
          const avgRating = c.ratings.length > 0
            ? c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length
            : null;
          
          const isPlayedByMultiple = friendsCount >= 2;
          const isNewForNetwork = new Date(c.first_network_play) >= new Date(thirtyDaysAgoISO);
          const isTopRated = avgRating !== null && avgRating >= 4.5;

          // Determine badge (priority order)
          let badgeType: NetworkCourseHighlight['badge_type'] = null;
          if (isPlayedByMultiple) {
            badgeType = 'played_by_friends';
          } else if (isNewForNetwork && friendsCount === 1) {
            badgeType = 'new_for_network';
          } else if (isTopRated) {
            badgeType = 'top_rated';
          }

          // Generate subline text
          let sublineText = '';
          if (isPlayedByMultiple) {
            sublineText = `Played by ${friendsCount} friends this month`;
          } else if (badgeType === 'new_for_network') {
            sublineText = `New discovery by ${c.friend_usernames[0]}`;
          } else if (isTopRated && avgRating) {
            sublineText = `Rated ${avgRating.toFixed(1)} by your network`;
          } else if (c.friend_usernames.length > 0) {
            sublineText = `Played by ${c.friend_usernames[0]} recently`;
          }

          // Relevance score for sorting
          const relevanceScore =
            (isPlayedByMultiple ? 100 : 0) +
            friendsCount * 10 +
            (avgRating ? avgRating * 5 : 0) +
            (new Date(c.last_played) >= new Date(sevenDaysAgoISO) ? 20 : 0);

          return {
            course_id: c.course_id,
            course_name: c.course_name,
            image_url: c.image_url,
            city: c.city,
            region: c.region,
            friends_played_count: friendsCount,
            last_played: c.last_played,
            display_friends: c.friend_usernames.slice(0, 3),
            avg_network_rating: avgRating,
            badge_type: badgeType,
            subline_text: sublineText,
            _score: relevanceScore,
          };
        })
        .sort((a, b) => (b as any)._score - (a as any)._score)
        .slice(0, 10)
        .map(({ _score, ...rest }: any) => rest);

      // Step 4: Calculate pulse data (last 30 days)
      const thirtyDayRatings = (recentRatings || []).filter(
        (r) => new Date(r.created_at) >= new Date(thirtyDaysAgoISO)
      );

      const activeUserIds = new Set(thirtyDayRatings.map((r) => r.user_id));
      const uniqueCourseIds = new Set(thirtyDayRatings.map((r) => r.course_id));

      // Count regions
      const regionCounts = new Map<string, number>();
      for (const rating of thirtyDayRatings) {
        const region = (rating.golf_courses as any)?.country;
        if (region) {
          regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
        }
      }

      let mostActiveRegion: string | null = null;
      let maxRegionCount = 0;
      for (const [region, count] of regionCounts) {
        if (count > maxRegionCount) {
          maxRegionCount = count;
          mostActiveRegion = region;
        }
      }

      const regionConcentration = thirtyDayRatings.length > 0
        ? maxRegionCount / thirtyDayRatings.length
        : 0;

      const pulse: NetworkPulseData = {
        total_rounds: thirtyDayRatings.length,
        active_friends: activeUserIds.size,
        new_courses_discovered: uniqueCourseIds.size,
        most_active_region: mostActiveRegion,
        region_concentration: regionConcentration,
      };

      return {
        friends,
        highlights,
        pulse,
        hasFriends: friends.length > 0,
        hasActivity: thirtyDayRatings.length > 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
