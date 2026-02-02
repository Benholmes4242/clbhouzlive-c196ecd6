import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem, FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';
import { getStreamPoster } from '@/utils/stream';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';
import { collectCourseIds, resolveGolfCourse } from '@/utils/resolveGolfCourse';

export const useRealPostsFetcher = () => {
  const fetchFriendsPosts = async (currentOffset: number, postsPerPage: number): Promise<ExploreContentItem[]> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users that the current user follows (personal follows)
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error fetching followed users:', followError);
        return [];
      }

      const followedUserIds = followedUsers?.map(f => f.following_id) || [];
      
      // Get businesses that the current user follows
      const { data: followedBusinesses, error: businessFollowError } = await supabase
        .from('business_follows')
        .select('business_id')
        .eq('follower_id', user.id);
        
      if (businessFollowError) {
        console.error('Error fetching followed businesses:', businessFollowError);
      }
      
      const followedBusinessIds = followedBusinesses?.map(f => f.business_id) || [];
      
      if (followedUserIds.length === 0 && followedBusinessIds.length === 0) {
        return []; // No followed users/businesses, return empty
      }

      // Creator follows removed - creator_follows table no longer exists
      // Posts from creators now come through personal profiles with is_creator flag

      // Build query filters for polymorphic following
      const orFilters: string[] = [];
      if (followedUserIds.length > 0) {
        // Include personal posts from followed users
        orFilters.push(`and(or(actor_type.eq.personal,actor_type.is.null),user_id.in.(${followedUserIds.join(',')}))`);
      }
      if (followedBusinessIds.length > 0) {
        orFilters.push(`and(actor_type.eq.business,actor_id.in.(${followedBusinessIds.join(',')}))`);
      }

      // Build the query for friends' posts (both videos and photos)
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          categories,
          badges,
          post_media!inner (
            id,
            media_type,
            media_url,
            poster_url,
            width,
            height,
            aspect_ratio,
            orientation,
            duration_seconds,
            filter_id,
            studio_edits
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
        `);

      // Add visibility filter - private posts only visible to owner
      const visibilityFilter = buildVisibilityFilter(user.id);
      
      // Combine following filter with visibility filter
      // Posts must match (following conditions) AND (visibility conditions)
      query = query
        .or(orFilters.join(','))
        .or(visibilityFilter)
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + postsPerPage - 1)
        .limit(postsPerPage);

      // Vertical-only filtering is applied post-fetch for flexibility

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching friends posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Split posts by actor type for polymorphic hydration (no creator type)
      const personalPosts = postsData.filter(p => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = postsData.filter(p => p.actor_type === 'business');

      // Get unique user IDs (for personal posts)
      const userIds = [...new Set(personalPosts.map(post => post.user_id))];
      
      // Get unique business IDs (for business posts)
      const businessIds = [...new Set(businessPosts.map(post => post.actor_id).filter(Boolean))] as string[];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = userIds.length > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', userIds)
        : { data: [], error: null };

      if (profilesError) {
        // Log but don't fail - gracefully continue with empty profiles
        console.warn('Error fetching profiles (continuing with placeholders):', profilesError);
      }
      
      // Get business accounts
      const { data: businessAccounts, error: businessError } = businessIds.length > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, logo_url, is_verified, category, location')
            .in('id', businessIds)
        : { data: [], error: null };
        
      if (businessError) {
        console.error('Error fetching business accounts:', businessError);
        // Don't fail - just continue without business data
      }

      // Use canonical helper to collect all course IDs
      const uniqueCourseIds = collectCourseIds(postsData);
      
      // Batch fetch golf course details
      const { data: golfCourses, error: coursesError } = uniqueCourseIds.length > 0
        ? await supabase
            .from('golf_courses')
            .select('id, name, country, sub_country, region')
            .in('id', uniqueCourseIds)
        : { data: [], error: null };
        
      if (coursesError) {
        console.error('Error fetching golf courses:', coursesError);
        // Don't fail - just continue without course data
      }
      
      // Create lookup map for courses
      const courseMap = new Map(
        (golfCourses || []).map(c => [c.id, c])
      );

      // Format posts for explore grid with polymorphic hydration (no creator type)
      const formattedPosts = postsData.map(post => {
        const isBusinessPost = post.actor_type === 'business';
        
        const userProfile = !isBusinessPost
          ? profiles?.find(profile => profile.id === post.user_id) 
          : null;
          
        const businessAccount = isBusinessPost && post.actor_id
          ? businessAccounts?.find(b => b.id === post.actor_id)
          : null;
          
        const allMedia = (post.post_media || []);
        const primaryMedia = allMedia.find((m: any) => m.media_type === 'video') || allMedia[0];
        
        const isValid =
          (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
          (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
        
        if (!primaryMedia || !isValid) {
          return null;
        }
        
        // Vertical-only check - applies uniformly to all posts (business + personal)
        if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY && primaryMedia.media_type === 'video') {
          const { width, height, aspect_ratio } = primaryMedia;
          
          // All posts must have metadata to pass
          if (width == null || height == null || aspect_ratio == null) {
            return null;
          }
          
          // All posts must be within vertical band
          if (aspect_ratio < VERTICAL_MIN_AR || aspect_ratio > VERTICAL_MAX_AR) {
            return null;
          }
        }

        // Find golf course from post tags OR direct course_id FK
        const golfCourseTag = (post.post_tags || []).find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        
        if (golfCourseTag?.taggable_entities) {
          // Option 1: Course linked via post_tags (older posts)
          const courseId = golfCourseTag.taggable_entities.entity_id;
          const fullCourse = courseMap.get(courseId);
          
          golfCourse = fullCourse ? {
            id: fullCourse.id,
            name: fullCourse.name,
            country: fullCourse.country || '',
            sub_country: fullCourse.sub_country,
            region: fullCourse.region,
          } : {
            id: courseId,
            name: golfCourseTag.taggable_entities.name,
            country: '',
          };
        } else if (post.course_id) {
          // Option 2: Course linked via direct FK (newer posts)
          const fullCourse = courseMap.get(post.course_id);
          if (fullCourse) {
            golfCourse = {
              id: fullCourse.id,
              name: fullCourse.name,
              country: fullCourse.country || '',
              sub_country: fullCourse.sub_country,
              region: fullCourse.region,
            };
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

        // Normalize dimensions and aspect ratio (handle strings, nulls, rotation)
        const toNum = (v: any): number | undefined => {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return Number.isFinite(n) ? n : undefined;
        };

        let width = toNum(primaryMedia.width) ?? toNum((primaryMedia as any).media_width);
        let height = toNum(primaryMedia.height) ?? toNum((primaryMedia as any).media_height);
        let aspectRatio = toNum((primaryMedia as any).aspect_ratio);

        // Handle rotated videos (90° or 270° rotation swaps dimensions)
        const rotation = toNum((primaryMedia as any).rotation);
        if (rotation && (rotation % 180) !== 0 && width && height) {
          [width, height] = [height, width]; // Swap for rotated video
          aspectRatio = width / height;
        } else if (!aspectRatio && width && height && height > 0) {
          aspectRatio = width / height;
        }

        // Build polymorphic creator
        let creator;
        if (isBusinessPost && businessAccount) {
          creator = {
            type: 'business' as const,
            id: businessAccount.id,
            name: businessAccount.name || 'Business',
            avatarUrl: businessAccount.logo_url || undefined,
            verified: businessAccount.is_verified || false,
            subtitle: businessAccount.location || businessAccount.category || undefined,
          };
        } else {
          creator = {
            type: 'personal' as const,
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username || undefined,
            avatarUrl: userProfile?.profile_photo_url || undefined,
          };
        }

        // Legacy user object - supports personal and business types
        let user;
        if (isBusinessPost && businessAccount) {
          user = {
            id: businessAccount.id,
            name: businessAccount.name || 'Business',
            avatar: businessAccount.logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: businessAccount.is_verified || false,
          };
        } else {
          user = {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.7,
          };
        }

        const formattedPost = {
          id: post.id,
          type: primaryMedia.media_type as 'video' | 'image',
          src: primaryMedia.media_url,
          thumbnailSrc: primaryMedia.media_type === 'video' 
            ? getStreamPoster(primaryMedia.media_url, '1s') || undefined
            : undefined,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds,
          aspectRatio,
          width,
          height,
          createdAt: post.created_at,
          actorType: (post.actor_type || 'personal') as 'personal' | 'business',
          actorId: post.actor_id || post.user_id,
          creator,
          user,
          business: isBusinessPost && businessAccount ? {
            id: businessAccount.id,
            name: businessAccount.name,
            logoUrl: businessAccount.logo_url,
            isVerified: businessAccount.is_verified,
            category: businessAccount.category,
            location: businessAccount.location,
          } : undefined,
          golfCourse,
          categories: post.categories || [],
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: true,
          media: allMedia.filter(m => isValidImageUrl(m.media_url)).map((m: any) => ({
            id: m.id,
            media_type: m.media_type,
            media_url: m.media_url,
            poster_url: m.poster_url,
            filter_id: m.filter_id,
            studio_edits: m.studio_edits,
          })),
          audioTrack: generateAudioTrack()
        };

        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      // Deduplicate posts by id (can occur when user follows both a creator and the underlying user)
      const seenIds = new Set<string>();
      const deduplicatedPosts = formattedPosts.filter(post => {
        if (seenIds.has(post.id)) return false;
        seenIds.add(post.id);
        return true;
      });

      return deduplicatedPosts;
    } catch (error) {
      console.error('Error fetching friends posts:', error);
      return [];
    }
  };

  /**
   * Fetch posts with Friends First global ordering using RPC.
   * Friends' posts appear before non-friends' posts globally, with correct pagination.
   */
  const fetchFriendsFirstPosts = async (
    currentOffset: number,
    postsPerPage: number,
    mediaFilter?: string,
    durationFilter?: { from: number; to: number | null }
  ): Promise<ExploreContentItem[]> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) return [];

      // Determine media type for RPC
      let mediaType: string | null = null;
      if (mediaFilter === FILTER_TYPES.VIDEOS || mediaFilter === FILTER_TYPES.SHORTS) {
        mediaType = 'video';
      } else if (mediaFilter === FILTER_TYPES.PHOTOS) {
        mediaType = 'image';
      }

      // Determine duration filters
      let maxDuration: number | null = null;
      let minDuration: number | null = null;
      
      if (mediaFilter === FILTER_TYPES.SHORTS) {
        maxDuration = 180;
      } else if (durationFilter) {
        if (durationFilter.from > 0) minDuration = durationFilter.from;
        if (durationFilter.to !== null) maxDuration = durationFilter.to;
      }

      // Call RPC to get ordered post IDs
      const { data: orderedIds, error: rpcError } = await supabase.rpc('get_friends_first_post_ids', {
        p_current_user_id: currentUser.id,
        p_limit: postsPerPage,
        p_offset: currentOffset,
        p_media_type: mediaType,
        p_max_duration: maxDuration,
        p_min_duration: minDuration,
      });

      if (rpcError) {
        console.error('Error calling friends-first RPC:', rpcError);
        return [];
      }

      if (!orderedIds || orderedIds.length === 0) {
        return [];
      }

      const postIds = orderedIds.map((row: { post_id: string }) => row.post_id);
      // Create a map of post ID -> is_friend for accurate isFollowing values
      const isFriendMap = new Map(orderedIds.map((row: { post_id: string; is_friend: boolean }) => [row.post_id, row.is_friend]));

      // Fetch full post data for these IDs
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          like_count,
          comment_count,
          categories,
          post_media!inner (
            id,
            media_type,
            media_url,
            poster_url,
            duration_seconds,
            width,
            height,
            aspect_ratio,
            media_width,
            media_height,
            image_orientation,
            filter_id,
            studio_edits
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
          ),
          post_likes(count),
          post_comments!post_comments_post_id_fkey(count)
        `)
        .in('id', postIds)
        .eq('status', 'published');

      if (postsError) {
        console.error('Error fetching posts by IDs:', postsError);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Re-sort posts to match RPC order (Supabase .in() doesn't preserve order)
      const postMap = new Map(postsData.map(p => [p.id, p]));
      const sortedPosts = postIds.map((id: string) => postMap.get(id)).filter(Boolean) as any[];

      // Hydrate posts with user/business profiles and golf course data
      const personalPosts = sortedPosts.filter(p => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = sortedPosts.filter(p => p.actor_type === 'business');

      const userIds = [...new Set(personalPosts.map(post => post.user_id))];
      const businessIds = [...new Set(businessPosts.map(post => post.actor_id).filter(Boolean))] as string[];

      const { data: profiles } = userIds.length > 0
        ? await supabase.from('user_profiles').select('id, display_name, username, profile_photo_url').in('id', userIds)
        : { data: [] };

      const { data: businessAccounts } = businessIds.length > 0
        ? await supabase.from('business_accounts').select('id, name, logo_url, is_verified, category, location').in('id', businessIds)
        : { data: [] };

      // Use canonical helper to collect all course IDs
      const uniqueCourseIds = collectCourseIds(sortedPosts);
      const { data: golfCourses } = uniqueCourseIds.length > 0
        ? await supabase.from('golf_courses').select('id, name, country, sub_country, region').in('id', uniqueCourseIds)
        : { data: [] };

      const courseMap = new Map((golfCourses || []).map(c => [c.id, c]));

      // Format posts
      const formattedPosts = sortedPosts.map(post => {
        const isBusinessPost = post.actor_type === 'business';
        const userProfile = !isBusinessPost ? profiles?.find(p => p.id === post.user_id) : null;
        const businessAccount = isBusinessPost && post.actor_id ? businessAccounts?.find(b => b.id === post.actor_id) : null;
        
        const allMedia = post.post_media || [];
        const primaryMedia = allMedia.find((m: any) => m.media_type === 'video') || allMedia[0];
        
        if (!primaryMedia) return null;
        
        const isValid = (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
                        (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
        if (!isValid) return null;

        const durationSeconds = primaryMedia.media_type === 'video' ? primaryMedia.duration_seconds : undefined;
        
        const golfCourseTag = (post.post_tags || []).find((tag: any) => tag.taggable_entities?.entity_type === 'golf_club');
        let golfCourse = null;
        if (golfCourseTag?.taggable_entities) {
          const courseId = golfCourseTag.taggable_entities.entity_id;
          const fullCourse = courseMap.get(courseId);
          golfCourse = fullCourse ? {
            id: fullCourse.id, name: fullCourse.name, country: fullCourse.country || '',
            sub_country: fullCourse.sub_country, region: fullCourse.region,
          } : { id: courseId, name: golfCourseTag.taggable_entities.name, country: '' };
        } else if (post.course_id) {
          const fullCourse = courseMap.get(post.course_id);
          if (fullCourse) {
            golfCourse = {
              id: fullCourse.id, name: fullCourse.name, country: fullCourse.country || '',
              sub_country: fullCourse.sub_country, region: fullCourse.region,
            };
          }
        }

        const toNum = (v: any): number | undefined => {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return Number.isFinite(n) ? n : undefined;
        };

        let width = toNum(primaryMedia.media_width) ?? toNum(primaryMedia.width);
        let height = toNum(primaryMedia.media_height) ?? toNum(primaryMedia.height);
        let aspectRatio = toNum(primaryMedia.aspect_ratio);
        const rotation = toNum(primaryMedia.rotation);
        if (rotation && (rotation % 180) !== 0 && width && height) {
          [width, height] = [height, width];
          aspectRatio = width / height;
        } else if (!aspectRatio && width && height && height > 0) {
          aspectRatio = width / height;
        }

        // Build polymorphic creator and user
        let creator;
        let user;
        if (isBusinessPost && businessAccount) {
          creator = { type: 'business' as const, id: businessAccount.id, name: businessAccount.name || 'Business', avatarUrl: businessAccount.logo_url || undefined, verified: businessAccount.is_verified || false, subtitle: businessAccount.location || businessAccount.category || undefined };
          user = { id: businessAccount.id, name: businessAccount.name || 'Business', avatar: businessAccount.logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', verified: businessAccount.is_verified || false };
        } else {
          creator = { type: 'personal' as const, id: post.user_id, name: userProfile?.display_name || userProfile?.username || 'User', username: userProfile?.username || undefined, avatarUrl: userProfile?.profile_photo_url || undefined };
          user = { id: post.user_id, name: userProfile?.display_name || userProfile?.username || 'User', username: userProfile?.username, avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', verified: false };
        }

        return {
          id: post.id,
          type: primaryMedia.media_type as 'video' | 'image',
          src: primaryMedia.media_url,
          thumbnailSrc: primaryMedia.media_type === 'video' ? getStreamPoster(primaryMedia.media_url, '1s') || undefined : undefined,
          title: post.content || 'Post',
          likes: post.post_likes?.[0]?.count || 0,
          comments: post.post_comments?.[0]?.count || 0,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds,
          aspectRatio, width, height,
          createdAt: post.created_at,
          actorType: (post.actor_type || 'personal') as 'personal' | 'business',
          actorId: post.actor_id || post.user_id,
          creator,
          user,
          business: isBusinessPost && businessAccount ? {
            id: businessAccount.id, name: businessAccount.name, logoUrl: businessAccount.logo_url,
            isVerified: businessAccount.is_verified, category: businessAccount.category, location: businessAccount.location,
          } : undefined,
          golfCourse,
          categories: post.categories || [],
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: isFriendMap.get(post.id) ?? false, // Use actual is_friend value from RPC
          media: allMedia.filter((m: any) => isValidImageUrl(m.media_url)).map((m: any) => ({
            id: m.id,
            media_type: m.media_type,
            media_url: m.media_url,
            poster_url: m.poster_url,
            filter_id: m.filter_id,
            studio_edits: m.studio_edits,
          })),
        };
      }).filter(Boolean) as ExploreContentItem[];

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching friends-first posts:', error);
      return [];
    }
  };

  const fetchRealPosts = async (
    currentOffset: number, 
    postsPerPage: number, 
    mediaFilter?: string, 
    subFilter?: string,
    durationFilter?: { from: number; to: number | null },
    sortOption?: string
  ): Promise<ExploreContentItem[]> => {
    try {
      // Get current user to filter out their personal posts (business posts OK)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;

      // For friends-first, use RPC for global ordering
      if (sortOption === 'friends-first' && currentUserId) {
        return await fetchFriendsFirstPosts(currentOffset, postsPerPage, mediaFilter, durationFilter);
      }

      // Build the base query with select - includes actor_type/actor_id for business profiles
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          like_count,
          comment_count,
          categories,
          post_media!inner (
            id,
            media_type,
            media_url,
            poster_url,
            duration_seconds,
            width,
            height,
            aspect_ratio,
            media_width,
            media_height,
            image_orientation,
            filter_id,
            studio_edits
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
          ),
          post_likes(count),
          post_comments!post_comments_post_id_fkey(count)
        `);

      // Filter out current user's PERSONAL posts (business posts are allowed)
      // Show posts where: user_id != currentUserId OR actor_type = 'business'
      if (currentUserId) {
        query = query.or(`user_id.neq.${currentUserId},actor_type.eq.business`);
      }
      
      // Apply visibility filter - private posts only visible to owner
      const visibilityFilter = buildVisibilityFilter(currentUserId);
      query = query.or(visibilityFilter).eq('status', 'published');

      // IMPORTANT: Apply filters BEFORE range/limit for correct pagination
      // Add media type filter if specified
      if (mediaFilter === FILTER_TYPES.SHORTS) {
        query = query
          .eq('post_media.media_type', MEDIA_TYPES.VIDEO)
          .not('post_media.duration_seconds', 'is', null)
          .lte('post_media.duration_seconds', 180);
      } else if (mediaFilter === FILTER_TYPES.VIDEOS) {
        query = query.eq('post_media.media_type', MEDIA_TYPES.VIDEO);
        
        // Apply duration filters if provided
        if (durationFilter) {
          // Always exclude null durations when filtering by duration
          query = query.not('post_media.duration_seconds', 'is', null);
          
          if (durationFilter.from > 0) {
            query = query.gte('post_media.duration_seconds', durationFilter.from);
          }
          if (durationFilter.to !== null) {
            query = query.lte('post_media.duration_seconds', durationFilter.to);
          }
        }
      } else if (mediaFilter === FILTER_TYPES.PHOTOS) {
        query = query.eq('post_media.media_type', MEDIA_TYPES.IMAGE);
        
        // Apply Photos subfilters
        if (subFilter === 'portraits') {
          query = query.eq('post_media.image_orientation', 'portrait');
        } else if (subFilter === 'landscapes') {
          query = query.eq('post_media.image_orientation', 'landscape');
        }
      }

      // Apply ordering based on sort option - uses DB-level like_count/comment_count columns
      if (sortOption === 'most-liked') {
        query = query
          .order('like_count', { ascending: false })
          .order('created_at', { ascending: false }); // tie-breaker
      } else if (sortOption === 'most-discussed') {
        query = query
          .order('comment_count', { ascending: false })
          .order('created_at', { ascending: false }); // tie-breaker
      } else {
        // 'newest' or default
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply proper pagination using offset
      const fromIndex = currentOffset;
      const toIndex = currentOffset + postsPerPage - 1;
      query = query.range(fromIndex, toIndex);

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Split posts by actor type for polymorphic hydration
      const personalPosts = postsData.filter((p: any) => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = postsData.filter((p: any) => p.actor_type === 'business');

      // Get unique user IDs (for personal posts)
      const userIds = [...new Set(personalPosts.map(post => post.user_id))];
      
      // Get unique business IDs (for business posts)
      const businessIds = [...new Set(businessPosts.map((post: any) => post.actor_id).filter(Boolean))] as string[];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = userIds.length > 0
        ? await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .in('id', userIds)
        : { data: [], error: null };

      if (profilesError) {
        // Log but don't fail - gracefully continue with empty profiles
        console.warn('Error fetching profiles (continuing with placeholders):', profilesError);
      }
      
      // Get business accounts
      const { data: businessAccounts, error: businessError } = businessIds.length > 0
        ? await supabase
            .from('business_accounts')
            .select('id, name, logo_url, is_verified, category, location')
            .in('id', businessIds)
        : { data: [], error: null };
        
      if (businessError) {
        console.error('Error fetching business accounts:', businessError);
        // Don't fail - just continue without business data
      }

      // Use canonical helper to collect all course IDs
      const uniqueCourseIds = collectCourseIds(postsData);
      
      // Batch fetch golf course details
      const { data: golfCourses, error: coursesError } = uniqueCourseIds.length > 0
        ? await supabase
            .from('golf_courses')
            .select('id, name, country, sub_country, region')
            .in('id', uniqueCourseIds)
        : { data: [], error: null };
        
      if (coursesError) {
        console.error('Error fetching golf courses:', coursesError);
        // Don't fail - just continue without course data
      }
      
      // Create lookup map for courses
      const courseMap = new Map(
        (golfCourses || []).map(c => [c.id, c])
      );

      // Format posts for explore grid with polymorphic creator hydration
      const formattedPosts = postsData.map((post: any) => {
        const isBusinessPost = post.actor_type === 'business';
        
        const userProfile = !isBusinessPost 
          ? profiles?.find(profile => profile.id === post.user_id) 
          : null;
          
        const businessAccount = isBusinessPost && post.actor_id
          ? businessAccounts?.find(b => b.id === post.actor_id)
          : null;
        const allMedia = (post.post_media || []);
        const primaryMedia = allMedia.find((m: any) => m.media_type === 'video') || allMedia[0]; // Prefer video as primary
        
        const isValid =
          (primaryMedia.media_type === 'image' && isValidImageUrl(primaryMedia.media_url)) ||
          (primaryMedia.media_type === 'video' && !!primaryMedia.media_url);
        
        if (!primaryMedia || !isValid) {
          return null;
        }

        // Client-side fallback for duration filtering (in case duration_seconds is missing)
        const durationSeconds = primaryMedia.media_type === 'video' 
          ? (primaryMedia as any).duration_seconds
          : undefined;

        if (durationFilter && durationSeconds != null) {
          if (durationFilter.to !== null && durationSeconds > durationFilter.to) {
            return null;
          }
          if (durationFilter.from > 0 && durationSeconds < durationFilter.from) {
            return null;
          }
        }

        // Find golf course from post tags OR direct course_id FK
        const golfCourseTag = (post.post_tags || []).find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        
        if (golfCourseTag?.taggable_entities) {
          const courseId = golfCourseTag.taggable_entities.entity_id;
          const fullCourse = courseMap.get(courseId);
          
          golfCourse = fullCourse ? {
            id: fullCourse.id,
            name: fullCourse.name,
            country: fullCourse.country || '',
            sub_country: fullCourse.sub_country,
            region: fullCourse.region,
          } : {
            id: courseId,
            name: golfCourseTag.taggable_entities.name,
            country: '',
          };
        } else if (post.course_id) {
          const fullCourse = courseMap.get(post.course_id);
          if (fullCourse) {
            golfCourse = {
              id: fullCourse.id,
              name: fullCourse.name,
              country: fullCourse.country || '',
              sub_country: fullCourse.sub_country,
              region: fullCourse.region,
            };
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

        // Normalize dimensions and aspect ratio (handle strings, nulls, rotation)
        const toNum = (v: any): number | undefined => {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return Number.isFinite(n) ? n : undefined;
        };

        let width = toNum((primaryMedia as any).media_width) ?? toNum((primaryMedia as any).width);
        let height = toNum((primaryMedia as any).media_height) ?? toNum((primaryMedia as any).height);
        let aspectRatio = toNum((primaryMedia as any).aspect_ratio);

        // Handle rotated videos (90° or 270° rotation swaps dimensions)
        const rotation = toNum((primaryMedia as any).rotation);
        if (rotation && (rotation % 180) !== 0 && width && height) {
          [width, height] = [height, width]; // Swap for rotated video
          aspectRatio = width / height;
        } else if (!aspectRatio && width && height && height > 0) {
          aspectRatio = width / height;
        }

        const formattedPost = {
          id: post.id,
          type: primaryMedia.media_type as 'video' | 'image',
          src: primaryMedia.media_url,
          thumbnailSrc: primaryMedia.media_type === 'video' 
            ? getStreamPoster(primaryMedia.media_url, '1s') || undefined
            : undefined,
          title: post.content || 'Post',
          likes: post.post_likes?.[0]?.count || 0,
          comments: post.post_comments?.[0]?.count || 0,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds, // Store numeric value for filtering
          aspectRatio,
          width,
          height,
          createdAt: post.created_at,
          actorType: (post.actor_type || 'personal') as 'personal' | 'business',
          actorId: post.actor_id || post.user_id,
          // Polymorphic user object - use business profile if available
          user: isBusinessPost && businessAccount
            ? {
                id: businessAccount.id,
                name: businessAccount.name || 'Business',
                avatar: businessAccount.logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                verified: businessAccount.is_verified || false,
              }
            : {
                id: post.user_id,
                name: userProfile?.display_name || userProfile?.username || 'User',
                username: userProfile?.username,
                avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                verified: false,
              },
          // Also include business object for components that need it
          business: isBusinessPost && businessAccount ? {
            id: businessAccount.id,
            name: businessAccount.name,
            logoUrl: businessAccount.logo_url,
            isVerified: businessAccount.is_verified,
            category: businessAccount.category,
            location: businessAccount.location,
          } : undefined,
          golfCourse,
          categories: post.categories || [],
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: Math.random() > 0.5,
          media: allMedia.filter(m => isValidImageUrl(m.media_url)).map((m: any) => ({
            id: m.id,
            media_type: m.media_type,
            media_url: m.media_url,
            poster_url: m.poster_url,
            filter_id: m.filter_id,
            studio_edits: m.studio_edits,
          })),
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

  // Helper: Find the primary video media from a post (uses display_order, then created_at)
  const getPrimaryVideoMedia = (post: any): any | null => {
    const mediaArray = post.post_media;
    if (!Array.isArray(mediaArray) || mediaArray.length === 0) return null;
    
    // Sort by display_order (nulls last), then created_at ascending
    const sorted = [...mediaArray].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    // Return first video found
    return sorted.find(m => m.media_type === 'video') || null;
  };

  // Helper: Check if a post passes vertical-only criteria
  // Returns meta_pending for posts with valid duration but missing AR (allowed through)
  // Review posts (categories includes 'review' OR has source_review_id) bypass video-only requirement
  const passesVerticalFilter = (post: any): { passes: boolean; reason?: string } => {
    // Check if this is a review post - allow image-only review posts into Clubhouse
    const isReviewPost = 
      (Array.isArray(post.categories) && post.categories.includes('review')) ||
      !!post.source_review_id;
    
    if (isReviewPost) {
      // Review posts are allowed regardless of media type (photos, videos, or both)
      // Check both post_media and course_review_media (via review_media field if present)
      const hasPostMedia = post.post_media && post.post_media.length > 0;
      const hasReviewMedia = post.review_media && post.review_media.length > 0;
      
      if (!hasPostMedia && !hasReviewMedia) {
        // Allow review posts with source_review_id through even without media attached to post
        // The feed will fetch media from course_review_media via source_review_id
        if (post.source_review_id) {
          return { passes: true, reason: 'review_post_with_source' };
        }
        return { passes: false, reason: 'no_media' };
      }
      return { passes: true, reason: 'review_post' };
    }
    
    // Non-review posts: apply standard video-only criteria
    const primaryMedia = getPrimaryVideoMedia(post);
    
    if (!primaryMedia) {
      return { passes: false, reason: 'no_media' };
    }
    if (primaryMedia.media_type !== 'video') {
      return { passes: false, reason: 'not_video' };
    }
    
    // Duration check: must have duration and be under 120s
    if (typeof primaryMedia.duration_seconds !== 'number') {
      return { passes: false, reason: 'duration_missing' };
    }
    if (primaryMedia.duration_seconds >= 120) {
      return { passes: false, reason: 'duration_ge_120' };
    }
    
    // Vertical-only check (when enabled)
    if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
      let { width, height, aspect_ratio } = primaryMedia;
      
      // Compute AR from width/height if aspect_ratio is null
      if (aspect_ratio == null && width != null && height != null && height > 0) {
        aspect_ratio = width / height;
      }
      
      // If AR still missing, allow through as "meta_pending" - playback still works
      if (aspect_ratio == null) {
        return { passes: true, reason: 'meta_pending' };
      }
      
      // Must be within vertical band
      if (aspect_ratio < VERTICAL_MIN_AR || aspect_ratio > VERTICAL_MAX_AR) {
        return { passes: false, reason: 'ar_outside_band' };
      }
    }
    
    return { passes: true };
  };

  // ============================================================================
  // FEED CURATION ALGORITHM
  // Rule 1: Every 3rd post should be from friends/followed users (social slot)
  // Rule 2: Every 6th post is a dedicated review slot (priority: friend > followed > global reviews)
  // ============================================================================

  interface CurationBuckets {
    friendPosts: any[];
    friendReviews: any[];
    followedPosts: any[];
    followedReviews: any[];
    globalPosts: any[];
    globalReviews: any[];
  }

  const categorizePosts = (
    posts: any[],
    friendIds: Set<string>,
    followedIds: Set<string>
  ): CurationBuckets => {
    const buckets: CurationBuckets = {
      friendPosts: [],
      friendReviews: [],
      followedPosts: [],
      followedReviews: [],
      globalPosts: [],
      globalReviews: [],
    };

    for (const post of posts) {
      const userId = post.user_id;
      const isReview = !!post.source_review_id;
      const isFriend = friendIds.has(userId);
      const isFollowed = followedIds.has(userId);

      if (isFriend) {
        if (isReview) {
          buckets.friendReviews.push(post);
        } else {
          buckets.friendPosts.push(post);
        }
      } else if (isFollowed) {
        if (isReview) {
          buckets.followedReviews.push(post);
        } else {
          buckets.followedPosts.push(post);
        }
      } else {
        if (isReview) {
          buckets.globalReviews.push(post);
        } else {
          buckets.globalPosts.push(post);
        }
      }
    }

    return buckets;
  };

  const curateFeed = (
    buckets: CurationBuckets,
    targetCount: number
  ): any[] => {
    const result: any[] = [];

    // Helper to get next non-review post with priority
    const getNextNonReviewPost = (): any | null => {
      // Priority: friend > followed > global
      if (buckets.friendPosts.length > 0) return buckets.friendPosts.shift();
      if (buckets.followedPosts.length > 0) return buckets.followedPosts.shift();
      if (buckets.globalPosts.length > 0) return buckets.globalPosts.shift();
      return null;
    };

    // Helper to get next friend/followed post (Rule 1)
    const getNextSocialPost = (): any | null => {
      // Priority: friend > followed, but can include reviews if allowed
      if (buckets.friendPosts.length > 0) return buckets.friendPosts.shift();
      if (buckets.followedPosts.length > 0) return buckets.followedPosts.shift();
      // Fallback to friend/followed reviews if no regular posts
      if (buckets.friendReviews.length > 0) return buckets.friendReviews.shift();
      if (buckets.followedReviews.length > 0) return buckets.followedReviews.shift();
      return null;
    };

    // Helper to get next review post with priority (Rule 2)
    const getNextReviewPost = (): any | null => {
      // Priority: friend > followed > global
      if (buckets.friendReviews.length > 0) return buckets.friendReviews.shift();
      if (buckets.followedReviews.length > 0) return buckets.followedReviews.shift();
      if (buckets.globalReviews.length > 0) return buckets.globalReviews.shift();
      return null;
    };

    // Helper to get any available post (fallback)
    const getAnyPost = (): any | null => {
      // Try non-reviews first, then reviews
      const nonReview = getNextNonReviewPost();
      if (nonReview) return nonReview;
      return getNextReviewPost();
    };

    // Build the curated feed
    // Rule 1: Every 3rd position (3, 6, 9...) is a social slot (friends/followed content)
    // Rule 2: Every 6th position (6, 12, 18...) is a dedicated review slot
    // Note: Position 6, 12, 18... are both social AND review slots - review takes priority
    for (let position = 1; position <= targetCount; position++) {
      let post: any | null = null;

      const isReviewSlot = position % 6 === 0; // Every 6th position: 6, 12, 18...
      const isSocialSlot = position % 3 === 0; // Every 3rd position: 3, 6, 9, 12...

      if (isReviewSlot) {
        // REVIEW SLOT (positions 6, 12, 18, 24...)
        // Priority: friend reviews > followed reviews > global reviews
        post = getNextReviewPost();
        
        // Fallback: if no reviews available, use standard priority (non-review posts)
        if (!post) {
          post = getNextNonReviewPost() || getAnyPost();
        }
      } else if (isSocialSlot) {
        // SOCIAL SLOT (positions 3, 9, 15, 21... - excluding review slots)
        // Priority: friend/followed content (posts or reviews)
        post = getNextSocialPost();
        
        // Fallback to any post if no social content available
        if (!post) {
          post = getAnyPost();
        }
      } else {
        // REGULAR SLOT - standard priority order
        // Priority: friend > followed > global (non-review posts first)
        post = getNextNonReviewPost();
        
        // If no non-review posts available, try any remaining post
        if (!post) {
          post = getAnyPost();
        }
      }

      if (post) {
        result.push(post);
      } else {
        // No more posts available
        break;
      }
    }

    return result;
  };

  // NEW: Clubhouse explore feed — short videos only (<120s, first media gating)
  // Uses "fetch-until-enough-valid" pattern with curation algorithm
  const fetchClubhouseExploreShorts = async (
    limit: number = 30,
    cursor: string | null = null
  ): Promise<ExploreContentItem[]> => {
    try {
      // Get current user for relationship lookups
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentUserId = currentUser?.id;

      // ============================================================================
      // STEP 1: Fetch user relationships (friends and followed users)
      // ============================================================================
      let friendIds = new Set<string>();
      let followedIds = new Set<string>();

      if (currentUserId) {
        // Fetch friends (bidirectional - status = 'accepted')
        const { data: friendships } = await supabase
          .from('user_friends')
          .select('friend_id, user_id')
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
          .eq('status', 'accepted');

        if (friendships) {
          for (const f of friendships) {
            // Add the other person in the friendship
            if (f.user_id === currentUserId) {
              friendIds.add(f.friend_id);
            } else {
              friendIds.add(f.user_id);
            }
          }
        }

        // Fetch followed users
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', currentUserId);

        if (following) {
          for (const f of following) {
            // Don't double-count friends as followed
            if (!friendIds.has(f.following_id)) {
              followedIds.add(f.following_id);
            }
          }
        }
      }

      // ============================================================================
      // STEP 2: Fetch extra posts (3x limit to ensure enough for curation)
      // ============================================================================
      const TARGET_COUNT = limit;
      const FETCH_MULTIPLIER = 3; // Fetch 3x to ensure enough content after curation
      const MAX_FETCHES = 5;
      const PAGE_SIZE = Math.max(limit * FETCH_MULTIPLIER, 60);
      
      let validPosts: any[] = [];
      let currentCursor = cursor;
      let fetchCount = 0;
      let totalRawFetched = 0;
      
      // Rejection counters for debugging
      const rejectionReasons = {
        no_media: 0,
        not_video: 0,
        duration_missing: 0,
        duration_ge_120: 0,
        missing_meta: 0,
        ar_outside_band: 0,
        meta_pending: 0,
        passed: 0
      };
      
      // Fetch enough posts for curation (need extra to fill buckets)
      const CURATION_TARGET = TARGET_COUNT * FETCH_MULTIPLIER;
      
      while (validPosts.length < CURATION_TARGET && fetchCount < MAX_FETCHES) {
        fetchCount++;
        
        let query = supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            actor_type,
            actor_id,
            course_id,
            categories,
            source_review_id,
            post_media!inner (
              id,
              media_type,
              media_url,
              duration_seconds,
              aspect_ratio,
              orientation,
              width,
              height,
              poster_url,
              created_at,
              display_order,
              studio_edits,
              filter_id
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
            ),
            post_likes(count),
            post_comments!post_comments_post_id_fkey(count)
          `)
          .order('display_order', { ascending: true, foreignTable: 'post_media', nullsFirst: false })
          .order('created_at', { ascending: true, foreignTable: 'post_media' })
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (currentCursor) {
          query = query.lt('created_at', currentCursor);
        }

        query = query.limit(PAGE_SIZE);

        const { data: postsData, error } = await query;

        if (error) {
          console.error('[useRealPostsFetcher] Query error:', error);
          // If this is the first fetch and we have no posts, throw to surface the error
          if (fetchCount === 1 && validPosts.length === 0) {
            throw new Error(`Posts query failed: ${error.message}`);
          }
          break;
        }

        if (!postsData || postsData.length === 0) break;
        
        totalRawFetched += postsData.length;
        currentCursor = postsData[postsData.length - 1].created_at;

        for (const post of postsData) {
          if (validPosts.length >= CURATION_TARGET) break;
          
          const result = passesVerticalFilter(post);
          
          if (result.passes) {
            validPosts.push(post);
            rejectionReasons.passed++;
          } else if (result.reason) {
            rejectionReasons[result.reason as keyof typeof rejectionReasons]++;
          }
        }
      }

      // Warn if no posts passed the vertical filter
      if (validPosts.length === 0) {
        console.warn('[fetchClubhouseExploreShorts] No posts passed vertical filter:', {
          totalRawFetched,
          rejectionReasons,
        });
      }

      // ============================================================================
      // STEP 3: Apply curation algorithm
      // ============================================================================
      const buckets = categorizePosts(validPosts, friendIds, followedIds);

      const curatedPosts = curateFeed(buckets, TARGET_COUNT);

      // ============================================================================
      // STEP 4: Hydrate curated posts with user/business/course data
      // ============================================================================
      
      // Split CURATED posts by actor_type for polymorphic hydration
      const personalPosts = curatedPosts.filter(p => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = curatedPosts.filter(p => p.actor_type === 'business');
      
      // Get unique user IDs (for personal posts)
      const userIds = [...new Set(personalPosts.map(post => post.user_id))] as string[];
      
      // Get unique business IDs (for business posts)
      const businessIds = [...new Set(businessPosts.map(post => post.actor_id).filter(Boolean))] as string[];
      
      // Fetch user profiles
      const { data: profiles, error: profilesError } = userIds.length > 0 
        ? await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url, home_club, eg_handicap_index, show_handicap')
          .in('id', userIds)
        : { data: [], error: null };

      if (profilesError) {
        console.error('[DataFetch] Profiles error:', profilesError);
        // Don't fail - continue with empty profiles, posts will still show
      }
      
      // Fetch business accounts
      const { data: businessAccounts, error: businessError } = businessIds.length > 0
        ? await supabase
          .from('business_accounts')
          .select('id, name, logo_url, is_verified, category, location')
          .in('id', businessIds)
        : { data: [], error: null };
        
      if (businessError) {
        console.error('[DataFetch] Business accounts error:', businessError);
        // Don't fail - just continue without business data
      }

      // ===== Golf course hydration (CRITICAL for "Played at …" row) =====
      // Use canonical helper to collect all course IDs
      const uniqueCourseIds = collectCourseIds(curatedPosts);

      const { data: golfCourses, error: coursesError } = uniqueCourseIds.length > 0
        ? await supabase
          .from('golf_courses')
          .select('id, name, country, sub_country, region')
          .in('id', uniqueCourseIds)
        : { data: [], error: null };

      if (coursesError) {
        console.error('[ClubhouseCourseHydration] golf_courses error:', coursesError);
        // Don't fail - just continue without course data
      }

      const courseMap = new Map((golfCourses || []).map((c: any) => [c.id, c]));

      // ===== Fetch ratings for review posts =====
      const reviewPostIds = curatedPosts
        .filter(p => p.source_review_id)
        .map(p => p.source_review_id)
        .filter(Boolean) as string[];
      
      const { data: ratings, error: ratingsError } = reviewPostIds.length > 0
        ? await supabase
          .from('course_ratings')
          .select('id, rating')
          .in('id', reviewPostIds)
        : { data: [], error: null };

      if (ratingsError) {
        console.error('[ClubhouseRatings] course_ratings error:', ratingsError);
      }

      const ratingMap = new Map((ratings || []).map(r => [r.id, r.rating]));

      // Format posts with polymorphic creator hydration
      const formattedPosts = curatedPosts.map(post => {
        const firstMedia = post.post_media[0];
        const isBusinessPost = post.actor_type === 'business';
        
        // Determine relationship status for this post's creator
        const postUserId = post.user_id;
        const isFriend = friendIds.has(postUserId);
        const isFollowedUser = followedIds.has(postUserId);
        
        // Get creator info based on actor type
        let userProfile: any = null;
        let businessAccount: any = null;
        
        if (isBusinessPost && post.actor_id) {
          businessAccount = businessAccounts?.find(b => b.id === post.actor_id);
        } else {
          userProfile = profiles?.find(profile => profile.id === post.user_id);
        }

        // Find golf course from tags OR direct course_id FK
        const golfCourseTag = (post.post_tags || []).find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        if (golfCourseTag?.taggable_entities) {
          const courseId = golfCourseTag.taggable_entities.entity_id;
          const fullCourse = courseMap.get(courseId);

          golfCourse = fullCourse ? {
            id: fullCourse.id,
            name: fullCourse.name,
            country: fullCourse.country || '',
            sub_country: fullCourse.sub_country,
            region: fullCourse.region,
          } : {
            id: courseId,
            name: golfCourseTag.taggable_entities.name,
            country: '',
          };
        } else if (post.course_id) {
          // Fallback to direct course_id FK (newer posts)
          const fullCourse = courseMap.get(post.course_id);
          if (fullCourse) {
            golfCourse = {
              id: fullCourse.id,
              name: fullCourse.name,
              country: fullCourse.country || '',
              sub_country: fullCourse.sub_country,
              region: fullCourse.region,
            };
          }
        }
        const durationSeconds = firstMedia.duration_seconds;

        // Build polymorphic creator object
        const creator = isBusinessPost && businessAccount
          ? {
              type: 'business' as const,
              id: businessAccount.id,
              name: businessAccount.name || 'Business',
              avatarUrl: businessAccount.logo_url || undefined,
              verified: businessAccount.is_verified || false,
              subtitle: businessAccount.location || businessAccount.category || undefined,
            }
          : {
              type: 'personal' as const,
              id: post.user_id,
              name: userProfile?.display_name || userProfile?.username || 'User',
              username: userProfile?.username || undefined,
              avatarUrl: userProfile?.profile_photo_url || undefined,
              verified: Math.random() > 0.7, // TODO: use real verified status
              subtitle: userProfile?.home_club || undefined,
              handicap: userProfile?.show_handicap !== false && userProfile?.eg_handicap_index != null 
                ? userProfile.eg_handicap_index 
                : undefined,
            };

        // Also build legacy user object for backward compatibility
        const user = isBusinessPost && businessAccount
          ? {
              id: businessAccount.id,
              name: businessAccount.name || 'Business',
              username: undefined,
              avatar: businessAccount.logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
              verified: businessAccount.is_verified || false,
              homeClub: undefined,
              handicap: undefined,
            }
          : {
              id: post.user_id,
              name: userProfile?.display_name || userProfile?.username || 'User',
              username: userProfile?.username,
              avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
              verified: Math.random() > 0.7,
              homeClub: userProfile?.home_club || undefined,
              handicap: userProfile?.show_handicap !== false && userProfile?.eg_handicap_index != null 
                ? userProfile.eg_handicap_index 
                : undefined,
            };

        // Build business object for business posts
        const business = isBusinessPost && businessAccount
          ? {
              id: businessAccount.id,
              name: businessAccount.name,
              logoUrl: businessAccount.logo_url,
              isVerified: businessAccount.is_verified,
              category: businessAccount.category,
              location: businessAccount.location,
            }
          : undefined;

        // Determine if this is a review post (only if linked to actual course review)
        // Note: Having 'review' category alone does NOT make it a review post
        const isReviewPost = !!post.source_review_id;
        
        // Get rating for review posts
        const reviewRating = post.source_review_id 
          ? ratingMap.get(post.source_review_id) 
          : null;

        return {
          id: post.id,
          type: firstMedia.media_type as 'video' | 'image',
          src: firstMedia.media_url,
          thumbnailSrc: firstMedia.poster_url || getStreamPoster(firstMedia.media_url, '1s') || undefined,
          title: post.content || 'Post',
          likes: post.post_likes?.[0]?.count || 0,
          comments: post.post_comments?.[0]?.count || 0,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds: durationSeconds ?? undefined,
          createdAt: post.created_at,
          actorType: (post.actor_type || 'personal') as 'personal' | 'business',
          actorId: post.actor_id || post.user_id,
          creator,
          user,
          business,
          golfCourse,
          categories: post.categories || [],
          // Review post fields
          isReview: isReviewPost,
          sourceReviewId: post.source_review_id || null,
          reviewRating: reviewRating ?? null,
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          // Real relationship flags based on fetched data
          isFollowing: isFollowedUser || isFriend,
          isFriend: isFriend,
          media: post.post_media.map((m: any) => ({
            id: m.id,
            media_type: m.media_type as 'video' | 'image',
            media_url: m.media_url,
            width: m.width,
            height: m.height,
            aspect_ratio: m.aspect_ratio,
            studio_edits: m.studio_edits,
            filter_id: m.filter_id,
            poster_url: m.poster_url,
            display_order: m.display_order,
          })),
          audioTrack: !isReviewPost && Math.random() > 0.6 ? {
            title: ["Eye of the Tiger", "The Final Countdown", "Original Audio"][Math.floor(Math.random() * 3)],
            artist: Math.random() > 0.5 ? "Survivor" : undefined,
            isOriginal: Math.random() > 0.5
          } : undefined
        };
      });

      console.log('[fetchClubhouseExploreShorts] Summary:', {
        totalRawFetched,
        validPostsAfterFilter: validPosts.length,
        curatedPostsCount: curatedPosts.length,
        formattedPostsCount: formattedPosts.length,
        rejectionReasons,
      });

      return formattedPosts;
    } catch (error) {
      console.error('[DataFetch] Error:', error);
      return [];
    }
  };

  return { fetchRealPosts, fetchFriendsPosts, fetchClubhouseExploreShorts };
};