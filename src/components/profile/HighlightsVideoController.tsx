import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useClubhouseStore } from "@/store/clubhouseStore";

type PlayerEl = HTMLVideoElement | (HTMLElement & { 
  play?: () => Promise<void>; 
  pause?: () => void; 
  muted?: boolean;
});

type HighlightsVideoContext = {
  activeId: string | null;
  register: (id: string, el: PlayerEl | null) => void;
  play: (id: string) => Promise<void>;
  pause: (id: string) => void;
  // Kept for API compatibility — derived from GlobalAudioContext
  carouselAudioPreference: 'muted' | 'unmuted';
  setCarouselAudioPreference: (preference: 'muted' | 'unmuted') => void;
  hasUserGesture: boolean;
  attemptUnmutedPlay: (id: string) => Promise<boolean>;
};

const HighlightsVideoContext = createContext<HighlightsVideoContext | null>(null);

export const useHighlightsVideo = () => {
  const context = useContext(HighlightsVideoContext);
  if (!context) {
    throw new Error('useHighlightsVideo must be used within HighlightsVideoProvider');
  }
  return context;
};

export function HighlightsVideoProvider({ children }: { children: React.ReactNode }) {
  const playersRef = useRef(new Map<string, PlayerEl>());
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // CHANGE 4: Use GlobalAudioContext as single source of truth for mute state.
  // Removed isolated carouselAudioPreference + sessionStorage — they caused drift
  // between the highlights carousel and the rest of the app.
  const isMuted = useClubhouseStore(s => s.isMuted);
  const setIsMuted = useClubhouseStore(s => s.setIsMuted);
  const markUserGestureUnmute = useClubhouseStore(s => s.markUserGestureUnmute);
  
  // Track if user has made a gesture for autoplay policies
  const [hasUserGesture, setHasUserGesture] = useState(false);

  // Derive carousel preference from global state for API compatibility
  const carouselAudioPreference: 'muted' | 'unmuted' = isMuted ? 'muted' : 'unmuted';

  // Sync global mute state to carousel preference
  const updateCarouselAudioPreference = useCallback((preference: 'muted' | 'unmuted') => {
    const newMuted = preference === 'muted';
    if (!newMuted) markUserGestureUnmute();
    setIsMuted(newMuted);
    
    // Mark that user has made a gesture
    if (preference === 'unmuted') {
      setHasUserGesture(true);
    }
  }, [setIsMuted, markUserGestureUnmute]);

  const register = useCallback((id: string, el: PlayerEl | null) => {
    console.log('🎥 Registering video element:', id, el ? 'with element' : 'null');
    if (!el) { 
      playersRef.current.delete(id); 
      return; 
    }
    playersRef.current.set(id, el);
  }, []);

  const setMuted = (el: PlayerEl, val: boolean) => { 
    try { 
      (el as any).muted = val; 
    } catch {
      // Handle cases where muted property might not be available
    }
  };

  const pause = useCallback((id: string) => {
    const el = playersRef.current.get(id);
    if (el?.pause) {
      el.pause();
    }
    if (activeId === id) {
      setActiveId(null);
    }
  }, [activeId]);

  // Attempt to play with sound - returns true if successful, false if blocked
  const attemptUnmutedPlay = useCallback(async (id: string): Promise<boolean> => {
    const el = playersRef.current.get(id);
    if (!el) return false;

    try {
      // Synchronously unmute within the gesture call stack (iOS requirement)
      setMuted(el, false);
      await el.play?.();
      console.log('🎥 Successfully started unmuted playback:', id);
      return true;
    } catch (error) {
      console.warn('🎥 Unmuted autoplay blocked by browser:', error);
      // Fallback to muted play and sync global state
      try {
        setMuted(el, true);
        setIsMuted(true); // Keep global state in sync with actual audio state
        await el.play?.();
        console.log('🎥 Fell back to muted playback:', id);
        return false;
      } catch (fallbackError) {
        console.warn('🎥 Even muted playback failed:', fallbackError);
        return false;
      }
    }
  }, [setIsMuted]);

  const play = useCallback(async (id: string) => {
    console.log('🎥 Play called for:', id, 'currentActive:', activeId, 'globalMuted:', isMuted);
    
    // RULE: only one video at a time - pause the previous one
    if (activeId && activeId !== id) {
      pause(activeId);
    }
    
    // Set active first to trigger HLSPlayer render
    setActiveId(id);
    
    // Wait for element to be registered (with retry mechanism)
    const waitForElement = () => {
      return new Promise<PlayerEl | null>((resolve) => {
        const checkElement = (attempts = 0) => {
          const el = playersRef.current.get(id);
          if (el) {
            console.log('🎥 Found element for play:', id, 'after', attempts, 'attempts');
            resolve(el);
          } else if (attempts < 10) {
            setTimeout(() => checkElement(attempts + 1), 50);
          } else {
            console.warn('🎥 Element not found after retries:', id);
            resolve(null);
          }
        };
        checkElement();
      });
    };
    
    const el = await waitForElement();
    if (!el) return;
    
    // Apply global mute state (single source of truth)
    if (isMuted) {
      // Always start muted when global state is muted
      setMuted(el, true);
      try {
        await el.play?.();
        console.log('🎥 Successfully started muted playback:', id);
      } catch (error) {
        console.warn('🎥 Failed to play video:', error);
      }
    } else {
      // Global state is unmuted — attempt unmuted play
      const success = await attemptUnmutedPlay(id);
      if (!success) {
        console.log('🎥 Card needs user gesture for sound:', id);
      }
    }
  }, [activeId, pause, isGloballyMuted, attemptUnmutedPlay]);

  return (
    <HighlightsVideoContext.Provider 
      value={{ 
        activeId, 
        register, 
        play, 
        pause, 
        carouselAudioPreference,
        setCarouselAudioPreference: updateCarouselAudioPreference,
        hasUserGesture,
        attemptUnmutedPlay
      }}
    >
      {children}
    </HighlightsVideoContext.Provider>
  );
}
