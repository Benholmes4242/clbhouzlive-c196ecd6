/**
 * WRITES THE MEMBER'S POSITION TO video_progress (BRIEF_WATCH_PAGE K.1).
 *
 * Mounted once by the fullscreen viewer chrome. Writes on pause, on close /
 * leaving the video, and on a throttled interval while playing — never on
 * every tick. Reads the same lane FullscreenTopProgress reads (the borrowed
 * rail lane while a borrow is live, otherwise 'fullscreen').
 */
import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';

export const PROGRESS_WRITE_INTERVAL_MS = 10_000;

function owns(snapPostId: string | null | undefined, postId: string): boolean {
  if (!snapPostId) return false;
  return snapPostId === postId || snapPostId.startsWith(`${postId}:`);
}

export function useVideoProgressWriter(activePost: FeedPost | null | undefined) {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);

  const postId = activePost?.id ?? null;
  const items = activePost?.mediaItems ?? [];
  // Progress is per post: only single-video posts are tracked.
  const isVideo = items.length === 1 && items[0]?.type === 'video' && (activePagerIdx ?? 0) === 0;
  const laneId: LaneId = useMemo(() => {
    if (borrow && postId && borrow.postId === postId) return borrow.laneId;
    return 'fullscreen' as LaneId;
  }, [borrow, postId]);

  const lastWrittenRef = useRef(-1);

  useEffect(() => {
    if (!userId || !postId || !isVideo) return;
    let last = { t: 0, d: 0 };
    let lastWriteAt = 0;
    lastWrittenRef.current = -1;

    const write = (reason: string) => {
      const pos = last.t;
      const dur = last.d;
      if (!(pos > 0) || Math.abs(pos - lastWrittenRef.current) < 0.5) return;
      lastWrittenRef.current = pos;
      lastWriteAt = Date.now();
      void supabase
        .from('video_progress')
        .upsert(
          {
            user_id: userId,
            post_id: postId,
            last_position_seconds: pos,
            duration_seconds: dur > 0 ? dur : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,post_id' },
        )
        .then(({ error }) => {
          if (error && import.meta.env.DEV) console.warn('[video_progress]', reason, error);
          if (!error && reason !== 'tick') void queryClient.invalidateQueries({ queryKey: ['video-progress', userId] });
        });
    };

    let prevState: string | null = null;
    const unsub = VideoEngine.subscribe(laneId, (s) => {
      if (!owns(s.postId, postId)) return;
      if (s.currentTime > 0) last = { t: s.currentTime, d: s.duration };
      if (s.state === 'paused' && prevState === 'playing') write('pause');
      prevState = s.state;
    });

    const timer = window.setInterval(() => {
      try {
        const s = VideoEngine.snapshot(laneId);
        if (!owns(s.postId, postId)) return;
        if (s.currentTime > 0) last = { t: s.currentTime, d: s.duration };
        if (s.state === 'playing' && Date.now() - lastWriteAt >= PROGRESS_WRITE_INTERVAL_MS) write('tick');
      } catch { /* engine not booted */ }
    }, 2000);

    return () => {
      unsub();
      window.clearInterval(timer);
      write('close');
    };
  }, [userId, postId, isVideo, laneId, queryClient]);
}
