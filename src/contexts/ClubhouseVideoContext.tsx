/**
 * ClubhouseVideoContext - Shares active video element reference
 * Used by GlobalBottomNavigation to show video progress bar on Clubhouse
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface ClubhouseVideoContextValue {
  activeVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  setActiveVideo: (video: HTMLVideoElement | null) => void;
  // Force re-render trigger when video changes
  videoChangeCounter: number;
}

const ClubhouseVideoContext = createContext<ClubhouseVideoContextValue | null>(null);

export const ClubhouseVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoChangeCounter, setVideoChangeCounter] = useState(0);

  const setActiveVideo = useCallback((video: HTMLVideoElement | null) => {
    activeVideoRef.current = video;
    // Trigger re-render in consumers
    setVideoChangeCounter(c => c + 1);
  }, []);

  return (
    <ClubhouseVideoContext.Provider value={{ activeVideoRef, setActiveVideo, videoChangeCounter }}>
      {children}
    </ClubhouseVideoContext.Provider>
  );
};

export const useClubhouseVideo = () => {
  const context = useContext(ClubhouseVideoContext);
  if (!context) {
    throw new Error('useClubhouseVideo must be used within ClubhouseVideoProvider');
  }
  return context;
};

// Safe hook that returns null if not in provider (for conditional use)
export const useClubhouseVideoSafe = () => {
  return useContext(ClubhouseVideoContext);
};
