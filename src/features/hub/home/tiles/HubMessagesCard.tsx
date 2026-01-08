/**
 * HubMessagesCard - Compact Messages Tile
 * Shorter height, cleaner layout matching Golf OS mock
 */

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { HubMessagesSheet } from '../../components/HubMessagesSheet';
import { haptic } from '@/utils/haptics';

// Mock data - will be replaced with real data later
const MOCK_MESSAGE_COUNT = 3;
const MOCK_SUBTITLE = "Home messages tara messages";

export function HubMessagesCard() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const messageCount = MOCK_MESSAGE_COUNT;
  const hasMessages = messageCount > 0;

  const openSheet = () => {
    haptic('light');
    setIsSheetOpen(true);
  };
  
  const closeSheet = () => setIsSheetOpen(false);

  return (
    <>
      <button 
        onClick={openSheet}
        className="w-full rounded-[22px] p-4 text-left transition-all active:scale-[0.98]"
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
                {MOCK_SUBTITLE}
              </div>
            </div>
          </div>
          
          {/* Message count badge */}
          {hasMessages && (
            <div 
              className="h-7 min-w-[28px] px-2.5 rounded-full flex items-center justify-center text-[14px] font-semibold"
              style={{
                background: 'var(--hub-glass-bg-input)',
                color: 'var(--hub-text)',
              }}
            >
              {messageCount}
            </div>
          )}
        </div>
      </button>
      
      <HubMessagesSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
