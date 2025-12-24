import { useState, useCallback, useMemo } from 'react';

export interface BulkProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
}

export interface BulkResult {
  success: string[];
  failed: { id: string; error: string }[];
}

export function useBulkSelect<T extends { id: string }>(items: T[], selectableFilter?: (item: T) => boolean) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<BulkProgress | null>(null);

  // Get only selectable items
  const selectableItems = useMemo(() => {
    if (!selectableFilter) return items;
    return items.filter(selectableFilter);
  }, [items, selectableFilter]);

  const selectableIds = useMemo(() => new Set(selectableItems.map(i => i.id)), [selectableItems]);

  // Enter select mode
  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
    setProgress(null);
  }, []);

  // Exit select mode
  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setProgress(null);
  }, []);

  // Toggle individual selection
  const toggleSelect = useCallback((id: string) => {
    if (!selectableIds.has(id)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [selectableIds]);

  // Select all on page
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(selectableIds));
  }, [selectableIds]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === selectableIds.size && selectableIds.size > 0) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, selectableIds.size, selectAll, deselectAll]);

  // Check if an item is selected
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  // Check if all selectable items are selected
  const allSelected = selectableIds.size > 0 && selectedIds.size === selectableIds.size;

  // Check if some but not all are selected
  const someSelected = selectedIds.size > 0 && selectedIds.size < selectableIds.size;

  // Get selected items
  const selectedItems = useMemo(() => 
    items.filter(i => selectedIds.has(i.id)), 
    [items, selectedIds]
  );

  // Execute bulk action with progress tracking
  const executeBulk = useCallback(async (
    action: (ids: string[]) => Promise<BulkResult>
  ): Promise<BulkResult> => {
    const ids = Array.from(selectedIds);
    setProgress({ total: ids.length, processed: 0, succeeded: 0, failed: 0 });

    try {
      const result = await action(ids);
      setProgress({
        total: ids.length,
        processed: ids.length,
        succeeded: result.success.length,
        failed: result.failed.length,
      });
      return result;
    } catch (error) {
      setProgress(prev => prev ? { ...prev, processed: prev.total, failed: prev.total } : null);
      throw error;
    }
  }, [selectedIds]);

  // Clear progress
  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    selectMode,
    selectedIds,
    selectedCount: selectedIds.size,
    selectableCount: selectableIds.size,
    allSelected,
    someSelected,
    progress,
    selectedItems,
    enterSelectMode,
    exitSelectMode,
    toggleSelect,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isSelected,
    executeBulk,
    clearProgress,
  };
}
