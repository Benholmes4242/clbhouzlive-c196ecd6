import { useEffect, useMemo } from 'react';
import { useTrendingFeed } from './useTrendingFeed';
import { useContentPreloader } from './useContentPreloader';

export const useEnhancedTrendingFeed = () => {
  const {
    userPosts,
    userPostsLoading,
    followedUsersPosts,
    followedPostsLoading,
    optimisticPosts,
    externalVideos,
    externalVideosLoading,
    refetchUserPosts,
    refetchFollowedPosts,
  } = useTrendingFeed();

  // Prepare all posts for preloading
  const allPosts = useMemo(() => {
    return [...optimisticPosts, ...userPosts, ...followedUsersPosts];
  }, [optimisticPosts, userPosts, followedUsersPosts]);

  // Extract media content for preloading
  const preloadableContent = useMemo(() => {
    const content: Array<{ id: string; type: 'image' | 'video'; url: string }> = [];
    
    allPosts.forEach(post => {
      post.post_media.forEach(media => {
        if (media.media_type === 'image' || media.media_type === 'video') {
          content.push({
            id: `${post.id}-${media.id}`,
            type: media.media_type,
            url: media.media_url,
          });
        }
      });
    });

    return content;
  }, [allPosts]);

  // Set up content preloader
  const { preloadAhead, isPreloaded } = useContentPreloader({
    preloadDistance: 5,
    enabled: true,
    onPreloadComplete: (id) => {
      console.log(`Preloaded trending content: ${id}`);
    },
  });

  // Start preloading when content is available
  useEffect(() => {
    if (preloadableContent.length > 0) {
      // Start preloading from the first item
      preloadAhead(0, preloadableContent);
    }
  }, [preloadableContent, preloadAhead]);

  return {
    userPosts,
    userPostsLoading,
    followedUsersPosts,
    followedPostsLoading,
    optimisticPosts,
    externalVideos,
    externalVideosLoading,
    refetchUserPosts,
    refetchFollowedPosts,
    allPosts,
    isPreloaded,
    preloadAhead: (index: number) => preloadAhead(index, preloadableContent),
  };
};