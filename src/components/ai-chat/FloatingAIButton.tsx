import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [isOpen, setIsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

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

  const openDock = () => {
    setIsOpen(true);
  };

  const closeDock = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (showOnboarding) {
      setShowOnboarding(false);
    }
    // Toggle dock on mobile, trigger onClick callback
    if (window.innerWidth <= 768) {
      isOpen ? closeDock() : openDock();
    } else {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault(); 
      handleClick(e as any);
    }
  };

  // Click outside to close on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        closeDock();
      }
    };

    if (isOpen && window.innerWidth <= 768) {
      document.addEventListener('click', handleClickOutside, { passive: true });
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const dockContent = (
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

      {/* Echo Dock - Right-edge tabbed handle */}
      <div 
        ref={dockRef}
        className={`echo-dock echo-dock--right ${isOpen ? 'is-open' : ''}`}
        style={{
          position: 'fixed',
          right: '0',
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          // Mobile spacing
          ...(typeof window !== 'undefined' && window.innerWidth <= 768 && {
            bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`
          })
        }}
      >
        {/* Handle (half-pill tab) */}
        <button
          className="echo-handle"
          aria-controls="echoPanel"
          aria-expanded={isOpen}
          aria-label="Open Echo assistant"
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          style={{
            pointerEvents: 'auto',
            appearance: 'none',
            border: '0',
            width: '48px',
            height: '112px',
            background: '#2A9D8F',
            borderRadius: '9999px 0 0 9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'translateX(0)',
            transition: 'transform 0.24s ease, opacity 0.2s ease',
            boxShadow: 'none',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <span className="echo-icon" aria-hidden="true">
            <PiWaveform 
              size={20} 
              className="text-white/90"
              style={{
                animation: 'echoWave 2s ease-in-out infinite'
              }}
            />
          </span>
          <span className="sr-only">Open Echo</span>
        </button>

        {/* Panel (existing Echo badge content) */}
        <div 
          className="echo-panel"
          id="echoPanel"
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            background: 'transparent',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.24s ease',
            willChange: 'transform'
          }}
        >
          {/* Existing Echo badge content */}
          <div
            className="
              w-[140px] h-14
              rounded-full
              bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]
              active:scale-95
              flex items-center justify-center
              relative overflow-hidden
              cursor-pointer
            "
            onClick={() => {
              closeDock();
              onClick();
            }}
          >
            {/* Inner gradient highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60 motion-reduce:opacity-0" />
            
            {/* PiWaveform Icon and Text */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <PiWaveform 
                  size={36} 
                  className="text-white/90 transition-all duration-200 ease-in-out"
                  style={{
                    animation: 'echoWave 2s ease-in-out infinite'
                  }}
                />
              </div>
              
              {/* Echo Text */}
              <span className="font-medium text-lg text-white/90 pr-2 animate-fade-in whitespace-nowrap flex items-center">
                Echo
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Mount to body via portal for proper fixed positioning
  return typeof window !== 'undefined' ? createPortal(dockContent, document.body) : null;
};

export default FloatingAIButton;
