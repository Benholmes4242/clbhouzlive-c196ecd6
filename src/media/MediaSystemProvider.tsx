/**
 * MediaSystemProvider - STUBBED (video teardown Stage A)
 *
 * All methods are no-ops; all getters return inert defaults.
 * The Provider + Context + hooks are preserved so every import still resolves.
 * No <video>/<audio> registrations do anything; nothing plays.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';

// ============ Types (unchanged shape) ============

export type MediaKind = 'video' | 'audio';

export interface MediaRegistration {
  id: string;
  element: HTMLVideoElement | HTMLAudioElement;
  kind: MediaKind;
  groupId?: string;
  isPlaying: boolean;
  lastPosition?: number;
}

export interface MediaSystemContextType {
  register: (args: { id: string; element: HTMLVideoElement | HTMLAudioElement; kind: MediaKind; groupId?: string }) => void;
  unregister: (id: string) => void;
  requestPlay: (id: string) => Promise<boolean>;
  pause: (id: string) => void;
  pauseAll: (exceptId?: string) => void;
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  savePosition: (id: string, time?: number) => void;
  getPosition: (id: string) => number | undefined;
  clearPosition: (id: string) => void;
  isPlaying: (id: string) => boolean;
  getActiveId: () => string | null;
  getRegistration: (id: string) => MediaRegistration | undefined;
}

const INERT_VALUE: MediaSystemContextType = {
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

const MediaSystemContext = createContext<MediaSystemContextType | null>(null);

// ============ Provider (stub) ============

export const MediaSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info('[VIDEOSTUB] active');
  }, []);

  const value = useMemo(() => INERT_VALUE, []);

  return (
    <MediaSystemContext.Provider value={value}>
      {children}
    </MediaSystemContext.Provider>
  );
};

// ============ Hooks ============

export function useMediaSystem(): MediaSystemContextType {
  const ctx = useContext(MediaSystemContext);
  return ctx ?? INERT_VALUE;
}

export function useMediaSystemSafe(): MediaSystemContextType {
  const ctx = useContext(MediaSystemContext);
  return ctx ?? INERT_VALUE;
}
