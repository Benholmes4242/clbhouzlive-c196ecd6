/**
 * Echo Chat Thread (read-only) – overlays origin; back returns to History list
 * Updated to use echo_conversations (the active system)
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../home/hubThemeLight.css';
import { useEchoConversationMessages } from '@/features/echo/hooks/useEchoHistory';
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

  // Use the new hook that queries echo_conversation_messages
  const { data: messages, isLoading, error } = useEchoConversationMessages(id ?? null);

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
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
        
        {!isLoading && !error && (!messages || messages.length === 0) && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 pb-20">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-white/90">No messages yet</h3>
              <p className="text-sm text-white/60 max-w-xs">
                This conversation doesn't have any messages.
              </p>
            </div>
          </div>
        )}

        {!isLoading && messages && messages.length > 0 && (
          <>
            {messages.map((m, i) => {
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
       </div>
      </div>
    </div>
  );
}
