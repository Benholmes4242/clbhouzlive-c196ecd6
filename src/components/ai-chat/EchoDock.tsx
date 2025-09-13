import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface EchoDockProps {
  onClick: () => void;
  shouldHide?: boolean;
}

const EchoDock: React.FC<EchoDockProps> = ({ onClick, shouldHide = false }) => {
  const { sentinelRef } = useAdaptiveGlass();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  const handleClick = () => {
    if (showOnboarding) {
      setShowOnboarding(false);
    }
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { 
      e.preventDefault(); 
      handleClick();
    }
  };

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

      {/* Echo Dock - Right-edge handle only */}
      <div 
        className="echo-dock--right"
        style={{
          position: 'fixed',
          right: '0',
          bottom: '30vh',
          zIndex: 10000,
          overflow: 'hidden',
          pointerEvents: 'none'
        }}
        aria-live="polite"
      >
        {/* Handle (half-pill tab) */}
        <button
          ref={btnRef}
          className="echo-handle echo-handle--label"
          aria-label="Open Echo assistant"
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          style={{
            pointerEvents: 'auto',
            appearance: 'none',
            border: '0',
            width: '25px',
            height: '120px',
            background: 'linear-gradient(135deg, #1D3557, #2A9D8F)',
            borderRadius: '9999px 0 0 9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: 'none'
          }}
        >
          <span className="echo-label" aria-hidden="true">Echo</span>
        </button>
      </div>
    </>
  );

  // Mount to body via portal for proper fixed positioning
  return typeof window !== 'undefined' ? createPortal(dockContent, document.body) : null;
};

export default EchoDock;