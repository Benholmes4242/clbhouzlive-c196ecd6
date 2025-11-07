/**
 * Echo Chat Thread (read-only) – overlays origin; back returns to History list
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../home/hubTheme.css';
import { useEchoChatThread } from '@/features/echo/hooks/useEchoChatThread';
import { formatDateTime } from '@/utils/dateFormat';

export default function HubEchoHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const goBack = () => nav(-1);

  const { data, isLoading, error } = useEchoChatThread(id!);

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
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] px-4 pt-4">
        <div className="space-y-4 pb-6">
          {isLoading && <div className="hub-msg">Loading chat…</div>}
          {error && !isLoading && (
            <div className="hub-msg">
              Couldn't load this chat.
              <pre style={{whiteSpace:'pre-wrap',opacity:.7,marginTop:8,fontSize:12}}>
                {JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}
          {!isLoading && !error && !data && <div className="hub-msg">Chat not found.</div>}

          {!isLoading && data && (
            <div className="hub-card">
              <div className="hub-card-title">Conversation</div>
              <div className="hub-muted mb-3">
                {formatDateTime(data.meta?.created_at)}
              </div>

              {data.messages.length === 0 ? (
                <div className="hub-msg">No messages in this chat yet.</div>
              ) : (
                <div className="echo-thread">
                  {data.messages.map((m, i) => (
                    <div
                      key={i}
                      className={`bubble ${m.role === 'user' ? 'me' : 'bot'}`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
