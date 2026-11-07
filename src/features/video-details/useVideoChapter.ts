import { useEffect, useState } from 'react';
import { VideoEngine } from '@/video/VideoEngine';
import type { LaneId } from '@/video/lanePolicy';
import type { VideoChapter } from '@/features/post-v2/lib/videoDetails';
import { ownerMatches } from '@/components/fullscreen-feed/scrubberMath';
import { currentChapter } from './videoDetailsModel';
export function useVideoChapter(postId: string | null, lane: LaneId, chapters: VideoChapter[]) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { setSeconds(0); if (!postId || !chapters.length) return;
    const tick = () => { try { const snapshot = VideoEngine.snapshot(lane); if (ownerMatches(snapshot.postId, `${postId}:0`)) setSeconds(Math.floor(snapshot.currentTime || 0)); } catch { /* unavailable lane has no chapter position */ } };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [postId, lane, chapters]);
  return currentChapter(chapters, seconds);
}