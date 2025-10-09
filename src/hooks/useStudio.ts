import { useState, useCallback } from 'react';
import { StudioEdits, StudioState, StudioTool } from '@/types/studio';

export function useStudio() {
  const [studioOpen, setStudioOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [studioState, setStudioState] = useState<StudioState>({});

  const updateEdits = useCallback((mediaId: string, patch: Partial<StudioEdits>) => {
    setStudioState(prev => ({
      ...prev,
      [mediaId]: { ...(prev[mediaId] ?? {}), ...patch }
    }));
  }, []);

  const clearEdits = useCallback((mediaId: string) => {
    setStudioState(prev => ({
      ...prev,
      [mediaId]: {}
    }));
  }, []);

  const getEdits = useCallback((mediaId: string): StudioEdits => {
    return studioState[mediaId] ?? {};
  }, [studioState]);

  const hasEdits = useCallback((mediaId: string) => {
    const mediaEdits = studioState[mediaId];
    return !!mediaEdits && Object.keys(mediaEdits).length > 0;
  }, [studioState]);

  const openStudio = useCallback(() => {
    setStudioOpen(true);
    setActiveTool(null);
  }, []);

  const closeStudio = useCallback(() => {
    setStudioOpen(false);
    setActiveTool(null);
  }, []);

  return {
    studioOpen,
    activeTool,
    studioState,
    openStudio,
    closeStudio,
    setActiveTool,
    updateEdits,
    clearEdits,
    getEdits,
    hasEdits
  };
}
