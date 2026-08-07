import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
import { formatNumber } from '@/i18n/format';
import { MostPlayedPanel as MostPlayedPanelShell } from './DiscoverCourseLedSkeleton';

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
  /** TRUE while the rounds aggregate has not settled — shell holds the slot. */
  isPending?: boolean;
  onRowPress: (row: MostPlayedRow) => void;
  onSeeAll?: () => void;
  showEyebrow?: boolean;
}

export function MostPlayedLeaderboard({
  rows,
  limit = 5,
  isPending = false,
  onRowPress,
  onSeeAll,
  showEyebrow = true,
}: Props) {
  const { t } = useTranslation('courses');
  const shown = rows.slice(0, limit);
  const metaQuery = useCourseCardMeta(shown.map((r) => r.courseId));
  const meta = metaQuery.data;
  // DECORATION ONLY (layer 2b): the row already holds its own course_name from
  // gam_round_stats, so only the THUMBNAIL waits — the shimmer sits in that slot
  // while the rest of the row reads straight away.
  const thumbPending = shown.length > 0 && metaQuery.isPending;

  if (isPending) return <MostPlayedPanelShell />;
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
          const name = m?.name ?? r.courseName ?? t('discover.unknownCourse', 'Course');
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
                padding: '10px 0',
                border: 'none',
                background: 'transparent',
                borderBottom: i === shown.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <span style={{ ...NUMF, fontSize: 12, color: A.DIM, width: 14, flexShrink: 0 }}>
                {formatNumber(i + 1)}
              </span>
              <CourseImageFallback
                courseId={r.courseId}
                courseName={name}
                imageUrl={m?.imageUrl}
                initialsSize={13}
                pending={thumbPending}
                style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0 }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 800,
                    color: A.INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                    minWidth: 0,
                  }}
                >
                  {m?.region && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.35,
                        color: A.BODY,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.region}
                    </span>
                  )}
                  {r.delta != null && r.delta > 0 && (
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#0F8F4A',
                        background: 'rgba(15,143,74,0.10)',
                        border: '1px solid rgba(15,143,74,0.18)',
                        borderRadius: 5,
                        padding: '1.5px 6px',
                        fontVariantNumeric: 'tabular-nums lining',
                      }}
                    >
                      {t('discover.vsLastWeek', '+{{count}} vs last week', { count: r.delta })}
                    </span>
                  )}
                </span>
              </span>
              <span
                style={{
                  ...NUMF,
                  fontSize: 17,
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
