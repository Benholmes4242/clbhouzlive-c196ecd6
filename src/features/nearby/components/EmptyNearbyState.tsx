import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

interface EmptyNearbyStateProps {
  onOpenToPlay?: () => void;
}

export function EmptyNearbyState({ onOpenToPlay }: EmptyNearbyStateProps) {
  return (
    <div 
      className="mx-3 rounded-[18px] backdrop-blur-[20px] border p-8 text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}
    >
      {/* Relaxed golfer illustration placeholder */}
      <div className="mb-4 text-5xl opacity-60">⛳️</div>
      
      <h3 className="text-[17px] font-semibold text-white mb-1.5">
        All quiet nearby
      </h3>
      
      <p className="text-[14px] text-white/60 mb-4 max-w-[280px] mx-auto leading-relaxed">
        Tap 'Open to Play' to appear on nearby golfers' radars.
      </p>
      
      {onOpenToPlay && (
        <TapButton
          className="inline-flex items-center justify-center px-6 h-10 rounded-xl backdrop-blur-[20px] border font-medium text-[14px] transition-all duration-[85ms] active:scale-[0.97]"
          style={{
            background: 'rgba(76,220,151,0.18)',
            borderColor: 'rgba(76,220,151,0.3)',
            color: '#4cdc97'
          }}
          onPointerDown={() => {
            haptic('light');
            onOpenToPlay();
          }}
        >
          Open to Play
        </TapButton>
      )}
    </div>
  );
}
