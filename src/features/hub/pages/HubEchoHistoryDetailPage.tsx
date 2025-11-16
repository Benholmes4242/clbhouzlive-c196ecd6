/**
 * Echo Chat Thread (read-only) – overlays origin; back returns to History list
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../home/hubTheme.css';
import { useEchoChatThread } from '@/features/echo/hooks/useEchoChatThread';
import { formatDateTime } from '@/utils/dateFormat';
import { Squircle } from '@/components/ui/squircle';
import EchoAvatar from '@/components/ai-chat/EchoAvatar';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

export default function HubEchoHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id || null));
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const goBack = () => nav(-1);

  const { data, isLoading, error } = useEchoChatThread(id);
  const { data: userProfile } = useUserProfile(currentUserId);

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
            </div>
          )}
          {!isLoading && !error && !data && <div className="hub-msg">Chat not found.</div>}

          {!isLoading && data && (
            <div className="hub-card">
              <div className="hub-card-title">Conversation</div>
              <div className="hub-muted mb-3">
                {data.thread?.created_at ? formatDateTime(data.thread.created_at) : ''}
              </div>

              {(data.messages ?? []).length === 0 ? (
                <div className="hub-msg">No messages in this chat yet.</div>
              ) : (
                <div className="space-y-3">
                  {(data.messages ?? []).map((m, i) => {
                    const isUser = m.role === 'user';
                    return (
                      <div
                        key={m.id ?? i}
                        className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="flex-shrink-0">
                            <EchoAvatar state="idle" size={42} />
                          </div>
                        )}
                        <div className={`bubble ${isUser ? 'me' : 'bot'} max-w-[80%]`}>
                          {m.content}
                        </div>
                        {isUser && (
                          <div className="flex-shrink-0">
                            <Squircle width={42} height={42}>
                              {userProfile?.profile_photo_url ? (
                                <img src={userProfile.profile_photo_url} alt="You" className="w-full h-full object-cover" />
                              ) : (
                                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,background:'rgba(255,255,255,0.1)'}}>
                                  {userProfile?.display_name?.[0]?.toUpperCase() || 'Y'}
                                </div>
                              )}
                            </Squircle>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
