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
import { useMedia } from '@/hooks/useMedia';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { announce } from '@/utils/a11y';
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

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  // Apply tag filter from navigation state
  useEffect(() => {
    const s = (loc.state as any)?.applyTagFilter as string | undefined;
    if (s) {
      setFilters(prev => ({ ...prev, tag: s }));
      // Clear state so back/forward doesn't reapply
      window.history.replaceState({}, '');
      announce(`Filtered by #${s}`);
    }
  }, [loc.state]);

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
  
  // Data with search/filter support
  const { data: rawChats = [], isLoading, error } = useEchoHistorySearch(filters, { limit: 100 });
  
  // Apply client-side relevance sorting when sortMode === 'relevance'
  const chats = React.useMemo(() => {
    if (!rawChats || rawChats.length === 0) return [];
    if (sortMode !== 'relevance' || !filters.query) return rawChats;

    // Stable copy + score
    const scored = rawChats.map((c, originalIndex) => ({
      ...c,
      __score: relevanceScore(c.title || '', c.subtitle || '', String(filters.query || ''), c.is_starred),
      __originalIndex: originalIndex,
    }));

    // Sort by score desc, then by original order as tiebreaker
    scored.sort((a, b) => {
      if (b.__score !== a.__score) return b.__score - a.__score;
      return a.__originalIndex - b.__originalIndex;
    });

    return scored;
  }, [rawChats, sortMode, filters.query]);
  
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
  
  // Dynamic size calculation: base row + expanded inline thread
  const getRowSize = (index: number) => {
    const chat = chats[index];
    const baseHeight = 72; // Row height
    const expandedHeight = expandedId === chat.id 
      ? (expandedHeightsRef.current.get(chat.id) || 400) 
      : 0;
    return baseHeight + expandedHeight + (expandedId === chat.id ? 8 : 0); // 8px gap
  };
  
  // Inject sortMode into filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, sortMode }));
  }, [sortMode]);
  
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
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

      // Bulk mode shortcuts
      if (selectMode) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          bulkStar(true);
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          bulkDelete();
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedIds(new Set());
          setSelectMode(false);
          announce('Selection cleared');
        }
        return;
      }

      // S key - star/unstar expanded thread
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (expandedId) {
          const item = chats.find(c => c.id === expandedId);
          if (item) {
            const rankIndex = chats.findIndex(c => c.id === expandedId);
            handleStar(item.id, item.is_starred, 'keyboard', rankIndex);
          }
        }
      }

      // Delete/Backspace - delete expanded thread
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (expandedId) {
          handleDelete(expandedId, 'keyboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectMode, expandedId, chats, showShortcuts, handleStar, handleDelete, bulkStar, bulkDelete]);
  
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
        
        {/* Right controls: Sort + Select */}
        <div className="flex items-center gap-2">
          {/* Select All / Clear (only in select mode) */}
          {selectMode && (
            <>
              <button
                onClick={() => {
                  const all = new Set(chats.map((c) => c.id));
                  setSelectedIds(all);
                  announce(`Selected ${all.size} conversations`);
                }}
                className="px-3 py-1.5 rounded-full text-[13px] border border-white/10 hover:bg-white/12 transition-colors focus:outline-none focus:ring-2 focus:ring-white/18"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--hub-text)' }}
                aria-label="Select all visible conversations"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  announce('Selection cleared');
                }}
                className="px-3 py-1.5 rounded-full text-[13px] border border-white/10 hover:bg-white/12 transition-colors focus:outline-none focus:ring-2 focus:ring-white/18"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--hub-text)' }}
                aria-label="Clear selection"
              >
                Clear
              </button>
            </>
          )}
          
          {/* Sort dropdown (enhanced menu) */}
          {!selectMode && (
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="px-3 py-1.5 rounded-full text-[13px] border border-white/10 hover:bg-white/12 transition-colors focus:outline-none focus:ring-2 focus:ring-white/18"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--hub-text)' }}
                aria-haspopup="menu"
                aria-expanded={showSortMenu}
                aria-label="Sort conversations"
              >
                {sortMode === 'starred' ? 'Starred' : sortMode === 'relevance' ? 'Relevance' : 'Recent'}
              </button>

              {showSortMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowSortMenu(false)}
                    aria-hidden="true"
                  />
                  
                  {/* Menu */}
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border shadow-xl backdrop-blur-md p-1 z-[9999]"
                    style={{
                      borderColor: 'var(--hub-stroke)',
                      background: 'rgba(22, 24, 27, 0.98)',
                    }}
                  >
                    <button
                      role="menuitem"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-[14px]"
                      style={{ color: 'var(--hub-text)' }}
                      onClick={() => {
                        setSortMode('default');
                        setShowSortMenu(false);
                        echoHistoryAnalytics.sortChanged({ sort_mode: 'default' });
                        announce('Sorted by Recent');
                      }}
                    >
                      Recent
                    </button>
                    
                    <button
                      role="menuitem"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-[14px]"
                      style={{ color: 'var(--hub-text)' }}
                      onClick={() => {
                        setSortMode('starred');
                        setShowSortMenu(false);
                        echoHistoryAnalytics.sortChanged({ sort_mode: 'starred' });
                        announce('Sorted by Starred first');
                      }}
                    >
                      Starred first
                    </button>
                    
                    {Boolean(filters.query) && (
                      <button
                        role="menuitem"
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-[14px]"
                        style={{ color: 'var(--hub-text)' }}
                        onClick={() => {
                          setSortMode('relevance');
                          setShowSortMenu(false);
                          echoHistoryAnalytics.sortChanged({ sort_mode: 'relevance' });
                          announce('Sorted by Relevance');
                        }}
                      >
                        Relevance
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Select toggle */}
          <button
            onClick={() => {
              const next = !selectMode;
              setSelectMode(next);
              setSelectedIds(new Set());
              announce(next ? 'Selection mode enabled' : 'Selection mode disabled');
            }}
            className="px-3 py-1.5 rounded-full text-[13px] border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/18"
            style={{ 
              background: selectMode ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)', 
              color: 'var(--hub-text)' 
            }}
            aria-pressed={selectMode}
            aria-label="Select conversations"
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        </div>
      </header>

      {/* Body - Page shell with safe-area padding */}
      <main 
        className="relative h-full pt-[calc(3.5rem+var(--hub-pad,20px)+env(safe-area-inset-top,0px))] pb-[calc(var(--hub-pad,20px)+env(safe-area-inset-bottom,0px))] px-[var(--hub-pad,20px)]"
      >
        {/* Glass container */}
        <section
          className="relative overflow-hidden rounded-[18px] border p-[var(--hub-pad,20px)]"
          style={{
            background: 'var(--hub-glass-bg)',
            borderColor: 'var(--hub-stroke)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="text-[15px] font-medium mb-3"
            style={{ color: 'var(--hub-text)' }}
          >
            Recent chats
          </div>
          
          {/* Search & Filters */}
          <div className="mb-4 space-y-2">
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
              className="text-center py-8 text-[15px]"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              Couldn't load Echo history. Please try again.
            </div>
          )}

          {!isLoading && !error && chats.length === 0 && (
            <div
              className="text-center py-12 px-4"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              <div className="text-[15px] font-medium mb-1" style={{ color: 'var(--hub-text)' }}>
                {filters.query || filters.hasResponse !== undefined || filters.dateFrom
                  ? 'No conversations found'
                  : 'No Echo chats yet'}
              </div>
              <div className="text-[13px]">
                {filters.query || filters.hasResponse !== undefined || filters.dateFrom
                  ? 'Try a different search or clear filters'
                  : 'Ask Echo to get started'}
              </div>
            </div>
          )}

          {!isLoading && !error && chats.length > 0 && (
            <div className="relative">
              <VirtualList
                count={chats.length}
                estimateSize={72}
                getSize={getRowSize}
                overscan={3}
                className="max-h-[min(70vh,640px)] pr-1"
                render={(index) => {
                  const item = chats[index];
                  const isExpanded = expandedId === item.id;
                  const isChecked = selectedIds.has(item.id);
                  
                  return (
                    <div role="listitem" className="mb-2">
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
                        <>
                          <HistoryThreadInline
                            threadId={item.id}
                            title={item.title}
                            onCollapse={() => setExpandedId(null)}
                            onCopyLink={() => {
                              navigator.clipboard.writeText(window.location.origin + `/hub/echo/history/chat/${item.id}`);
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
                        </>
                      )}
                    </div>
                  );
                }}
              />

              {/* Bottom fade overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 rounded-b-[18px]"
                style={{
                  maskImage: 'linear-gradient(to top, black, transparent)',
                  WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
                  background: 'rgba(0,0,0,0.35)',
                }}
              />
            </div>
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
