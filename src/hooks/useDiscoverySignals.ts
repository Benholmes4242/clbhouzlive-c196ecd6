/**
 * useDiscoverySignals - Soft ranking signals for personalized discovery
 * 
 * Phase 7D: No visible algorithm, no badges, no explanations.
 * Signals are used internally to improve ordering everywhere.
 * 
 * Signals tracked:
 * - Creator affinity (watched multiple videos from same creator)
 * - Category frequency (what categories user watches most)
 * - Watch duration (completion > clicks - quality signal)
 * - Queue usage patterns
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CreatorAffinity {
  creatorId: string;
  watchCount: number;
  totalWatchSeconds: number;
}

interface DiscoverySignals {
  // Creator affinity - creators user has watched 2+ times
  topCreators: CreatorAffinity[];
  // Category preferences based on watch history
  preferredCategories: string[];
  // Whether user has used queue feature
  hasUsedQueue: boolean;
  // Loading state
  isLoading: boolean;
}

interface UseDiscoverySignalsResult extends DiscoverySignals {
  // Boost score for a video based on user signals
  getBoostScore: (creatorId: string, category?: string) => number;
  // Check if user has affinity for a creator
  hasCreatorAffinity: (creatorId: string) => boolean;
  // Refresh signals
  refresh: () => void;
}

const QUEUE_USED_KEY = 'clbhouz_queue_used';

export function useDiscoverySignals(): UseDiscoverySignalsResult {
  const { user } = useSupabaseSession();
  const [topCreators, setTopCreators] = useState<CreatorAffinity[]>([]);
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Queue usage is tracked in localStorage
  const hasUsedQueue = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(QUEUE_USED_KEY) === 'true';
  }, []);

  // Mark queue as used (called from queue hooks)
  const markQueueUsed = useCallback(() => {
    localStorage.setItem(QUEUE_USED_KEY, 'true');
  }, []);

  // Fetch user's watch history signals
  const fetchSignals = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch video progress to calculate creator affinity
      const { data: progressData, error: progressError } = await supabase
        .from('video_progress')
        .select(`
          post_id,
          last_position_seconds,
          duration_seconds,
          posts!inner(
            user_id,
            post_tags(
              taggable_entities(
                entity_type,
                slug
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .gt('last_position_seconds', 30) // Only count meaningful watches (>30s)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (progressError) {
        console.error('Error fetching discovery signals:', progressError);
        setIsLoading(false);
        return;
      }

      // Calculate creator affinity
      const creatorMap = new Map<string, CreatorAffinity>();
      const categoryCount = new Map<string, number>();

      for (const record of progressData || []) {
        const creatorId = (record.posts as any)?.user_id;
        if (creatorId) {
          const existing = creatorMap.get(creatorId) || {
            creatorId,
            watchCount: 0,
            totalWatchSeconds: 0,
          };
          existing.watchCount += 1;
          existing.totalWatchSeconds += record.last_position_seconds || 0;
          creatorMap.set(creatorId, existing);
        }

        // Track category preferences
        const tags = (record.posts as any)?.post_tags || [];
        for (const tag of tags) {
          if (tag.taggable_entities?.entity_type === 'video_category') {
            const slug = tag.taggable_entities.slug;
            categoryCount.set(slug, (categoryCount.get(slug) || 0) + 1);
          }
        }
      }

      // Sort creators by watch count, then by total watch time
      const sortedCreators = Array.from(creatorMap.values())
        .filter(c => c.watchCount >= 2) // Only include creators watched 2+ times
        .sort((a, b) => {
          if (b.watchCount !== a.watchCount) return b.watchCount - a.watchCount;
          return b.totalWatchSeconds - a.totalWatchSeconds;
        })
        .slice(0, 10);

      // Sort categories by frequency
      const sortedCategories = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([slug]) => slug);

      setTopCreators(sortedCreators);
      setPreferredCategories(sortedCategories);
    } catch (err) {
      console.error('Error in fetchSignals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Calculate boost score for a video
  const getBoostScore = useCallback((creatorId: string, category?: string): number => {
    let score = 0;

    // Creator affinity boost (max +50)
    const creatorAffinity = topCreators.find(c => c.creatorId === creatorId);
    if (creatorAffinity) {
      score += Math.min(creatorAffinity.watchCount * 10, 50);
    }

    // Category preference boost (max +30)
    if (category && preferredCategories.includes(category)) {
      const categoryIndex = preferredCategories.indexOf(category);
      score += Math.max(30 - categoryIndex * 5, 10);
    }

    return score;
  }, [topCreators, preferredCategories]);

  // Check if user has affinity for a creator (watched 2+ videos)
  const hasCreatorAffinity = useCallback((creatorId: string): boolean => {
    return topCreators.some(c => c.creatorId === creatorId);
  }, [topCreators]);

  return {
    topCreators,
    preferredCategories,
    hasUsedQueue,
    isLoading,
    getBoostScore,
    hasCreatorAffinity,
    refresh: fetchSignals,
  };
}

// Export the queue marking function for use in queue hooks
export function markQueueUsed() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(QUEUE_USED_KEY, 'true');
  }
}
