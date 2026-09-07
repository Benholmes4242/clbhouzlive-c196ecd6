import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { DISCOVER_FACT, DISCOVER_QUIET, KICKER, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { useHeroCourseImage } from '@/features/amateur/useHeroCourseImage';
import { FIGS, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

/**
 * AMATEUR HERO (BRIEF_AMATEUR_PAGE, block 0).
 *
 * THE LATEST CIRCLE ROUND, full bleed into the notch at 340px. The subject
 * chain is the one useCircleLatestRounds already owns: the member's circle
 * first, then a suggested round from the wider platform when the circle is
 * quiet — so a member with no friends and no rounds still gets a hero. The
 * course supplies the frame; the round supplies everything on top of it.
 *
 * THE ROUND SHAPE RIDES OVER THE SCRIM AT 34px. RoundShape's fills were mixed
 * on WHITE for the light Discover tiles, so over a photograph they read as pale
 * washes rather than tints — the trace and its beads carry the shape, which is
 * why the band is short and the meta row is off.
 */

export const AMATEUR_HERO_H = 340;
/** The trace band. Short on purpose: it is a shape, not a chart. */
export const AMATEUR_HERO_SHAPE_H = 34;

function toPar(row: CircleRoundRow): { text: string; tone: string } | null {
  if (row.gross == null || row.course_par == null) return null;
  const d = row.gross - row.course_par;
  if (d === 0) return { text: 'E', tone: DISCOVER_FACT };
  return { text: d > 0 ? `+${d}` : `${d}`, tone: d < 0 ? TOPAR_RED : DISCOVER_FACT };
}

export function AmateurHero({ userId }: { userId: string | undefined }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  const { data: rounds } = useCircleLatestRounds(userId, {
    limit: 1,
    includeSuggested: true,
  });
  const row = rounds?.[0] ?? null;
  const scoreIds = useMemo(() => [row?.score_id ?? null], [row?.score_id]);
  const shapes = useRoundHoleShapes(scoreIds);
  const shape = shapes?.get(row?.score_id ?? '') ?? null;
  /* THE PHOTOGRAPH. The rounds hook carries no image column, so the hero reads
     golf_courses.thumbnail_image — the same field block 2's course rows use. */
  const heroImage = useHeroCourseImage(row?.course_id);

  const par = row ? toPar(row) : null;

  return (
    <section
      style={{
        position: 'relative',
        height: AMATEUR_HERO_H,
        /* FULL BLEED INTO THE NOTCH: the route is immersive, so the hero pays
           the safe area itself and the photograph runs under the status bar. */
        marginTop: 0,
        overflow: 'hidden',
        fontFamily: SANS,
        ...FIGS,
      }}
    >
      <CourseImageFallback
        courseId={row?.course_id ?? null}
        courseName={row?.course_name ?? null}
        initialsSize={44}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 0 }}
      >
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
        {/* THE LOCAL DEEPENING, THIS HERO ONLY (BRIEF_AMATEUR_PAGE).
            SCRIM_STANDOUT reaches zero at 32% of the surface. On a 340px hero
            that is 109px from the bottom - exactly where the round shape sits,
            so the shape was drawn on the fade-out edge, effectively on raw
            photograph. This second layer carries real tone up to ~48%, which
            covers the whole caption stack (name row, shape, course name) and
            leaves the top two thirds of the picture untouched. Local, so no
            other surface that renders RoundShape moves. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(0deg, rgba(10,14,10,0.72) 0%, rgba(10,14,10,0.58) 26%, rgba(10,14,10,0.34) 38%, rgba(10,14,10,0) 50%)',
          }}
        />

      </CourseImageFallback>

      {row && (
        <button
          type="button"
          onClick={() => {
            if (row.course_id) navigate(`/courses/${row.course_id}`);
          }}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 1,
            display: 'block',
            width: 'auto',
            padding: 0,
            border: 0,
            background: 'transparent',
            textAlign: 'left',
            cursor: row.course_id ? 'pointer' : 'default',
          }}
        >
          {/* WHO, on the photograph. */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <SquircleAvatar
              size={30}
              src={row.profile_photo_url ?? undefined}
              alt={row.display_name}
            />
            <span
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 14,
                fontWeight: 700,
                color: DISCOVER_FACT,
                textShadow: '0 1px 2px rgba(0,0,0,0.72)',
              }}
            >
              {row.display_name}
            </span>
            {par && (
              <span
                className="tabular-nums"
                style={{
                  marginLeft: 'auto',
                  fontSize: 17,
                  fontWeight: 700,
                  color: par.tone,
                  textShadow: '0 1px 2px rgba(0,0,0,0.72)',
                }}
              >
                {par.text}
              </span>
            )}
          </span>

          {/* THE ROUND SHAPE, over the scrim, 34px. */}
          <span style={{ display: 'block', marginTop: 8 }}>
            <RoundShape
              row={row}
              shape={shape}
              width={320}
              height={AMATEUR_HERO_SHAPE_H}
              showMeta={false}
              strokeWidth={2}
            />
          </span>

          <span
            style={{
              ...KICKER,
              display: 'block',
              marginTop: 8,
              color: DISCOVER_QUIET,
              textShadow: '0 1px 2px rgba(0,0,0,0.72)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.course_name ?? t('discover.coursesPlayed.course', 'Course')}
          </span>
        </button>
      )}
    </section>
  );
}

export default AmateurHero;
