import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

interface PlaybackController {
  register: (id: string, pauseFn: () => void) => () => void;
  requestPlay: (id: string) => void;
  pauseAll: () => void;
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
  const playersRef = useRef<Map<string, () => void>>(new Map());
  const [sheetClosing, setSheetClosing] = useState(false);

  const register = useCallback((id: string, pauseFn: () => void) => {
    playersRef.current.set(id, pauseFn);
    
    // If sheet is closing, immediately pause
    if (sheetClosing) {
      pauseFn();
    }
    
    return () => {
      playersRef.current.delete(id);
    };
  }, [sheetClosing]);

  const requestPlay = useCallback((id: string) => {
    // Pause all other videos
    playersRef.current.forEach((pauseFn, playerId) => {
      if (playerId !== id) {
        pauseFn();
      }
    });
  }, []);

  const pauseAll = useCallback(() => {
    playersRef.current.forEach((pauseFn) => {
      pauseFn();
    });
  }, []);

  const handleSetSheetClosing = useCallback((closing: boolean) => {
    setSheetClosing(closing);
    if (closing) {
      pauseAll();
    }
  }, [pauseAll]);

  const value: PlaybackController = {
    register,
    requestPlay,
    pauseAll,
    setSheetClosing: handleSetSheetClosing,
  };

  return (
    <SheetPlaybackContext.Provider value={value}>
      {children}
    </SheetPlaybackContext.Provider>
  );
};