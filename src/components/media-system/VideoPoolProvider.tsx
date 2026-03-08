import { createContext, useContext, type ReactNode } from 'react';
import { useVideoPool } from './hooks/useVideoPool';
import { MediaStoreProvider } from './store/MediaStoreContext';
import type { MediaStore } from './store/createMediaStore';

type VideoPoolContextType = ReturnType<typeof useVideoPool>;

const VideoPoolContext = createContext<VideoPoolContextType | null>(null);

interface VideoPoolProviderProps {
  children: ReactNode;
  /** Optional scoped store — if provided, wraps children in MediaStoreProvider */
  store?: MediaStore;
}

export function VideoPoolProvider({ children, store }: VideoPoolProviderProps) {
  const pool = useVideoPool();

  const inner = (
    <VideoPoolContext.Provider value={pool}>
      {children}
    </VideoPoolContext.Provider>
  );

  // If a scoped store is provided, wrap with MediaStoreProvider
  // If not (Clubhouse usage), children use the global singleton — no change
  if (store) {
    return (
      <MediaStoreProvider store={store}>
        {inner}
      </MediaStoreProvider>
    );
  }

  return inner;
}

export function useVideoPoolContext(): VideoPoolContextType {
  const ctx = useContext(VideoPoolContext);
  if (!ctx) throw new Error('useVideoPoolContext must be used within VideoPoolProvider');
  return ctx;
}
