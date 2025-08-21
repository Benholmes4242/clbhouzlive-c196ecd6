import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import soundwaveIcon from '@/assets/soundwave-white-icon.png';
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

  // Check for first-time onboarding
  useEffect(() => {
    const hasSeenEcho = localStorage.getItem('echo-onboarding-seen');
    if (!hasSeenEcho) {
      setTimeout(() => setShowOnboarding(true), 500);
      localStorage.setItem('echo-onboarding-seen', 'true');
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
            <div className="font-medium text-sm mb-1">Meet Echo — your personal AI caddy</div>
            <div className="text-xs text-slate-300">Ask Echo about news, golf tips, swing guidance & more.</div>
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
          bg-gradient-to-br from-slate-800 via-slate-700 to-teal-600
          shadow-[0_4px_12px_rgba(0,0,0,0.15),0_0_20px_rgba(20,184,166,0.2)]
          hover:shadow-[0_6px_20px_rgba(0,0,0,0.2),0_0_30px_rgba(20,184,166,0.3)]
          active:scale-95
          flex items-center justify-center
          relative overflow-hidden
        `}
      >
        {/* Inner gradient highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60" />
        
        {/* Soundwave Icon */}
        <div className={`flex items-center justify-center transition-all duration-200 ${isExpanded ? 'gap-3' : 'gap-0'}`}>
          <div className="w-10 h-10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="10" width="1.5" height="4" rx="0.75" fill="white"/>
              <rect x="5" y="8" width="1.5" height="8" rx="0.75" fill="white"/>
              <rect x="8" y="6" width="1.5" height="12" rx="0.75" fill="white"/>
              <rect x="11" y="4" width="1.5" height="16" rx="0.75" fill="white"/>
              <rect x="14" y="7" width="1.5" height="10" rx="0.75" fill="white"/>
              <rect x="17" y="9" width="1.5" height="6" rx="0.75" fill="white"/>
              <rect x="20" y="11" width="1.5" height="2" rx="0.75" fill="white"/>
            </svg>
          </div>
          
          {/* Echo Text (shown when expanded) */}
          {isExpanded && (
            <span className="font-medium text-base text-white/90 pr-2 animate-fade-in whitespace-nowrap">
              Echo
            </span>
          )}
        </div>
      </div>
    </>
  );
};

export default FloatingAIButton;