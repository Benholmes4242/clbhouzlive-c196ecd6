/**
 * Top100ProgressPanel — "YOUR PROGRESS".
 *
 * One row per list from user_top100_progress_view, each with a played/total
 * bar. Tapping a row opens the list progress sheet.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { AMBER, HAIRLINE_INK_8, INK, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import type { Top100ListProgress } from '@/hooks/top100/useUserTop100Progress';

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

interface Props {
  lists: Top100ListProgress[];
  onOpenList: (list: Top100ListProgress) => void;
}

export const Top100ProgressPanel: React.FC<Props> = ({ lists, onOpenList }) => {
  const { t } = useTranslation('courses');

  const started = lists.filter((l) => l.total > 0);
  if (started.length === 0) return null;

  const totalPlayed = started.reduce((acc, l) => acc + l.played, 0);
  const totalRated = started.reduce((acc, l) => acc + l.rated, 0);
  const totalCourses = started.reduce((acc, l) => acc + l.total, 0);

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
            played: totalPlayed,
            total: totalCourses,
            rated: totalRated,
          })}
        </span>
      </div>

      {started.map((list, i) => {
        const pct = list.total > 0 ? Math.min(100, (list.played / list.total) * 100) : 0;
        return (
          <button
            key={list.list_id}
            type="button"
            onClick={() => onOpenList(list)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              borderTop: i === 0 ? 'none' : `1px solid ${HAIRLINE_INK_8}`,
              background: 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {list.list_name}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 11,
                  fontWeight: 700,
                  color: INK_MUTE,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('top100.progressPanel.row', {
                  played: list.played,
                  total: list.total,
                  rated: list.rated,
                })}
              </span>
              <ChevronRight size={14} color="rgba(15,23,42,0.30)" />
            </div>
            <div
              style={{
                marginTop: 7,
                height: 4,
                borderRadius: 999,
                background: 'rgba(15,23,42,0.07)',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${pct}%`, height: '100%', background: AMBER }} />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default Top100ProgressPanel;
