
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useUserProfileQueries = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useSupabaseSession();

  // Fetch the user profile by username or ID
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      // First try to find by username
      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .eq('is_public', true)
        .maybeSingle();
      
      // If not found by username, try to find by ID (fallback for users without usernames)
      if (!data && !error) {
        const { data: idData, error: idError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', username)
          .eq('is_public', true)
          .maybeSingle();
        
        data = idData;
        error = idError;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  // Fetch tracker stats for this user with proper filtering
  const { data: trackerStats } = useQuery({
    queryKey: ['trackerStats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      
      // Fetch played courses with their golf course details
      const { data: userCourses } = await supabase
        .from('user_courses')
        .select(`
          course_id,
          played,
          golf_courses (
            id,
            name,
            country,
            region,
            continent,
            global_rank,
            regional_rank
          )
        `)
        .eq('user_id', profile.id)
        .eq('played', true);

      let stats: { [cat: string]: number } = {
        'GB&I': 0,
        'Europe': 0,
        'USA': 0,
        'Global': 0
      };

      if (userCourses) {
        userCourses.forEach(userCourse => {
          const course = userCourse.golf_courses;
          if (!course) return;

          // Global - courses with global rank <= 100
          if (course.global_rank && course.global_rank <= 100) {
            stats['Global']++;
          }

          // GB&I - courses with regional rank <= 100 in GB&I countries
          if (course.regional_rank && course.regional_rank <= 100) {
            const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            if (gbiCountries.includes(course.country)) {
              stats['GB&I']++;
            }
          }

          // Europe - courses with regional rank <= 100 in Europe (excluding GB&I)
          if (course.regional_rank && course.regional_rank <= 100 && course.continent === 'Europe') {
            const gbiCountries = ['Scotland', 'England', 'Wales', 'Northern Ireland', 'Ireland'];
            if (!gbiCountries.includes(course.country)) {
              stats['Europe']++;
            }
          }

          // USA - courses with regional rank <= 100 in USA
          if (course.regional_rank && course.regional_rank <= 100 && course.country === 'United States') {
            stats['USA']++;
          }
        });
      }

      return stats;
    },
    enabled: !!profile?.id,
  });

  // Check relationship status with current user
  const { data: relationshipStatus } = useQuery({
    queryKey: ['relationshipStatus', currentUser?.id, profile?.id],
    queryFn: async () => {
      if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return null;
      
      // Check if following
      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      // Check friend status - look for bidirectional relationships
      const { data: friendData } = await supabase
        .from('user_friends')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${profile.id}),and(user_id.eq.${profile.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

      // Properly type the friend status
      const friendStatus = friendData?.status;
      const validFriendStatus: 'pending' | 'accepted' | null = 
        friendStatus === 'pending' || friendStatus === 'accepted' ? friendStatus as 'pending' | 'accepted' : null;

      return {
        isFollowing: !!followData,
        friendStatus: validFriendStatus
      };
    },
    enabled: !!currentUser?.id && !!profile?.id && currentUser.id !== profile.id,
  });

  return {
    profile,
    isLoading,
    trackerStats,
    relationshipStatus,
    currentUser
  };
};
