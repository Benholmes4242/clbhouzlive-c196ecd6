import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

// Debug flag declaration
declare global {
  interface Window {
    __DEBUG_SHEET__?: boolean;
  }
}

interface PlaybackController {
  register: (id: string, pauseFn: () => void, muteFn: () => void) => () => void;
  requestPlay: (id: string) => void;
  requestUnmute: (id: string) => void;
  pauseAll: () => void;
  muteAll: () => void;
  setSheetClosing: (closing: boolean) => void;
}

const SheetPlaybackContext = createContext<PlaybackController | null>(null);

export const useSheetPlayback = () => {
  const context = useContext(SheetPlaybackContext);
  if (!context) {
    throw new Error('useSheetPlayback must be used within SheetPlaybackProvider');
  }
  return context;
};

interface SheetPlaybackProviderProps {
  children: React.ReactNode;
}

export const SheetPlaybackProvider: React.FC<SheetPlaybackProviderProps> = ({ children }) => {
  const playersRef = useRef<Map<string, { pauseFn: () => void; muteFn: () => void }>>(new Map());
  const [sheetClosing, setSheetClosing] = useState(false);

  const register = useCallback((id: string, pauseFn: () => void, muteFn: () => void) => {
    playersRef.current.set(id, { pauseFn, muteFn });
    
    if (window.__DEBUG_SHEET__) {
      console.log(`[SheetPlaybackContext] Registered player:`, {
        id,
        totalPlayers: playersRef.current.size,
        sheetClosing
      });
    }
    
    // If sheet is closing, immediately pause and mute
    if (sheetClosing) {
      pauseFn();
      muteFn();
    }
    
    return () => {
      playersRef.current.delete(id);
      if (window.__DEBUG_SHEET__) {
        console.log(`[SheetPlaybackContext] Unregistered player:`, {
          id,
          totalPlayers: playersRef.current.size
        });
      }
    };
  }, [sheetClosing]);

  const requestPlay = useCallback((id: string) => {
    if (window.__DEBUG_SHEET__) {
      console.log(`[SheetPlaybackContext] Request play for:`, {
        id,
        willPauseOthers: Array.from(playersRef.current.keys()).filter(pid => pid !== id)
      });
    }
    
    // Pause all other videos
    playersRef.current.forEach(({ pauseFn }, playerId) => {
      if (playerId !== id) {
        pauseFn();
      }
    });
  }, []);

  const requestUnmute = useCallback((id: string) => {
    if (window.__DEBUG_SHEET__) {
      console.log(`[SheetPlaybackContext] Request unmute for:`, {
        id,
        willMuteOthers: Array.from(playersRef.current.keys()).filter(pid => pid !== id)
      });
    }
    
    // Mute all other videos
    playersRef.current.forEach(({ muteFn }, playerId) => {
      if (playerId !== id) {
        muteFn();
      }
    });
  }, []);

  const pauseAll = useCallback(() => {
    playersRef.current.forEach(({ pauseFn }) => {
      pauseFn();
    });
  }, []);

  const muteAll = useCallback(() => {
    playersRef.current.forEach(({ muteFn }) => {
      muteFn();
    });
  }, []);

  const handleSetSheetClosing = useCallback((closing: boolean) => {
    setSheetClosing(closing);
    if (closing) {
      pauseAll();
      muteAll();
    }
  }, [pauseAll, muteAll]);

  const value: PlaybackController = {
    register,
    requestPlay,
    requestUnmute,
    pauseAll,
    muteAll,
    setSheetClosing: handleSetSheetClosing,
  };

  return (
    <SheetPlaybackContext.Provider value={value}>
      {children}
    </SheetPlaybackContext.Provider>
  );
};