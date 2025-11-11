/**
 * AI Chat History — Inline expansion with virtualization
 * Apple-level index + inline thread UX
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useEchoHistorySearch, type EchoHistorySearchFilters } from '@/features/echo/hooks/useEchoHistorySearch';
import { SwipeableHistoryRow } from '@/features/echo/components/SwipeableHistoryRow';
import { HistoryThreadInline } from '@/features/echo/components/HistoryThreadInline';
import { ThreadTagEditorInline } from '@/features/echo/components/tags/ThreadTagEditorInline';
import { VirtualList } from '@/features/echo/components/virtual/VirtualList';
import { EchoHistorySearch } from '@/features/echo/components/EchoHistorySearch';
import { BulkActionBar } from '@/features/echo/components/BulkActionBar';
import { ShortcutsModal } from '@/features/echo/components/ShortcutsModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { starThread, deleteThread } from '@/features/echo/api/threadActions';
import { bulkStarThreads, bulkDeleteThreads } from '@/features/echo/api/bulkActions';
import { bulkAddTagsToThreads, bulkRemoveTagsFromThreads } from '@/features/echo/api/bulkTags';
import { BulkTagPopover } from '@/features/echo/components/BulkTagPopover';
import { fetchThreadDetails } from '@/features/echo/api/threadDetails';
import { startZipExport } from '@/features/echo/utils/exportOrchestrator';
import { downloadBlob, defaultZipName } from '@/features/echo/utils/download';
import { useExportHud } from '@/features/echo/hooks/useExportHud';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { echoHistoryAnalytics } from '@/features/echo/analytics/echoHistoryAnalytics';
import { relevanceScore } from '@/features/echo/utils/relevance';
import { fuzzyScore } from '@/features/echo/utils/fuzzy';
import { useMedia } from '@/hooks/useMedia';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { announce } from '@/utils/a11y';
import { clamp, isTypingTarget, readHashIndex, writeHashIndex } from '@/features/echo/utils/focus';
import '../home/hubTheme.css';

export function HubEchoHistoryPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const queryClient = useQueryClient();
  const isDesktop = useMedia('(min-width: 1024px)');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingDeletes, setPendingDeletes] = useState<Map<string, { timer: NodeJS.Timeout; startTime: number }>>(new Map());
  
  // Export HUD
  const exportHud = useExportHud();

  // Keyboard navigation state
  const listRef = useRef<HTMLDivElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [kbNavEnabled] = useLocalStorage('echo.kbNav', true);
  const [hashNavEnabled] = useLocalStorage('echo.kbNav.hash', true);
  const hasRestoredFromHash = useRef(false);

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  // Apply filters from navigation state and query params
  useEffect(() => {
    const s = (loc.state as any) || {};
    const params = new URLSearchParams(loc.search);
    const next: Partial<EchoHistorySearchFilters> = {};

    // State-based drilldown (from charts)
    if (s.applyTagFilter) next.tag = s.applyTagFilter;
    if (s.applyQuery) next.query = s.applyQuery;
    if (s.applyDateFrom) next.dateFrom = new Date(s.applyDateFrom);
    if (s.applyDateTo) next.dateTo = new Date(s.applyDateTo);

    // Query-param drilldown (?tag=foo&q=bar&from=YYYY-MM-DD&to=YYYY-MM-DD)
    const qpTag = params.get('tag') || undefined;
    const qpQ = params.get('q') || undefined;
    const qpFrom = params.get('from') || undefined;
    const qpTo = params.get('to') || undefined;

    if (qpTag) next.tag = qpTag;
    if (qpQ) next.query = qpQ;
    if (qpFrom) next.dateFrom = new Date(qpFrom);
    if (qpTo) next.dateTo = new Date(qpTo);

    if (Object.keys(next).length) {
      setFilters(prev => ({ ...prev, ...next }));
      // Clear state so back/forward doesn't reapply
      if (s.applyTagFilter || s.applyQuery || s.applyDateFrom || s.applyDateTo) {
        window.history.replaceState({}, '');
      }
      if (next.tag) announce(`Filtered by #${next.tag}`);
      if (next.query) announce(`Applied search: ${next.query}`);
      if (next.dateFrom || next.dateTo) announce('Date range filter applied');
    }
  }, [loc.state, loc.search]);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  // Search & Filter state
  const [filters, setFilters] = useState<EchoHistorySearchFilters>({});
  
  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIndex = useRef<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBulkTag, setShowBulkTag] = useState(false);
  
  // Shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcutsHintSeen, setShortcutsHintSeen] = useLocalStorage('echo.shortcutHintSeen', false);
  
  // Sort mode (persisted)
  const [sortMode, setSortMode] = useLocalStorage<'default' | 'starred' | 'relevance'>('echo.sortMode', 'default');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Fuzzy search toggle (persisted)
  const [fuzzy, setFuzzy] = useLocalStorage<boolean>('echo.fuzzy', false);
  
  // Debounce query for snappier typing
  const debouncedQuery = useDebouncedValue(filters.query, 180);
  
  // Data with search/filter support
  const { data: rawChats = [], isLoading, error } = useEchoHistorySearch(
    { ...filters, query: debouncedQuery }, 
    { limit: 100 }
  );
  
  // Apply client-side relevance sorting + fuzzy filtering
  const chats = React.useMemo(() => {
    if (!rawChats || rawChats.length === 0) return [];
    
    // Fuzzy filtering when enabled
    if (fuzzy && debouncedQuery) {
      const q = String(debouncedQuery);
      const scored = rawChats.map((c, i) => ({
        ...c,
        __f: fuzzyScore((c.title || '') + ' ' + (c.subtitle || ''), q),
        __r: i,
      }));
      scored.sort((a, b) => (b.__f - a.__f) || (a.__r - b.__r));
      // Drop very weak matches if user typed 3+ chars
      const threshold = q.length >= 3 ? 2 : 0;
      return scored.filter((x) => x.__f > threshold);
    }
    
    // Relevance sorting (when not in fuzzy mode)
    if (sortMode !== 'relevance' || !debouncedQuery) return rawChats;

    // Stable copy + score
    const scored = rawChats.map((c, originalIndex) => ({
      ...c,
      __score: relevanceScore(c.title || '', c.subtitle || '', String(debouncedQuery || ''), c.is_starred),
      __originalIndex: originalIndex,
    }));

    // Sort by score desc, then by original order as tiebreaker
    scored.sort((a, b) => {
      if (b.__score !== a.__score) return b.__score - a.__score;
      return a.__originalIndex - b.__originalIndex;
    });

    return scored;
  }, [rawChats, sortMode, fuzzy, debouncedQuery]);
  
  // Auto-open shortcuts modal once for new users
  useEffect(() => {
    if (!shortcutsHintSeen && chats.length > 0) {
      const timer = setTimeout(() => {
        setShowShortcuts(true);
        setShortcutsHintSeen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shortcutsHintSeen, chats.length, setShortcutsHintSeen]);
  
  // Track expanded heights for proper virtualization
  const expandedHeightsRef = useRef<Map<string, number>>(new Map());
  
  // Dynamic size calculation: base row + expanded inline thread + spacing
  const getRowSize = (index: number) => {
    const chat = chats[index];
    const baseHeight = 72; // Row height
    const spacing = 12; // 12px gap between cards (space-y-3)
    const expandedHeight = expandedId === chat.id 
      ? (expandedHeightsRef.current.get(chat.id) || 400) 
      : 0;
    return baseHeight + expandedHeight + (expandedId === chat.id ? 8 : 0) + spacing;
  };
  
  // Inject sortMode into filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, sortMode }));
  }, [sortMode]);

  // Reset focus when list changes
  useEffect(() => {
    if (!chats || chats.length === 0) { 
      setFocusedIndex(-1); 
      return; 
    }
    if (focusedIndex < 0 || focusedIndex >= chats.length) {
      setFocusedIndex(0);
    }
  }, [chats?.length, focusedIndex]);

  // Ensure a row is visible (auto-scroll)
  const ensureRowVisible = useCallback((idx: number) => {
    // DOM fallback
    const container = listRef.current;
    if (!container) return;

    const row = container.querySelector<HTMLElement>(`[data-row-index="${idx}"]`);
    if (!row) return;

    const c = container.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const pad = 8; // small breathing room

    if (r.top < c.top + pad) {
      container.scrollBy({ top: r.top - c.top - pad, behavior: 'smooth' });
    } else if (r.bottom > c.bottom - pad) {
      container.scrollBy({ top: r.bottom - c.bottom + pad, behavior: 'smooth' });
    }
  }, []);

  // Focus a row (calls ensureRowVisible first)
  const focusRowAt = useCallback((idx: number) => {
    ensureRowVisible(idx);
    // focus the hidden CTA/button inside the row
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-row-index="${idx}"] [data-row-cta]`
    );
    el?.focus();
  }, [ensureRowVisible]);

  // Restore focus from hash on first data load
  useEffect(() => {
    if (!hashNavEnabled || hasRestoredFromHash.current) return;
    if (!chats || chats.length === 0) return;

    const fromHash = readHashIndex();
    if (fromHash != null) {
      const idx = clamp(fromHash, 0, chats.length - 1);
      setFocusedIndex(idx);
      focusRowAt(idx);
    }
    hasRestoredFromHash.current = true;
  }, [hashNavEnabled, chats?.length, focusRowAt]);

  // Update hash whenever focusedIndex changes
  useEffect(() => {
    if (!hashNavEnabled) return;
    if (focusedIndex < 0 || !chats || chats.length === 0) return;
    writeHashIndex(clamp(focusedIndex, 0, chats.length - 1));
  }, [hashNavEnabled, focusedIndex, chats?.length]);

  // Keep hash valid when list size shrinks
  useEffect(() => {
    if (!hashNavEnabled || !chats) return;
    const idx = readHashIndex();
    if (idx != null && idx >= chats.length) {
      writeHashIndex(chats.length - 1);
    }
  }, [hashNavEnabled, chats?.length]);
  
  // Search & filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query: query || undefined }));
  }, []);
  
  const handleFilterChange = useCallback((newFilters: { hasResponse?: boolean; dateFrom?: Date; starred?: boolean; tag?: string }) => {
    setFilters(prev => ({
      ...prev,
      hasResponse: newFilters.hasResponse,
      dateFrom: newFilters.dateFrom,
      starred: newFilters.starred,
      tag: newFilters.tag,
    }));
    
    // Track filter changes
    echoHistoryAnalytics.filterApplied({
      has_response: newFilters.hasResponse,
      date_from: newFilters.dateFrom?.toISOString(),
      starred: newFilters.starred,
    });
    
    // Track tag filter separately
    if (newFilters.tag) {
      echoHistoryAnalytics.tagFilterApplied({ tag: newFilters.tag });
    }
  }, []);

  // Star handler with optimistic updates
  const handleStar = useCallback(async (threadId: string, currentStarred: boolean, source: 'row-hover' | 'swipe' | 'keyboard', rankIndex?: number) => {
    const nextStarred = !currentStarred;
    
    // Get title for a11y announcement
    const item = chats.find(c => c.id === threadId);
    const title = item?.title || 'Conversation';
    
    // A11y announcement
    announce(`${nextStarred ? 'Starred' : 'Unstarred'} ${title}`);
    
    // Track analytics
    echoHistoryAnalytics.starToggled({
      thread_id: threadId,
      prev_starred: currentStarred,
      next_starred: nextStarred,
      source,
      list_filters: filters,
      rank_index: rankIndex,
    });
    
    // Optimistic update
    queryClient.setQueryData(
      ['echoHistorySearch', filters, 100],
      (old: any) => {
        if (!old) return old;
        return old.map((item: any) =>
          item.id === threadId ? { ...item, is_starred: nextStarred } : item
        );
      }
    );

    try {
      await starThread(threadId, nextStarred);
      toast({
        description: nextStarred ? 'Starred' : 'Unstarred',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to star/unstar:', error);
      // Rollback optimistic update
      queryClient.setQueryData(
        ['echoHistorySearch', filters, 100],
        (old: any) => {
          if (!old) return old;
          return old.map((item: any) =>
            item.id === threadId ? { ...item, is_starred: currentStarred } : item
          );
        }
      );
      toast({
        description: 'Failed to update star status',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [filters, queryClient]);

  // Soft delete with undo (mobile flow)
  const handleSoftDelete = useCallback((threadId: string, source: 'swipe' | 'row-hover' | 'keyboard') => {
    const startTime = Date.now();
    
    // Get title for a11y announcement
    const item = chats.find(c => c.id === threadId);
    const title = item?.title || 'Conversation';
    
    // A11y announcement
    announce(`Conversation ${title} deleted. Undo available for 5 seconds.`);
    
    // Track soft delete
    echoHistoryAnalytics.deleteSoft({
      thread_id: threadId,
      source,
      list_filters: filters,
    });
    
    // Store original data for undo
    const currentData = queryClient.getQueryData(['echoHistorySearch', filters, 100]) as any[];
    
    // Optimistic remove
    queryClient.setQueryData(
      ['echoHistorySearch', filters, 100],
      (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== threadId);
      }
    );
    
    // Collapse if expanded
    if (expandedId === threadId) {
      setExpandedId(null);
    }
    
    // Set 5s timer for hard delete
    const timer = setTimeout(() => {
      handleHardDelete(threadId);
      setPendingDeletes(prev => {
        const next = new Map(prev);
        next.delete(threadId);
        return next;
      });
    }, 5000);
    
    setPendingDeletes(prev => new Map(prev).set(threadId, { timer, startTime }));
    
    // Show toast with undo
    const { dismiss } = toast({
      description: 'Conversation deleted',
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo delete"
          onClick={() => {
            // A11y announcement
            const item = chats.find(c => c.id === threadId);
            announce(`Restored ${item?.title || 'conversation'}`);
            
            // Track undo
            const elapsed = (Date.now() - startTime) / 1000;
            echoHistoryAnalytics.deleteUndo({
              thread_id: threadId,
              seconds_elapsed: elapsed,
            });
            
            // Clear timer
            const pending = pendingDeletes.get(threadId);
            if (pending) {
              clearTimeout(pending.timer);
              setPendingDeletes(prev => {
                const next = new Map(prev);
                next.delete(threadId);
                return next;
              });
            }
            
            // Restore data
            queryClient.setQueryData(['echoHistorySearch', filters, 100], currentData);
            
            dismiss();
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  }, [filters, queryClient, expandedId, pendingDeletes]);
  
  // Hard delete (actual deletion)
  const handleHardDelete = useCallback(async (threadId: string) => {
    const startTime = Date.now();
    
    try {
      await deleteThread(threadId);
      const latency = Date.now() - startTime;
      
      // Track hard delete
      echoHistoryAnalytics.deleteHard({
        thread_id: threadId,
        latency_ms: latency,
      });
    } catch (error) {
      console.error('Failed to delete:', error);
      // Rollback - refetch data
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
      toast({
        description: 'Failed to delete conversation',
        variant: 'destructive',
        duration: 3000,
      });
    }
  }, [queryClient]);

  // Delete handler with confirm (desktop flow)
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return;
    
    const threadId = deleteConfirmId;
    setDeleteConfirmId(null);
    
    // Desktop: Show undo toast after confirm
    handleSoftDelete(threadId, 'row-hover');
  }, [deleteConfirmId, handleSoftDelete]);
  
  // Delete initiation (mobile swipe vs desktop)
  const handleDelete = useCallback((threadId: string, source: 'swipe' | 'row-hover' | 'keyboard') => {
    if (source === 'swipe') {
      // Mobile swipe: immediate soft delete with undo
      handleSoftDelete(threadId, source);
    } else {
      // Desktop/keyboard: show confirm dialog
      setDeleteConfirmId(threadId);
    }
  }, [handleSoftDelete]);

  // Bulk action handlers
  const selectedArray = Array.from(selectedIds);
  
  // Bulk export ZIP with worker-based orchestrator
  const bulkExportZip = useCallback((format: 'json' | 'md') => {
    if (selectedArray.length < 2) return;
    
    const controller = startZipExport({
      threadIds: selectedArray,
      format,
      filename: defaultZipName(),
      onProgress: (p) => exportHud.update(p),
      onDone: (blob) => {
        exportHud.done();
        downloadBlob(blob, defaultZipName());
        toast({ description: `Exported ${selectedArray.length} conversations`, duration: 2000 });
      },
      onError: (err) => {
        exportHud.done();
        toast({ description: err.message || 'Export failed', variant: 'destructive', duration: 3000 });
      },
    });

    exportHud.show({ total: selectedArray.length, onCancel: controller.cancel });
  }, [selectedArray, exportHud]);
  
  const bulkStar = useCallback(async (star: boolean) => {
    if (selectedArray.length === 0) return;
    
    // Optimistic update
    queryClient.setQueryData(['echoHistorySearch', filters, 100], (old: any) =>
      (old || []).map((x: any) => selectedIds.has(x.id) ? { ...x, is_starred: star } : x)
    );
    
    echoHistoryAnalytics.bulkStar({ count: selectedArray.length, starred: star });
    
    try {
      await bulkStarThreads(selectedArray, star);
      toast({ description: star ? `Starred ${selectedArray.length} conversations` : `Unstarred ${selectedArray.length} conversations`, duration: 2000 });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
      toast({ description: 'Failed to update starred', variant: 'destructive' });
    }
  }, [selectedArray, selectedIds, filters, queryClient]);
  
  const bulkDelete = useCallback(async () => {
    if (selectedArray.length === 0) return;
    
    const snapshot = queryClient.getQueryData(['echoHistorySearch', filters, 100]) as any[] || [];
    const start = Date.now();
    
    // Optimistic remove
    queryClient.setQueryData(['echoHistorySearch', filters, 100], (old: any) =>
      (old || []).filter((x: any) => !selectedIds.has(x.id))
    );
    
    // Collapse if any selected items are expanded
    setExpandedId(prev => (prev && selectedIds.has(prev) ? null : prev));
    setSelectMode(false);
    setSelectedIds(new Set());
    
    echoHistoryAnalytics.bulkDeleteSoft({ count: selectedArray.length });
    announce(`Deleted ${selectedArray.length} conversations. Undo available for 5 seconds.`);
    
    const { dismiss } = toast({
      description: `Deleted ${selectedArray.length} conversations`,
      duration: 5000,
      action: (
        <ToastAction
          altText="Undo bulk delete"
          onClick={() => {
            echoHistoryAnalytics.bulkDeleteUndo({ count: selectedArray.length, seconds_elapsed: (Date.now() - start) / 1000 });
            queryClient.setQueryData(['echoHistorySearch', filters, 100], snapshot);
            announce(`Restored ${selectedArray.length} conversations`);
            dismiss();
          }}
        >
          Undo
        </ToastAction>
      ),
    });
    
    // Finalize after 5s
    setTimeout(async () => {
      try {
        await bulkDeleteThreads(selectedArray);
        echoHistoryAnalytics.bulkDeleteHard({ count: selectedArray.length, latency_ms: Date.now() - start });
      } catch {
        queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
        toast({ description: 'Failed to delete some items', variant: 'destructive' });
      }
    }, 5000);
  }, [selectedArray, selectedIds, filters, queryClient]);

  // Bulk tag handlers
  const handleBulkTagAdd = useCallback(async (tags: string[]) => {
    if (selectedArray.length === 0) return;
    try {
      // Optimistic: attach tags to selected items locally
      queryClient.setQueryData(['echoHistorySearch', filters, 100], (old: any) =>
        (old || []).map((x: any) => 
          selectedIds.has(x.id) 
            ? { ...x, tags: Array.from(new Set([...(x.tags || []), ...tags.map(t => t.toLowerCase())])) } 
            : x
        )
      );
      await bulkAddTagsToThreads(selectedArray, tags);
      echoHistoryAnalytics.bulkTagsAdd({ count_threads: selectedArray.length, count_tags: tags.length });
      toast({ description: `Added ${tags.length} tag(s) to ${selectedArray.length} conversation(s)` });
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
      toast({ description: 'Failed to add tags', variant: 'destructive' });
    }
  }, [selectedArray, selectedIds, filters, queryClient]);

  const handleBulkTagRemove = useCallback(async (tags: string[]) => {
    if (selectedArray.length === 0) return;
    try {
      // Optimistic: strip tags locally
      const removeSet = new Set(tags.map(t => t.toLowerCase()));
      queryClient.setQueryData(['echoHistorySearch', filters, 100], (old: any) =>
        (old || []).map((x: any) =>
          selectedIds.has(x.id) 
            ? { ...x, tags: (x.tags || []).filter((t: string) => !removeSet.has(t.toLowerCase())) } 
            : x
        )
      );
      await bulkRemoveTagsFromThreads(selectedArray, tags);
      echoHistoryAnalytics.bulkTagsRemove({ count_threads: selectedArray.length, count_tags: tags.length });
      toast({ description: `Removed ${tags.length} tag(s) from ${selectedArray.length} conversation(s)` });
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
      toast({ description: 'Failed to remove tags', variant: 'destructive' });
    }
  }, [selectedArray, selectedIds, filters, queryClient]);

  // Enhanced keyboard shortcuts with navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (isTypingTarget(document.activeElement)) {
        return;
      }

      // ? key - toggle shortcuts cheatsheet
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        if (!showShortcuts) {
          echoHistoryAnalytics.shortcutsOpened();
        }
        return;
      }

      // Keyboard navigation (J/K/Arrow keys)
      if (!selectMode && kbNavEnabled && chats.length > 0) {
        const maxIndex = chats.length - 1;
        
        // J or Down - next row
        if ((e.key === 'j' || e.key === 'ArrowDown') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const nextIndex = clamp(focusedIndex + 1, 0, maxIndex);
          setFocusedIndex(nextIndex);
          focusRowAt(nextIndex);
          echoHistoryAnalytics.kbNavMoved({ to_index: nextIndex, key: e.key === 'j' ? 'j' : 'down' });
          return;
        }

        // K or Up - previous row
        if ((e.key === 'k' || e.key === 'ArrowUp') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const nextIndex = clamp(focusedIndex - 1, 0, maxIndex);
          setFocusedIndex(nextIndex);
          focusRowAt(nextIndex);
          echoHistoryAnalytics.kbNavMoved({ to_index: nextIndex, key: e.key === 'k' ? 'k' : 'up' });
          return;
        }

        // Home - jump to first
        if (e.key === 'Home') {
          e.preventDefault();
          setFocusedIndex(0);
          focusRowAt(0);
          echoHistoryAnalytics.kbNavMoved({ to_index: 0, key: 'home' });
          return;
        }

        // End - jump to last
        if (e.key === 'End') {
          e.preventDefault();
          setFocusedIndex(maxIndex);
          focusRowAt(maxIndex);
          echoHistoryAnalytics.kbNavMoved({ to_index: maxIndex, key: 'end' });
          return;
        }

        // O or Enter - open/close focused thread
        if ((e.key === 'o' || e.key === 'Enter') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < chats.length) {
            const item = chats[focusedIndex];
            const willOpen = expandedId !== item.id;
            setExpandedId(willOpen ? item.id : null);
            echoHistoryAnalytics.kbNavToggledOpen({ thread_id: item.id, is_open: willOpen });
            announce(willOpen ? `Opened ${item.title}` : 'Closed conversation');
          }
          return;
        }
      }

      // Selection mode keyboard shortcuts
      if (selectMode) {
        // T - open bulk tag dialog
        if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (selectedArray.length > 0) {
            setShowBulkTag(true);
            announce(`Opened bulk tag for ${selectedArray.length} conversations`);
          }
          return;
        }

        // Space - toggle selection on focused row
        if (e.key === ' ') {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < chats.length) {
            const item = chats[focusedIndex];
            const next = new Set(selectedIds);
            if (selectedIds.has(item.id)) {
              next.delete(item.id);
              announce('Deselected');
            } else {
              next.add(item.id);
              announce('Selected');
            }
            setSelectedIds(next);
          }
          return;
        }

        // Shift+J or Shift+Down - extend selection down
        if ((e.key === 'j' || e.key === 'ArrowDown') && e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const nextIndex = clamp(focusedIndex + 1, 0, chats.length - 1);
          setFocusedIndex(nextIndex);
          focusRowAt(nextIndex);
          // Add to selection
          const item = chats[nextIndex];
          const next = new Set(selectedIds);
          next.add(item.id);
          setSelectedIds(next);
          announce('Extended selection');
          return;
        }

        // Shift+K or Shift+Up - extend selection up
        if ((e.key === 'k' || e.key === 'ArrowUp') && e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          const nextIndex = clamp(focusedIndex - 1, 0, chats.length - 1);
          setFocusedIndex(nextIndex);
          focusRowAt(nextIndex);
          // Add to selection
          const item = chats[nextIndex];
          const next = new Set(selectedIds);
          next.add(item.id);
          setSelectedIds(next);
          announce('Extended selection');
          return;
        }

        // S - bulk star
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          bulkStar(true);
        }
        
        // Delete/Backspace - bulk delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          bulkDelete();
        }
        
        // Escape - clear selection
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedIds(new Set());
          setSelectMode(false);
          announce('Selection cleared');
        }
        return;
      }

      // Non-selection mode shortcuts (focused thread)
      // S key - star/unstar focused or expanded thread
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const targetId = expandedId || (focusedIndex >= 0 && focusedIndex < chats.length ? chats[focusedIndex].id : null);
        if (targetId) {
          const item = chats.find(c => c.id === targetId);
          if (item) {
            const rankIndex = chats.findIndex(c => c.id === targetId);
            handleStar(item.id, item.is_starred, 'keyboard', rankIndex);
          }
        }
      }

      // Delete/Backspace - delete focused or expanded thread
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const targetId = expandedId || (focusedIndex >= 0 && focusedIndex < chats.length ? chats[focusedIndex].id : null);
        if (targetId) {
          handleDelete(targetId, 'keyboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectMode, 
    expandedId, 
    chats, 
    showShortcuts, 
    focusedIndex,
    selectedIds,
    kbNavEnabled,
    handleStar, 
    handleDelete, 
    bulkStar, 
    bulkDelete,
    focusRowAt
  ]);
  
  // Cleanup pending deletes on unmount
  useEffect(() => {
    return () => {
      pendingDeletes.forEach(({ timer }) => clearTimeout(timer));
    };
  }, [pendingDeletes]);

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'var(--hub-backdrop)',
        backdropFilter: 'blur(var(--hub-backdrop-blur))',
        WebkitBackdropFilter: 'blur(var(--hub-backdrop-blur))',
      }}
    >
      {/* Opaque Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'var(--hub-header-bg-solid)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          transition: 'all 160ms ease-out',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          contain: 'paint',
        }}
      >
        <button
          onClick={handleBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back to Hub"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">Echo History</h1>
        <div /> {/* Spacer for flex layout */}
      </header>

      {/* Body - Page shell with safe-area padding */}
      <main 
        className="relative h-full pt-[calc(3.5rem+var(--hub-pad,20px)+env(safe-area-inset-top,0px))] pb-[calc(var(--hub-pad,20px)+env(safe-area-inset-bottom,0px))]"
      >
        {/* Content container - direct on background */}
        <section className="px-4 md:px-6 max-w-3xl mx-auto">
          <h2
            className="text-[17px] font-semibold mb-3"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            Recent chats
          </h2>
          
          {/* Search & Filters */}
          <div className="mb-3">
            <EchoHistorySearch
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              activeTag={filters.tag}
            />
            
            {/* Active tag filter pill */}
            {filters.tag && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--hub-text-dim)' }}>
                  Filtered by tag:
                </span>
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, tag: undefined }));
                    announce(`Cleared tag filter: ${filters.tag}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:bg-white/12"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'var(--hub-text)',
                  }}
                  aria-label={`Clear tag filter ${filters.tag}`}
                >
                  <span>#{filters.tag}</span>
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-[64px] rounded-[18px] animate-pulse"
                  style={{ background: 'var(--hub-glass-bg)' }}
                />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div
              className="text-center py-8 px-4 space-y-2"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              <div className="text-[15px]">Couldn't load Echo history. Please try again.</div>
              {import.meta.env.DEV && error instanceof Error && (
                <div className="text-xs font-mono text-destructive/80 max-w-2xl mx-auto break-words">
                  {error.message}
                </div>
              )}
            </div>
          )}

          {/* Empty history (no items at all) */}
          {!isLoading && !error && chats.length === 0 && !filters.query && !filters.tag && (
            <div 
              role="status" 
              aria-live="polite"
              className="text-center py-12 px-4"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              <div className="text-[15px] font-medium mb-1" style={{ color: 'var(--hub-text)' }}>
                No conversations yet
              </div>
              <div className="text-[13px]">
                Start a chat with Echo to see it here
              </div>
            </div>
          )}

          {/* No results for current query/tag/filters */}
          {!isLoading && !error && chats.length === 0 && (filters.query || filters.tag || filters.hasResponse !== undefined || filters.starred || filters.dateFrom) && (
            <div 
              role="status" 
              aria-live="polite"
              className="text-center py-12 px-4"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              <div className="text-[15px] font-medium mb-2" style={{ color: 'var(--hub-text)' }}>
                No results found
              </div>
              {filters.tag && (
                <div className="text-[13px] mb-2">
                  No results for <strong style={{ color: 'var(--hub-text)' }}>#{filters.tag}</strong>
                </div>
              )}
              {filters.query && (
                <div className="text-[13px] mb-2">
                  No results for "<strong style={{ color: 'var(--hub-text)' }}>{String(filters.query)}</strong>"
                </div>
              )}
              <div className="flex items-center gap-2 justify-center mt-4">
                {filters.tag && (
                  <button
                    onClick={() => setFilters((p) => ({ ...p, tag: undefined }))}
                    className="px-3 py-1.5 rounded-full text-[13px] border border-white/12 hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Clear tag filter
                  </button>
                )}
                {filters.query && (
                  <button
                    onClick={() => setFilters((p) => ({ ...p, query: '' }))}
                    className="px-3 py-1.5 rounded-full text-[13px] border border-white/12 hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Clear search
                  </button>
                )}
                {(filters.hasResponse !== undefined || filters.starred || filters.dateFrom) && (
                  <button
                    onClick={() => setFilters((p) => ({ ...p, hasResponse: undefined, starred: undefined, dateFrom: undefined }))}
                    className="px-3 py-1.5 rounded-full text-[13px] border border-white/12 hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && chats.length > 0 && (
            <ErrorBoundary>
              <div 
                ref={listRef}
                className="relative"
                role="listbox"
                aria-label="Conversations"
                aria-multiselectable={selectMode || undefined}
                id="echo-history-list"
              >
              <VirtualList
                    count={chats.length}
                    estimateSize={72}
                    getSize={getRowSize}
                    overscan={8}
                    className="max-h-[min(70vh,640px)] pr-1"
                    render={(index) => {
                  const item = chats[index];
                  const isExpanded = expandedId === item.id;
                  const isChecked = selectedIds.has(item.id);
                  
                  return (
                    <div role="listitem" className="pb-3">
                      <SwipeableHistoryRow
                        id={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        last_activity_at={item.last_activity_at}
                        relative_date={item.relative_date}
                        message_count={item.message_count}
                        has_response={item.has_response}
                        is_starred={item.is_starred}
                        isStarred={item.is_starred}
                        listFilters={filters}
                        rankIndex={index}
                        isPendingDelete={pendingDeletes.has(item.id)}
                        selectionMode={selectMode}
                        selected={isChecked}
                        searchQuery={filters.query}
                        tags={item.tags || []}
                        index={index}
                        onFocusIndex={setFocusedIndex}
                        onTagsChange={() => {
                          // Invalidate query to refetch with updated tags
                          queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
                        }}
                        onSelectToggle={(e?: React.MouseEvent) => {
                          // Handle shift-click range selection
                          if (e?.shiftKey && lastSelectedIndex.current !== null && isDesktop) {
                            const [start, end] = [lastSelectedIndex.current, index].sort((a, b) => a - b);
                            const rangeIds = chats.slice(start, end + 1).map((c) => c.id);
                            const next = new Set(selectedIds);
                            rangeIds.forEach((id) => next.add(id));
                            setSelectedIds(next);
                            announce(`Selected ${rangeIds.length} conversations`);
                          } else {
                            const next = new Set(selectedIds);
                            if (isChecked) {
                              next.delete(item.id);
                            } else {
                              next.add(item.id);
                            }
                            setSelectedIds(next);
                            lastSelectedIndex.current = index;
                            announce(isChecked ? 'Deselected' : 'Selected');
                          }
                        }}
                        onStar={() => handleStar(item.id, item.is_starred, 'swipe', index)}
                        onDelete={() => handleDelete(item.id, 'swipe')}
                        onClick={() => {
                          if (selectMode) {
                            const next = new Set(selectedIds);
                            if (isChecked) {
                              next.delete(item.id);
                            } else {
                              next.add(item.id);
                            }
                            setSelectedIds(next);
                            announce(isChecked ? 'Deselected' : 'Selected');
                            return;
                          }
                          
                          if (isExpanded) {
                            setExpandedId(null);
                          } else {
                            setExpandedId(item.id);
                            announce(`Opened conversation ${item.title}`);
                            echoHistoryAnalytics.openInline({
                              thread_id: item.id,
                              list_filters: filters,
                              rank_index: index,
                            });
                          }
                        }}
                      />

                      {isExpanded && (
                        <div className="mt-2" aria-label="Conversation preview">
                          <HistoryThreadInline
                            threadId={item.id}
                            title={item.title}
                            onCollapse={() => {
                              setExpandedId(null);
                              announce('Closed conversation preview');
                            }}
                            onCopyLink={() => {
                              navigator.clipboard.writeText(window.location.origin + `/hub/echo/history/chat/${item.id}`);
                              announce('Link copied to clipboard');
                            }}
                            onOpenFull={() => {
                              echoHistoryAnalytics.openFull({
                                thread_id: item.id,
                                from_inline: true,
                              });
                              const state = loc.state as any;
                              nav(`/hub/echo/history/chat/${item.id}`, {
                                state: { backgroundLocation: state?.backgroundLocation, fromHub: true },
                              });
                            }}
                            onHeightChange={(height) => {
                              expandedHeightsRef.current.set(item.id, height);
                            }}
                          />
                          
                          {/* Inline tag editor */}
                          <div className="mt-3 px-4">
                            <ThreadTagEditorInline
                              threadId={item.id}
                              initialTags={item.tags || []}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </div>
            </ErrorBoundary>
          )}
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete conversation?"
        description="This will remove the conversation from your history. You'll have 5 seconds to undo."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
      
      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedArray.length}
        onStar={() => bulkStar(true)}
        onUnstar={() => bulkStar(false)}
        onDelete={bulkDelete}
        onExportZip={selectedArray.length >= 2 ? bulkExportZip : undefined}
        onBulkTagClick={() => setShowBulkTag(true)}
        onClear={() => {
          setSelectedIds(new Set());
          setSelectMode(false);
          announce('Selection cleared');
        }}
      />
      
      {/* Bulk tagging popover */}
      {showBulkTag && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center z-[1100] px-4" onClick={() => setShowBulkTag(false)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <BulkTagPopover
              onAdd={handleBulkTagAdd}
              onRemove={handleBulkTagRemove}
              onClose={() => setShowBulkTag(false)}
            />
          </div>
        </div>
      )}
      
      {/* Export HUD */}
      {exportHud.ui}
      
      {/* Shortcuts modal */}
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}
