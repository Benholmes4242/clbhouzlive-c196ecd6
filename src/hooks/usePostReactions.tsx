import { useState, useCallback } from 'react';
import { PostReactions } from '@/components/clubhouse/QuickReactionButton';

interface UserReactions {
  [postId: string]: string; // postId -> emoji
}

interface PostReactionsMap {
  [postId: string]: PostReactions; // postId -> { emoji -> count }
}

export const usePostReactions = () => {
  const [userReactions, setUserReactions] = useState<UserReactions>({});
  const [postReactions, setPostReactions] = useState<PostReactionsMap>({});

  // Generate mock reaction data for posts
  const generateMockReactions = useCallback((postId: string): PostReactions => {
    // Generate consistent but random-looking data based on postId
    const seed = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (max: number) => (seed * 9301 + 49297) % max;
    
    return {
      '😂': random(100) > 70 ? random(50) + 5 : 0,
      '🔥': random(100) > 60 ? random(40) + 3 : 0,
      '👏': random(100) > 80 ? random(25) + 2 : 0,
      '❤️': random(80) + 10, // Always has some hearts
    };
  }, []);

  // Get reactions for a specific post
  const getPostReactions = useCallback((postId: string): PostReactions => {
    if (!postReactions[postId]) {
      const mockReactions = generateMockReactions(postId);
      setPostReactions(prev => ({
        ...prev,
        [postId]: mockReactions
      }));
      return mockReactions;
    }
    return postReactions[postId];
  }, [postReactions, generateMockReactions]);

  // Get user's reaction for a specific post
  const getUserReaction = useCallback((postId: string): string | undefined => {
    return userReactions[postId];
  }, [userReactions]);

  // Handle user reaction
  const handleReaction = useCallback((postId: string, emoji: string) => {
    const currentUserReaction = userReactions[postId];
    const currentPostReactions = getPostReactions(postId);

    // If user already reacted with this emoji, remove the reaction
    if (currentUserReaction === emoji) {
      setUserReactions(prev => {
        const newReactions = { ...prev };
        delete newReactions[postId];
        return newReactions;
      });

      setPostReactions(prev => ({
        ...prev,
        [postId]: {
          ...currentPostReactions,
          [emoji]: Math.max(0, currentPostReactions[emoji] - 1)
        }
      }));
      return;
    }

    // Remove previous reaction if exists
    if (currentUserReaction) {
      setPostReactions(prev => ({
        ...prev,
        [postId]: {
          ...currentPostReactions,
          [currentUserReaction]: Math.max(0, currentPostReactions[currentUserReaction] - 1)
        }
      }));
    }

    // Add new reaction
    setUserReactions(prev => ({
      ...prev,
      [postId]: emoji
    }));

    setPostReactions(prev => ({
      ...prev,
      [postId]: {
        ...currentPostReactions,
        [emoji]: (currentPostReactions[emoji] || 0) + 1
      }
    }));
  }, [userReactions, getPostReactions]);

  return {
    getPostReactions,
    getUserReaction,
    handleReaction
  };
};