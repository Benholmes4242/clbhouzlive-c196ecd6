/**
 * Top100ProgressPanel — "YOUR PROGRESS".
 *
 * Scoped to the active list only: one bar for the list currently selected by
 * the scope pill. Tapping it opens the list progress sheet.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { AMBER, HAIRLINE_INK_8, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import type { Top100ListProgress } from '@/hooks/top100/useUserTop100Progress';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

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
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: AMBER,
          }}
        >
          {t('top100.progressPanel.heading')}
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontVariantNumeric: 'tabular-nums',
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
