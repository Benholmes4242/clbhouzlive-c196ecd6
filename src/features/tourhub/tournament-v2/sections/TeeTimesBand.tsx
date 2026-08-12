/**
 * TeeTimesBand — promoted, unmissable entry point to the full tee-times
 * sheet. Rendered directly below the On the Course rail (and above
 * EVENT INFO). Clock glyph in soft amber squircle, title + subline,
 * chevron. Disabled state when no draw has been released yet.
 */
import { Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FONT, INK, INK_MUTE, HAIRLINE_INK_8, SURFACE } from '../../_shared/tokens';

const AMBER_TINT = 'rgba(247,147,30,0.10)';
const AMBER = '#F7931E';

interface Props {
  round: number;
  groupCount: number;
  onTap: () => void;
}

export function TeeTimesBand({ round, groupCount, onTap }: Props) {
  const { t } = useTranslation('tourhub');
  const disabled = groupCount <= 0;
  const subline = disabled
    ? t('tournament.teeTimesBand.notReleased', { defaultValue: 'Draw not yet released' })
    : t('tournament.teeTimesBand.subline', {
        round,
        count: groupCount,
        defaultValue: `Round ${round} · ${groupCount} groups`,
      });

  return (
    <div style={{ padding: '4px 16px 8px', fontFamily: FONT }}>
      <button
        type="button"
        onClick={disabled ? undefined : onTap}
        disabled={disabled}
        aria-disabled={disabled}
        className={disabled ? '' : 'active:bg-slate-50 transition-colors'}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 14px',
          background: SURFACE,
          border: `0.5px solid ${HAIRLINE_INK_8}`,
          borderRadius: 12,
          textAlign: 'left',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: 10,
            background: AMBER_TINT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: AMBER,
          }}
        >
          <Clock size={17} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
            {t('tournament.teeTimesBand.title', { defaultValue: 'Tee times' })}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11.5,
              fontWeight: 500,
              color: INK_MUTE,
              lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {subline}
          </div>
        </div>
        {!disabled && (
          <ChevronRight size={18} strokeWidth={2} color={INK_MUTE} aria-hidden />
        )}
      </button>
    </div>
  );
}

export default TeeTimesBand;
