import { useState, useCallback, useEffect } from 'react';
import { GolfCourse } from '@/components/admin/golf-courses/types';

export function useGolfCoursesSelection(courses: GolfCourse[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Clear selection when courses change
  useEffect(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((courseId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(courses.map(c => c.id)));
  }, [courses]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectMode(false);
  }, []);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  }, []);

  const selectedCourses = courses.filter(c => selectedIds.has(c.id));
  const isAllSelected = courses.length > 0 && selectedIds.size === courses.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < courses.length;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isSelectMode) {
        e.preventDefault();
        selectAll();
      }

      // Escape to clear selection
      if (e.key === 'Escape' && selectedIds.size > 0) {
        clearSelection();
      }

      // S to toggle select mode
      if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSelectMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectMode, selectAll, clearSelection, toggleSelectMode, selectedIds.size]);

  return {
    selectedIds,
    selectedCourses,
    isSelectMode,
    isAllSelected,
    isSomeSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectMode,
  };
}
