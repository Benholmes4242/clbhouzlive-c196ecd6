import React from 'react';
import { cn } from '@/lib/utils';

interface ClbhouzLoadingSpinnerProps {
  /** Visual variant */
  variant?: 'dark' | 'light' | 'glass';
  /** Size */
  size?: 'sm' | 'md';
  /** Optional message below spinner */
  message?: string;
  /** Additional className */
  className?: string;
}

/**
 * ClbhouzLoadingSpinner - Premium golf-themed loading spinner
 * 
 * Design: Minimalist golf ball with pulsing ring animation
 * - Inner circle represents golf ball with dimple texture
 * - Outer rings pulse and rotate smoothly
 * - Matches Clbhouz brand aesthetic
 */
export function ClbhouzLoadingSpinner({
  variant = 'dark',
  size = 'md',
  message,
  className,
}: ClbhouzLoadingSpinnerProps) {
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      ball: 'w-4 h-4',
      ring: 'w-7 h-7',
      outerRing: 'w-8 h-8',
      text: 'text-xs mt-2',
    },
    md: {
      container: 'w-12 h-12',
      ball: 'w-5 h-5',
      ring: 'w-10 h-10',
      outerRing: 'w-12 h-12',
      text: 'text-sm mt-3',
    },
  };

  const variantClasses = {
    dark: {
      ball: 'bg-white/90',
      ballShadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),_0_0_8px_rgba(255,255,255,0.2)]',
      ring: 'border-white/20',
      ringActive: 'border-t-white/80 border-r-white/60',
      outerRing: 'border-white/10',
      outerRingActive: 'border-b-white/40',
      pulse: 'bg-white/5',
      text: 'text-white/70',
    },
    light: {
      ball: 'bg-foreground/80',
      ballShadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15),_0_0_8px_rgba(0,0,0,0.1)]',
      ring: 'border-muted-foreground/20',
      ringActive: 'border-t-foreground/70 border-r-foreground/50',
      outerRing: 'border-muted-foreground/10',
      outerRingActive: 'border-b-muted-foreground/30',
      pulse: 'bg-muted-foreground/5',
      text: 'text-muted-foreground',
    },
    glass: {
      ball: 'bg-white/80 backdrop-blur-sm',
      ballShadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),_0_0_12px_rgba(255,255,255,0.3)]',
      ring: 'border-white/15',
      ringActive: 'border-t-white/70 border-r-white/50',
      outerRing: 'border-white/8',
      outerRingActive: 'border-b-white/30',
      pulse: 'bg-white/5',
      text: 'text-white/80',
    },
  };

  const sizes = sizeClasses[size];
  const colors = variantClasses[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {/* Spinner container */}
      <div className={cn('relative flex items-center justify-center', sizes.container)}>
        {/* Pulsing background glow */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full animate-pulse',
            colors.pulse
          )}
          style={{ animationDuration: '2s' }}
        />
        
        {/* Outer rotating ring */}
        <div 
          className={cn(
            'absolute rounded-full border-2 border-transparent',
            sizes.outerRing,
            colors.outerRing,
            colors.outerRingActive
          )}
          style={{
            animation: 'spin 2.5s linear infinite',
          }}
        />
        
        {/* Inner rotating ring - faster, opposite direction */}
        <div 
          className={cn(
            'absolute rounded-full border-2 border-transparent',
            sizes.ring,
            colors.ring,
            colors.ringActive
          )}
          style={{
            animation: 'spin 1.2s linear infinite reverse',
          }}
        />
        
        {/* Golf ball center - with subtle dimple texture */}
        <div 
          className={cn(
            'relative rounded-full',
            sizes.ball,
            colors.ball,
            colors.ballShadow
          )}
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          {/* Dimple texture overlay */}
          <div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, transparent 20%, rgba(0,0,0,0.05) 25%, transparent 30%),
                          radial-gradient(circle at 70% 40%, transparent 15%, rgba(0,0,0,0.04) 20%, transparent 25%),
                          radial-gradient(circle at 50% 70%, transparent 18%, rgba(0,0,0,0.04) 23%, transparent 28%)`,
            }}
          />
          {/* Highlight */}
          <div 
            className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1/3 h-1/4 rounded-full bg-white/40"
            style={{ filter: 'blur(1px)' }}
          />
        </div>
      </div>
      
      {/* Optional message */}
      {message && (
        <p className={cn('font-medium', sizes.text, colors.text)}>
          {message}
        </p>
      )}
    </div>
  );
}

export default ClbhouzLoadingSpinner;
