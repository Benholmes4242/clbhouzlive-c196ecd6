/**
 * AI Chat History — Inline expansion with virtualization
 * Apple-level index + inline thread UX
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEchoHistorySearch, type EchoHistorySearchFilters } from '@/features/echo/hooks/useEchoHistorySearch';
import { HistoryRow } from '@/features/echo/components/HistoryRow';
import { HistoryThreadInline } from '@/features/echo/components/HistoryThreadInline';
import { VirtualList } from '@/features/echo/components/virtual/VirtualList';
import { EchoHistorySearch } from '@/features/echo/components/EchoHistorySearch';
import '../home/hubTheme.css';

export function HubEchoHistoryPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  
  const handleFilterChange = useCallback((newFilters: { hasResponse?: boolean; dateFrom?: Date }) => {
    setFilters(prev => ({
      ...prev,
      hasResponse: newFilters.hasResponse,
      dateFrom: newFilters.dateFrom,
    }));
  }, []);

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
                      <HistoryRow
                        id={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        createdAt={item.last_activity_at}
                        messageCount={item.message_count}
                        isExpanded={isExpanded}
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedId(null);
                          } else {
                            setExpandedId(item.id);
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
    </div>
  );
}
