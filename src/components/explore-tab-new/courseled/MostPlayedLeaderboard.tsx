import { useTranslation } from 'react-i18next';

import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
import { formatNumber } from '@/i18n/format';

/**
 * Section 5 — MOST PLAYED THIS WEEK (BRIEF, section 5).
 *
 * Frequency is the inclusive metric: every tracked round contributes, not just
 * career weeks. A rising course carries a GREEN delta; a cooling course carries
 * NO delta — never a red one, because a quiet week is not a failure.
 */

interface Props {
  rows: MostPlayedRow[];
  limit?: number;
  onRowPress: (row: MostPlayedRow) => void;
  onSeeAll?: () => void;
  showEyebrow?: boolean;
}

export function MostPlayedLeaderboard({
  rows,
  limit = 5,
  onRowPress,
  onSeeAll,
  showEyebrow = true,
}: Props) {
  const { t } = useTranslation('courses');
  const shown = rows.slice(0, limit);
  const { data: meta } = useCourseCardMeta(shown.map((r) => r.courseId));

  if (shown.length === 0) return null;

  return (
    <section>
      {showEyebrow && (
        <Eyebrow
          aside={
            rows.length > shown.length && onSeeAll ? (
              <InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>
            ) : (
              <span style={LABEL}>{t('discover.trackedRounds', 'Tracked rounds')}</span>
            )
          }
        >
          {t('discover.mostPlayed', 'Most played this week')}
        </Eyebrow>
      )}

      <div style={{ ...CARD_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {shown.map((r, i) => {
          const m = meta?.get(r.courseId);
          return (
            <button
              key={r.courseId}
              type="button"
              onClick={() => onRowPress(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                width: '100%',
                padding: '11px 0',
                border: 'none',
                background: 'transparent',
                borderBottom: i === shown.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <span style={{ ...NUMF, fontSize: 12, color: A.DIM, width: 16, flexShrink: 0 }}>
                {formatNumber(i + 1)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: A.INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m?.name ?? r.courseName ?? t('discover.unknownCourse', 'Course')}
                </span>
                {m?.region && (
                  <span style={{ display: 'block', fontSize: 11, color: A.MUTE, marginTop: 1 }}>
                    {m.region}
                  </span>
                )}
              </span>
              {r.delta != null && (
                <span style={{ ...NUMF, fontSize: 11.5, color: A.UNDER, flexShrink: 0 }}>
                  {`+${formatNumber(r.delta)}`}
                </span>
              )}
              <span
                style={{
                  ...NUMF,
                  fontSize: 16,
                  color: A.INK,
                  flexShrink: 0,
                  minWidth: 26,
                  textAlign: 'right',
                }}
              >
                {formatNumber(r.count)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MostPlayedLeaderboard;
