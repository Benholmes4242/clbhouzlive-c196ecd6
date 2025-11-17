/**
 * Echo Chat Thread (read-only) – overlays origin; back returns to History list
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../home/hubTheme.css';
import { useEchoChatThread } from '@/features/echo/hooks/useEchoChatThread';
import { EchoMessageRow } from '@/features/echo/components/EchoMessageRow';
import type { EchoMessage } from '@/features/echo/state/echoTypes';

export default function HubEchoHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const goBack = () => nav(-1);

  const { data, isLoading, error } = useEchoChatThread(id);

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={goBack}
          className="text-white/90 hover:text-white text-[15px] font-medium transition-colors"
          aria-label="Back"
        >
          ‹ Back
        </button>
        <h1 className="text-white/90 text-[17px] font-semibold">AI Chat</h1>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-5 pt-3 pb-6 scroll-smooth">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-white/60">Loading chat…</div>
            </div>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-white/60">Couldn't load this chat.</div>
            </div>
          </div>
        )}
        
        {!isLoading && !error && !data && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <div className="text-white/60">Chat not found.</div>
            </div>
          </div>
        )}

        {!isLoading && data && (
          <>
            {(data.messages ?? []).length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2 pb-20">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-white/90">No messages yet</h3>
                  <p className="text-sm text-white/60 max-w-xs">
                    This conversation doesn't have any messages.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {(data.messages ?? []).map((m, i) => {
                  // Convert to EchoMessage format
                  const echoMessage: EchoMessage = {
                    id: m.id ?? String(i),
                    role: m.role as 'user' | 'assistant' | 'system',
                    content: m.content ?? '',
                    createdAt: m.created_at ?? new Date().toISOString(),
                  };
                  
                  return (
                    <EchoMessageRow
                      key={echoMessage.id}
                      message={echoMessage}
                    />
                  );
                })}
                
                {/* Scroll anchor */}
                <div className="h-1" />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
