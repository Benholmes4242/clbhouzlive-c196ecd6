import { useEffect } from 'react';
import { preloadProfilePhotos } from './useProfilePhotoCache';
import { supabase } from '@/integrations/supabase/client';

// Preload profile photos for better UX
export const useProfilePreloader = () => {
  
  useEffect(() => {
    const preloadCommonProfiles = async () => {
      try {
        // Preload suggested users' profile photos
        const { data: suggestedUsers } = await supabase
          .from('user_profiles')
          .select('profile_photo_url')
          .eq('is_public', true)
          .not('profile_photo_url', 'is', null)
          .limit(20);

        if (suggestedUsers) {
          const urls = suggestedUsers
            .map(user => user.profile_photo_url)
            .filter(Boolean) as string[];
          
          // Preload in smaller sizes first for thumbnails
          preloadProfilePhotos(urls, 40);
          preloadProfilePhotos(urls, 80);
        }

        // If user is logged in, preload followed users
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: followedUsers } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .limit(50);

          if (followedUsers) {
            const followingIds = followedUsers.map(f => f.following_id);
            
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('profile_photo_url')
              .in('id', followingIds)
              .not('profile_photo_url', 'is', null);

            if (profiles) {
              const followedUrls = profiles
                .map(profile => profile.profile_photo_url)
                .filter(Boolean) as string[];
              
              preloadProfilePhotos(followedUrls, 40);
              preloadProfilePhotos(followedUrls, 80);
            }
          }
        }
      } catch (error) {
        console.log('Profile preloading failed:', error);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timer = setTimeout(preloadCommonProfiles, 1000);
    return () => clearTimeout(timer);
  }, []);
};