/**
 * Echo History Tile
 * Full-width tile showing recent Echo chat and swing analyses with thumbnails
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';

interface EchoHistoryTileProps {
  limitChat?: number;
  limitSwing?: number;
}

function EchoRow({ 
  thumb, 
  title, 
  date, 
  onClick 
}: { 
  thumb?: string; 
  title: string; 
  date: string; 
  onClick: () => void;
}) {
  const fallback = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=100&h=100&fit=crop';
  
  return (
    <div 
      onClick={onClick} 
      className="w-full flex items-center gap-3 py-2.5 group hover:bg-white/06 rounded-xl transition-colors cursor-pointer"
    >
      <div className="h-14 w-14 rounded-2xl overflow-hidden border border-white/12 bg-black/30 shrink-0">
        {thumb ? (
          <video 
            src={thumb} 
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-[20px]">🏌️‍♂️</div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-[15px] text-white/95 truncate">{title}</div>
        <div className="text-[13px] text-white/65">{date}</div>
      </div>
      <span
        className="ml-auto rounded-2xl px-3 h-10 border border-white/12 text-white/85 text-[13px] hover:bg-white/08 shrink-0 flex items-center justify-center"
      >
        View
      </span>
    </div>
  );
}

export function EchoHistoryTile({ 
  limitChat = 1, 
  limitSwing = 2
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
    <Tile 
      title="Recent Echo" 
      subtitle="Chat & Swing"
      onViewAll={() => nav('/hub/echo/history')}
    >
      <div className="space-y-4">
        {/* Chat Section */}
        <div>
          <div className="text-[12px] tracking-wide text-white/55 mb-1.5">CHAT</div>
          {chatLoading && <div className="h-14 rounded-2xl bg-white/04 animate-pulse" />}
          {!chatLoading && chatItems.length > 0 && (
            <div className="text-[14px] text-white/60 py-2">
              {chatItems[0].title}
            </div>
          )}
          {!chatLoading && chatItems.length === 0 && (
            <div className="text-white/50 py-2 text-[14px]">No chat history yet</div>
          )}
        </div>

        {/* Swing Section */}
        <div>
          <div className="text-[12px] tracking-wide text-white/55 mb-1.5">SWING</div>
          <ul className="space-y-2.5">
            {swingLoading && [0, 1].slice(0, limitSwing).map(i => (
              <div key={i} className="h-14 rounded-2xl bg-white/04 animate-pulse" />
            ))}
            {!swingLoading && swingItems.map(s => (
              <EchoRow 
                key={s.id}
                thumb={s.thumbUrl} 
                title="Swing Analysis" 
                date={formatDistanceToNow(new Date(s.dateISO), { addSuffix: true })}
                onClick={() => nav(`/hub/echo/history/swing/${s.id}`)}
              />
            ))}
            {!swingLoading && swingItems.length === 0 && (
              <div className="text-white/50 py-2 text-[14px]">No swing analyses yet</div>
            )}
          </ul>
        </div>
      </div>
    </Tile>
  );
}
