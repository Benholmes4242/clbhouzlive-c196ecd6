import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PiWaveform } from 'react-icons/pi';
import { useLocation } from 'react-router-dom';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface FloatingAIButtonProps {
  onClick: () => void;
  shouldHide?: boolean;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick, shouldHide = false }) => {
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  // Check for first-time onboarding (only first 3 sessions) - SSR safe
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const count = parseInt(localStorage.getItem('echo-session-count') || '0');
    if (count < 3) {
      localStorage.setItem('echo-session-count', String(count + 1));
      const t = setTimeout(() => setShowOnboarding(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault(); 
      onClick(); 
    }
  };


  // Auto-hide onboarding after 3 seconds
  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  // Don't show on clubhouse page or when modals are open
  if (location.pathname === '/clubhouse' || location.pathname === '/' || shouldHide) {
    return null;
  }

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 200);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setTimeout(() => setIsExpanded(false), 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (showOnboarding) {
      setShowOnboarding(false);
    }
    onClick();
  };

  return (
    <>
      {/* Invisible sentinel for background sampling */}
      <div
        ref={sentinelRef}
        className="fixed bottom-32 right-6 w-16 h-16 pointer-events-none z-[9998]"
        style={{ opacity: 0 }}
      />
      
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="fixed bottom-40 right-20 z-[10001] animate-fade-in">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-[280px] relative">
            <div className="font-medium text-sm mb-1">Meet Echo - your personal caddie</div>
            <div className="text-xs text-slate-300">Analyse swing or ask about swing tips, courses, golf news, or trips.</div>
            <div className="absolute bottom-1/2 -right-2 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-slate-900 transform translate-y-1/2"></div>
          </div>
        </div>
      )}

      {/* Echo Dock - Right-edge container that clips overflow */}
      <div 
        className={`echo-dock ${isExpanded ? 'is-open' : ''}`}
        style={{
          position: 'fixed',
          right: '0',
          bottom: 'clamp(92px, 8vh, 132px)', // Moved up by ~20px
          width: isExpanded ? '180px' : '64px',
          height: 'auto',
          overflow: 'hidden',
          zIndex: 10000,
          pointerEvents: 'none',
          transition: 'width 0.2s ease',
          boxShadow: 'none', // Remove any drop shadow
          // Mobile spacing: clear bottom tab bar + safe area + extra height
          ...(typeof window !== 'undefined' && window.innerWidth <= 768 && {
            bottom: `calc(84px + env(safe-area-inset-bottom, 0px))` // Moved up by 20px
          })
        }}
      >
        {/* Echo Button */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Open Echo assistant"
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`
            echo-fab
            cursor-pointer
            transition-all duration-200 ease-out motion-reduce:transition-none
            ${isExpanded ? 'w-[140px] h-14' : 'w-14 h-14'}
            rounded-full
            bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]
            active:scale-95
            flex items-center justify-center
            relative overflow-hidden
            before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-[#2A9D8F] before:to-[#1D3557] before:opacity-20 before:blur-xl before:-z-10 before:scale-110
          `}
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            transform: isExpanded ? 'translateX(0)' : 'translateX(12px)',
            transition: 'transform 0.2s ease, width 0.2s ease'
          }}
        >
          
          {/* Inner gradient highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60 motion-reduce:opacity-0" />
          
          {/* PiWaveform Icon */}
          <div className={`flex items-center justify-center transition-all duration-200 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
            <div className="w-10 h-10 flex items-center justify-center">
              <PiWaveform 
                size={36} 
                className="text-white/90 transition-all duration-200 ease-in-out"
                style={{
                  animation: 'echoWave 2s ease-in-out infinite'
                }}
              />
            </div>
            
            {/* Echo Text (shown when expanded) */}
            {isExpanded && (
              <span className="font-medium text-lg text-white/90 pr-2 animate-fade-in whitespace-nowrap flex items-center">
                Echo
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingAIButton;