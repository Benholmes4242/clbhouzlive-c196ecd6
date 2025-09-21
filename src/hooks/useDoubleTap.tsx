import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DoubleTapConfig {
  onDoubleTap?: (e: React.MouseEvent | React.TouchEvent) => void;
  onSingleTap?: (e: React.MouseEvent | React.TouchEvent) => void;
  delay?: number;
  disabled?: boolean;
}

export const useDoubleTap = ({
  onDoubleTap,
  onSingleTap,
  delay = 300,
  disabled = false
}: DoubleTapConfig) => {
  const [tapCount, setTapCount] = React.useState(0);
  const [lastTap, setLastTap] = React.useState(0);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const now = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (now - lastTap < delay && tapCount === 1) {
      // Double tap detected
      setTapCount(0);
      setLastTap(0);
      onDoubleTap?.(e);
    } else {
      // First tap or single tap after delay
      setTapCount(1);
      setLastTap(now);
      
      timeoutRef.current = setTimeout(() => {
        onSingleTap?.(e);
        setTapCount(0);
        setLastTap(0);
      }, delay);
    }
  }, [disabled, delay, tapCount, lastTap, onDoubleTap, onSingleTap]);

  return { handleTap };
};

// Heart burst animation component
interface HeartBurstProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export const HeartBurst: React.FC<HeartBurstProps> = ({ x, y, onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x - 24,
        top: y - 24,
      }}
    >
      {/* Main heart */}
      <div className="relative">
        <div 
          className="w-12 h-12 text-red-500 flex items-center justify-center animate-heart-burst"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
          }}
        >
          ❤️
        </div>
        
        {/* Gradient burst effect */}
        <div 
          className="absolute inset-0 rounded-full animate-burst-gradient"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 100%)',
          }}
        />
        
        {/* Floating mini hearts */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 text-red-400 animate-float-heart"
            style={{
              left: '50%',
              top: '50%',
              animationDelay: `${i * 50}ms`,
              transform: `rotate(${i * 60}deg) translateY(-20px)`,
            }}
          >
            ♥
          </div>
        ))}
      </div>
    </div>
  );
};

// Like count pop animation
interface CountPopProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const CountPop: React.FC<CountPopProps> = ({ children, isActive, className }) => {
  return (
    <div className={cn(
      'transition-all duration-200',
      isActive && 'animate-count-pop',
      className
    )}>
      {children}
    </div>
  );
};

// Success pulse animation
interface SuccessPulseProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const SuccessPulse: React.FC<SuccessPulseProps> = ({ children, isActive, className }) => {
  return (
    <div className={cn(
      'transition-all duration-200',
      isActive && 'animate-success-pulse',
      className
    )}>
      {children}
    </div>
  );
};