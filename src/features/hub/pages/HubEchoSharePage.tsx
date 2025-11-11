/**
 * Public Share Page - View shared Echo conversation
 * Read-only view with Apple glass styling
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSharedThread } from '@/features/echo/api/shareActions';
import { MessageBubble } from '@/components/ai-chat/MessageBubble';
import { groupMessages } from '@/components/ai-chat/utils/groupMessages';
import { echoHistoryAnalytics } from '@/features/echo/analytics/echoHistoryAnalytics';
import { HighlightedText } from '@/features/echo/components/HighlightedText';
import { ArrowLeft, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import '@/features/hub/home/hubTheme.css';

export function HubEchoSharePage() {
  const { token } = useParams<{ token: string }>();
  const nav = useNavigate();

  // URL <-> input state
  const [searchParams, setSearchParams] = useSearchParams();
  const q = useMemo(() => (searchParams.get('q') || '').trim(), [searchParams]);

  // Local input (debounced to URL)
  const [queryInput, setQueryInput] = useState(q);

  // Keep input in sync if URL changes externally
  useEffect(() => {
    setQueryInput(q);
  }, [q]);

  // Debounce: push input -> URL (?q=) after 250ms
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (queryInput) next.set('q', queryInput);
      else next.delete('q');
      // preserve token and any future params
      setSearchParams(next, { replace: true });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  const { data: thread, isLoading, error } = useQuery({
    queryKey: ['echo-share', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      return getSharedThread(token);
    },
    retry: false,
  });

  // Track public share view
  useEffect(() => {
    if (thread) {
      echoHistoryAnalytics.shareOpenedPublic({
        thread_id: thread.thread_id,
      });
    }
  }, [thread]);

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const groupedMessages = thread ? groupMessages(thread.messages) : [];

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'var(--hub-backdrop)',
        backdropFilter: 'blur(var(--hub-backdrop-blur))',
        WebkitBackdropFilter: 'blur(var(--hub-backdrop-blur))',
      }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between gap-3 px-4 h-14 border-b"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'var(--hub-header-bg-solid)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <button
          onClick={() => nav('/')}
          className="flex items-center gap-2 text-white/90 hover:text-white text-[15px] font-medium transition-colors flex-shrink-0"
          aria-label="Go to home"
        >
          <ArrowLeft size={18} />
          Home
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold truncate flex-1 text-center">
          <HighlightedText
            text={thread ? thread.title : 'Shared Conversation'}
            query={q}
          />
        </h1>
        
        {/* Copy link + Share search */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({
                description: 'Link copied to clipboard',
                duration: 2000,
              });
            }}
            className="px-3 py-1.5 rounded-full text-[13px] border transition-colors hover:bg-white/10"
            style={{ 
              borderColor: 'rgba(255,255,255,0.10)',
              color: 'var(--hub-text)'
            }}
            aria-label="Copy share link"
          >
            Copy link
          </button>

          <div
            role="search"
            aria-label="Search within shared conversation"
          >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              borderColor: 'rgba(255,255,255,0.10)',
              color: 'var(--hub-text)'
            }}
          >
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setQueryInput('');
                }
              }}
              placeholder="Search highlights…"
              aria-label="Search text to highlight"
              className="bg-transparent outline-none text-[13px] placeholder:text-white/50 w-[160px]"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => setQueryInput('')}
                aria-label="Clear search"
                className="opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
                title="Clear"
              >
                <X size={14} className="text-white/90" />
              </button>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main
        className="relative h-full pt-[calc(3.5rem+var(--hub-pad,20px)+env(safe-area-inset-top,0px))] pb-[calc(var(--hub-pad,20px)+env(safe-area-inset-bottom,0px))] px-[var(--hub-pad,20px)]"
      >
        <section
          className="relative overflow-hidden rounded-[18px] border p-[var(--hub-pad,20px)] h-full"
          style={{
            background: 'var(--hub-glass-bg)',
            borderColor: 'var(--hub-stroke)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-[18px] animate-pulse"
                  style={{ background: 'var(--hub-glass-bg)' }}
                />
              ))}
            </div>
          )}

          {error && (
            <div
              className="text-center py-12 px-4"
              style={{ color: 'var(--hub-text)' }}
            >
              <div className="text-[17px] font-semibold mb-2">
                Share link not found
              </div>
              <div className="text-[15px]" style={{ color: 'var(--hub-text-dim)' }}>
                This link may have expired or been revoked.
              </div>
            </div>
          )}

          {thread && (
            <div
              className="space-y-3 overflow-y-auto max-h-full pb-4"
              style={{
                maxHeight: 'calc(100vh - 140px)',
              }}
            >
              {groupedMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role as 'user' | 'assistant'}
                  content={msg.content}
                  timestamp={msg.created_at}
                  firstInGroup={msg.firstInGroup}
                  lastInGroup={msg.lastInGroup}
                  readOnly={true}
                  showChips={msg.firstInGroup}
                  maxWidth="desktop"
                  searchQuery={q}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
