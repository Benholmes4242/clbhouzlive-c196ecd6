
import { VideoPost, UserPostWithType } from '@/components/feed/types';

export const sortContentByTime = (content: (VideoPost | UserPostWithType)[]): (VideoPost | UserPostWithType)[] => {
  return content.sort((a, b) => {
    let dateA: Date;
    let dateB: Date;
    
    if (a.type === 'user_post') {
      dateA = new Date(a.created_at);
    } else {
      // For video posts, parse timeAgo or use current time as fallback
      dateA = new Date(); // Fallback for video posts without proper timestamps
    }
    
    if (b.type === 'user_post') {
      dateB = new Date(b.created_at);
    } else {
      dateB = new Date(); // Fallback for video posts without proper timestamps
    }
    
    return dateB.getTime() - dateA.getTime(); // Newest first
  });
};
