import { useState, useCallback } from 'react';

export interface UserReactions {
  [postId: string]: string; // Single emoji reaction per post
}

export const usePostReactions = () => {
  const [userReactions, setUserReactions] = useState<UserReactions>({});

  const getUserReaction = useCallback((postId: string): string | undefined => {
    return userReactions[postId];
  }, [userReactions]);

  const handleReaction = useCallback((postId: string, emoji: string) => {
    setUserReactions(prev => {
      const newReactions = { ...prev };
      
      if (emoji === '' || emoji === prev[postId]) {
        // Remove reaction if empty string or same emoji
        delete newReactions[postId];
      } else {
        // Set new reaction (replaces any existing one)
        newReactions[postId] = emoji;
      }
      
      return newReactions;
    });
  }, []);

  return {
    getUserReaction,
    handleReaction
  };
};