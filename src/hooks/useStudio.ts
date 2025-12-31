import { useState, useCallback } from 'react';
import { StudioEdits, StudioState, StudioTool, PostStudioEdits } from '@/types/studio';

export function useStudio() {
  const [studioOpen, setStudioOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  
  // Per-media edits (filter, crop, rotate, text)
  const [studioState, setStudioState] = useState<StudioState>({});
  
  // Post-level edits (music, badge) - applies to entire post
  const [postEdits, setPostEdits] = useState<PostStudioEdits>({});

  // Per-media edit operations
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

  // Post-level edit operations
  const updatePostEdits = useCallback((patch: Partial<PostStudioEdits>) => {
    setPostEdits(prev => ({ ...prev, ...patch }));
  }, []);

  const clearPostEdits = useCallback(() => {
    setPostEdits({});
  }, []);

  const openStudio = useCallback(() => {
    setStudioOpen(true);
    setActiveTool(null);
  }, []);

  const closeStudio = useCallback(() => {
    setStudioOpen(false);
    setActiveTool(null);
  }, []);

  // Reset all edits (called when starting new post)
  const resetAllEdits = useCallback(() => {
    setStudioState({});
    setPostEdits({});
  }, []);

  return {
    studioOpen,
    activeTool,
    studioState,
    postEdits,
    openStudio,
    closeStudio,
    setActiveTool,
    updateEdits,
    clearEdits,
    getEdits,
    hasEdits,
    updatePostEdits,
    clearPostEdits,
    resetAllEdits
  };
}
