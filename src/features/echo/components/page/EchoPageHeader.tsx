/**
 * EchoPageHeader - Cleo glass-style header for Echo
 * Glass background with warm gradient bleed-through
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
      className="flex-none px-[18px] flex items-center justify-between"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        height: 'calc(56px + max(env(safe-area-inset-top, 0px), 47px))',
        background: 'rgba(255,251,235,0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.25)',
      }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
        aria-label="Go back to Hub"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: '#B45309' }} />
      </button>

      {/* Center - show orb + title when in conversation */}
      <div className="flex-1 flex items-center justify-center">
        {hasMessages && (
          <div className="flex items-center gap-2">
            {/* Echo icon - gradient circle */}
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: '#F59E0B',
                animation: prefersReduced ? 'none' : 'pulseGlow 3s ease-in-out infinite',
              }}
            >
              <div className="flex items-center gap-[1.5px]">
                <div 
                  className="w-[1.5px] h-1 bg-white rounded-full"
                  style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite' }}
                />
                <div 
                  className="w-[1.5px] h-2 bg-white rounded-full"
                  style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }}
                />
                <div 
                  className="w-[1.5px] h-1 bg-white rounded-full"
                  style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }}
                />
              </div>
            </div>
            <span className="text-[16px] font-semibold" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>Echo</span>
          </div>
        )}
      </div>

      {/* Right button - contextual */}
      {hasMessages ? (
        <button
          onClick={onNewChat}
          className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="Start new conversation"
        >
          <Plus className="w-[22px] h-[22px]" style={{ color: '#B45309' }} />
        </button>
      ) : (
        <button
          onClick={onOpenHistory}
          className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center active:scale-[0.97] transition-transform"
          aria-label="View conversation history"
        >
          <Clock className="w-5 h-5" style={{ color: '#B45309' }} />
        </button>
      )}
    </header>
  );
}
