/**
 * Top100ProgressPanel — "YOUR PROGRESS".
 *
 * Scoped to the active list only: one bar for the list currently selected by
 * the scope pill. Tapping it opens the list progress sheet.
 */
import { A } from '@/features/courses/components/holes/analytical/tokens';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { AMBER, HAIRLINE_INK_8, INK, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { Top100ListProgress } from '@/hooks/top100/useUserTop100Progress';

/**
 * Top100ProgressEmpty - shown instead of the panel when played === 0.
 *
 * At zero there is nothing to measure, so there is no bar, no fraction, no
 * chevron and no tap target: the list sheet would only open the page the
 * member is already on. Signed-out visitors get the sign-in framing rather
 * than a statement that they have played nothing.
 */
export const Top100ProgressEmpty: React.FC<{ list: string; signedIn: boolean }> = ({
  list,
  signedIn,
}) => {
  const { t } = useTranslation('courses');

  useEffect(() => {
    analyticsEvents.track('t100_progress_empty_shown', { list, signed_in: signedIn });
  }, [list, signedIn]);

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderRadius: 12,
        overflow: 'hidden',
        padding: '12px',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>
        {t(signedIn ? 'top100.progress.emptyTitle' : 'top100.progress.signedOutTitle')}
      </div>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: INK_MUTE,
          lineHeight: 1.4,
          marginTop: 4,
        }}
      >
        {t(signedIn ? 'top100.progress.emptyBody' : 'top100.progress.signedOutBody')}
      </div>
    </div>
  );
};



interface Props {
  list: Top100ListProgress;
  onOpenList: (list: Top100ListProgress) => void;
}

export const Top100ProgressPanel: React.FC<Props> = ({ list, onOpenList }) => {
  const { t } = useTranslation('courses');

  const pct = list.total > 0 ? Math.min(100, (list.played / list.total) * 100) : 0;

  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 12px',
          borderBottom: `1px solid ${HAIRLINE_INK_8}`,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: A.AMBER_DEEP,
          }}
        >
          {t('top100.progressPanel.heading')}
        </span>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"zero" 0, "tnum" 1',
            fontSize: 11,
            fontWeight: 700,
            color: INK_MUTE,
          }}
        >
          {t('top100.progressPanel.aggregate', {
            played: list.played,
            total: list.total,
            rated: list.rated,
          })}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onOpenList(list)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '12px',
          background: 'transparent',
        }}
        aria-label={t('top100.progressPanel.heading')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              height: 4,
              borderRadius: 999,
              background: 'rgba(15,23,42,0.07)',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${pct}%`, height: '100%', background: AMBER }} />
          </div>
          <ChevronRight size={14} color="rgba(15,23,42,0.30)" />
        </div>
      </button>
    </div>
  );
};

export default Top100ProgressPanel;
