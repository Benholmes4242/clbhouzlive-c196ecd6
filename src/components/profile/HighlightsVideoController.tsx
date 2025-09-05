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
  pause: (id: string, resetToMuted?: boolean) => void;
  setCardMuted: (id: string, muted: boolean) => void;
  getCardMuted: (id: string) => boolean;
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
  const cardMutedStates = useRef(new Map<string, boolean>()); // Per-card mute states

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

  const setCardMuted = useCallback((id: string, muted: boolean) => {
    cardMutedStates.current.set(id, muted);
    const el = playersRef.current.get(id);
    if (el) {
      setMuted(el, muted);
    }
  }, []);

  const getCardMuted = useCallback((id: string) => {
    return cardMutedStates.current.get(id) ?? true; // Default to muted
  }, []);

  const pause = useCallback((id: string, resetToMuted = false) => {
    const el = playersRef.current.get(id);
    if (el?.pause) {
      el.pause();
    }
    if (el && resetToMuted) {
      // Only reset to muted when switching videos, not on manual pause
      cardMutedStates.current.set(id, true);
      setMuted(el, true);
    }
    if (activeId === id) {
      setActiveId(null);
    }
  }, [activeId]);

  const play = useCallback(async (id: string) => {
    console.log('🎥 Play called for:', id, 'currentActive:', activeId);
    // RULE: only one video at a time - pause the previous one and reset to muted
    if (activeId && activeId !== id) {
      pause(activeId, true); // Reset previous video to muted when switching
    }
    
    // Auto-unmute the new video when starting to play
    cardMutedStates.current.set(id, false);
    
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
    
    // Auto-unmute the newly playing video
    setMuted(el, false);
    
    try {
      await el.play?.();
      console.log('🎥 Successfully started playing:', id);
    } catch (error) {
      console.warn('Failed to play video:', error);
    }
  }, [activeId, pause]);

  return (
    <HighlightsVideoContext.Provider 
      value={{ activeId, register, play, pause, setCardMuted, getCardMuted }}
    >
      {children}
    </HighlightsVideoContext.Provider>
  );
}