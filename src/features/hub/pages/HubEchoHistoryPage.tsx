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
import { VirtualList } from '@/features/echo/components/virtual/VirtualList';
import { EchoHistorySearch } from '@/features/echo/components/EchoHistorySearch';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { starThread, deleteThread } from '@/features/echo/api/threadActions';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { echoHistoryAnalytics } from '@/features/echo/analytics/echoHistoryAnalytics';
import { useMedia } from '@/hooks/useMedia';
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

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

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
  
  // Data with search/filter support
  const { data: chats = [], isLoading, error } = useEchoHistorySearch(filters, { limit: 100 });
  
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
  
  // Search & filter handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query: query || undefined }));
  }, []);
  
  const handleFilterChange = useCallback((newFilters: { hasResponse?: boolean; dateFrom?: Date; starred?: boolean }) => {
    setFilters(prev => ({
      ...prev,
      hasResponse: newFilters.hasResponse,
      dateFrom: newFilters.dateFrom,
      starred: newFilters.starred,
    }));
    
    // Track filter changes
    echoHistoryAnalytics.filterApplied({
      has_response: newFilters.hasResponse,
      date_from: newFilters.dateFrom?.toISOString(),
      starred: newFilters.starred,
    });
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
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
  }, [expandedId, chats, handleStar, handleDelete]);
  
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
        <div className="w-16" />
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
          <EchoHistorySearch
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            className="mb-4"
          />

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
                        onStar={() => handleStar(item.id, item.is_starred, 'swipe', index)}
                        onDelete={() => handleDelete(item.id, 'swipe')}
                        onClick={() => {
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
        description="This action cannot be undone. All messages in this conversation will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
}
