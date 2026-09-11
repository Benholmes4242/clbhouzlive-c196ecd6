/**
 * CourseOfTheWeekSection — daily Top-100 pick on the tour overview.
 * Placed between StatWatch and CollegeFranchise. Self-hides on no-data / error
 * (expansion pattern: no reservation, downstream sections move up).
 *
 * BRIEF_TOUR_OVERVIEW_TWO_SECTIONS B — WHAT THIS SECTION IS NOW.
 * Full-bleed photograph at 210px with the RANK AND THE NAME ON IT, then two
 * figures, one basis line, one terminal row. The old top-left TOP 100 pill is
 * gone: the rank now reads as TYPE, not as a badge.
 *
 * NO CHARACTER LINE, AND THAT IS A RULING, NOT AN OMISSION (section C).
 * The brief called for one sentence saying what the course IS, beneath the
 * image. The only candidate source is golf_courses.description, and it was
 * sampled: ten Top 100 courses, first sentence each. Four of ten open with
 * "Nestled" or "Tucked" — a template voice a member meets twice a week in a
 * section that rotates daily — and Archerfield and Aronimink open on club
 * administrative history, not character. Good six times in ten is not good
 * enough for the one line whose job is to justify the section.
 *
 * THE LINE RENDERS IF AND ONLY IF A PURPOSE-WRITTEN STRING EXISTS. The proper
 * solution is filed in the roadmap open list: a nullable short editorial column
 * on golf_courses, one hand-written sentence per course, rendered when present
 * and omitted when not, so the section improves course by course. DO NOT
 * POPULATE IT FROM description PROGRAMMATICALLY — the existing field is the
 * wrong voice, which is the whole finding.
 *
 * TWO FIGURES, NOT THREE. MEMBERS' RATING and HAVE PLAYED IT, with ONE basis
 * line under them. A rating and its own review count are a figure and its
 * sample; splitting them across two figure slots would break the rule the whole
 * programme runs on. "In your circle" is a good idea with no data behind it
 * today and is filed, not built.
 *
 * HAVE PLAYED IT comes from get_course_field_sizes with the nil-uuid exclusion,
 * exactly as VenueRecordBand does it — one call for the whole section. A failed
 * read, an unavailable function or a zero renders NOTHING and the rating stands
 * alone: that zero is returned both for a course nobody has played and for a
 * course with no qualifying WHS mapping, so it must never read as "nobody has
 * played here".
 */

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionShell } from './SectionShell';
import { V4, OVERVIEW_GUTTER as GUT } from '../tokens';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourseOfTheWeek } from '../../hooks/useCourseOfTheWeek';
import { useCourseFieldPlayers } from '@/hooks/gam/useCourseFieldPlayers';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';

/**
 * NOBODY IS EXCLUDED, DELIBERATELY. get_course_field_sizes takes an exclusion
 * because the trophy room must drop the record holder from the field they hold a
 * record against. Here the question is every member who has played the course,
 * so a nil uuid is passed: the function compares with IS DISTINCT FROM, so it
 * matches no member and excludes nobody. THIS IS NOT AN UNFILLED PLACEHOLDER —
 * do not substitute the viewing member's id. Same call, same wording, as
 * VenueRecordBand.
 */
const EXCLUDE_NOBODY = '00000000-0000-0000-0000-000000000000';

