import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { PullToRefresh } from '@/components/PullToRefresh';
import { supabase } from '@/integrations/supabase/client';
import { formatRelativeTime } from '@/utils/dateFormat';

type ChatItem = {
  id: string;
  preview_text: string;
  created_at: string;
};

type SwingItem = {
  id: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type RecentEchoScreenProps = {
  onClose: () => void;
};

export function RecentEchoScreen({ onClose }: RecentEchoScreenProps) {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();

  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [swingItems, setSwingItems] = useState<SwingItem[]>([]);
  const [swingLoading, setSwingLoading] = useState(true);

  const fetchData = async () => {
    // Fetch chat history from localStorage
    try {
      const stored = localStorage.getItem('echo_chat');
      if (stored) {
        const conversations = JSON.parse(stored);
        const items = Object.values(conversations).map((conv: any) => ({
          id: conv.id,
          preview_text: (conv.customTitle || conv.title || 'Untitled conversation')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80) + ((conv.customTitle || conv.title || '').length > 80 ? '…' : ''),
          created_at: conv.createdAt || conv.timestamp || new Date().toISOString()
        }));
        items.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setChatItems(items.slice(0, 20));
      }
    } catch (error) {
      console.error('[RecentEchoScreen] Error loading chat history:', error);
    } finally {
      setChatLoading(false);
    }

    // Fetch swing history from Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('pro_ai_analyses')
          .select('id, video_url, created_at, analysis_results')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setSwingItems(data.map(d => ({
            id: d.id,
            title: 'Swing Analysis',
            thumbnail_url: d.video_url,
            created_at: d.created_at
          })));
        }
      }
    } catch (error) {
      console.error('[RecentEchoScreen] Error loading swing history:', error);
    } finally {
      setSwingLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch when the sheet opens
  useEffect(() => {
    if (params.get('sheet') === 'recent-echo') {
      const t = setTimeout(() => {
        fetchData();
      }, 250);
      return () => clearTimeout(t);
    }
  }, [params]);

  // Refetch on foreground/focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const handleRefresh = () => {
    setChatLoading(true);
    setSwingLoading(true);
    fetchData();
  };

  return (
    <EchoConversationsProvider>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="h-full w-full -mx-4 -mb-6 overflow-y-auto px-4 py-6 space-y-6">
          {/* CHAT SECTION */}
          <section>
            <h2 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--hub-text-bright)' }}>
              Chat History
            </h2>
            
            {chatLoading && (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="h-[68px] rounded-xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                ))}
              </div>
            )}
            
            {!chatLoading && chatItems.length === 0 && (
              <div className="text-[14px] opacity-60 py-12 text-center">
                No Echo chats yet — ask Echo anything to start.
              </div>
            )}
            
            {!chatLoading && chatItems.length > 0 && (
              <div className="space-y-2">
                {chatItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => nav(`/hub?sheet=echo&id=${item.id}`)}
                    className="w-full text-left rounded-xl bg-white/5 hover:bg-white/7 transition px-3 py-2.5 flex items-start gap-2 border border-white/6"
                  >
                    <span className="inline-flex h-[22px] w-[22px] rounded-full items-center justify-center bg-white/10 mr-1">
                      🗨️
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[14px] leading-tight">
                        {item.preview_text}
                      </div>
                      <div className="text-[12px] opacity-60 mt-0.5">
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* SWING SECTION */}
          <section>
            <h2 className="text-[18px] font-semibold mb-3" style={{ color: 'var(--hub-text-bright)' }}>
              Swing History
            </h2>
            
            {swingLoading && (
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-[140px] rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                ))}
              </div>
            )}
            
            {!swingLoading && swingItems.length === 0 && (
              <div className="text-[14px] opacity-60 py-12 text-center">
                No swing videos yet — upload one to get feedback.
              </div>
            )}
            
            {!swingLoading && swingItems.length > 0 && (
              <div className="space-y-3">
                {swingItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => nav(`/hub?sheet=swing&id=${item.id}`)}
                    className="w-full rounded-2xl overflow-hidden relative border border-white/6 bg-white/5 hover:bg-white/7 transition"
                  >
                    <div className="px-3 pt-3 pb-2 text-[14px] leading-tight">
                      {item.title || 'Swing Analysis'}
                    </div>
                    
                    <div className="relative px-3 pb-3">
                      <div className="rounded-xl overflow-hidden relative h-[92px]">
                        {item.thumbnail_url ? (
                          <video
                            src={item.thumbnail_url}
                            className="absolute inset-0 h-full w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="absolute inset-0 h-full w-full bg-white/10" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/0" />
                        <div className="absolute left-2 bottom-2 text-[12px] opacity-85">
                          {formatRelativeTime(item.created_at)}
                        </div>
                        <span className="absolute right-2 bottom-2 text-[13px] px-3 py-1 rounded-full bg-white/12 border border-white/15">
                          View
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>
    </EchoConversationsProvider>
  );
}
