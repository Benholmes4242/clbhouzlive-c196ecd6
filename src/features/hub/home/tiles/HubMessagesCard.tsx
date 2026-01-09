/**
 * HubMessagesCard V2 - Premium tapable row
 * Soft warm badge, subtle press state
 */

import React, { useState } from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { HubMessagesSheet } from '../../components/HubMessagesSheet';
import { haptic } from '@/utils/haptics';
import { HUB_DEMO_MODE, MOCK_MESSAGES } from '../hubDemoConfig';

const useMessagesData = () => {
  if (HUB_DEMO_MODE) {
    return {
      unreadCount: MOCK_MESSAGES.unreadCount,
      groupChatsCount: MOCK_MESSAGES.groupChatsCount,
      latestSnippet: MOCK_MESSAGES.latestSnippet,
      senderNames: MOCK_MESSAGES.senderNames || [],
    };
  }
  
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
        className={`w-full rounded-[18px] p-3.5 text-left transition-all duration-150 active:scale-[0.99] relative ${className || ''}`}
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: 'var(--hub-shadow-tile)',
          minHeight: '60px',
        }}
      >
        <div className="flex items-center gap-3">
          {/* V2 Icon container - rounded square */}
          <div 
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--hub-surface-2)' }}
          >
            <MessageSquare 
              className="w-[18px] h-[18px]" 
              style={{ color: 'var(--hub-text-dim)' }} 
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div 
              className="text-[15px] font-semibold"
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

          {/* V2 Warm badge pill - not a harsh circle */}
          {hasMessages ? (
            <div 
              className="h-6 min-w-[24px] px-2 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{
                background: 'var(--hub-badge-warm-bg)',
                color: 'var(--hub-badge-warm-text)',
                border: '1px solid var(--hub-badge-warm-border)',
              }}
            >
              {messages.unreadCount}
            </div>
          ) : (
            <ChevronRight 
              className="w-4 h-4 flex-shrink-0" 
              style={{ color: 'var(--hub-text-dimmer)' }} 
            />
          )}
        </div>
      </button>
      
      <HubMessagesSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
