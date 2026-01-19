/**
 * MediaSystemProvider - Unified global media manager
 * Single source of truth for all video/audio playback in the app
 * 
 * Replaces: VideoManagerContext, VideoPlaybackManagerProvider, GlobalAudioContext
 */

import React, { createContext, useContext, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { safePlay } from '@/utils/safePlay';
import { runtimeUserMute } from './runtime';
import { MediaDevHud } from './runtime/MediaDevHud';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';

// ============ Types ============

export type MediaKind = 'video' | 'audio';

export interface MediaRegistration {
  id: string;
  element: HTMLVideoElement | HTMLAudioElement;
  kind: MediaKind;
  groupId?: string; // For grouping (e.g., feed ID, carousel ID)
  isPlaying: boolean;
  lastPosition?: number;
}

export interface MediaSystemContextType {
  // Registration
  register: (args: { id: string; element: HTMLVideoElement | HTMLAudioElement; kind: MediaKind; groupId?: string }) => void;
  unregister: (id: string) => void;
  
  // Playback control
  requestPlay: (id: string) => Promise<boolean>;
  pause: (id: string) => void;
  pauseAll: (exceptId?: string) => void;
  
  // Mute control
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  
  // Position tracking
  savePosition: (id: string, time?: number) => void;
  getPosition: (id: string) => number | undefined;
  clearPosition: (id: string) => void;
  
  // State queries
  isPlaying: (id: string) => boolean;
  getActiveId: () => string | null;
  getRegistration: (id: string) => MediaRegistration | undefined;
}

const MediaSystemContext = createContext<MediaSystemContextType | null>(null);

// ============ Storage Keys ============

const MUTE_STATE_KEY = 'media_muted';
const POSITIONS_KEY = 'media_positions';
const MAX_POSITIONS = 200; // Cap stored positions
const POSITION_SAVE_THROTTLE = 3000; // ms between saves

// ============ Provider ============

export const MediaSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Rehydration integration - reset media on app resume
  const { isRehydrating } = useRehydrationSafe();
  
  // Deprecation warning - only in DEV
  // (This component is legacy - use MediaRuntime directly)
  
  // Media registry
  const registry = useRef<Map<string, MediaRegistration>>(new Map());
  
  // Currently playing ID (only one at a time)
  const activeIdRef = useRef<string | null>(null);
  
  // Stored positions (survives unmount for continue watching)
  // Hydrate from sessionStorage on init
  const positionsRef = useRef<Map<string, number>>(
    (() => {
      try {
        const saved = sessionStorage.getItem(POSITIONS_KEY);
        if (saved) {
          const entries = JSON.parse(saved) as [string, number][];
          return new Map(entries.slice(-MAX_POSITIONS)); // Cap on load
        }
      } catch {}
      return new Map();
    })()
  );
  
  // Throttle position saves
  const lastPositionSaveRef = useRef<number>(0);
  
  // Mute state with session persistence
  const [isMuted, setIsMutedState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(MUTE_STATE_KEY);
      return saved !== null ? JSON.parse(saved) : true; // Default muted
    } catch {
      return true;
    }
  });
  
  // Tab visibility tracking
  const isTabVisible = useRef(!document.hidden);
  
  // ============ Mute Control ============
  
  const setMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    try {
      sessionStorage.setItem(MUTE_STATE_KEY, JSON.stringify(muted));
    } catch {}
    
    // Apply to all registered media
    registry.current.forEach((reg) => {
      if (reg.element) {
        reg.element.muted = muted;
      }
    });
  }, []);
  
  const toggleMute = useCallback(() => {
    runtimeUserMute();
    setMuted(!isMuted);
  }, [isMuted, setMuted]);
  
  // ============ Registration ============
  
  const register = useCallback((args: {
    id: string;
    element: HTMLVideoElement | HTMLAudioElement;
    kind: MediaKind;
    groupId?: string;
  }) => {
    const { id, element, kind, groupId } = args;
    
    // Apply mute state immediately
    element.muted = isMuted;
    
    // Ensure WebView-safe attributes for video
    if (kind === 'video' && element instanceof HTMLVideoElement) {
      element.playsInline = true;
      element.setAttribute('webkit-playsinline', 'true');
      element.setAttribute('x5-playsinline', 'true');
    }
    
    registry.current.set(id, {
      id,
      element,
      kind,
      groupId,
      isPlaying: !element.paused,
      lastPosition: positionsRef.current.get(id),
    });
    // Registration log removed for cleaner console
  }, [isMuted]);
  
  const unregister = useCallback((id: string) => {
    const reg = registry.current.get(id);
    if (reg) {
      // Save position before unregistering
      if (reg.element && reg.element.currentTime > 0) {
        positionsRef.current.set(id, reg.element.currentTime);
      }
      
      // Clear active if this was the active video
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
      }
    }
    
    registry.current.delete(id);
    // Unregistration log removed for cleaner console
  }, []);
  
  // ============ Playback Control ============
  
  const pauseAll = useCallback((exceptId?: string) => {
    registry.current.forEach((reg) => {
      if (reg.id !== exceptId && reg.element && !reg.element.paused) {
        reg.element.pause();
        reg.isPlaying = false;
      }
    });
    
    if (!exceptId) {
      activeIdRef.current = null;
    }
  }, []);
  
  const pause = useCallback((id: string) => {
    const reg = registry.current.get(id);
    if (reg?.element && !reg.element.paused) {
      reg.element.pause();
      reg.isPlaying = false;
      
      if (activeIdRef.current === id) {
        activeIdRef.current = null;
      }
    }
  }, []);
  
  const requestPlay = useCallback(async (id: string): Promise<boolean> => {
    const reg = registry.current.get(id);
    if (!reg?.element) {
      return false;
    }
    
    // Already playing? Skip
    if (!reg.element.paused && !reg.element.ended) {
      activeIdRef.current = id;
      reg.isPlaying = true;
      return true;
    }
    
    // Pause all others first (single player rule)
    pauseAll(id);
    
    // Use safePlay for robust autoplay
    const success = await safePlay(reg.element as HTMLVideoElement);
    
    if (success) {
      activeIdRef.current = id;
      reg.isPlaying = true;
    }
    
    return success;
  }, [pauseAll]);
  
  // ============ Position Tracking ============
  
  const savePosition = useCallback((id: string, time?: number) => {
    const reg = registry.current.get(id);
    const position = time ?? reg?.element?.currentTime ?? 0;
    const duration = reg?.element?.duration ?? 0;
    
    // Skip if position is 0 or video is too short (< 10s)
    if (position <= 0 || duration < 10) return;
    
    // Skip if video ended (within 2s of end)
    if (duration > 0 && position >= duration - 2) {
      positionsRef.current.delete(id);
      return;
    }
    
    positionsRef.current.set(id, position);
    
    // Throttle persistence to sessionStorage (every 3s max)
    const now = Date.now();
    if (now - lastPositionSaveRef.current < POSITION_SAVE_THROTTLE) return;
    lastPositionSaveRef.current = now;
    
    // Persist to session storage with cap
    try {
      const entries = Array.from(positionsRef.current.entries());
      // Keep only last MAX_POSITIONS entries
      const capped = entries.slice(-MAX_POSITIONS);
      sessionStorage.setItem(POSITIONS_KEY, JSON.stringify(capped));
    } catch {}
  }, []);
  
  const getPosition = useCallback((id: string): number | undefined => {
    return positionsRef.current.get(id);
  }, []);
  
  const clearPosition = useCallback((id: string) => {
    positionsRef.current.delete(id);
  }, []);
  
  // ============ State Queries ============
  
  const isPlayingFn = useCallback((id: string): boolean => {
    return activeIdRef.current === id;
  }, []);
  
  const getActiveId = useCallback((): string | null => {
    return activeIdRef.current;
  }, []);
  
  const getRegistration = useCallback((id: string): MediaRegistration | undefined => {
    return registry.current.get(id);
  }, []);
  
  // ============ Lifecycle Handling ============
  
  useEffect(() => {
    // Tab visibility
    const handleVisibilityChange = () => {
      const wasVisible = isTabVisible.current;
      isTabVisible.current = !document.hidden;
      
      if (document.hidden && wasVisible) {
        pauseAll();
      }
    };
    
    // Window blur/focus
    const handleBlur = () => {
      pauseAll();
    };

    const handleFocus = () => {
      // Note: We don't auto-resume here - autoplay hook decides what to play.
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pauseAll]);
  
  // ============ Rehydration Handling ============
  
  useEffect(() => {
    if (isRehydrating) {
      pauseAll();
      
      // Clear all registrations to force fresh reconnection
      // Videos will re-register when their components remount with new reconnectionKey
    }
  }, [isRehydrating, pauseAll]);
  
  // ============ Context Value ============
  
  const value = useMemo<MediaSystemContextType>(() => ({
    register,
    unregister,
    requestPlay,
    pause,
    pauseAll,
    isMuted,
    setMuted,
    toggleMute,
    savePosition,
    getPosition,
    clearPosition,
    isPlaying: isPlayingFn,
    getActiveId,
    getRegistration,
  }), [
    register, 
    unregister, 
    requestPlay, 
    pause, 
    pauseAll, 
    isMuted, 
    setMuted, 
    toggleMute,
    savePosition,
    getPosition,
    clearPosition,
    isPlayingFn,
    getActiveId,
    getRegistration,
  ]);
  
  return (
    <MediaSystemContext.Provider value={value}>
      {children}
    </MediaSystemContext.Provider>
  );
};

// ============ Hook ============

export function useMediaSystem(): MediaSystemContextType {
  const context = useContext(MediaSystemContext);
  if (!context) {
    throw new Error('useMediaSystem must be used within MediaSystemProvider');
  }
  return context;
}

// Safe version that returns defaults when outside provider
export function useMediaSystemSafe(): MediaSystemContextType {
  const context = useContext(MediaSystemContext);
  if (!context) {
    // Return safe defaults
    return {
      register: () => {},
      unregister: () => {},
      requestPlay: async () => false,
      pause: () => {},
      pauseAll: () => {},
      isMuted: true,
      setMuted: () => {},
      toggleMute: () => {},
      savePosition: () => {},
      getPosition: () => undefined,
      clearPosition: () => {},
      isPlaying: () => false,
      getActiveId: () => null,
      getRegistration: () => undefined,
    };
  }
  return context;
}
