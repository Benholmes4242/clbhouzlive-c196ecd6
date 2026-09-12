import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  openFull: (videoId: string) => void;
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

  const openFull = useCallback((videoId: string) => {
    // VideoPlayerModal was deleted in PR-5. Plain deep-link navigation is the
    // intent: /post/:postId is a full deep-link page (logged-out preview, web
    // gate exempt), with no overlay presentation, no dismiss affordance and no
    // expectation of a page behind it. It must NOT be added to App.tsx's
    // backgroundLocation overlay list — that would change every ordinary
    // navigation to a post to fix a path the deleted modal was the last real
    // user of. (The old { state: { backgroundLocation } } here was a leftover
    // from that modal: the overlay router mounts nothing for /post/:postId, so
    // the tap silently returned the member to where they were.)
    setState(prev => ({ ...prev, isMiniOpen: false }));
    navigate(`/post/${videoId}`, { replace: false });
  }, [navigate]);

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
