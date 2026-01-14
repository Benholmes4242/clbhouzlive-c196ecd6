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
        className={`w-full rounded-[20px] p-4 text-left transition-all duration-150 active:scale-[0.99] relative ${className || ''}`}
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: '0 8px 24px rgba(2, 6, 23, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
          minHeight: '68px',
        }}
      >
        <div className="flex items-center gap-3.5">
          {/* V3 Icon container - rounded square with subtle gradient */}
          <div 
            className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, var(--hub-surface-2) 0%, var(--hub-surface) 100%)',
              border: '1px solid var(--hub-stroke-subtle)',
            }}
          >
            <MessageSquare 
              className="w-[19px] h-[19px]" 
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
            {/* V2 snippet - slightly larger, editorial feel */}
            <div 
              className="mt-0.5 line-clamp-1"
              style={{ 
                color: 'var(--hub-text-dim)', 
                fontSize: '12.5px',
              }}
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

          {/* V3 Badge + Chevron - refined styling */}
          <div className="flex items-center gap-2.5 flex-shrink-0 ml-1">
            {hasMessages && (
              <div 
                className="h-[24px] min-w-[24px] px-2.5 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: 'rgba(255, 142, 61, 0.16)',
                  color: '#EA580C',
                  border: '1px solid rgba(255, 142, 61, 0.25)',
                  boxShadow: '0 2px 6px rgba(255, 142, 61, 0.12)',
                }}
              >
                {messages.unreadCount}
              </div>
            )}
            <ChevronRight 
              className="w-[18px] h-[18px] flex-shrink-0" 
              style={{ color: 'var(--hub-text-dimmer)' }} 
            />
          </div>
        </div>
      </button>
      
      <HubMessagesSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
