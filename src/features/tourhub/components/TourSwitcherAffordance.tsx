/**
 * TourSwitcherAffordance — discreet tour-switch pill in the Tour Hub chrome.
 * The picker sheet UI is owned by TourPickerSheet (shared with the Chrome
 * island's left capsule).
 */

import React, { useState } from 'react';
import { ArrowLeftRight, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useActiveMensMajor } from '../hooks/useActiveMensMajor';
import { useTourSelection } from '../context/TourSelectionContext';
import { TourPickerSheet, useTourPillLabel } from './TourPickerSheet';
import {
  AMBER,
  FONT,
  GOLD,
  GOLD_DEEP,
} from '../_shared/tokens';

const GOLD_TINT_18 = 'rgba(255,184,0,0.18)';
const GOLD_BORDER = 'rgba(255,184,0,0.45)';

export interface TourSwitcherAffordanceProps {
  variant?: 'glass' | 'default';
}

export const TourSwitcherAffordance: React.FC<TourSwitcherAffordanceProps> = ({
  variant = 'default',
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('tourhub');
  const { selectedTourSlug, viewingTourSlug } = useTourSelection();
  const activeTourSlug = viewingTourSlug ?? selectedTourSlug ?? 'pga';
  const isMajorActive = activeTourSlug === 'major';
  const pillLabel = useTourPillLabel();
  // Reference activeMajor to preserve prior side-effect fetch surface
  useActiveMensMajor();



  return (
    <>
      {variant === 'glass' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('picker.switchTourAria')}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="active:scale-[0.96]"
          style={{
            height: 40,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 15px',
            borderRadius: 999,
            background: isMajorActive ? GOLD_TINT_18 : 'rgba(255,255,255,0.16)',
            border: `1px solid ${isMajorActive ? GOLD_BORDER : 'rgba(255,255,255,0.30)'}`,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
          }}
        >
          {isMajorActive && (
            <Trophy size={13} strokeWidth={2.4} color={GOLD} aria-hidden />
          )}
          <span
            style={{
              fontFamily: '',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: isMajorActive ? GOLD : '#FFFFFF',
            }}
          >
            {pillLabel}
          </span>
          <ArrowLeftRight size={14} strokeWidth={2.4} color={isMajorActive ? GOLD : '#F7931E'} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('picker.switchTourAria')}
          aria-haspopup="dialog"
          aria-expanded={open}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 2,
            padding: '0 14px 0 10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT,
            height: 36,
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: isMajorActive ? GOLD_DEEP : AMBER,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {isMajorActive ? t('pill.majorEyebrow') : t('pill.tourEyebrow')}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: isMajorActive ? GOLD_DEEP : '#0A0E14',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            {pillLabel}
            <ArrowLeftRight size={11} strokeWidth={2.2} color={isMajorActive ? GOLD_DEEP : '#0A0E14'} aria-hidden />
          </span>
        </button>
      )}

      <TourPickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default TourSwitcherAffordance;
