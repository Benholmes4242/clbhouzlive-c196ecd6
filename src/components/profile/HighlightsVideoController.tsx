import { createContext, useCallback, useContext, useRef, useState } from "react";

type PlayerEl = HTMLVideoElement | (HTMLElement & { 
  play?: () => Promise<void>; 
  pause?: () => void; 
  muted?: boolean;
});

type HighlightsVideoContext = {
  activeId: string | null;
  mutedPref: boolean;
  register: (id: string, el: PlayerEl | null) => void;
  play: (id: string) => Promise<void>;
  pause: (id: string) => void;
  toggleMute: () => void;
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
  const [mutedPref, setMutedPref] = useState(true);

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
    if (el) {
      setMuted(el, true); // RULE: paused videos revert to muted
    }
    if (activeId === id) {
      setActiveId(null);
    }
  }, [activeId]);

  const play = useCallback(async (id: string) => {
    console.log('🎥 Play called for:', id, 'currentActive:', activeId);
    // RULE: only one video at a time - pause the previous one
    if (activeId && activeId !== id) {
      pause(activeId);
    }
    
    const el = playersRef.current.get(id);
    console.log('🎥 Found element for play:', id, !!el);
    if (!el) return;
    
    // RULE: new video adopts previous card's audio state
    setMuted(el, mutedPref);
    
    try {
      await el.play?.();
      setActiveId(id);
      console.log('🎥 Successfully started playing:', id);
    } catch (error) {
      console.warn('Failed to play video:', error);
    }
  }, [activeId, mutedPref, pause]);

  const toggleMute = useCallback(() => {
    const next = !mutedPref;
    setMutedPref(next);
    
    // Update currently playing video's mute state
    if (activeId) {
      const el = playersRef.current.get(activeId);
      if (el) {
        setMuted(el, next);
      }
    }
  }, [mutedPref, activeId]);

  return (
    <HighlightsVideoContext.Provider 
      value={{ activeId, mutedPref, register, play, pause, toggleMute }}
    >
      {children}
    </HighlightsVideoContext.Provider>
  );
}