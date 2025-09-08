import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunctionDebounced } from '@/utils/edgeFunctionHelper';

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

  const generateMotivation = useCallback(
    async (region: string, played: number, total: number): Promise<string> => {
      const cacheKey = `${region}-${played}-${total}-${userId}`;
      
      // Return cached result if available
      if (motivationCache[cacheKey]) {
        return motivationCache[cacheKey];
      }

      setIsLoading(true);
      
      try {
        const debounceKey = `motivation-${region}-${played}-${total}`;
        
        const data = await callEdgeFunctionDebounced(
          'generate-progress-motivation',
          {
            region,
            played,
            total,
            userDisplayName,
            isOwnProfile
          },
          debounceKey,
          1000, // 1 second debounce
          { timeout: 8000, retries: 1 }
        );

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
    },
    [userId, userDisplayName, isOwnProfile, motivationCache]
  );

  const getDefaultMotivation = (region: string, played: number, total: number): string => {
    const remaining = total - played;
    const percentage = Math.round((played / total) * 100);
    
    if (remaining === 0) {
      switch (region) {
        case 'global': return 'World golf mastery achieved - every legendary course conquered!';
        case 'usa': return 'Coast-to-coast excellence complete - American golf royalty earned!';
        case 'britain-ireland': return 'Links legend status confirmed - golf\'s birthplace mastered!';
        case 'europe': return 'Continental champion crowned - European excellence personified!';
        default: return 'Ultimate achievement unlocked - golf greatness realized!';
      }
    }

    if (remaining <= 20) {
      switch (region) {
        case 'global': return `Global golf glory within reach - just ${remaining} legendary courses await!`;
        case 'usa': return `American dream almost realized, ${percentage}% of treasures discovered!`;
        case 'britain-ireland': return `Links mastery beckons - ${remaining} historic gems remaining!`;
        case 'europe': return `Continental conquest nearly complete, ${percentage}% of Europe explored!`;
        default: return `Victory in sight - ${remaining} courses from greatness!`;
      }
    }

    // Create varied default formats for different regions
    switch (region) {
      case 'global': return `Building worldwide legacy - ${percentage}% of golf's finest experienced!`;
      case 'usa': return `${remaining} American treasures await your discovery!`;
      case 'britain-ireland': return `Walking golf history's footsteps, ${percentage}% complete!`;
      case 'europe': return `Continental adventure underway - ${played} gems discovered!`;
      default: return `Golf journey advancing - ${percentage}% progress achieved!`;
    }
  };

  return {
    generateMotivation,
    isLoading
  };
};