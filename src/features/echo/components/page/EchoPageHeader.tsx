/**
 * EchoPageHeader - Minimal Apple-style header for full-page Echo experience
 * Shows only navigation controls; title appears only when in conversation
 */

import React from 'react';
import { ChevronLeft, Plus } from 'lucide-react';

interface EchoPageHeaderProps {
  onBack: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
}

export function EchoPageHeader({ onBack, onNewChat, hasMessages }: EchoPageHeaderProps) {
  return (
    <header 
      className="flex-none h-14 bg-[#F8FAFC] px-4 flex items-center justify-between"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Back to Hub"
      >
        <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
      </button>

      {/* Center - only show title when in conversation */}
      <div className="flex-1 flex items-center justify-center">
        {hasMessages && (
          <span className="text-[17px] font-semibold text-[#1D1D1F]">Echo</span>
        )}
      </div>

      {/* New chat button - only show when there are messages */}
      {hasMessages ? (
        <button
          onClick={onNewChat}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          aria-label="New chat"
        >
          <Plus className="w-6 h-6 text-[#1D1D1F]" />
        </button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}
