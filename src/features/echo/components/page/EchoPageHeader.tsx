 /**
  * EchoPageHeader - WhatsApp-style minimal header for Echo
  * Shows navigation controls; orb + title appears in conversation mode
  */
 
 import React from 'react';
 import { ChevronLeft, Plus, Clock } from 'lucide-react';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EchoPageHeaderProps {
  onBack: () => void;
  onNewChat: () => void;
  onOpenHistory: () => void;
  hasMessages: boolean;
}

export function EchoPageHeader({ onBack, onNewChat, onOpenHistory, hasMessages }: EchoPageHeaderProps) {
   const prefersReduced = usePrefersReducedMotion();
 
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
        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
         aria-label="Go back to Hub"
      >
        <ChevronLeft className="w-6 h-6 text-[#1D1D1F]" />
      </button>

      {/* Center - show orb + title when in conversation */}
      <div className="flex-1 flex items-center justify-center">
        {hasMessages && (
          <div className="flex items-center gap-2">
            {/* Small orb */}
            <div className="w-8 h-8 rounded-full bg-[#FFBF66] flex items-center justify-center">
              <div className="flex items-center gap-[2px]">
                 <div 
                   className="w-[2px] h-1.5 bg-white rounded-full"
                   style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite' }}
                 />
                 <div 
                   className="w-[2px] h-2.5 bg-white rounded-full"
                   style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }}
                 />
                 <div 
                   className="w-[2px] h-1.5 bg-white rounded-full"
                   style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }}
                 />
              </div>
            </div>
             <span className="text-[1.0625rem] font-semibold text-[#1D1D1F]">Echo</span>
          </div>
        )}
      </div>

      {/* Right button - contextual */}
      {hasMessages ? (
        <button
          onClick={onNewChat}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
           aria-label="Start new conversation"
        >
          <Plus className="w-6 h-6 text-[#1D1D1F]" />
        </button>
      ) : (
        <button
          onClick={onOpenHistory}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
           aria-label="View conversation history"
        >
          <Clock className="w-[22px] h-[22px] text-[#1D1D1F]" />
        </button>
      )}
    </header>
  );
}
