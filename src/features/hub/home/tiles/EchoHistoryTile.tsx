/**
 * Echo History Tile
 * Shows recent Echo chat and swing analyses with thumbnails
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { TileHeader } from '../components/TileHeader';

interface EchoHistoryTileProps {
  limitChat?: number;
  limitSwing?: number;
  viewAllTo: string;
}

export function EchoHistoryTile({ 
  limitChat = 2, 
  limitSwing = 2, 
  viewAllTo 
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
            title: conv.customTitle || conv.title || 'Untitled conversation',
            dateISO: conv.createdAt || conv.timestamp || new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
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
        dateISO: d.created_at,
        thumbUrl: d.video_url
      }));
    },
  });

  return (
    <Tile className="col-span-2 min-h-[140px]">
      <TileHeader 
        title="Recent Echo" 
        subtitle="Chat & Swing" 
        onViewAll={() => nav(viewAllTo)}
      />
      
      <div className="space-y-3 mt-2">
        {/* Chat Section */}
        <div>
          <div className="text-[12px] text-white/50 font-medium mb-2 px-1">CHAT</div>
          <div className="space-y-1">
            {chatLoading && [0, 1].slice(0, limitChat).map(i => (
              <div key={i} className="h-14 rounded-2xl bg-white/04 animate-pulse" />
            ))}
            {!chatLoading && chatItems.map((i: any) => (
              <button 
                key={i.id} 
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/06 transition-colors text-left"
                onClick={() => nav(`/hub/echo/history/chat/${i.id}`)}
              >
                <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/04 grid place-items-center text-[18px] shrink-0">
                  💬
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-white truncate" title={i.title}>
                    {i.title}
                  </div>
                  <div className="text-[12px] text-white/60">
                    {formatDistanceToNow(new Date(i.dateISO), { addSuffix: true })}
                  </div>
                </div>
                <span className="ml-auto text-white/40 text-lg">›</span>
              </button>
            ))}
            {!chatLoading && chatItems.length === 0 && (
              <div className="text-[13px] text-white/60 py-2 px-1">No chat history yet</div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div 
          className="h-px my-2.5"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent)' }}
        />

        {/* Swing Section */}
        <div>
          <div className="text-[12px] text-white/50 font-medium mb-2 px-1">SWING</div>
          <div className="space-y-1">
            {swingLoading && [0, 1].slice(0, limitSwing).map(i => (
              <div key={i} className="h-14 rounded-2xl bg-white/04 animate-pulse" />
            ))}
            {!swingLoading && swingItems.map((i: any) => (
              <button 
                key={i.id} 
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl hover:bg-white/06 transition-colors text-left"
                onClick={() => nav(`/hub/echo/history/swing/${i.id}`)}
              >
                {i.thumbUrl ? (
                  <video 
                    src={i.thumbUrl} 
                    className="w-14 h-14 rounded-2xl object-cover border border-white/12 shrink-0"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/04 grid place-items-center text-[18px] shrink-0">
                    🏌️‍♂️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-white">{i.title}</div>
                  <div className="text-[12px] text-white/60">
                    {formatDistanceToNow(new Date(i.dateISO), { addSuffix: true })}
                  </div>
                </div>
                <span className="ml-auto text-white/40 text-lg">›</span>
              </button>
            ))}
            {!swingLoading && swingItems.length === 0 && (
              <div className="text-[13px] text-white/60 py-2 px-1">No swing analyses yet</div>
            )}
          </div>
        </div>
      </div>
    </Tile>
  );
}
