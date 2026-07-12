/**
 * TourIslandLeft — LEFT-capsule content for the ChromeIsland on the Tour
 * Hub. Purely presentational: burger + divider + short tour label +
 * chevron. State (menu open, picker open, current label) is owned by
 * TourHubMainPage so the node registered via useSetChromeLeftSlot stays
 * a stable value derived from context there.
 *
 * The wrapping capsule (glass, 44px, radius 999) is supplied by
 * ChromeIsland's LeftCapsule; this component only owns the row content.
 */
import React from 'react';
import { ChevronDown, Menu } from 'lucide-react';

const DIVIDER = 'rgba(255,255,255,0.14)';
const CHEVRON = 'rgba(255,255,255,0.60)';

export interface TourIslandLeftProps {
  label: string;
  onMenuTap: () => void;
  onPickerTap: () => void;
}

export const TourIslandLeft: React.FC<TourIslandLeftProps> = ({
  label,
  onMenuTap,
  onPickerTap,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        height: '100%',
      }}
    >
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuTap}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="active:scale-[0.94]"
      >
        <Menu size={15} color="#FFFFFF" strokeWidth={2.2} />
      </button>

      <span
        aria-hidden
        style={{
          width: 1,
          height: 18,
          background: DIVIDER,
          flexShrink: 0,
        }}
      />

      <button
        type="button"
        aria-label={`Switch tour — current ${label}`}
        aria-haspopup="dialog"
        onClick={onPickerTap}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'Geist, system-ui, sans-serif',
        }}
        className="active:scale-[0.96]"
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <ChevronDown size={10} color={CHEVRON} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
};

export default TourIslandLeft;
