/**
 * CourseOfTheWeekSection — daily Top-100 editorial pick on the tour overview.
 * Placed between StatWatch and CollegeFranchise. Self-hides on no-data / error
 * (expansion pattern: no reservation, downstream sections move up).
 */

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionShell } from './SectionShell';
import { V4 } from '../tokens';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseOfTheWeek } from '../../hooks/useCourseOfTheWeek';
import { SPACE } from '@/lib/spacing';
import { useMyCourseBest } from '../../hooks/useMyCourseBest';
import { A, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { CHIP_GLASS_BG, CHIP_GLASS_BORDER, SCRIM_STANDOUT } from '@/styles/photoScrim';

/** Stat cell for the Course of the Week panel. Amber is reserved for the member. */
function CotwStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: tone ?? A.INK, letterSpacing: '-0.01em', ...FIGS }}>
        {value}
      </span>
      <span style={{ ...LABEL, color: A.DIM }}>{label}</span>
      {sub ? <span style={{ ...LABEL, fontSize: 8, color: A.MUTE }}>{sub}</span> : null}
    </div>
  );
}

export function CourseOfTheWeekSection() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCourseOfTheWeek();
  // No row (never played / signed out) => two-cell stat row, no error surface.
  const { data: myBest } = useMyCourseBest(data?.course_id);

  // Loading: skeleton mirrors card geometry, no reservation beyond it.
  if (isLoading && !data) {
    return (
      <SectionShell eyebrow="COURSE OF THE WEEK">
        <div style={{ padding: `0 ${SPACE.pagePadX}px` }}>
          <div
            style={{
              background: V4.surface,
              border: `0.5px solid ${V4.cardBorder}`,
              boxShadow: V4.cardShadow,
              borderRadius: V4.cardRadius,
              overflow: 'hidden',
            }}
          >
            <Skeleton className="w-full" style={{ height: 200, borderRadius: 0 }} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded" />
              <div style={{ height: '0.5px', background: V4.hairline, margin: '4px 0' }} />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
              <Skeleton className="h-9 w-full rounded" style={{ marginTop: 6 }} />
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  // No-data / error: render nothing, let CollegeFranchise sit under StatWatch.
  if (isError || !data) return null;

  const {
    course_id,
    course_name,
    country,
    region,
    thumbnail_image,
    list_label,
    list_rank,
    avg_rating,
    review_count,
    reviews_this_week,
    quote,
    reviewer_name,
  } = data;

  const location = [region, country].filter(Boolean).join(' · ');

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="course-of-the-week"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <SectionShell
          eyebrow="COURSE OF THE WEEK"
          linkLabel="Top 100"
          onLinkClick={() => navigate('/top100')}
        >
          <div style={{ padding: `0 ${SPACE.pagePadX}px 6px`, fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
            The clubhouse verdict
          </div>

          <div style={{ padding: `10px ${SPACE.pagePadX}px 0` }}>
            <div
              style={{
                background: V4.surface,
                border: `0.5px solid ${V4.cardBorder}`,
                boxShadow: V4.cardShadow,
                borderRadius: V4.cardRadius,
                overflow: 'hidden',
              }}
            >
              {/* Media header */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 200,
                  background: 'linear-gradient(145deg, #0a1f0a, #0d0d0d)',
                  overflow: 'hidden',
                }}
              >
                {thumbnail_image ? (
                  <motion.img
                    src={thumbnail_image}
                    alt={course_name}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : null}
                {/* Gradient overlays for chip + name legibility */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: SCRIM_STANDOUT,
                    pointerEvents: 'none',
                  }}
                />

                {/* Top-left chip: TOP 100 · {label} #{rank} */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 999,
                    background: CHIP_GLASS_BG,
                    border: CHIP_GLASS_BORDER,
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span>TOP 100</span>
                  <span style={{ opacity: 0.55 }}>·</span>
                  <span>{list_label}</span>
                  <span style={{ color: V4.amber }}>#{list_rank}</span>
                </div>

                {/* Top-right: reviews this week (only when > 0) */}
                {reviews_this_week > 0 ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: 'rgba(247,147,30,0.92)',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    +{reviews_this_week} this week
                  </div>
                ) : null}

                {/* Course name + location over the image */}
                <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                      textShadow: '0 2px 12px rgba(0,0,0,0.55)',
                    }}
                  >
                    {course_name}
                  </div>
                  {location ? (
                    <div style={{ marginTop: 3, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.02em' }}>
                      {location}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Stat row — three cells when the member has played here,
                    two when signed out / never played (grid rebalances). */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${myBest?.best_gross != null ? 3 : 2}, 1fr)`,
                    alignItems: 'start',
                  }}
                >
                  <CotwStat label="Rating" value={Number(avg_rating ?? 0).toFixed(1)} />
                  <CotwStat label="Reviews" value={review_count.toLocaleString()} />
                  {myBest?.best_gross != null ? (
                    <CotwStat
                      label="Your best"
                      value={String(myBest.best_gross)}
                      tone={A.AMBER}
                      sub={
                        myBest.rounds_here && myBest.rounds_here > 0
                          ? `${myBest.rounds_here} ${myBest.rounds_here === 1 ? 'round' : 'rounds'}`
                          : undefined
                      }
                    />
                  ) : null}
                </div>

                {/* Quote block (only when present) */}
                {quote ? (
                  <>
                    <div style={{ height: '0.5px', background: V4.hairline }} />
                    <blockquote
                      style={{
                        margin: 0,
                        padding: 0,
                        borderLeft: `2px solid ${V4.amber}`,
                        paddingLeft: 10,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: V4.inkSoft,
                          fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        “{quote}”
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: V4.inkFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        — {reviewer_name ?? 'A member'}
                      </div>
                    </blockquote>
                  </>
                ) : null}

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${course_id}`)}
                  style={{
                    marginTop: 2,
                    width: '100%',
                    height: 44,
                    borderRadius: 12,
                    border: `0.5px solid ${V4.ink}`,
                    background: V4.ink,
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  See the course
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: V4.inkFaint,
                letterSpacing: '0.04em',
              }}
            >
              Today's pick from the Top 100 — rated by members
            </div>
          </div>
        </SectionShell>
      </motion.div>
    </AnimatePresence>
  );
}

export default CourseOfTheWeekSection;