/** Figure kicker on this section's two stats: 9/700/0.12em uppercase. */
const FIGURE_KICKER: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: A.DIM,
};

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        className="tabular-nums lining-nums"
        style={{ fontSize: 20, fontWeight: 700, color: A.INK, letterSpacing: '-0.02em', ...FIGS }}
      >
        {value}
      </span>
      <span style={FIGURE_KICKER}>{label}</span>
    </div>
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

  /* ONE call, one course id — see EXCLUDE_NOBODY above for the nil uuid. */
  const field = useCourseFieldPlayers(
    data?.course_id ? [data.course_id] : [],
    EXCLUDE_NOBODY,
  );
  const playedRaw = data?.course_id ? field.data?.sizes.get(data.course_id) : undefined;
  const played =
    field.data?.available && typeof playedRaw === 'number' && playedRaw > 0
      ? playedRaw
      : null;

  // Loading: hold mirrors the rebuilt anatomy — image, two figures, basis line,
  // terminal row. No reservation beyond it.
  if (isLoading && !data) {
    return (
      <SectionShell padX={GUT} eyebrow="COURSE OF THE WEEK" rightMeta="Top 100">
        <div>
          <Skeleton className="w-full" style={{ height: 210, borderRadius: 0 }} />
          <div style={{ padding: `14px ${GUT}px 0`, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 32 }}>
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            <Skeleton className="h-3 w-2/5 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
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
    region,
    thumbnail_image,
    list_label,
    list_rank,
    avg_rating,
    review_count,
  } = data;

  /* THE RANK IS TYPE NOW. "GB&I #92 · SURREY" — the list label, the rank in
     amber, the region at 50% white. The old glass pill is retired (dead list). */
  const hasRank = list_rank != null;
  const open = () => navigate(`/courses/${course_id}`);

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
          padX={GUT}
          eyebrow="COURSE OF THE WEEK"
          linkLabel="Top 100"
          onLinkClick={() => navigate('/courses?tab=top100')}
        >
          {/* THE WHOLE SECTION IS THE TAP TARGET; the terminal row is the
              affordance, not a second target. */}
          <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* FULL-BLEED PHOTOGRAPH, 210px. Screen edge to screen edge; the
                body below re-pays the 20px gutter. */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 210,
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
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}

              {/* Gradient to 72% at the foot — the type sits in it, not on a
                  panel. */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to bottom, rgba(0,0,0,0) 38%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.72) 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* EVERYTHING ON THE IMAGE, BOTTOM-LEFT: rank line, then name. */}
              <div style={{ position: 'absolute', left: GUT, right: GUT, bottom: 14 }}>
                {hasRank || region ? (
                  <div
                    className="tabular-nums lining-nums"
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      marginBottom: 6,
                    }}
                  >
                    {hasRank ? (
                      <span style={{ color: '#FFFFFF' }}>
                        {list_label ? `${list_label} ` : ''}
                        <span style={{ color: V4.amber }}>#{list_rank}</span>
                      </span>
                    ) : null}
                    {hasRank && region ? <span style={{ color: 'rgba(255,255,255,0.5)' }}>·</span> : null}
                    {region ? <span style={{ color: 'rgba(255,255,255,0.5)' }}>{region}</span> : null}
                  </div>
                ) : null}
                <div
                  style={{
                    fontSize: 23,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.12,
                  }}
                >
                  {course_name}
                </div>
              </div>
            </div>

            {/* Body, back on the 20px gutter. NO CHARACTER LINE — see the file
                header: it renders only when a purpose-written sentence exists,
                and that column does not exist yet. */}
            <div style={{ padding: `14px ${GUT}px 0` }}>
              {avg_rating != null && review_count > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: 32 }}>
                    <Figure label="Members' rating" value={Number(avg_rating).toFixed(1)} />
                    {played != null ? <Figure label="Have played it" value={String(played)} /> : null}
                  </div>
                  {/* ONE basis line for the figures above. Singular at one. */}
                  <div
                    className="tabular-nums lining-nums"
                    style={{ marginTop: 10, fontSize: 13, fontWeight: 600, lineHeight: '18px', color: A.BODY }}
                  >
                    {`From ${review_count.toLocaleString()} member review${review_count === 1 ? '' : 's'}.`}
                  </div>
                </>
              ) : null}

              {/* Terminal row. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  paddingTop: 11,
                  borderTop: `1px solid ${V4.hairline}`,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.INK }}>
                  See the course
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: A.MUTE }} aria-hidden>
                  &rsaquo;
                </span>
              </div>
            </div>
          </div>
        </SectionShell>
      </motion.div>
    </AnimatePresence>
  );
}

export default CourseOfTheWeekSection;
