/**
 * HubMessagesCard - Compact Messages Tile
 * Shorter height, cleaner layout matching Golf OS mock
 */

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { HubMessagesSheet } from '../../components/HubMessagesSheet';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_MESSAGES } from '../hubDemoConfig';

// Hook for messages data - uses demo data when flag is on
const useMessagesData = () => {
  if (HUB_DEMO_MODE) {
    return {
      unreadCount: MOCK_MESSAGES.unreadCount,
      groupChatsCount: MOCK_MESSAGES.groupChatsCount,
      latestSnippet: MOCK_MESSAGES.latestSnippet,
      senderNames: MOCK_MESSAGES.senderNames || [],
    };
  }
  
  // Real data - currently empty
  return {
    unreadCount: 0,
    groupChatsCount: 0,
    latestSnippet: null as string | null,
    senderNames: [] as string[],
  };
};

interface HubMessagesCardProps {
  className?: string;
}

export function HubMessagesCard({ className }: HubMessagesCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const messages = useMessagesData();
  
  const hasMessages = messages.unreadCount > 0;

  const openSheet = () => {
    haptic('light');
    setIsSheetOpen(true);
  };
  
  const closeSheet = () => setIsSheetOpen(false);

  return (
    <>
      <button 
        onClick={openSheet}
        className={`w-full rounded-[22px] p-3 text-left transition-all active:scale-[0.98] relative ${className || ''}`}
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
          minHeight: '64px',
        }}
      >
        {/* Orange badge - top right - consistent with Active Games badge */}
        {hasMessages && (
          <div 
            className="absolute top-3 right-3 h-[18px] min-w-[18px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: 'rgba(247, 158, 27, 0.15)',
              color: '#F79E1B',
              border: '1px solid rgba(247, 158, 27, 0.3)',
              boxShadow: '0 2px 8px rgba(247, 158, 27, 0.1)',
            }}
          >
            {messages.unreadCount}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Icon bubble */}
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--hub-glass-bg-input)' }}
          >
            <MessageSquare 
              className="w-4 h-4" 
              style={{ color: 'var(--hub-text-dim)' }} 
            />
          </div>
          
          <div className="flex-1 min-w-0 pr-6">
            <div 
              className="text-[15px] font-extrabold"
              style={{ color: 'var(--hub-text)' }}
            >
              Messages
            </div>
            <div 
              className="text-[12px] mt-0.5 line-clamp-1"
              style={{ color: 'var(--hub-text-muted)' }}
            >
              {hasMessages
                ? (() => {
                    const names = messages.senderNames;
                    if (names.length === 0) return 'Group chats, game invites, and messages.';
                    if (names.length === 1) return `Message from ${names[0]}`;
                    if (names.length === 2) return `Messages from ${names[0]} and ${names[1]}`;
                    const shown = names.slice(0, 2);
                    const remaining = names.length - 2;
                    return `Messages from ${shown.join(', ')} and ${remaining} more`;
                  })()
                : 'Group chats, game invites, and messages.'}
            </div>
          </div>
        </div>
      </button>
      
      <HubMessagesSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
