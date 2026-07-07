import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// PR-5 (queue family strip): pruned to Continue Watching only.
// Removed drawer-only fields: nextVideoId, nextMeta, setNext, consumeNext,
// isQueueOpen, openQueue, closeQueue. See PR-5 ship summary for the survivors table.
const STORAGE_KEY = 'mini_player_state';

export interface MiniPlayerMeta {
  title: string;
  creatorName: string;
  thumbnailUrl: string;
  hlsUrl?: string;
  posterUrl?: string;
}

interface VideoPlaybackContextValue {
  activeVideoId: string | null;
  isMiniOpen: boolean;
  miniMeta: MiniPlayerMeta | null;

  openMini: (videoId: string, meta?: MiniPlayerMeta) => void;
  closeMini: () => void;
  openFull: (videoId: string, backgroundLocation?: Location) => void;
  setMiniMeta: (meta: MiniPlayerMeta | null) => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

interface PersistedState {
  activeVideoId: string | null;
  isMiniOpen: boolean;
  miniMeta: MiniPlayerMeta | null;
}

const DEFAULT_STATE: PersistedState = {
  activeVideoId: null,
  isMiniOpen: false,
  miniMeta: null,
};

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistedState;
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_STATE;
  });

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  // Close mini if activeVideoId is missing (bad restore state)
  useEffect(() => {
    if (state.isMiniOpen && !state.activeVideoId) {
      setState(prev => ({ ...prev, isMiniOpen: false }));
    }
  }, [state.isMiniOpen, state.activeVideoId]);

  const openMini = useCallback((videoId: string, meta?: MiniPlayerMeta) => {
    if (!videoId) return;
    setState(prev => ({
      ...prev,
      activeVideoId: videoId,
      isMiniOpen: true,
      miniMeta: meta || null,
    }));
  }, []);

  const closeMini = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeVideoId: null,
      isMiniOpen: false,
      miniMeta: null,
    }));
  }, []);

  const openFull = useCallback((videoId: string, backgroundLocation?: Location) => {
    // VideoPlayerModal was deleted in PR-5. Route deep-links to /post/:id instead.
    setState(prev => ({ ...prev, isMiniOpen: false }));
    const bgLoc = backgroundLocation || location;
    navigate(`/post/${videoId}`, {
      state: { backgroundLocation: bgLoc },
      replace: false,
    });
  }, [navigate, location]);

  const setMiniMeta = useCallback((meta: MiniPlayerMeta | null) => {
    setState(prev => ({ ...prev, miniMeta: meta }));
  }, []);

  return (
    <VideoPlaybackContext.Provider value={{
      activeVideoId: state.activeVideoId,
      isMiniOpen: state.isMiniOpen,
      miniMeta: state.miniMeta,
      openMini,
      closeMini,
      openFull,
      setMiniMeta,
    }}>
      {children}
    </VideoPlaybackContext.Provider>
  );
};

export function useVideoPlayback() {
  const context = useContext(VideoPlaybackContext);
  if (!context) {
    throw new Error('useVideoPlayback must be used within a VideoPlaybackProvider');
  }
  return context;
}

// Safe hook that doesn't throw when used outside provider (for optional usage)
export function useVideoPlaybackSafe() {
  return useContext(VideoPlaybackContext);
}
