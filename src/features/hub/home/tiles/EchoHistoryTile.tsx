/**
 * Echo History Tile
 * Shows recent Echo chat and swing analyses
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TileHeader } from '../parts/TileHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface EchoHistoryTileProps {
  className?: string;
  limitChat?: number;
  limitSwing?: number;
  viewAllTo: string;
}

export function EchoHistoryTile({ 
  className, 
  limitChat = 3, 
  limitSwing = 2, 
  viewAllTo 
}: EchoHistoryTileProps) {
  const nav = useNavigate();

  // Fetch recent chat conversations from localStorage
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

  // Fetch recent swing analyses
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
    <section className={className}>
      <TileHeader 
        title="Recent Echo" 
        subtitle="Chat & Swing" 
        viewAllTo={viewAllTo}
      />
      <div className="list">
        <div className="eyebrow">Chat</div>
        {chatLoading && [0, 1, 2].slice(0, limitChat).map(i => <div className="skel" key={i} />)}
        {!chatLoading && chatItems.map(i => (
          <button 
            key={i.id} 
            className="row text-left w-full p-2 rounded-lg hover:bg-white/03 transition-colors"
            onClick={() => nav(`/hub/echo/history/chat/${i.id}`)}
          >
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{i.title}</div>
              <div className="eyebrow text-xs">
                {formatDistanceToNow(new Date(i.dateISO), { addSuffix: true })}
              </div>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
        {!chatLoading && chatItems.length === 0 && (
          <div className="eyebrow text-xs">No chat history yet</div>
        )}

        <div className="eyebrow mt-4">Swing</div>
        {swingLoading && [0, 1].slice(0, limitSwing).map(i => <div className="skel" key={i} />)}
        {!swingLoading && swingItems.map(i => (
          <button 
            key={i.id} 
            className="row text-left w-full p-2 rounded-lg hover:bg-white/03 transition-colors"
            onClick={() => nav(`/hub/echo/history/swing/${i.id}`)}
          >
            {i.thumbUrl && (
              <video 
                src={i.thumbUrl} 
                className="w-12 h-12 rounded-lg object-cover"
                muted
                playsInline
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium">{i.title}</div>
              <div className="eyebrow text-xs">
                {formatDistanceToNow(new Date(i.dateISO), { addSuffix: true })}
              </div>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
        {!swingLoading && swingItems.length === 0 && (
          <div className="eyebrow text-xs">No swing analyses yet</div>
        )}
      </div>
    </section>
  );
}
