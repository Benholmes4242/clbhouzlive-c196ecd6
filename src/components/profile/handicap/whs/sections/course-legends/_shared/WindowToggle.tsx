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
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SCOPE_PILL_RADIUS } from '@/components/explore-tab-new/courseled/tokens';
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

  // Canonical shell-tab pill geometry (FilterChips): SCOPE_PILL_RADIUS,
  // 8/14 padding, 12.5/700 type, selected = ink fill, idle = panel + hairline.
  const activeFill = isLight ? '#0F172A' : A.INK;
  const activeInk = isLight ? '#FFFFFF' : A.PANEL;
  const idleFill = isLight ? 'transparent' : A.PANEL;
  const idleInk = isLight ? '#0F172A' : A.INK;
  const idleBorder = isLight ? 'rgba(15,23,42,0.14)' : A.BORDER;

  const options: Array<{ value: LegendWindow; label: string }> = [
    { value: '90d', label: t('handicap.legends.window90d') },
    { value: 'all_time', label: t('handicap.legends.windowAllTime') },
  ];

  return (
    <div style={{ display: 'inline-flex', flexShrink: 0, gap: 8 }}>
      {options.map((o) => {
        const active = window === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setWindow(o.value)}
            aria-pressed={active}
            style={{
              flexShrink: 0,
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: SCOPE_PILL_RADIUS,
              whiteSpace: 'nowrap',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: 12.5,
              fontWeight: 700,
              background: active ? activeFill : idleFill,
              color: active ? activeInk : idleInk,
              border: `1px solid ${active ? activeFill : idleBorder}`,
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
