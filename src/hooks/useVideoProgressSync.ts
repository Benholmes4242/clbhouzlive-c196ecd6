import { useEffect, useRef, useCallback, useState } from 'react';
import { USE_VIDEO_PROGRESS_SYNC_V1 } from '@/utils/featureFlags';
import { logVideoTelemetry } from '@/utils/videoTelemetry';

interface VideoProgressSyncOptions {
  segments?: number[];  // Explicit segment durations
  totalSegments?: number; // Fallback to equal segments
}

export function useVideoProgressSync(
  videoElement: HTMLVideoElement | null,
  options: VideoProgressSyncOptions = {}
) {
  const [progress, setProgress] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState<number[]>([]);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number>();
  const isActiveRef = useRef(false);
  const telemetryLoggedRef = useRef(false);

  const { segments, totalSegments = 1 } = options;

  // Calculate segment progress from video time
  const calculateProgress = useCallback(() => {
    if (!videoElement || !USE_VIDEO_PROGRESS_SYNC_V1) return;

    const currentTime = videoElement.currentTime;
    const duration = videoElement.duration;

    if (!duration || isNaN(duration) || duration === 0) return;

    // Direct DOM update for visual progress bar (no React state)
    if (progressFillRef.current) {
      const ratio = Math.min(1, Math.max(0, currentTime / duration));
      // Round to 3 decimal places to prevent micro-jumps
      const roundedRatio = Math.round(ratio * 1000) / 1000;
      progressFillRef.current.style.transform = `scaleX(${roundedRatio})`;
    }

    // Use explicit segments or create equal segments
    const segmentDurations = segments || Array(totalSegments).fill(duration / totalSegments);
    const newSegmentProgress: number[] = [];
    
    let accumulatedTime = 0;
    for (let i = 0; i < segmentDurations.length; i++) {
      const segmentStart = accumulatedTime;
      const segmentEnd = accumulatedTime + segmentDurations[i];
      
      if (currentTime <= segmentStart) {
        newSegmentProgress.push(0);
      } else if (currentTime >= segmentEnd) {
        newSegmentProgress.push(1);
      } else {
        const segmentProgress = (currentTime - segmentStart) / segmentDurations[i];
        newSegmentProgress.push(Math.max(0, Math.min(1, segmentProgress)));
      }
      
      accumulatedTime += segmentDurations[i];
    }

    setSegmentProgress(newSegmentProgress);
    
    // Overall progress kept in state for a11y only
    const overallProgress = Math.max(0, Math.min(100, (currentTime / duration) * 100));
    setProgress(overallProgress);
  }, [videoElement, segments, totalSegments]);

  // rAF sync loop
  const startSyncLoop = useCallback(() => {
    if (!USE_VIDEO_PROGRESS_SYNC_V1 || isActiveRef.current) return;
    
    isActiveRef.current = true;
    
    if (!telemetryLoggedRef.current) {
      logVideoTelemetry('video_progress_sync_started', {
        segments_count: segments?.length || totalSegments,
        player_type: videoElement?.src?.includes('.m3u8') ? 'HLS' : 'native',
        duration: videoElement?.duration
      });
      telemetryLoggedRef.current = true;
    }

    const loop = () => {
      if (!isActiveRef.current) return;
      
      calculateProgress();
      rafRef.current = requestAnimationFrame(loop);
    };
    
    rafRef.current = requestAnimationFrame(loop);
  }, [calculateProgress, segments, totalSegments, videoElement]);

  // Stop sync loop
  const stopSyncLoop = useCallback((reason?: string) => {
    if (!USE_VIDEO_PROGRESS_SYNC_V1) return;
    
    isActiveRef.current = false;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }

    if (reason && telemetryLoggedRef.current) {
      logVideoTelemetry(`video_progress_sync_${reason}`);
    }
  }, []);

  // Complete all segments
  const completeProgress = useCallback(() => {
    if (!USE_VIDEO_PROGRESS_SYNC_V1) return;
    
    const segmentCount = segments?.length || totalSegments;
    setSegmentProgress(Array(segmentCount).fill(1));
    setProgress(100);
    stopSyncLoop('completed');
  }, [segments, totalSegments, stopSyncLoop]);

  // Video event handlers with src change detection
  useEffect(() => {
    if (!videoElement || !USE_VIDEO_PROGRESS_SYNC_V1) return;

    // Reset progress when src changes
    const currentSrc = videoElement.src;
    if (currentSrc) {
      setProgress(0);
      setSegmentProgress([]);
      telemetryLoggedRef.current = false;
    }

    const handlePlay = () => startSyncLoop();
    const handlePlaying = () => startSyncLoop();
    const handleCanPlay = () => startSyncLoop();
    const handlePause = () => {
      // Only stop if not looping (looped videos should keep the loop running)
      if (!videoElement.loop) {
        stopSyncLoop('paused');
      }
    };
    const handleWaiting = () => {
      // Don't stop on waiting, just let the loop catch up when playing resumes
    };
    const handleStalled = () => {
      // Don't stop on stalled, it will resume
    };
    const handleVideoEnded = () => {
      // Only complete if not looping
      if (!videoElement.loop) {
        const segmentCount = segments?.length || totalSegments;
        setSegmentProgress(Array(segmentCount).fill(1));
        setProgress(100);
        stopSyncLoop('completed');
      }
    };
    const handleLoadedMetadata = () => {
      // Reset to 0 when metadata loads
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = 'scaleX(0)';
      }
      setProgress(0);
      const segmentCount = segments?.length || totalSegments;
      setSegmentProgress(Array(segmentCount).fill(0));
    };
    const handleLoadStart = () => {
      // Reset progress on new source load and stop any active sync
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = 'scaleX(0)';
      }
      setProgress(0);
      const segmentCount = segments?.length || totalSegments;
      setSegmentProgress(Array(segmentCount).fill(0));
      stopSyncLoop();
      telemetryLoggedRef.current = false;
    };
    const handleTimeUpdate = () => {
      // Fallback sync on timeupdate (~4-5fps) to keep in-sync if rAF ever hiccups
      if (!isActiveRef.current && !videoElement.paused) {
        calculateProgress();
      }
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('stalled', handleStalled);
    videoElement.addEventListener('ended', handleVideoEnded);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('loadstart', handleLoadStart);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('stalled', handleStalled);
      videoElement.removeEventListener('ended', handleVideoEnded);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('loadstart', handleLoadStart);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      stopSyncLoop();
    };
  }, [videoElement, startSyncLoop, stopSyncLoop, completeProgress]);

  // Visibility handling
  useEffect(() => {
    if (!USE_VIDEO_PROGRESS_SYNC_V1) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSyncLoop('paused');
      } else if (videoElement && !videoElement.paused) {
        startSyncLoop();
        logVideoTelemetry('video_progress_sync_resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [videoElement, startSyncLoop, stopSyncLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSyncLoop();
  }, [stopSyncLoop]);

  return {
    progress,
    segmentProgress,
    isActive: isActiveRef.current,
    setProgressFillRef: (ref: HTMLDivElement | null) => {
      progressFillRef.current = ref;
    }
  };
}