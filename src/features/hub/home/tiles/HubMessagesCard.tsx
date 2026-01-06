/**
 * HubMessagesCard - Messages section (replaces Nearby Golfers)
 * Shows conversations with empty state, links to messages list
 */

import React from 'react';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';
import { MessageCircle } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Mock data for v1 - will be replaced with real data later
const MOCK_CONVERSATIONS: Array<{
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
}> = [];

function timeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function HubMessagesCard() {
  const { navigateFromHub } = useHub();
  
  const conversations = MOCK_CONVERSATIONS;
  const isEmpty = conversations.length === 0;

  return (
    <Tile 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <h3>Messages</h3>
          <button
            onClick={(e) => { e.stopPropagation(); navigateFromHub('/hub/messages'); }}
            className="text-[15px] font-medium transition"
            style={{ background: 'transparent', border: 'none', color: 'var(--hub-text-body)', padding: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
          >
            See all →
          </button>
        </div>
      }
    >
      <div className="h-full overflow-y-auto" data-hub-scroll-container="true">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'var(--hub-glass-bg-input)' }}
            >
              <MessageCircle className="w-6 h-6" style={{ color: 'var(--hub-text-dim)' }} />
            </div>
            <h4 
              className="text-[15px] font-semibold mb-1"
              style={{ color: 'var(--hub-text)' }}
            >
              No messages yet
            </h4>
            <p 
              className="text-[13px] leading-relaxed"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              When you play games or follow golfers, chats will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.slice(0, 5).map(conv => (
              <button
                key={conv.id}
                className="w-full flex items-center gap-3 p-2 rounded-xl transition"
                style={{ background: 'transparent' }}
                onClick={() => navigateFromHub(`/hub/messages/${conv.id}`)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hub-glass-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <SquircleAvatar
                  size={42}
                  src={conv.avatarUrl}
                  alt={conv.name}
                  fallback={conv.name.charAt(0).toUpperCase()}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div 
                    className="text-[14px] font-semibold truncate"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    {conv.name}
                  </div>
                  <div 
                    className="text-[13px] truncate"
                    style={{ color: 'var(--hub-text-sub)' }}
                  >
                    {conv.lastMessage}
                  </div>
                </div>
                <span 
                  className="text-[12px] shrink-0"
                  style={{ color: 'var(--hub-text-muted)' }}
                >
                  {timeAgo(conv.timestamp)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}
