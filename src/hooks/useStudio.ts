import { useState, useCallback } from 'react';
import { DraftEdits, DraftEditsMap, StudioTool } from '@/types/studio';

export function useStudio() {
  const [studioOpen, setStudioOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudioTool>(null);
  const [edits, setEdits] = useState<DraftEditsMap>(new Map());

  const updateEdits = useCallback((mediaId: string, patch: Partial<DraftEdits>) => {
    setEdits(prev => {
      const next = new Map(prev);
      const current = next.get(mediaId) ?? {};
      next.set(mediaId, { ...current, ...patch });
      return next;
    });
  }, []);

  const clearEdits = useCallback((mediaId: string) => {
    setEdits(prev => {
      const next = new Map(prev);
      next.delete(mediaId);
      return next;
    });
  }, []);

  const hasEdits = useCallback((mediaId: string) => {
    const mediaEdits = edits.get(mediaId);
    return !!mediaEdits && Object.keys(mediaEdits).length > 0;
  }, [edits]);

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
    edits,
    openStudio,
    closeStudio,
    setActiveTool,
    updateEdits,
    clearEdits,
    hasEdits
  };
}
