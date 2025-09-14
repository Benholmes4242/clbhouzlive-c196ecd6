import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { PiWaveform } from 'react-icons/pi';

interface EchoDockProps {
  onClick: () => void;
  onSwingCoachClick?: () => void;
  shouldHide?: boolean;
}

type ChatTab = 'chat' | 'swing' | 'message';

const EchoDock: React.FC<EchoDockProps> = ({ onClick, onSwingCoachClick, shouldHide = false }) => {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pressTimer, setPressTimer] = useState<number | null>(null);
  const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null);
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

  // Auto-dismiss panel after 2.5s idle
  useEffect(() => {
    if (panelOpen) {
      const timer = setTimeout(() => setPanelOpen(false), 2500);
      setDismissTimer(timer);
      return () => clearTimeout(timer);
    } else {
      if (dismissTimer) {
        clearTimeout(dismissTimer);
        setDismissTimer(null);
      }
    }
  }, [panelOpen, dismissTimer]);

  // Close panel on outside click or Escape
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (!panelOpen || !btnRef.current) return;
      if (!btnRef.current.contains(e.target as Node)) setPanelOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setPanelOpen(false);
    }
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen]);

  // Don't show on clubhouse page or when modals are open
  if (location.pathname === '/clubhouse' || location.pathname === '/' || shouldHide) {
    return null;
  }

  function handlePointerDown() {
    const id = window.setTimeout(() => {
      // Dock ripple animation
      if (btnRef.current) {
        btnRef.current.style.animation = 'echo-ripple 0.3s ease-out';
        setTimeout(() => {
          if (btnRef.current) {
            btnRef.current.style.animation = '';
          }
        }, 300);
      }
      setPanelOpen(true);
      try { (navigator as any).vibrate?.(10); } catch {}
    }, 600);
    setPressTimer(id);
  }

  function clearPressTimer() {
    if (pressTimer) {
      window.clearTimeout(pressTimer);
      setPressTimer(null);
    }
  }

  function handlePointerUp() {
    clearPressTimer();
  }

  function handlePointerCancel() {
    clearPressTimer();
  }

  function handleClick() {
    if (showOnboarding) {
      setShowOnboarding(false);
    }
    if (panelOpen) return;
    onClick();
  }

  const openAIChatOverlay = (tab: ChatTab) => {
    if (tab === 'swing' && onSwingCoachClick) {
      onSwingCoachClick();
    } else {
      onClick();
    }
  };

  const dockContent = (
    <>
      {/* Onboarding Tooltip */}
      {showOnboarding && (
        <div className="fixed bottom-32 right-20 z-[10001] animate-fade-in">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-[280px] relative">
            <div className="font-medium text-sm mb-1">Meet Echo - your personal caddie</div>
            <div className="text-xs text-slate-300">Analyse swing or ask about swing tips, courses, golf news, or trips.</div>
            <div className="absolute bottom-1/2 -right-2 w-0 h-0 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-slate-900 transform translate-y-1/2"></div>
          </div>
        </div>
      )}

      <button
        ref={btnRef}
        aria-label="Open Echo assistant"
        className={`echoDoc-btn ${panelOpen ? 'is-panel-open' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
      >
        <span className="echoDoc-halo" aria-hidden />
        <span className="echoDoc-core">
          <PiWaveform 
            size={22} 
            className="text-white/90 transition-all duration-200 ease-in-out"
            style={{
              animation: 'echoWave 3s ease-in-out infinite'
            }}
          />
          <span className="echoDoc-text">Echo</span>
        </span>
      </button>

      {panelOpen && <RadialFan onItemClick={(tab) => { setPanelOpen(false); openAIChatOverlay(tab); }} />}
    </>
  );

  return typeof window !== 'undefined' ? createPortal(dockContent, document.body) : null;
};

type RadialFanProps = {
  onItemClick: (tab: ChatTab) => void;
};

const RadialFan: React.FC<RadialFanProps> = ({ onItemClick }) => {
  const [positions, setPositions] = useState<Array<{x: number, y: number}>>([]);
  const fanRef = useRef<HTMLDivElement>(null);
  
  const items = [
    { label: 'Chat', tab: 'chat' as ChatTab, disabled: false },
    { label: 'Swing Coach', tab: 'swing' as ChatTab, disabled: false },
    { label: 'Message', tab: 'message' as ChatTab, disabled: true },
  ];

  const calculateSafePositions = useCallback(() => {
    if (!fanRef.current) return;

    const PREFERRED_RADIUS = 90;
    const GAP_ABOVE_DOCK = 8;
    const CHIP_SIZE = 56;
    const CHIP_RADIUS = CHIP_SIZE / 2;
    const PADDING = 12;

    // Get viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const visualViewport = (window as any).visualViewport;
    const viewportHeight = visualViewport?.height || vh;
    const viewportTop = visualViewport?.offsetTop || 0;

    // Get safe area insets
    const computedStyle = getComputedStyle(document.documentElement);
    const safeTop = parseFloat(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
    
    // Find dock element to get its position
    const dockElement = document.querySelector('.echoDoc-btn') as HTMLElement;
    if (!dockElement) return;
    
    const dockRect = dockElement.getBoundingClientRect();
    const dockRadius = Math.max(dockRect.width, dockRect.height) / 2;
    
    // Fan origin: directly above dock center
    const originX = dockRect.left + dockRect.width / 2;
    const originY = dockRect.top - (dockRadius + GAP_ABOVE_DOCK);
    
    // Calculate max radius to keep all items within viewport bounds
    const minLeft = PADDING + CHIP_RADIUS;
    const minTop = viewportTop + safeTop + PADDING + CHIP_RADIUS;
    const maxRadiusFromLeft = originX - minLeft;
    const maxRadiusFromTop = originY - minTop;
    const maxRadius = Math.min(maxRadiusFromLeft, maxRadiusFromTop);
    
    // Use the smaller of preferred radius or max safe radius
    const radius = Math.max(dockRadius + GAP_ABOVE_DOCK + CHIP_RADIUS, Math.min(PREFERRED_RADIUS, maxRadius));
    
    // Position items in arc from 200° (bottom-left) to 110° (top-left)
    const startAngle = 200; // bottom-left
    const endAngle = 110;   // top-left
    const steps = items.length - 1 || 1;
    
    const newPositions = items.map((_, index) => {
      const t = steps ? (index / steps) : 0.5;
      const angleDeg = startAngle + (endAngle - startAngle) * t;
      const angleRad = (angleDeg * Math.PI) / 180;
      
      const x = originX + radius * Math.cos(angleRad) - CHIP_RADIUS;
      const y = originY - radius * Math.sin(angleRad) - CHIP_RADIUS;
      
      return { x, y };
    });
    
    setPositions(newPositions);
  }, [items.length]);

  // Calculate positions on mount and viewport changes
  useEffect(() => {
    calculateSafePositions();
    
    const resizeObserver = new ResizeObserver(calculateSafePositions);
    resizeObserver.observe(document.body);
    
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', calculateSafePositions);
      visualViewport.addEventListener('scroll', calculateSafePositions);
    }
    
    window.addEventListener('resize', calculateSafePositions);
    window.addEventListener('orientationchange', calculateSafePositions);
    
    return () => {
      resizeObserver.disconnect();
      if (visualViewport) {
        visualViewport.removeEventListener('resize', calculateSafePositions);
        visualViewport.removeEventListener('scroll', calculateSafePositions);
      }
      window.removeEventListener('resize', calculateSafePositions);
      window.removeEventListener('orientationchange', calculateSafePositions);
    };
  }, [calculateSafePositions]);

  return (
    <div 
      ref={fanRef}
      className="echoDoc-panel" 
      role="menu" 
      aria-label="Echo quick actions"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      {items.map((item, index) => {
        const position = positions[index] || { x: 0, y: 0 };
        const delay = index * 20; // 20ms stagger
        
        return (
          <button
            key={item.tab}
            role="menuitem"
            className={`echoDoc-fanItem animate-in ${item.disabled ? 'is-disabled' : ''}`}
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              animationDelay: `${delay}ms`,
              pointerEvents: 'auto'
            }}
            onClick={item.disabled ? undefined : () => onItemClick(item.tab)}
            onPointerDown={() => {
              try { (navigator as any).vibrate?.(5); } catch {}
            }}
            aria-disabled={item.disabled || undefined}
            tabIndex={item.disabled ? -1 : 0}
          >
            <span className="echoDoc-fanText">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default EchoDock;