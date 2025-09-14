import React, { useState, useEffect, useRef } from 'react';
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
  const items = [
    { label: 'Chat', tab: 'chat' as ChatTab, disabled: false },
    { label: 'Swing Coach', tab: 'swing' as ChatTab, disabled: false },
    { label: 'Message', tab: 'message' as ChatTab, disabled: true },
  ];

  // Calculate arc positions - 90° for 3 items, positioned above dock
  const calculatePosition = (index: number, total: number) => {
    const arcAngle = total <= 3 ? 90 : 120; // degrees
    const startAngle = total <= 3 ? 225 : 240; // start from upper left, going counter-clockwise
    const angleStep = arcAngle / (total - 1);
    const angle = (startAngle + index * angleStep) * (Math.PI / 180);
    const radius = 80; // distance from dock center
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    // Offset to position fan above dock (dock is 56px + padding)
    const dockOffset = 40; // dock radius + padding to clear it
    
    return { x: -x, y: y - dockOffset }; // negative x for left positioning, y offset for above dock
  };

  return (
    <div 
      className="echoDoc-panel" 
      role="menu" 
      aria-label="Echo quick actions"
    >
      {items.map((item, index) => {
        const { x, y } = calculatePosition(index, items.length);
        const delay = index * 20; // 20ms stagger
        
        return (
          <button
            key={item.tab}
            role="menuitem"
            className={`echoDoc-fanItem animate-in ${item.disabled ? 'is-disabled' : ''}`}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              animationDelay: `${delay}ms`,
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