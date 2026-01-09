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
    };
  }
  
  // Real data - currently empty
  return {
    unreadCount: 0,
    groupChatsCount: 0,
    latestSnippet: null as string | null,
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
        className={`w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98] min-h-[72px] ${className || ''}`}
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon bubble */}
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--hub-glass-bg-input)' }}
            >
              <MessageSquare 
                className="w-5 h-5" 
                style={{ color: 'var(--hub-text-dim)' }} 
              />
            </div>
            
            <div>
              <div 
                className="text-[17px] font-semibold"
                style={{ color: 'var(--hub-text)' }}
              >
                Messages
              </div>
              <div 
                className="text-[13px] mt-0.5"
                style={{ color: 'var(--hub-text-muted)' }}
              >
                {hasMessages
                  ? `${messages.groupChatsCount} group chats · "${messages.latestSnippet}"`
                  : 'Group chats, game invites, and messages with golfers – all in one place.'}
              </div>
            </div>
          </div>
          
          {/* Message count badge - only show when has messages */}
          {hasMessages && (
            <div 
              className="h-7 min-w-[28px] px-2.5 rounded-full flex items-center justify-center text-[14px] font-semibold"
              style={{
                background: 'var(--hub-glass-bg-input)',
                color: 'var(--hub-text)',
              }}
            >
              {messages.unreadCount}
            </div>
          )}
        </div>
      </button>
      
      <HubMessagesSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
