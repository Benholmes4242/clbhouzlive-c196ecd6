/**
 * WindowToggle - the 90 DAYS / ALL TIME filter for a course record board.
 *
 * MOVED here from the deleted CourseLegendsSection. The aggregate section is
 * gone but the drilldown that GolfClubView mounts on the course page still
 * owns this toggle, so the control moved rather than being deleted with its
 * old host.
 *
 * Text-only filter row per the house rule: active = bold ink, inactive =
 * muted. No fill, no outline.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LegendWindow } from '@/lib/gam/types';
import type { WindowToggleVariant } from '../types';

interface Props {
  window: LegendWindow;
  setWindow: (w: LegendWindow) => void;
  variant?: WindowToggleVariant;
}

export const WindowToggle: React.FC<Props> = ({
  window,
  setWindow,
  variant = 'dark',
}) => {
  const { t } = useTranslation('common');
  const isLight = variant === 'light';
  const activeColor = isLight ? '#0F172A' : '#FFFFFF';
  const idleColor = isLight ? '#94A3B8' : 'rgba(255,255,255,0.45)';

  const options: Array<{ value: LegendWindow; label: string }> = [
    { value: '90d', label: t('handicap.legends.window90d') },
    { value: 'all_time', label: t('handicap.legends.windowAllTime') },
  ];

  return (
    <div style={{ display: 'inline-flex', flexShrink: 0, gap: 14 }}>
      {options.map((o) => {
        const active = window === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setWindow(o.value)}
            aria-pressed={active}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: 9,
              fontWeight: active ? 700 : 700,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: active ? activeColor : idleColor,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
};

export default WindowToggle;
