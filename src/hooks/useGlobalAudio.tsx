import { useState, useCallback } from 'react';

export const useGlobalAudio = () => {
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);
  
  const toggleGlobalMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);
  
  const setGlobalMute = useCallback((muted: boolean) => {
    setIsGloballyMuted(muted);
  }, []);

  return {
    isGloballyMuted,
    toggleGlobalMute,
    setGlobalMute
  };
};