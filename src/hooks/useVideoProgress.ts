import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface VideoProgressData {
  lastPositionSeconds: number;
  durationSeconds: number | null;
  updatedAt: string | null;
}

interface UseVideoProgressResult {
  progress: VideoProgressData | null;
  isLoading: boolean;
  updateProgress: (position: number, duration?: number) => Promise<void>;
  clearProgress: () => Promise<void>;
  shouldResume: boolean;
  resumePosition: number;
}

/**
 * Hook for managing video watch progress
 * 
 * Resume rule:
 * - If last_position_seconds > 0 AND < duration_seconds - 10: resume from position
 * - Else: start from 0
 */
export const useVideoProgress = (postId: string): UseVideoProgressResult => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const [progress, setProgress] = useState<VideoProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Throttle updates to avoid excessive DB writes
  const lastUpdateRef = useRef<number>(0);
  const THROTTLE_MS = 5000; // 5 seconds minimum between updates

  // Fetch existing progress
  useEffect(() => {
    const fetchProgress = async () => {
      if (!userId || !postId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('video_progress')
          .select('last_position_seconds, duration_seconds, updated_at')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching video progress:', error);
        } else if (data) {
          setProgress({
            lastPositionSeconds: data.last_position_seconds,
            durationSeconds: data.duration_seconds,
            updatedAt: data.updated_at,
          });
        }
      } catch (err) {
        console.error('Error in fetchProgress:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [userId, postId]);

  // Update progress (throttled)
  const updateProgress = useCallback(async (position: number, duration?: number) => {
    if (!userId || !postId) return;

    // Throttle updates
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    try {
      // video_progress.last_position_seconds and duration_seconds are now
      // numeric(10,3) (widened 2026-04-22). Persist sub-second precision so
      // resume positions land exactly where the user paused.
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          post_id: postId,
          last_position_seconds: position,
          duration_seconds: duration ?? null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,post_id',
        });

      if (error) {
        console.error('Error updating video progress:', error);
      } else {
        setProgress(prev => ({
          lastPositionSeconds: position,
          durationSeconds: duration ?? prev?.durationSeconds ?? null,
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error in updateProgress:', err);
    }
  }, [userId, postId]);

  // Clear progress (when video completed)
  const clearProgress = useCallback(async () => {
    if (!userId || !postId) return;

    try {
      // Set position to 0 to mark as complete (can resume from start)
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: userId,
          post_id: postId,
          last_position_seconds: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,post_id',
        });

      if (error) {
        console.error('Error clearing video progress:', error);
      } else {
        setProgress(prev => prev ? { ...prev, lastPositionSeconds: 0 } : null);
      }
    } catch (err) {
      console.error('Error in clearProgress:', err);
    }
  }, [userId, postId]);

  // Calculate resume state
  const shouldResume = Boolean(
    progress &&
    progress.lastPositionSeconds > 0 &&
    (!progress.durationSeconds || progress.lastPositionSeconds < progress.durationSeconds - 10)
  );

  const resumePosition = shouldResume ? progress?.lastPositionSeconds ?? 0 : 0;

  return {
    progress,
    isLoading,
    updateProgress,
    clearProgress,
    shouldResume,
    resumePosition,
  };
};

export default useVideoProgress;
