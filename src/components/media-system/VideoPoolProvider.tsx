import { createContext, useContext, type ReactNode } from 'react';
import { useVideoPool } from './hooks/useVideoPool';

type VideoPoolContextType = ReturnType<typeof useVideoPool>;

const VideoPoolContext = createContext<VideoPoolContextType | null>(null);

export function VideoPoolProvider({ children }: { children: ReactNode }) {
  const pool = useVideoPool();
  return (
    <VideoPoolContext.Provider value={pool}>
      {children}
    </VideoPoolContext.Provider>
  );
}

export function useVideoPoolContext(): VideoPoolContextType {
  const ctx = useContext(VideoPoolContext);
  if (!ctx) throw new Error('useVideoPoolContext must be used within VideoPoolProvider');
  return ctx;
}
