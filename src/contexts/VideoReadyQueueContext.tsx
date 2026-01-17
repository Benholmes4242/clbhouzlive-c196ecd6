import React, { createContext, useContext, ReactNode } from 'react';
import { useVideoReadyQueue, UseVideoReadyQueueConfig, UseVideoReadyQueueReturn } from '@/hooks/useVideoReadyQueue';

const VideoReadyQueueContext = createContext<UseVideoReadyQueueReturn | null>(null);

interface VideoReadyQueueProviderProps {
  children: ReactNode;
  config?: Partial<UseVideoReadyQueueConfig>;
}

export function VideoReadyQueueProvider({ 
  children, 
  config 
}: VideoReadyQueueProviderProps) {
  const queue = useVideoReadyQueue(config);
  
  return (
    <VideoReadyQueueContext.Provider value={queue}>
      {children}
    </VideoReadyQueueContext.Provider>
  );
}

export function useVideoReadyQueueContext(): UseVideoReadyQueueReturn {
  const context = useContext(VideoReadyQueueContext);
  if (!context) {
    throw new Error('useVideoReadyQueueContext must be used within VideoReadyQueueProvider');
  }
  return context;
}

export { VideoReadyQueueContext };
