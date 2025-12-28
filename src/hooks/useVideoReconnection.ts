import { useEffect, useState } from 'react';
import { useRehydrationSafe } from '../contexts/RehydrationContext';

export function useVideoReconnection(videoId: string) {
  const { isRehydrating } = useRehydrationSafe();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectionKey, setReconnectionKey] = useState(0);

  useEffect(() => {
    if (isRehydrating) {
      console.log(`[VideoReconnection] Starting reconnection for video ${videoId.slice(0, 8)}`);
      setIsReconnecting(true);
      
      // Force HLS instance recreation by incrementing key
      setReconnectionKey(prev => prev + 1);
      
      // Keep reconnecting state for minimum duration (perceived performance)
      const timer = setTimeout(() => {
        console.log(`[VideoReconnection] Reconnection complete for video ${videoId.slice(0, 8)}`);
        setIsReconnecting(false);
      }, 500); // 500ms minimum reconnection display

      return () => clearTimeout(timer);
    }
  }, [isRehydrating, videoId]);

  return {
    isReconnecting,
    reconnectionKey, // Use this as key prop on video element to force remount
  };
}
