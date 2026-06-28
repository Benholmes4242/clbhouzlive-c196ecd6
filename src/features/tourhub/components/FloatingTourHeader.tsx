/**
 * FloatingTourHeader — self-contained floating glass pill row that sits flush
 * under the notch over the cinematic Tour Hub overview hero.
 *
 * Owns its own: positioning, scrim, safe-area, blur, status-bar transparency,
 * and shield lifecycle. No global event bus, no shared CSS vars.
 */
import React, { useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { applyShieldColor } from '@/hooks/useMedianStatusBar';

export interface FloatingTourHeaderProps {
  onMenuTap: () => void;
  onSearchTap: () => void;
  /** Optional extra pill rendered at end of the row (e.g. tour picker). */
  endSlot?: React.ReactNode;
}

const GLASS_BG = 'rgba(255,255,255,0.16)';
const GLASS_BORDER = '1px solid rgba(255,255,255,0.30)';
const GLASS_BLUR = 'blur(14px)';
const PILL_H = 38;

const pillStyle: React.CSSProperties = {
  height: PILL_H,
  minWidth: PILL_H,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  background: GLASS_BG,
  border: GLASS_BORDER,
  backdropFilter: GLASS_BLUR,
  WebkitBackdropFilter: GLASS_BLUR,
  color: '#FFFFFF',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  transition: 'transform 120ms ease',
};

export const FloatingTourHeader: React.FC<FloatingTourHeaderProps> = ({
  onMenuTap,
  onSearchTap,
  endSlot,
}) => {


  // Self-contained notch transparency: set on mount, restore on unmount.
  useEffect(() => {
    // CSS shield
    let prevShield = '#F8FAFC';
    try {
      const shield = document.getElementById('safe-area-shield');
      if (shield) prevShield = shield.style.backgroundColor || '#F8FAFC';
    } catch {}
    applyShieldColor('transparent');

    // Native Median status bar
    try {
      (window as any).median?.statusbar?.set({
        style: 'dark',
        color: '00000000',
        overlay: true,
        blur: false,
      });
    } catch {}

    return () => {
      // Restore to app light default.
      applyShieldColor(prevShield && prevShield !== 'transparent' ? prevShield : '#F8FAFC');
      try {
        (window as any).median?.statusbar?.set({
          style: 'light',
          color: 'FFF8FAFC',
          overlay: false,
          blur: false,
        });
      } catch {}
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        pointerEvents: 'none', // scrim doesn't block; pills re-enable
      }}
    >
      {/* Scrim covering notch + pill row + ~20px below */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `calc(env(safe-area-inset-top, 0px) + ${PILL_H + 8 + 10 + 20}px)`,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.18) 55%, rgba(15,23,42,0) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            paddingTop: 8,
            paddingBottom: 10,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          {/* Menu (hamburger) */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenuTap}
            style={pillStyle}
            className="active:scale-[0.94]"
          >
            <Menu size={18} color="#FFFFFF" strokeWidth={2.2} />
          </button>

          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            onClick={onSearchTap}
            style={pillStyle}
            className="active:scale-[0.94]"
          >
            <Search size={18} color="#FFFFFF" strokeWidth={2.2} />
          </button>


          {endSlot}
        </div>
      </div>
    </div>
  );
};

export default FloatingTourHeader;
