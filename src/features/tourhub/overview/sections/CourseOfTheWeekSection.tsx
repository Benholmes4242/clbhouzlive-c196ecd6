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
import { CHIP_GLASS_CLASS, SCRIM_STANDOUT } from '@/styles/photoScrim';

/**
 * FigurePair — one label/value pair on the single figure line.
 * Label AXIS-adjacent at the READ floor (11), value 15/700 tabular, 5px gap.
 * Amber is reserved for the VIEWING MEMBER's figure (Your best).
 */
function FigurePair({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.DIM }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: tone ?? A.INK, letterSpacing: '-0.01em', ...FIGS }}>
        {value}
      </span>
    </span>
  );
}

/**
 * clampToSentence — the quote is the best content in the section, so it must
 * FINISH A THOUGHT rather than stop mid-phrase.
 *
 * The RPC returns the FULL review text (get_course_of_the_week selects
 * cr.review with no substring), so all trimming is ours to do client-side.
 * A bare -webkit-line-clamp cuts wherever line three happens to end, which is
 * how "…I wouldn't quite put it …" shipped. Instead we keep whole sentences up
 * to a three-line budget, and only then fall back to a word boundary. The CSS
 * clamp stays underneath as a geometric safety net (a wide glyph run can still
 * overflow), but in the normal case it has nothing left to cut.
 *
 * The ellipsis is appended ONLY when text was actually dropped.
 */
const QUOTE_BUDGET = 150; // ~3 lines at 14.5px italic in the card's text column

export function clampToSentence(text: string, budget = QUOTE_BUDGET): { text: string; truncated: boolean } {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= budget) return { text: clean, truncated: false };

  // Whole sentences first.
  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    const next = (out + sentence).trimEnd();
    if (next.length > budget) break;
    out = next + ' ';
  }
  out = out.trim();
  if (out.length > 0) return { text: out, truncated: out.length < clean.length };

  // No sentence fits — fall back to the last word boundary inside the budget.
  const slice = clean.slice(0, budget);
  const cut = slice.lastIndexOf(' ');
  return { text: (cut > 40 ? slice.slice(0, cut) : slice).trimEnd(), truncated: true };
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
            <Skeleton className="w-full" style={{ height: 170, borderRadius: 0 }} />
            {/* Hold mirrors the rebuilt card: one figure line, three quote
                lines, one quiet action. No footer, no button block. */}
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton className="h-4 w-2/3 rounded" />
              <div style={{ height: '0.5px', background: V4.hairline }} />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
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
  const trimmedQuote = clampToSentence(quote ?? '');
  // Ellipsis only when text was genuinely dropped, and spaced off a full stop
  // so a completed sentence does not read "heard.…".
  const quoteSuffix = trimmedQuote.truncated ? (/[.!?]$/.test(trimmedQuote.text) ? ' …' : '…') : '';

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
          <div style={{ padding: `0 ${SPACE.pagePadX}px` }}>
            {/* THE WHOLE CARD IS THE TAP TARGET. It was not before — only the
                filled button was — so a card that looked tappable was not, and
                the button was the loudest thing on the page for a destination
                the card already implied. The quiet "See the course ›" below is
                the affordance, not a second target. */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/courses/${course_id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/courses/${course_id}`);
                }
              }}
              style={{
                cursor: 'pointer',
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
                  height: 170,
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
                  className={CHIP_GLASS_CLASS}
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 999,
                    color: '#FFFFFF',
                    fontSize: 11,
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
                      fontSize: 11,
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
                {/* ONE figure line, not a three-up. The pairs are inline with a
                    5px internal gap and 16px between them; nothing wraps.
                    "1 round" is gone — it wrapped under YOUR BEST and cost the
                    card a line for one word. */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'nowrap', overflow: 'hidden' }}>
                  <FigurePair label="Rating" value={Number(avg_rating ?? 0).toFixed(1)} />
                  <FigurePair label="Reviews" value={review_count.toLocaleString()} tone={A.MUTE} />
                  {/* Never played / signed out => the pair COLLAPSES. No dash,
                      no zero, no em-dash placeholder. */}
                  {myBest?.best_gross != null ? (
                    <FigurePair label="Your best" value={String(myBest.best_gross)} tone={A.AMBER} />
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
                        borderLeft: `3px solid ${V4.amber}`,
                        paddingLeft: 11,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14.5,
                          lineHeight: 1.5,
                          color: A.MUTE,
                          fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        “{trimmedQuote.text}{quoteSuffix}”
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: A.DIM, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        — {reviewer_name ?? 'A member'}
                      </div>
                    </blockquote>
                  </>
                ) : null}

                {/* Quiet action. The card owns the navigation; this is the
                    affordance, so it must not become a second tap target. */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: A.INK }}>
                  See the course ›
                </div>
              </div>
            </div>
          </div>
        </SectionShell>
      </motion.div>
    </AnimatePresence>
  );
}

export default CourseOfTheWeekSection;
