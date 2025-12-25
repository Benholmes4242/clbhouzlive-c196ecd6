import { supabase } from '@/integrations/supabase/client';
import { ExploreContentItem, FILTER_TYPES, MEDIA_TYPES } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';
import { FEATURE_FLAGS, VERTICAL_MIN_AR, VERTICAL_MAX_AR } from '@/config/featureFlags';
import { getStreamPoster } from '@/utils/stream';

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

      // Build query filters for polymorphic following
      const orFilters: string[] = [];
      if (followedUserIds.length > 0) {
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
        .or(orFilters.join(','))
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

      // Split posts by actor type for polymorphic hydration
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
        console.error('Error fetching profiles:', profilesError);
        return [];
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

      // Format posts for explore grid with polymorphic creator hydration
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
          // IMPORTANT: Stop capturing immediately after "Golf Club", "Golf Course", or "GC"
          const courseMatch = contentText.match(/📍\s*(?:Played at\s+)?([^,\n.!?]+(?:Golf Club|Golf Course|GC))/i) ||
                            contentText.match(/at\s+([^,\n.!?]+(?:Golf Club|Golf Course|GC))/i);
          
          if (courseMatch) {
            const courseName = courseMatch[1].trim()
              .replace(/\([^)]*\)/g, '') // Remove any parentheses content
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
            };

        // Legacy user object
        const user = isBusinessPost && businessAccount
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
              verified: Math.random() > 0.7,
            };

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
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: true,
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

  const fetchRealPosts = async (
    currentOffset: number, 
    postsPerPage: number, 
    mediaFilter?: string, 
    subFilter?: string,
    durationFilter?: { from: number; to: number | null }
  ): Promise<ExploreContentItem[]> => {
    try {
      // Build the base query with select
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
            width,
            height,
            aspect_ratio,
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
        `);

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

      // Apply ordering and pagination AFTER filters
      query = query
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + postsPerPage - 1);

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
          // IMPORTANT: Stop capturing immediately after "Golf Club", "Golf Course", or "GC"
          const courseMatch = contentText.match(/📍\s*(?:Played at\s+)?([^,\n.!?]+(?:Golf Club|Golf Course|GC))/i) ||
                            contentText.match(/at\s+([^,\n.!?]+(?:Golf Club|Golf Course|GC))/i);
          
          if (courseMatch) {
            const courseName = courseMatch[1].trim()
              .replace(/\([^)]*\)/g, '') // Remove any parentheses content
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
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: durationSeconds ? `${durationSeconds}s` : undefined,
          durationSeconds, // Store numeric value for filtering
          aspectRatio,
          width,
          height,
          createdAt: post.created_at, // Map created_at to createdAt
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

  // NEW: Clubhouse explore feed — short videos only (<120s, first media gating)
  const fetchClubhouseExploreShorts = async (
    limit: number = 30,
    cursor: string | null = null
  ): Promise<ExploreContentItem[]> => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
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
            created_at
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
        .order('created_at', { ascending: true, foreignTable: 'post_media' })
        .order('created_at', { ascending: false })
        .limit(1, { foreignTable: 'post_media' });

      // Filter: video only
      // PHASE A HOTFIX: Removed strict duration_seconds filter from DB query
      // Now allowing null duration_seconds (for business posts missing metadata)
      query = query.eq('post_media.media_type', 'video');

      // Apply vertical-only aspect ratio band when flag is enabled (TikTok-style)
      // HOTFIX: Removed from DB query to allow business posts with NULL metadata
      // For personal posts with metadata: enforce vertical band
      // For business posts: allow through (until metadata pipeline + backfill complete)
      // if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
      //   query = query... (moved to JS filter below)
      // }

      // Cursor-based pagination
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      query = query.limit(limit);

      const { data: postsData, error } = await query;

      if (error) {
        console.error('[DataFetch] Error:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Defensive filter: ensure first media is video with valid metadata
      const validPosts = postsData.filter(post => {
        const firstMedia = post.post_media?.[0];
        if (!firstMedia || firstMedia.media_type !== 'video') return false;
        
        // Duration check: must have duration and be under limit
        if (typeof firstMedia.duration_seconds !== 'number') return false;
        if (firstMedia.duration_seconds >= 120) return false;
        
        // Vertical-only check: applies uniformly to all posts (business + personal)
        if (FEATURE_FLAGS.CLUBHOUSE_VERTICAL_ONLY) {
          const { width, height, aspect_ratio } = firstMedia;
          
          // All posts must have metadata to pass
          if (width == null || height == null || aspect_ratio == null) {
            return false;
          }
          
          // All posts must be within vertical band
          if (aspect_ratio < VERTICAL_MIN_AR || aspect_ratio > VERTICAL_MAX_AR) {
            return false;
          }
        }
        
        return true;
      });

      // Split posts by actor_type for polymorphic hydration
      const personalPosts = validPosts.filter(p => !p.actor_type || p.actor_type === 'personal');
      const businessPosts = validPosts.filter(p => p.actor_type === 'business');
      
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
        return [];
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

      // Format posts with polymorphic creator hydration
      const formattedPosts = validPosts.map(post => {
        const firstMedia = post.post_media[0];
        const isBusinessPost = post.actor_type === 'business';
        
        // Get creator info based on actor type
        let userProfile: any = null;
        let businessAccount: any = null;
        
        if (isBusinessPost && post.actor_id) {
          businessAccount = businessAccounts?.find(b => b.id === post.actor_id);
        } else {
          userProfile = profiles?.find(profile => profile.id === post.user_id);
        }

        // Find golf course from tags
        const golfCourseTag = (post.post_tags || []).find(
          tag => tag.taggable_entities?.entity_type === 'golf_club'
        );

        let golfCourse = null;
        if (golfCourseTag?.taggable_entities) {
          golfCourse = {
            id: golfCourseTag.taggable_entities.entity_id,
            name: golfCourseTag.taggable_entities.name,
            country: 'Unknown'
          };
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

        return {
          id: post.id,
          type: 'video' as const,
          src: firstMedia.media_url,
          thumbnailSrc: firstMedia.poster_url || getStreamPoster(firstMedia.media_url, '1s') || undefined,
          title: post.content || 'Video',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
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
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'Featured'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: Math.random() > 0.5,
          media: [{
            id: firstMedia.id,
            media_type: firstMedia.media_type as 'video' | 'image',
            media_url: firstMedia.media_url,
            width: firstMedia.width,
            height: firstMedia.height,
            aspect_ratio: firstMedia.aspect_ratio
          } as any],
          audioTrack: Math.random() > 0.6 ? {
            title: ["Eye of the Tiger", "The Final Countdown", "Original Audio"][Math.floor(Math.random() * 3)],
            artist: Math.random() > 0.5 ? "Survivor" : undefined,
            isOriginal: Math.random() > 0.5
          } : undefined
        };
      });

      return formattedPosts;
    } catch (error) {
      console.error('[DataFetch] Error:', error);
      return [];
    }
  };

  return { fetchRealPosts, fetchFriendsPosts, fetchClubhouseExploreShorts };
};