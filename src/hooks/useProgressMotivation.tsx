import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MotivationCache {
  [key: string]: string;
}

export const useProgressMotivation = (
  userId?: string,
  userDisplayName?: string,
  isOwnProfile?: boolean
) => {
  const [motivationCache, setMotivationCache] = useState<MotivationCache>({});
  const [isLoading, setIsLoading] = useState(false);

  const generateMotivation = async (
    region: string,
    played: number,
    total: number
  ): Promise<string> => {
    const cacheKey = `${region}-${played}-${total}-${userId}`;
    
    // Return cached result if available
    if (motivationCache[cacheKey]) {
      return motivationCache[cacheKey];
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-progress-motivation', {
        body: {
          region,
          played,
          total,
          userDisplayName,
          isOwnProfile
        }
      });

      if (error) {
        console.error('Error generating motivation:', error);
        return getDefaultMotivation(region, played, total);
      }

      const message = data?.motivationalMessage || getDefaultMotivation(region, played, total);
      
      // Cache the result
      setMotivationCache(prev => ({
        ...prev,
        [cacheKey]: message
      }));

      return message;
    } catch (error) {
      console.error('Error calling motivation function:', error);
      return getDefaultMotivation(region, played, total);
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultMotivation = (region: string, played: number, total: number): string => {
    const remaining = total - played;
    
    if (remaining === 0) {
      switch (region) {
        case 'global': return 'World champion! You\'ve conquered the finest courses!';
        case 'usa': return 'America mastered! Coast-to-coast excellence achieved!';
        case 'britain-ireland': return 'Links legend! Golf\'s birthplace conquered!';
        case 'europe': return 'Continental champion! Europe\'s best explored!';
        default: return 'Achievement unlocked! Excellence achieved!';
      }
    }

    if (remaining <= 20) {
      switch (region) {
        case 'global': return 'So close to world golf glory!';
        case 'usa': return 'Almost there! American dream within reach!';
        case 'britain-ireland': return 'Nearly a links master! Push through!';
        case 'europe': return 'European excellence almost yours!';
        default: return 'The finish line is in sight!';
      }
    }

    switch (region) {
      case 'global': return 'Building your worldwide golf legacy!';
      case 'usa': return 'Exploring America\'s golf treasures!';
      case 'britain-ireland': return 'Walking in golf history\'s footsteps!';
      case 'europe': return 'Discovering Continental golf gems!';
      default: return 'Your golf journey continues!';
    }
  };

  return {
    generateMotivation,
    isLoading
  };
};