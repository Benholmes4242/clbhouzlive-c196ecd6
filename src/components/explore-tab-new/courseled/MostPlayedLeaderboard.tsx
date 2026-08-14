import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
import { formatNumber } from '@/i18n/format';
import { MostPlayedPanel as MostPlayedPanelShell } from './DiscoverCourseLedSkeleton';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

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

/** One decimal, TRUE MINUS, "E" at level. */
function formatToPar(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'E';
  const n = formatNumber(Math.abs(r), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${r > 0 ? '+' : '\u2212'}${n}`;
}

/**
 * MOVEMENT — a MOVEMENT, not a score: INDEX_DELTA.light green up / red down.
 * NEW is amber (the absence of a prior week), LEVEL is dim. Absolute figures
 * only; a percentage at this volume would lie (see §5).
 */
function MoveMark({
  row,
  t,
}: {
  row: MostPlayedRow;
  t: (key: string, def: string, opts?: Record<string, unknown>) => string;
}) {
  const base: React.CSSProperties = {
    ...LABEL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    fontSize: 9,
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums lining-nums',
  };
  if (row.move === 'new')
    return <span style={{ ...base, color: A.AMBER }}>{t('discover.mostPlayedNew', 'New')}</span>;
  if (row.move === 'level')
    return <span style={{ ...base, color: A.DIM }}>{t('discover.mostPlayedLevel', 'Level')}</span>;
  const up = row.move === 'up';
  const color = up ? INDEX_DELTA.light.improved : INDEX_DELTA.light.drifted;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span style={{ ...base, color }}>
      <Icon size={9} strokeWidth={2.75} />
      {formatNumber(Math.abs(row.change))}
    </span>
  );
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
  // BAR SCALE: the RENDERED SET. This section is a ranking, not an absolute
  // measure, so the top row always fills. The sheet shows more courses and so
  // may scale differently — stated in the brief report.
  const maxCount = shown.reduce((m, r) => Math.max(m, r.count), 0) || 1;

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
                  fontVariantNumeric: 'tabular-nums lining-nums',
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
                {/* META LINE: region · played to +n. NO TRAILING MIDDOT when
                    the course has no scored eighteen this week. */}
                {(m?.region || r.avgToPar != null) && (
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
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {m?.region}
                    {m?.region && r.avgToPar != null ? ' · ' : ''}
                    {/* A SCORE, NOT A MOVEMENT: to-par convention, BODY ink,
                        never the movement green beside it. */}
                    {r.avgToPar != null && (
                      <span style={{ color: A.BODY }}>
                        {t('discover.mostPlayedAvgToPar', 'Played to {{value}}', {
                          value: formatToPar(r.avgToPar),
                        })}
                      </span>
                    )}
                  </span>
                )}
                {/* VOLUME BAR: count / busiest in the rendered set. */}
                <span
                  aria-hidden
                  style={{
                    display: 'block',
                    height: 5,
                    marginTop: 7,
                    borderRadius: 999,
                    background: A.BORDER,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${Math.max(4, (r.count / maxCount) * 100)}%`,
                      borderRadius: 999,
                      background: A.INK,
                    }}
                  />
                </span>
              </span>
              <span style={{ flexShrink: 0, textAlign: 'right', minWidth: 34 }}>
                <span
                  style={{
                    ...NUMF,
                    display: 'block',
                    fontSize: 20,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: A.INK,
                  }}
                >
                  {formatNumber(r.count)}
                </span>
                <MoveMark row={r} t={t} />
              </span>
            </button>
          );
        })}
      </div>


    </section>
  );
}

export default MostPlayedLeaderboard;
