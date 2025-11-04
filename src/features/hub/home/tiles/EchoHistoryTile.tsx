/**
 * Echo History Tile
 * Full-width tile showing recent Echo chat and swing analyses with thumbnails
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tile } from '../components/Tile';
import { formatRelativeTime } from '@/utils/dateFormat';

interface EchoHistoryTileProps {
  limitChat?: number;
  limitSwing?: number;
}

export function EchoHistoryTile({ 
  limitChat = 10, 
  limitSwing = 8
}: EchoHistoryTileProps) {
  const nav = useNavigate();

  const { data: chatItems = [], isLoading: chatLoading } = useQuery({
    queryKey: ['echoChatHistory', limitChat],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem('echo_chat');
        if (!stored) return [];
        
        const conversations = JSON.parse(stored);
        return Object.values(conversations)
          .map((conv: any) => ({
            id: conv.id,
            previewText: (conv.customTitle || conv.title || 'Untitled conversation')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 80) + ((conv.customTitle || conv.title || '').length > 80 ? '…' : ''),
            timestamp: conv.createdAt || conv.timestamp || new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limitChat);
      } catch (error) {
        console.error('Error loading chat history:', error);
        return [];
      }
    },
  });

  const { data: swingItems = [], isLoading: swingLoading } = useQuery({
    queryKey: ['swingAnalysesHistory', limitSwing],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data = [] } = await supabase
        .from('pro_ai_analyses')
        .select('id, video_url, created_at, analysis_results')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limitSwing);

      return data.map(d => ({
        id: d.id,
        title: 'Swing Analysis',
        timestamp: d.created_at,
        thumbnail_url: d.video_url
      }));
    },
  });

  return (
    <Tile 
      title="Chat and Swing History"
      footer={
        <div className="mt-auto pt-4">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={() => nav('/hub?sheet=recent-echo')}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View all chat and swing history"
          >
            View all →
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* CHAT SECTION */}
        <section>
          <div className="text-[15px] font-medium mb-2 opacity-80">Chat</div>

          <div className="relative">
            {/* Scroll container */}
            <div className="cs-scroll max-h-[140px] overflow-y-auto pr-1 -mr-1">
              {chatLoading && (
                <>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-[68px] rounded-xl mb-2 animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                  ))}
                </>
              )}
              {!chatLoading && chatItems.length === 0 && (
                <div className="text-[13px] opacity-60 py-10 text-center">
                  No Echo chats yet — ask Echo anything above.
                </div>
              )}
              {!chatLoading && chatItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => nav(`/hub?sheet=echo&id=${item.id}`)}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/7 transition px-3 py-2.5 mb-2 flex items-start gap-2 border border-white/6"
                >
                  <span className="inline-flex h-[22px] w-[22px] rounded-full items-center justify-center bg-white/10 mr-1">
                    🗨️
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[14px] leading-tight">
                      {item.previewText}
                    </div>
                    <div className="text-[12px] opacity-60 mt-0.5">
                      {formatRelativeTime(item.timestamp)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Fade mask */}
            {!chatLoading && chatItems.length > 0 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent" />
            )}
          </div>
        </section>

        {/* SWING SECTION */}
        <section>
          <div className="text-[15px] font-medium mb-2 opacity-80">Swing</div>

          <div className="relative">
            <div className="cs-scroll max-h-[160px] overflow-y-auto pr-1 -mr-1">
              {swingLoading && (
                <>
                  {[0, 1].map(i => (
                    <div key={i} className="h-[140px] rounded-2xl mb-3 animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
                  ))}
                </>
              )}
              {!swingLoading && swingItems.length === 0 && (
                <div className="text-[13px] opacity-60 py-10 text-center">
                  No swing videos yet — upload one to get feedback.
                </div>
              )}
              {!swingLoading && swingItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => nav(`/hub?sheet=swing&id=${item.id}`)}
                  className="w-full mb-3 rounded-2xl overflow-hidden relative border border-white/6 bg-white/5 hover:bg-white/7 transition"
                >
                  {/* Title above thumb */}
                  <div className="px-3 pt-3 pb-2 text-[14px] leading-tight">
                    {item.title || 'Swing Analysis'}
                  </div>

                  {/* Thumbnail with overlay */}
                  <div className="relative px-3 pb-3">
                    <div className="rounded-xl overflow-hidden relative h-[92px]">
                      <video
                        src={item.thumbnail_url}
                        className="absolute inset-0 h-full w-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/0" />
                      <div className="absolute left-2 bottom-2 text-[12px] opacity-85">
                        {formatRelativeTime(item.timestamp)}
                      </div>
                      <span className="absolute right-2 bottom-2 text-[13px] px-3 py-1 rounded-full bg-white/12 border border-white/15">
                        View
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Fade mask */}
            {!swingLoading && swingItems.length > 0 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[rgba(0,0,0,0.35)] to-transparent" />
            )}
          </div>
        </section>
      </div>
    </Tile>
  );
}
