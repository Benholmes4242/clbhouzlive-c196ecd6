/**
 * Echo Tile - Merged with Chat History Preview
 * Shows most recent chat preview; full list in sheet
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HubTile from '../components/HubTile';

type EchoPreview = {
  id: string;
  preview: string;
  timestamp: string;
};

export function EchoTile() {
  const nav = useNavigate();

  const { data: recentChat, isLoading } = useQuery({
    queryKey: ['echoHistory'],
    staleTime: 1000 * 60, // 1 minute
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Try conversations first (existing 55)
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, messages, updated_at')
        .eq('user_id', user.id)
        .eq('conversation_type', 'chat')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conversations && conversations.messages) {
        const msgs = Array.isArray(conversations.messages) ? conversations.messages : [];
        const lastMsg = msgs[msgs.length - 1] as any;
        if (lastMsg?.content) {
          return {
            id: conversations.id,
            preview: lastMsg.content.slice(0, 80),
            timestamp: conversations.updated_at,
          };
        }
      }

      // Fallback to echo_threads/echo_messages
      const { data: threads } = await supabase
        .from('echo_threads')
        .select('id, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (threads) {
        const { data: messages } = await supabase
          .from('echo_messages')
          .select('content, created_at')
          .eq('thread_id', threads.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (messages) {
          return {
            id: threads.id,
            preview: messages.content.slice(0, 80),
            timestamp: messages.created_at,
          };
        }
      }

      return null;
    },
  });

  const handleFooterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    nav('/hub?sheet=echo');
  };

  return (
    <HubTile
      title="Echo"
      subtitle="Ask me anything"
      footer={
        <button
          onClick={handleFooterClick}
          className="text-[15px] font-medium transition hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          View all →
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between">
        {isLoading && (
          <div className="mt-2 h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}
        
        {!isLoading && recentChat && (
          <button
            onClick={() => nav('/hub?sheet=echo')}
            className="mt-2 p-3 rounded-xl text-left transition hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="text-[13px] line-clamp-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {recentChat.preview}
            </p>
            <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {new Date(recentChat.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </button>
        )}

        {!isLoading && !recentChat && (
          <div className="mt-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            No conversations yet
          </div>
        )}
      </div>
    </HubTile>
  );
}
