import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem, FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';
import { FEATURE_FLAGS, PORTRAIT_MAX_ASPECT_RATIO } from '@/config/featureFlags';

export const useRealPostsFetcher = () => {
  const fetchFriendsPosts = async (currentOffset: number, postsPerPage: number): Promise<ExploreContentItem[]> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users that the current user follows
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error fetching followed users:', followError);
        return [];
      }

      const followedUserIds = followedUsers?.map(f => f.following_id) || [];
      
      if (followedUserIds.length === 0) {
        return []; // No followed users, return empty
      }

      // Build the query for friends' posts (both videos and photos)
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            id,
            media_type,
            media_url,
            width,
            height,
            aspect_ratio,
            orientation,
            duration_seconds
          ),
          post_tags (
            id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name
            )
          )
        `)
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + postsPerPage - 1)
        .limit(postsPerPage);

      // Apply portrait filtering when flag is enabled
      if (FEATURE_FLAGS.CLUBHOUSE_PORTRAIT_ONLY) {
        query = query.filter('post_media.aspect_ratio', 'lte', PORTRAIT_MAX_ASPECT_RATIO);
      }

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching friends posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const allMedia = (post.post_media || []);
        const primaryMedia = allMedia.find((m: any) => m.media_type === 'video') || allMedia[0]; // Prefer video as primary
        
        const isValid =
          (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
          (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
        
        if (!primaryMedia || !isValid) {
          return null;
        }

        // Find golf course from post tags
        const golfCourseTag = (post.post_tags || []).find(
          tag => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        
        if (golfCourseTag?.taggable_entities) {
          // Use golf course from tags if available
          golfCourse = {
            id: golfCourseTag.taggable_entities.entity_id,
            name: golfCourseTag.taggable_entities.name,
            country: 'Unknown'
          };
        } else if (post.content) {
          // Extract golf course from content text as fallback
          const contentText = post.content;
          
          // Look for patterns like "📍 Played at [Course Name]" or "@[Course Name]"
          const courseMatch = contentText.match(/📍\s*(?:Played at\s+)?([^,\n]+(?:Golf Club|Golf Course|GC)[^,\n]*)/i) ||
                            contentText.match(/at\s+([^,\n]+(?:Golf Club|Golf Course|GC)[^,\n]*)/i);
          
          if (courseMatch) {
            const courseName = courseMatch[1].trim()
              .replace(/\([^)]*(?<!Course|course)\)/g, '') // Remove parentheses content EXCEPT if it contains "Course"
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            if (courseName.length > 3) { // Only if we have a reasonable course name
              golfCourse = {
                id: 'extracted-' + courseName.toLowerCase().replace(/\s+/g, '-'),
                name: courseName,
                country: 'Unknown'
              };
            }
          }
        }

        // Generate random audio track for video posts (demo purposes)
        const generateAudioTrack = () => {
          if (primaryMedia.media_type !== 'video' || Math.random() > 0.4) return undefined;
          
          const tracks = [
            { title: "Eye of the Tiger", artist: "Survivor" },
            { title: "The Final Countdown", artist: "Europe" },
            { title: "We Will Rock You", artist: "Queen" },
            { title: "Born to Be Wild", artist: "Steppenwolf" },
            { title: "Thunderstruck", artist: "AC/DC" },
            { title: "Original Audio", isOriginal: true },
            { title: "Golf Swing Audio", isOriginal: true },
            { title: "Course Ambience", isOriginal: true }
          ];
          
          return tracks[Math.floor(Math.random() * tracks.length)];
        };

        // Use actual duration from database
        const durationSeconds = primaryMedia.media_type === 'video' 
          ? (primaryMedia as any).duration_seconds
          : undefined;

        const formattedPost = {
          id: post.id,
          type: primaryMedia.media_type as 'video' | 'image',
          src: primaryMedia.media_url,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds, // Store numeric value for filtering
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.7 // Random verification for demo
          },
          golfCourse,
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: true, // All posts in friends feed should be from followed users
          media: allMedia.filter(m => isValidImageUrl(m.media_url)),
          audioTrack: generateAudioTrack()
        };

        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching friends posts:', error);
      return [];
    }
  };

  const fetchRealPosts = async (currentOffset: number, postsPerPage: number, mediaFilter?: string, subFilter?: string): Promise<ExploreContentItem[]> => {
    try {
      // Build the query
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            id,
            media_type,
            media_url,
            duration_seconds,
            media_width,
            media_height,
            image_orientation
          ),
          post_tags (
            id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + postsPerPage - 1)
        .limit(postsPerPage);

      // Add media type filter if specified
      if (mediaFilter === FILTER_TYPES.SHORTS) {
        query = query
          .eq('post_media.media_type', MEDIA_TYPES.VIDEO)
          .lte('post_media.duration_seconds', 180);
        
        // Apply Shorts subfilter
        if (subFilter === 'trending') {
          // Order by engagement (likes + comments + shares approximation)
          query = query.order('created_at', { ascending: false });
        } else if (subFilter === 'new') {
          // Already ordered by created_at DESC
          query = query.order('created_at', { ascending: false });
        } else if (subFilter && ['golf-swing', 'hole-in-one', 'long-drive', 'fail'].includes(subFilter)) {
          // Tag-based filtering - filter in post-processing since we can't efficiently query tags in this structure
          // The filtering will happen client-side after fetch
        }
      } else if (mediaFilter === FILTER_TYPES.VIDEOS) {
        query = query.eq('post_media.media_type', MEDIA_TYPES.VIDEO);
      } else if (mediaFilter === FILTER_TYPES.PHOTOS) {
        query = query.eq('post_media.media_type', MEDIA_TYPES.IMAGE);
        
        // Apply Photos subfilters
        if (subFilter === 'new') {
          query = query.order('created_at', { ascending: false });
        } else if (subFilter === 'popular') {
          // For popular, we'll sort by created_at for now (engagement metrics would go here)
          query = query.order('created_at', { ascending: false });
        } else if (subFilter === 'courses') {
          // Filter will happen post-processing for course-tagged posts
        } else if (subFilter === 'portraits') {
          // Server-side filter for portrait orientation
          query = query.eq('post_media.image_orientation', 'portrait');
        } else if (subFilter === 'landscapes') {
          // Server-side filter for landscape orientation
          query = query.eq('post_media.image_orientation', 'landscape');
        }
      }

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const allMedia = (post.post_media || []);
        const primaryMedia = allMedia.find((m: any) => m.media_type === 'video') || allMedia[0]; // Prefer video as primary
        
        const isValid =
          (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
          (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
        
        if (!primaryMedia || !isValid) {
          return null;
        }

        // Find golf course from post tags
        const golfCourseTag = (post.post_tags || []).find(
          tag => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        
        if (golfCourseTag?.taggable_entities) {
          // Use golf course from tags if available
          golfCourse = {
            id: golfCourseTag.taggable_entities.entity_id,
            name: golfCourseTag.taggable_entities.name,
            country: 'Unknown'
          };
        } else if (post.content) {
          // Extract golf course from content text as fallback
          const contentText = post.content;
          
          // Look for patterns like "📍 Played at [Course Name]" or "@[Course Name]"
          const courseMatch = contentText.match(/📍\s*(?:Played at\s+)?([^,\n]+(?:Golf Club|Golf Course|GC)[^,\n]*)/i) ||
                            contentText.match(/at\s+([^,\n]+(?:Golf Club|Golf Course|GC)[^,\n]*)/i);
          
          if (courseMatch) {
            const courseName = courseMatch[1].trim()
              .replace(/\([^)]*(?<!Course|course)\)/g, '') // Remove parentheses content EXCEPT if it contains "Course"
              .replace(/\s+/g, ' ') // Normalize spaces
              .trim();
            
            if (courseName.length > 3) { // Only if we have a reasonable course name
              golfCourse = {
                id: 'extracted-' + courseName.toLowerCase().replace(/\s+/g, '-'),
                name: courseName,
                country: 'Unknown'
              };
            }
          }
        }

        // Generate random audio track for video posts (demo purposes)
        const generateAudioTrack = () => {
          if (primaryMedia.media_type !== 'video' || Math.random() > 0.4) return undefined;
          
          const tracks = [
            { title: "Eye of the Tiger", artist: "Survivor" },
            { title: "The Final Countdown", artist: "Europe" },
            { title: "We Will Rock You", artist: "Queen" },
            { title: "Born to Be Wild", artist: "Steppenwolf" },
            { title: "Thunderstruck", artist: "AC/DC" },
            { title: "Original Audio", isOriginal: true },
            { title: "Golf Swing Audio", isOriginal: true },
            { title: "Course Ambience", isOriginal: true }
          ];
          
          return tracks[Math.floor(Math.random() * tracks.length)];
        };

        // Use actual duration from database
        const durationSeconds = primaryMedia.media_type === 'video' 
          ? (primaryMedia as any).duration_seconds
          : undefined;

        const formattedPost = {
          id: post.id,
          type: primaryMedia.media_type as 'video' | 'image',
          src: primaryMedia.media_url,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds, // Store numeric value for filtering
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.7 // Random verification for demo
          },
          golfCourse,
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: Math.random() > 0.5,
          media: allMedia.filter(m => isValidImageUrl(m.media_url)),
          audioTrack: generateAudioTrack()
        };

        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      // Apply tag-based subfilter for Shorts (client-side)
      if (mediaFilter === FILTER_TYPES.SHORTS && subFilter && ['golf-swing', 'hole-in-one', 'long-drive', 'fail'].includes(subFilter)) {
        const tagKeywords: Record<string, string[]> = {
          'golf-swing': ['swing', 'golf swing', 'technique'],
          'hole-in-one': ['hole in one', 'ace', 'holeinone'],
          'long-drive': ['long drive', 'distance', 'bomber'],
          'fail': ['fail', 'miss', 'bloopers', 'oops']
        };
        
        const keywords = tagKeywords[subFilter] || [];
        
        return formattedPosts.filter(post => {
          const content = post.title?.toLowerCase() || '';
          const courseName = post.golfCourse?.name?.toLowerCase() || '';
          
          return keywords.some(keyword => 
            content.includes(keyword.toLowerCase()) || 
            courseName.includes(keyword.toLowerCase())
          );
        });
      }

      // Apply Photos subfilters (client-side)
      if (mediaFilter === FILTER_TYPES.PHOTOS) {
        let filtered = formattedPosts;
        
        if (subFilter === 'courses') {
          // Only show posts with golf course tags
          filtered = filtered.filter(post => post.golfCourse !== null);
        }
        
        // Note: portraits/landscapes filtering would require aspect ratio data
        // For now, we'll skip orientation filtering until we have that data
        
        return filtered;
      }

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching real posts:', error);
      return [];
    }
  };

  return { fetchRealPosts, fetchFriendsPosts };
};