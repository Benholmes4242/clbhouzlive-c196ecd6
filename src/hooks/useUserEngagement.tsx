import { useState, useEffect } from 'react';

interface UserEngagementData {
  isNewUser: boolean;
  isInactiveUser: boolean;
  hasPosted: boolean;
  lastInteraction: Date | null;
}

export const useUserEngagement = (): UserEngagementData => {
  const [engagementData, setEngagementData] = useState<UserEngagementData>({
    isNewUser: false,
    isInactiveUser: false,
    hasPosted: false,
    lastInteraction: null
  });

  useEffect(() => {
    // Check localStorage for user engagement data
    const checkUserEngagement = () => {
      try {
        // Check if user has posted before
        const hasPosted = localStorage.getItem('user_has_posted') === 'true';
        
        // Check last interaction timestamp
        const lastInteractionString = localStorage.getItem('last_discover_interaction');
        const lastInteraction = lastInteractionString ? new Date(lastInteractionString) : null;
        
        // Check if user is new (no posts and no previous interactions)
        const isNewUser = !hasPosted && !lastInteraction;
        
        // Check if user is inactive (last interaction more than 7 days ago)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isInactiveUser = lastInteraction ? lastInteraction < sevenDaysAgo : false;

        setEngagementData({
          isNewUser,
          isInactiveUser: isInactiveUser && !isNewUser, // Don't mark new users as inactive
          hasPosted,
          lastInteraction
        });

        // Update last interaction timestamp
        localStorage.setItem('last_discover_interaction', new Date().toISOString());
        
      } catch (error) {
        console.error('Error checking user engagement:', error);
        // Default to new user if we can't read localStorage
        setEngagementData({
          isNewUser: true,
          isInactiveUser: false,
          hasPosted: false,
          lastInteraction: null
        });
      }
    };

    checkUserEngagement();
  }, []);

  return engagementData;
};

// Helper functions to update engagement status
export const markUserAsPosted = () => {
  try {
    localStorage.setItem('user_has_posted', 'true');
    localStorage.setItem('last_discover_interaction', new Date().toISOString());
  } catch (error) {
    console.error('Error updating user posted status:', error);
  }
};

export const updateLastInteraction = () => {
  try {
    localStorage.setItem('last_discover_interaction', new Date().toISOString());
  } catch (error) {
    console.error('Error updating last interaction:', error);
  }
};