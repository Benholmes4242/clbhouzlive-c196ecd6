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
    const percentage = Math.round((played / total) * 100);
    
    if (remaining === 0) {
      switch (region) {
        case 'global': return 'Achievement unlocked! (100% complete) World champion of golf!';
        case 'usa': return 'Achievement unlocked! (100% complete) American golf mastery achieved!';
        case 'britain-ireland': return 'Achievement unlocked! (100% complete) Links legend status earned!';
        case 'europe': return 'Achievement unlocked! (100% complete) Continental champion crowned!';
        default: return 'Achievement unlocked! (100% complete) Excellence achieved!';
      }
    }

    if (remaining <= 20) {
      switch (region) {
        case 'global': return `${remaining} trips to go! (${percentage}% complete) World golf glory awaits!`;
        case 'usa': return `${remaining} trips to go! (${percentage}% complete) American dream within reach!`;
        case 'britain-ireland': return `${remaining} trips to go! (${percentage}% complete) Links mastery almost yours!`;
        case 'europe': return `${remaining} trips to go! (${percentage}% complete) European excellence nearly achieved!`;
        default: return `${remaining} trips to go! (${percentage}% complete) The finish line is in sight!`;
      }
    }

    switch (region) {
      case 'global': return `${remaining} courses to go (${percentage}% complete) Building your worldwide golf legacy!`;
      case 'usa': return `${remaining} courses to go (${percentage}% complete) Exploring America's golf treasures!`;
      case 'britain-ireland': return `${remaining} courses to go (${percentage}% complete) Walking golf history's footsteps!`;
      case 'europe': return `${remaining} courses to go (${percentage}% complete) Discovering Continental golf gems!`;
      default: return `${remaining} courses to go (${percentage}% complete) Your golf journey continues!`;
    }
  };

  return {
    generateMotivation,
    isLoading
  };
};