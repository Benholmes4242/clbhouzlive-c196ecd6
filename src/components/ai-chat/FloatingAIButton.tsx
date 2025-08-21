import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PiWaveform } from 'react-icons/pi';
import { useLocation } from 'react-router-dom';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  // Check for first-time onboarding (only first 3 sessions)
  useEffect(() => {
    const echoSessionCount = parseInt(localStorage.getItem('echo-session-count') || '0');
    
    if (echoSessionCount < 3) {
      // Increment session count
      localStorage.setItem('echo-session-count', (echoSessionCount + 1).toString());
      
      // Show onboarding for first 3 sessions
      setTimeout(() => setShowOnboarding(true), 3000);
    }
  }, []);


  // Auto-hide onboarding after 3 seconds
  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => setShowOnboarding(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  // Don't show on clubhouse page
  if (location.pathname === '/clubhouse' || location.pathname === '/') {
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
        className="fixed bottom-28 right-6 w-16 h-16 pointer-events-none z-[9998]"
        style={{ opacity: 0 }}
      />
      
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="fixed bottom-40 right-6 z-[10000] animate-fade-in">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-[280px] relative">
            <div className="font-medium text-sm mb-1">Meet Echo - your personal caddie</div>
            <div className="text-xs text-slate-300">Analyse swing or ask about swing tips, courses, golf news, or trips.</div>
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        </div>
      )}

      {/* Echo Orb */}
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 10000
        }}
        className={`
          cursor-pointer
          transition-all duration-200 ease-out
          ${isExpanded ? 'w-[140px] h-14' : 'w-14 h-14'}
          rounded-full
          bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]
          shadow-[0_0_20px_0_rgba(0,0,0,0.16)]
          hover:shadow-[0_0_24px_0_rgba(0,0,0,0.18),0_0_14px_rgba(247,147,30,0.18)]
          active:scale-95
          flex items-center justify-center
          relative overflow-hidden
          border border-white/10
        `}
      >
        
        {/* Inner gradient highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60" />
        
        {/* PiWaveform Icon */}
        <div className={`flex items-center justify-center transition-all duration-200 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
          <div className="w-10 h-10 flex items-center justify-center">
            <PiWaveform 
              size={28} 
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
    </>
  );
};

export default FloatingAIButton;