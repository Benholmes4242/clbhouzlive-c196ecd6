/**
 * AI Chat History — Inline expansion with virtualization
 * Apple-level index + inline thread UX
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEchoChatHistory } from '@/features/echo/hooks/useEchoChatHistory';
import { HistoryRow } from '@/features/echo/components/HistoryRow';
import { HistoryThreadInline } from '@/features/echo/components/HistoryThreadInline';
import { useVirtualization } from '@/hooks/useVirtualization';
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

  // Data (chat-only)
  const { data: chats = [], isLoading, error } = useEchoChatHistory({ limit: 100 });

  // Virtualization for large lists
  const containerHeight = window.innerHeight - 180; // Account for header
  const itemHeight = 72; // Estimated row height
  
  const {
    visibleItems,
    containerProps,
    innerProps,
  } = useVirtualization(chats, {
    itemHeight,
    containerHeight,
    overscan: 5,
  });

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
            className="text-[15px] font-medium mb-4"
            style={{ color: 'var(--hub-text)' }}
          >
            Recent chats
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
              className="text-center py-8 text-[15px]"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              No Echo chats yet — ask Echo to get started.
            </div>
          )}

          {!isLoading && !error && chats.length > 0 && (
            <div className="relative">
              <div 
                id="echo-history-scroll"
                className="max-h-[min(70vh,640px)] overflow-y-auto overscroll-contain pr-1"
                role="list"
              >
                <div className="space-y-2">
                  {visibleItems.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                      <div key={item.id} role="listitem">
                        <HistoryRow
                          id={item.id}
                          title={item.title}
                          subtitle={item.subtitle}
                          createdAt={item.created_at}
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
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

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
