import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import soundwaveIcon from '@/assets/soundwave-white-icon.png';
import { useLocation } from 'react-router-dom';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  // Responsive sizing
  const buttonSize = isMobile ? 56 : 64;
  const safeAreaBottom = isMobile ? 12 : 24;

  // Check for first-time onboarding (show for first 3 sessions)
  useEffect(() => {
    const sessions = parseInt(localStorage.getItem('echo-session-count') || '0');
    const hasSeenEcho = localStorage.getItem('echo-onboarding-seen');
    
    if (!hasSeenEcho && sessions < 3) {
      // Show onboarding after 3s on profile or feed screens
      const timer = setTimeout(() => {
        if (location.pathname === '/profile' || location.pathname.includes('/discover') || location.pathname.includes('/tour-central')) {
          setShowOnboarding(true);
          localStorage.setItem('echo-session-count', (sessions + 1).toString());
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Auto-hide onboarding after showing
  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        if (parseInt(localStorage.getItem('echo-session-count') || '0') >= 3) {
          localStorage.setItem('echo-onboarding-seen', 'true');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  // Idle pulse animation every 6-8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(prev => prev + 1);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Don't show on clubhouse page
  if (location.pathname === '/clubhouse' || location.pathname === '/') {
    return null;
  }

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
      // Show label after 400ms hover
      const timer = setTimeout(() => setShowLabel(true), 400);
      setHoverTimer(timer);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
      setShowLabel(false);
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        setHoverTimer(null);
      }
    }
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    const timer = setTimeout(() => {
      setIsExpanded(true);
      setShowLabel(true);
    }, 400);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setTimeout(() => {
      setIsExpanded(false);
      setShowLabel(false);
    }, 100);
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
        className="fixed pointer-events-none z-[9998]"
        style={{ 
          bottom: `${80 + safeAreaBottom}px`,
          right: '24px',
          width: `${buttonSize}px`,
          height: `${buttonSize}px`,
          opacity: 0 
        }}
      />
      
      {/* Enhanced Onboarding Tooltip */}
      {showOnboarding && (
        <div 
          className="fixed z-[10001] animate-fade-in"
          style={{ 
            bottom: `${120 + buttonSize + safeAreaBottom}px`,
            right: '24px'
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] max-w-[300px] relative border border-white/10">
            <div className="font-semibold text-sm mb-1">Meet Echo — your personal caddie</div>
            <div className="text-xs text-slate-300 leading-relaxed">Analyse swing or ask about swing tips, courses, golf news, or trips.</div>
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-slate-900/95"></div>
          </div>
        </div>
      )}

      {/* Hover/Long-press Label */}
      {showLabel && (
        <div 
          className="fixed z-[10001] animate-fade-in"
          style={{ 
            bottom: `${80 + safeAreaBottom}px`,
            right: `${24 + buttonSize + 12}px`
          }}
        >
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
            Echo
          </div>
        </div>
      )}

      {/* Enhanced Echo FAB */}
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: `${safeAreaBottom}px`,
          right: '24px',
          zIndex: 10000,
          width: `${buttonSize}px`,
          height: `${buttonSize}px`
        }}
        className={`
          cursor-pointer select-none
          transition-all duration-150 ease-out
          ${isExpanded && !isMobile ? 'scale-[1.04]' : 'scale-100'}
          ${isPressed ? 'scale-[0.96]' : ''}
          rounded-full
          bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700
          shadow-[0_8px_24px_rgba(0,0,0,0.16),0_0_0_1px_rgba(255,255,255,0.1)_inset]
          hover:shadow-[0_12px_32px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.15)_inset]
          flex items-center justify-center
          relative overflow-hidden
          backdrop-blur-sm
        `}
      >
        {/* Idle pulse animation */}
        <div 
          key={pulseKey}
          className="absolute inset-0 rounded-full animate-ping opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            animationDuration: '900ms',
            animationIterationCount: '2',
            transform: 'scale(1.3)'
          }}
        />
        
        {/* Inner premium highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/15 to-white/25 opacity-80" />
        
        {/* Premium border overlay */}
        <div className="absolute inset-0 rounded-full border border-white/20" />
        
        {/* Icon with breathing animation on hover */}
        <div className={`
          transition-all duration-140 ease-out
          ${isExpanded && !isMobile ? 'scale-[0.98]' : 'scale-100'}
        `}>
          <svg 
            width={isMobile ? "20" : "24"} 
            height={isMobile ? "20" : "24"} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <rect x="2" y="10" width="1.5" height="4" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="5" y="8" width="1.5" height="8" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="8" y="6" width="1.5" height="12" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="11" y="4" width="1.5" height="16" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="14" y="7" width="1.5" height="10" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="17" y="9" width="1.5" height="6" rx="0.75" fill="white" fillOpacity="0.9"/>
            <rect x="20" y="11" width="1.5" height="2" rx="0.75" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
      </div>
    </>
  );
};

export default FloatingAIButton;