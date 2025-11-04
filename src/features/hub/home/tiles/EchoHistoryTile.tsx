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
    <div className="w-full flex items-center gap-3 py-2.5 rounded-xl text-left">
      <div 
        className="h-14 w-14 rounded-2xl overflow-hidden shrink-0"
        style={{ 
          border: '1px solid var(--hub-stroke-mid)',
          background: 'var(--hub-media-bg)',
        }}
      >
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
        <div className="text-[15px] truncate" style={{ color: 'var(--hub-text-bright)' }}>
          {title}
        </div>
        <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)' }}>
          {date}
        </div>
      </div>
      <button
        onClick={onClick}
        className="ml-auto rounded-2xl px-3 h-10 text-[13px] shrink-0 transition"
        style={{
          border: '1px solid var(--hub-stroke-mid)',
          color: 'var(--hub-text-body)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-button)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        View
      </button>
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
      onViewAll={() => nav('/hub?sheet=recent-echo')}
    >
      <div className="space-y-4">
        {/* Chat Section */}
        <div>
          <div className="text-[12px] tracking-wide mb-1.5" style={{ color: 'var(--hub-text-muted)' }}>
            CHAT
          </div>
          {chatLoading && (
            <div className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          )}
          {!chatLoading && chatItems.length > 0 && (
            <div className="text-[14px] py-2" style={{ color: 'var(--hub-text-sub)' }}>
              {chatItems[0].title}
            </div>
          )}
          {!chatLoading && chatItems.length === 0 && (
            <div className="py-2 text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
              No chat history yet
            </div>
          )}
        </div>

        {/* Swing Section */}
        <div>
          <div className="text-[12px] tracking-wide mb-1.5" style={{ color: 'var(--hub-text-muted)' }}>
            SWING
          </div>
          <ul className="space-y-2.5">
            {swingLoading && [0, 1].slice(0, limitSwing).map(i => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
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
              <div className="py-2 text-[14px]" style={{ color: 'var(--hub-text-dim)' }}>
                No swing analyses yet
              </div>
            )}
          </ul>
        </div>
      </div>
    </Tile>
  );
}
