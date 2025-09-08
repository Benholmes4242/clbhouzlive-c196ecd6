import { createContext, useCallback, useContext, useRef, useState } from "react";

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
  
  // Carousel-level audio preference - default to muted
  const [carouselAudioPreference, setCarouselAudioPreference] = useState<'muted' | 'unmuted'>(() => {
    // Try to restore from session storage
    const stored = sessionStorage.getItem('highlights-carousel-audio-preference');
    return (stored === 'unmuted') ? 'unmuted' : 'muted';
  });
  
  // Track if user has made a gesture for autoplay policies
  const [hasUserGesture, setHasUserGesture] = useState(false);

  // Persist preference to session storage
  const updateCarouselAudioPreference = useCallback((preference: 'muted' | 'unmuted') => {
    setCarouselAudioPreference(preference);
    sessionStorage.setItem('highlights-carousel-audio-preference', preference);
    
    // Mark that user has made a gesture
    if (preference === 'unmuted') {
      setHasUserGesture(true);
    }
  }, []);

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
      // Set unmuted and attempt play
      setMuted(el, false);
      await el.play?.();
      console.log('🎥 Successfully started unmuted playback:', id);
      return true;
    } catch (error) {
      console.warn('🎥 Unmuted autoplay blocked by browser:', error);
      // Fallback to muted play
      try {
        setMuted(el, true);
        await el.play?.();
        console.log('🎥 Fell back to muted playback:', id);
        return false;
      } catch (fallbackError) {
        console.warn('🎥 Even muted playback failed:', fallbackError);
        return false;
      }
    }
  }, []);

  const play = useCallback(async (id: string) => {
    console.log('🎥 Play called for:', id, 'currentActive:', activeId, 'audioPreference:', carouselAudioPreference);
    
    // RULE: only one video at a time - pause the previous one
    if (activeId && activeId !== id) {
      pause(activeId);
    }
    
    // Set active first to trigger HLSPlayer render
    setActiveId(id);
    
    // Wait for element to be registered (with retry mechanism)
    const waitForElement = () => {
      return new Promise<PlayerEl | null>((resolve) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        let cancelled = false;
        
        // Listen for cancellation events
        const handleCancel = () => {
          cancelled = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve(null);
        };
        
        window.addEventListener('cancelVideoOperations', handleCancel, { once: true });
        
        const checkElement = (attempts = 0) => {
          if (cancelled) {
            resolve(null);
            return;
          }
          
          const el = playersRef.current.get(id);
          if (el) {
            console.log('🎥 Found element for play:', id, 'after', attempts, 'attempts');
            window.removeEventListener('cancelVideoOperations', handleCancel);
            resolve(el);
          } else if (attempts < 10) {
            timeoutId = setTimeout(() => checkElement(attempts + 1), 50);
          } else {
            console.warn('🎥 Element not found after retries:', id);
            window.removeEventListener('cancelVideoOperations', handleCancel);
            resolve(null);
          }
        };
        
        checkElement();
      });
    };
    
    const el = await waitForElement();
    if (!el) return;
    
    // Apply carousel-level audio preference
    if (carouselAudioPreference === 'muted') {
      // Always start muted when preference is muted
      setMuted(el, true);
      try {
        await el.play?.();
        console.log('🎥 Successfully started muted playback:', id);
      } catch (error) {
        console.warn('🎥 Failed to play video:', error);
      }
    } else {
      // Preference is unmuted - attempt unmuted play
      const success = await attemptUnmutedPlay(id);
      if (!success) {
        // Store that this card needs user gesture to enable sound
        console.log('🎥 Card needs user gesture for sound:', id);
      }
    }
  }, [activeId, pause, carouselAudioPreference, attemptUnmutedPlay]);

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