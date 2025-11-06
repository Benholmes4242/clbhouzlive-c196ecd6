/**
 * AI Chat History — Chat-only list
 * Renders inside the existing /hub/new glass page.
 * No thread navigation yet; rows are non-navigating buttons.
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { useEchoChatHistory } from '@/features/echo/hooks/useEchoChatHistory';
import { formatRelativeTime } from '@/utils/dateFormat';
import '../home/hubTheme.css';

export function HubNewPage() {
  const nav = useNavigate();
  const loc = useLocation();

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
  const { data: chats = [], isLoading, error } = useEchoChatHistory({ limit: 50 });

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
        className="sticky top-0 z-10 px-5 pt-4 pb-3"
        style={{
          background: 'transparent',
          borderBottom: '1px solid var(--hub-header-stroke)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-[15px] transition-colors"
            style={{ color: 'var(--hub-text-body)' }}
          >
            ← Back
          </button>

          <h1
            className="text-[17px] font-semibold"
            style={{ color: 'var(--hub-text)' }}
          >
            AI Chat History
          </h1>

          <TapButton
            onPointerDown={handleBack}
            className="transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
            style={{ color: 'var(--hub-close-idle)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-close-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-close-idle)'}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </TapButton>
        </div>
      </header>

      {/* Body */}
      <main className="w-full h-[calc(100vh-80px)] overflow-y-auto px-3.5 pt-3 pb-6">
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'var(--hub-glass-bg)',
            border: '1px solid var(--hub-stroke)',
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
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl animate-pulse"
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
              Couldn't load chat history. Please try again.
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-2">
              {chats.length === 0 && (
                <div
                  className="text-center py-8 text-[15px]"
                  style={{ color: 'var(--hub-text-dim)' }}
                >
                  No Echo chats yet — ask Echo a question to get started.
                </div>
              )}

              {chats.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl transition-colors text-left"
                  style={{
                    background: 'var(--hub-glass-bg)',
                    border: '1px solid var(--hub-stroke)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hub-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--hub-glass-bg)';
                  }}
                  onClick={() => {}}
                  aria-label="Chat thread"
                >
                  <div className="text-2xl">🗨️</div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[15px] font-medium truncate"
                      style={{ color: 'var(--hub-text)' }}
                    >
                      {item.preview_text || 'Chat with Echo'}
                    </div>
                    <div
                      className="text-[13px] mt-0.5"
                      style={{ color: 'var(--hub-text-dim)' }}
                    >
                      {formatRelativeTime(item.created_at)}
                    </div>
                  </div>
                  <div
                    className="text-xl"
                    style={{ color: 'var(--hub-text-dim)' }}
                  >
                    ›
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
