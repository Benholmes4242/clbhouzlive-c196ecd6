/**
 * EchoOrb - Solid orange orb with white soundwave bars
 * Reusable across sheet header, empty state, and history items
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ECHO_ORANGE } from './echoStyles';

interface EchoOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  muted?: boolean;
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-10 h-10', barGap: 'gap-[2px]', bars: [1.5, 2.5, 1.5], barWidth: 'w-[2px]' },
  md: { container: 'w-11 h-11', barGap: 'gap-[2px]', bars: [2, 3.5, 2], barWidth: 'w-[2.5px]' },
  lg: { container: 'w-14 h-14', barGap: 'gap-[2.5px]', bars: [2, 3.5, 2], barWidth: 'w-[2.5px]' },
  xl: { container: 'w-16 h-16', barGap: 'gap-[3px]', bars: [3, 5, 3], barWidth: 'w-[3px]' },
};

export function EchoOrb({ 
  size = 'md', 
  muted = false, 
  animate = true,
  className 
}: EchoOrbProps) {
  const config = sizeConfig[size];
  
  const bgColor = muted ? 'bg-[#F0F0F5]' : `bg-[${ECHO_ORANGE}]`;
  const barColor = muted ? 'bg-[#C7C7CC]' : 'bg-white';
  
  return (
    <div 
      className={cn(
        config.container,
        "rounded-full flex items-center justify-center",
        muted ? 'bg-[#F0F0F5]' : '',
        !muted && 'shadow-sm',
        className
      )}
      style={!muted ? { backgroundColor: ECHO_ORANGE } : undefined}
    >
      <div className={cn("flex items-center", config.barGap)}>
        {config.bars.map((height, index) => (
          <div
            key={index}
            className={cn(config.barWidth, "rounded-full", barColor)}
            style={{
              height: `${height * 4}px`,
              animation: animate && !muted 
                ? `gentleWave 3s ease-in-out infinite` 
                : undefined,
              animationDelay: animate && !muted 
                ? `${index * 0.5}s` 
                : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
