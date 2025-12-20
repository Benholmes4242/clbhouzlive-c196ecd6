import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  
  // 6B-3: Next video info
  nextVideoId: string | null;
  nextMeta: MiniPlayerMeta | null;
  
  // 6B-3.3: Queue drawer state
  isQueueOpen: boolean;
  
  openMini: (videoId: string, meta?: MiniPlayerMeta) => void;
  closeMini: () => void;
  openFull: (videoId: string, backgroundLocation?: Location) => void;
  setMiniMeta: (meta: MiniPlayerMeta | null) => void;
  
  // 6B-3: Queue integration
  setNext: (videoId: string | null, meta?: MiniPlayerMeta | null) => void;
  consumeNext: () => { videoId: string | null; meta: MiniPlayerMeta | null };
  
  // 6B-3.3: Queue drawer controls
  openQueue: () => void;
  closeQueue: () => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

interface PersistedState {
  activeVideoId: string | null;
  isMiniOpen: boolean;
  miniMeta: MiniPlayerMeta | null;
  nextVideoId: string | null;
  nextMeta: MiniPlayerMeta | null;
  isQueueOpen: boolean;
}

const DEFAULT_STATE: PersistedState = {
  activeVideoId: null,
  isMiniOpen: false,
  miniMeta: null,
  nextVideoId: null,
  nextMeta: null,
  isQueueOpen: false,
};

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize from sessionStorage
  // IMPORTANT: If we're on /video/ route on mount, force isMiniOpen=false to avoid mini under modal
  const [state, setState] = useState<PersistedState>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistedState;
        // Don't restore mini-open state if we're already on video route (hard refresh scenario)
        if (window.location.pathname.startsWith('/video/')) {
          return { ...DEFAULT_STATE, ...parsed, isMiniOpen: false };
        }
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_STATE;
  });

  // Use ref for consumeNext to avoid stale closure
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist to sessionStorage whenever state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  // Close mini-player if user navigates to the video route (full player)
  useEffect(() => {
    if (location.pathname.startsWith('/video/') && state.isMiniOpen) {
      setState(prev => ({ ...prev, isMiniOpen: false }));
    }
  }, [location.pathname, state.isMiniOpen]);

  // 6B-4 G: Close mini if activeVideoId is missing (bad restore state)
  useEffect(() => {
    if (state.isMiniOpen && !state.activeVideoId) {
      setState(prev => ({ ...prev, isMiniOpen: false }));
    }
  }, [state.isMiniOpen, state.activeVideoId]);

  const openMini = useCallback((videoId: string, meta?: MiniPlayerMeta) => {
    // 6B-4: Guard against null/empty video IDs
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
    // Close mini first
    setState(prev => ({ ...prev, isMiniOpen: false }));
    
    // Navigate to full player
    const bgLoc = backgroundLocation || location;
    navigate(`/video/${videoId}`, { 
      state: { backgroundLocation: bgLoc, fromVideo: true },
      replace: false 
    });
  }, [navigate, location]);

  const setMiniMeta = useCallback((meta: MiniPlayerMeta | null) => {
    setState(prev => ({ ...prev, miniMeta: meta }));
  }, []);

  // 6B-3: Set the next video to play
  const setNext = useCallback((videoId: string | null, meta: MiniPlayerMeta | null = null) => {
    setState(prev => ({ ...prev, nextVideoId: videoId, nextMeta: meta }));
  }, []);

  // 6B-3: Consume next (returns and clears)
  const consumeNext = useCallback(() => {
    const result = { videoId: stateRef.current.nextVideoId, meta: stateRef.current.nextMeta };
    setState(prev => ({ ...prev, nextVideoId: null, nextMeta: null }));
    return result;
  }, []);

  // 6B-3.3: Queue drawer controls
  const openQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: true }));
  }, []);

  const closeQueue = useCallback(() => {
    setState(prev => ({ ...prev, isQueueOpen: false }));
  }, []);

  return (
    <VideoPlaybackContext.Provider value={{
      activeVideoId: state.activeVideoId,
      isMiniOpen: state.isMiniOpen,
      miniMeta: state.miniMeta,
      nextVideoId: state.nextVideoId,
      nextMeta: state.nextMeta,
      isQueueOpen: state.isQueueOpen,
      openMini,
      closeMini,
      openFull,
      setMiniMeta,
      setNext,
      consumeNext,
      openQueue,
      closeQueue,
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
