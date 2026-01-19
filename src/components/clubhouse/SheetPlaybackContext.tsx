/**
 * SheetPlaybackContext - Manages video playback within sheet/modal contexts
 * 
 * Ensures only one video plays at a time within a sheet, and handles
 * proper mute/unmute coordination.
 */

import React, { createContext, useContext, useCallback, useRef, useState } from 'react';

declare global {
  interface Window {
    __DEBUG_SHEET__?: boolean;
  }
}

interface SheetPlaybackContextType {
  register: (id: string, pauseFn: () => void, muteFn: () => void) => () => void;
  requestPlay: (id: string) => void;
  requestUnmute: (id: string) => void;
  notifySheetClosing: () => void;
  notifySheetOpened: () => void;
}

const SheetPlaybackContext = createContext<SheetPlaybackContextType | null>(null);

interface SheetPlaybackProviderProps {
  children: React.ReactNode;
}

export const SheetPlaybackProvider: React.FC<SheetPlaybackProviderProps> = ({ children }) => {
  const playersRef = useRef<Map<string, { pauseFn: () => void; muteFn: () => void }>>(new Map());
  const [sheetClosing, setSheetClosing] = useState(false);

  const register = useCallback((id: string, pauseFn: () => void, muteFn: () => void) => {
    playersRef.current.set(id, { pauseFn, muteFn });
    
    // If sheet is closing, immediately pause and mute
    if (sheetClosing) {
      pauseFn();
      muteFn();
    }
    
    return () => {
      playersRef.current.delete(id);
    };
  }, [sheetClosing]);

  const requestPlay = useCallback((id: string) => {
    // Pause all other videos
    playersRef.current.forEach(({ pauseFn }, playerId) => {
      if (playerId !== id) {
        pauseFn();
      }
    });
  }, []);

  const requestUnmute = useCallback((id: string) => {
    // Mute all other videos when one requests unmute
    playersRef.current.forEach(({ muteFn }, playerId) => {
      if (playerId !== id) {
        muteFn();
      }
    });
  }, []);

  const notifySheetClosing = useCallback(() => {
    setSheetClosing(true);
    
    // Pause and mute all videos
    playersRef.current.forEach(({ pauseFn, muteFn }) => {
      pauseFn();
      muteFn();
    });
  }, []);

  const notifySheetOpened = useCallback(() => {
    setSheetClosing(false);
  }, []);

  return (
    <SheetPlaybackContext.Provider
      value={{
        register,
        requestPlay,
        requestUnmute,
        notifySheetClosing,
        notifySheetOpened,
      }}
    >
      {children}
    </SheetPlaybackContext.Provider>
  );
};

export const useSheetPlayback = () => {
  const context = useContext(SheetPlaybackContext);
  if (!context) {
    // Return no-op functions for use outside provider
    return {
      register: () => () => {},
      requestPlay: () => {},
      requestUnmute: () => {},
      notifySheetClosing: () => {},
      notifySheetOpened: () => {},
    };
  }
  return context;
};