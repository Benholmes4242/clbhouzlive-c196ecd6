import { VideoPost, UserPostWithType } from '@/components/feed/types';
import { sortContentByTime } from '@/utils/contentSorting';

export const filterExternalVideos = (externalVideos: VideoPost[]) => {
  // Filter out example friend videos with early return for performance
  return externalVideos.length > 0 ? externalVideos.filter(video => 
    video.type === 'friend' &&
    !video.user.username?.includes('mikej_golf') && 
    !video.user.username?.includes('sarahgolf') &&
    !video.user.name?.includes('Mike Johnson') &&
    !video.user.name?.includes('Sarah Chen')
  ) : [];
};

export const combineAndDeduplicatePosts = (
  userPosts: any[],
  followedUsersPosts: any[]
): UserPostWithType[] => {
  // Convert posts to the correct type and include ALL user posts (including current user's)
  const allUserPosts: UserPostWithType[] = [
    ...userPosts.map(post => ({ ...post, type: 'user_post' as const })),
    ...followedUsersPosts.map(post => ({ ...post, type: 'user_post' as const }))
  ];

  // Deduplicate posts by ID to prevent showing the same post twice
  return allUserPosts.reduce((acc, post) => {
    if (!acc.find(existingPost => existingPost.id === post.id)) {
      acc.push(post);
    }
    return acc;
  }, [] as UserPostWithType[]);
};

export const processFeedContent = (
  userPosts: any[],
  followedUsersPosts: any[],
  externalVideos: VideoPost[]
) => {
  const realFriendVideos = filterExternalVideos(externalVideos);
  const uniqueUserPosts = combineAndDeduplicatePosts(userPosts, followedUsersPosts);
  
  // Combine all content
  const allContent: (VideoPost | UserPostWithType)[] = [
    ...uniqueUserPosts,
    ...realFriendVideos
  ];

  return sortContentByTime(allContent);
};