import React, { createContext, useContext, useState, useCallback } from 'react';

interface GlobalAudioContextType {
  isGloballyMuted: boolean;
  setGlobalMute: (muted: boolean) => void;
  toggleGlobalMute: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to muted on every session (resets on page refresh)
  const [isGloballyMuted, setIsGloballyMuted] = useState(true);

  const setGlobalMute = useCallback((muted: boolean) => {
    setIsGloballyMuted(muted);
  }, []);

  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  return (
    <GlobalAudioContext.Provider value={{
      isGloballyMuted,
      setGlobalMute,
      toggleGlobalMute
    }}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider');
  }
  return context;
};