
import { mockExploreContent } from '@/components/explore/mockData';
import { ExploreContentItem } from '@/components/explore/types';
import { isValidImageUrl } from './urlValidation';

export const useMockPostsHandler = () => {
  const getMockPosts = (currentMockOffset: number, postsPerPage: number): ExploreContentItem[] => {
    console.log('Getting mock posts from offset:', currentMockOffset);
    
    const start = currentMockOffset % mockExploreContent.length;
    const end = Math.min(start + postsPerPage, mockExploreContent.length);
    
    let posts = mockExploreContent.slice(start, end);
    console.log('Initial mock posts slice:', posts.length);
    
    // Filter out posts with invalid image URLs
    posts = posts.filter(post => {
      const isValid = isValidImageUrl(post.src);
      if (!isValid) {
        console.log('Filtering out invalid mock post:', post.id, post.src);
      }
      return isValid;
    });
    
    console.log('Mock posts after filtering:', posts.length);
    
    // If we need more posts and reached end, wrap around
    if (posts.length < postsPerPage && mockExploreContent.length > 0) {
      const remaining = postsPerPage - posts.length;
      console.log('Need more posts, wrapping around for:', remaining);
      
      const wrappedPosts = mockExploreContent.slice(0, remaining)
        .filter(post => {
          const isValid = isValidImageUrl(post.src);
          if (!isValid) {
            console.log('Filtering out invalid wrapped post:', post.id, post.src);
          }
          return isValid;
        })
        .map(post => ({
          ...post,
          id: `${post.id}-${Math.random()}` // Ensure unique IDs
        }));
      posts = [...posts, ...wrappedPosts];
      console.log('Final mock posts with wrapped:', posts.length);
    }
    
    return posts;
  };

  return { getMockPosts };
};
