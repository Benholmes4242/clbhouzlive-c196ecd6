/**
 * EchoPageHeader - Fixed header for full-page Echo experience
 */

import React from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { EchoOrb } from '@/features/hub/components/echo-v2/EchoOrb';

interface EchoPageHeaderProps {
  onBack: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
}

export function EchoPageHeader({ onBack, onNewChat, hasMessages }: EchoPageHeaderProps) {
  return (
    <header 
      className="flex-none h-14 bg-[#F8FAFC] border-b border-[#E5E5EA] px-4 flex items-center justify-between"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F0F0F5] transition-colors active:scale-95"
        aria-label="Back to Hub"
      >
        <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
      </button>

      {/* Title with orb */}
      <div className="flex items-center gap-2">
        <EchoOrb size="sm" />
        <span className="text-[17px] font-semibold text-[#1D1D1F]">Echo</span>
      </div>

      {/* New chat button - only show when there are messages */}
      {hasMessages ? (
        <button
          onClick={onNewChat}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F0F0F5] transition-colors active:scale-95"
          aria-label="New chat"
        >
          <Plus className="w-6 h-6 text-[#1D1D1F]" />
        </button>
      ) : (
        <div className="w-10" /> // Spacer for alignment
      )}
    </header>
  );
}
