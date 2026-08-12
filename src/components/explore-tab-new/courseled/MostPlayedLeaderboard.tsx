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
 * Frequency is the inclusive metric: every tracked round contributes. The count
 * is the point of the section. A delta only appears when the hook found a real
 * prior-week comparison, and it renders as a PLAIN DIM FIGURE — no capsule, no
 * tint, no green (green means under par or the viewing member, never volume).
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
                padding: '12px 0',
                border: 'none',
                background: 'transparent',
                borderBottom: i === shown.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  ...LABEL,
                  fontSize: 9,
                  color: A.DIM,
                  width: 13,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums lining',
                }}
              >
                {formatNumber(i + 1)}
              </span>
              <CourseImageFallback
                courseId={r.courseId}
                courseName={name}
                imageUrl={m?.imageUrl}
                initialsSize={13}
                pending={thumbPending}
                style={{ width: 52, height: 52, borderRadius: 13, flexShrink: 0 }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                {/* TWO LINES, NOT A TRUNCATION: the parenthetical on a
                    two-course club is the only thing telling the two apart. */}
                <span
                  style={{
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: A.INK,
                    letterSpacing: '-0.015em',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                  }}
                >
                  {name}
                </span>
                {m?.region && (
                  <span
                    style={{
                      ...LABEL,
                      display: 'block',
                      fontSize: 9,
                      color: A.DIM,
                      marginTop: 3,
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
                      ...LABEL,
                      display: 'block',
                      fontSize: 9,
                      color: A.DIM,
                      marginTop: 2,
                      fontVariantNumeric: 'tabular-nums lining',
                    }}
                  >
                    {t('discover.mostPlayedDelta', '+{{count}} on last week', {
                      count: r.delta,
                    })}
                  </span>
                )}
              </span>
              <span style={{ flexShrink: 0, textAlign: 'right', minWidth: 30 }}>
                <span
                  style={{
                    ...NUMF,
                    display: 'block',
                    fontSize: 24,
                    letterSpacing: '-0.035em',
                    lineHeight: 0.95,
                    color: A.INK,
                  }}
                >
                  {formatNumber(r.count)}
                </span>
                <span
                  style={{
                    ...LABEL,
                    display: 'block',
                    fontSize: 9,
                    color: A.DIM,
                    marginTop: 3,
                  }}
                >
                  {t('discover.roundsLabel', 'Rounds')}
                </span>
              </span>
            </button>
          );
        })}
      </div>


    </section>
  );
}

export default MostPlayedLeaderboard;
