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
import { ChevronDown, ChevronLeft, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { resolveChrome } from '@/features/chrome-v2/registry';

/**
 * The island is ONE object: this content must never disagree with the capsule
 * it sits inside. So rather than pinning literals, we resolve the same spec
 * ChromeIsland resolves and mirror its inkFor(tone) exactly (#FFFFFF on dark,
 * #0F172A on light) — the registry stays the single source of tone.
 */
const TONED = {
  light: { INK: '#0F172A', DIVIDER: 'rgba(15,23,42,0.14)', CHEVRON: 'rgba(15,23,42,0.55)' },
  dark: { INK: '#FFFFFF', DIVIDER: 'rgba(255,255,255,0.18)', CHEVRON: 'rgba(255,255,255,0.62)' },
} as const;

export interface TourIslandLeftProps {
  label: string;
  onMenuTap: () => void;
  onPickerTap: () => void;
  /** When false, the tour label/picker trigger is hidden; only the menu remains. */
  showPicker?: boolean;
  /** When 'back', render a back chevron in place of the burger. */
  mode?: 'menu' | 'back';
  onBackTap?: () => void;
}

export const TourIslandLeft: React.FC<TourIslandLeftProps> = ({
  label,
  onMenuTap,
  onPickerTap,
  showPicker = true,
  mode = 'menu',
  onBackTap,
}) => {
  const { t } = useTranslation('tourhub');
  const location = useLocation();
  const { INK, DIVIDER, CHEVRON } =
    TONED[resolveChrome(location.pathname, new URLSearchParams(location.search)).tone];
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
        aria-label={mode === 'back' ? t('picker.backAria', { defaultValue: 'Back' }) : t('picker.openMenuAria')}
        onClick={mode === 'back' ? onBackTap : onMenuTap}
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
        {mode === 'back'
          ? <ChevronLeft size={17} color={INK} strokeWidth={2.2} />
          : <Menu size={15} color={INK} strokeWidth={2.2} />}
      </button>

      {showPicker && (
        <>
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
            aria-label={t('picker.switchTourCurrentAria', { label })}
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
            className="active:scale-[0.96]"
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: INK,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
            <ChevronDown size={10} color={CHEVRON} strokeWidth={2.4} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
};

export default TourIslandLeft;
