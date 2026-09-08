import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import { useRoundHoleShapes, type HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { DISCOVER_FACT, DISCOVER_QUIET, KICKER, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { toParFor } from '@/components/explore-tab-new/friendRoundParts';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';
import { useHeroCourseImage } from '@/features/amateur/useHeroCourseImage';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
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

/** THE LEVEL-PAR RULE ON A PHOTOGRAPH (§3a). 14% white: present enough to give
 *  the curve a floor, quiet enough not to read as a scratch on the picture. */
const HERO_BASELINE = 'rgba(255,255,255,0.14)';

/** 7 -> 7TH, 12 -> 12TH, 21 -> 21ST. */
function ordinal(n: number): string {
  const mod100 = n % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? 'TH'
      : n % 10 === 1
        ? 'ST'
        : n % 10 === 2
          ? 'ND'
          : n % 10 === 3
            ? 'RD'
            : 'TH';
  return `${n}${suffix}`;
}

/**
 * §1 THE KICKER NAMES WHAT IS NOTABLE. First rung that applies wins:
 *
 *   1 HOLE IN ONE AT THE 7TH   2 ALBATROSS AT THE 12TH   3 EAGLE AT THE 12TH
 *   4 COURSE RECORD            5 PERSONAL BEST HERE      6 JUST PLAYED
 *
 * THE KICKER IS THE KEY TO THE GOLD DOT. Rungs 1-3 are read off the hole series
 * the shape is already drawn from — no new query. Rungs 4 and 5 are NOT
 * implemented: neither the course's record nor this member's history at this
 * course is in the hero's data, and inventing either from one round would be a
 * false claim. Until that read exists the ladder steps 3 -> 6.
 *
 * NO HOLE SERIES, NO FEAT (§4): the ladder falls to JUST PLAYED rather than
 * showing a gap. A feat with an unknown hole takes the BARE form.
 */
function featKicker(shape: HoleShape | null): string {
  if (!shape) return 'JUST PLAYED';

  const scored = shape.holes.filter((h) => h.par != null && h.strokes != null);
  const named = (label: string, holeNo: number | null | undefined) =>
    holeNo != null ? `${label} AT THE ${ordinal(holeNo)}` : label;

  const ace = scored.find((h) => h.strokes === 1);
  if (ace) return named('HOLE IN ONE', ace.holeNo);

  const albatross = scored.find((h) => (h.strokes as number) - (h.par as number) <= -3);
  if (albatross) return named('ALBATROSS', albatross.holeNo);

  const eagle = scored.find((h) => (h.strokes as number) - (h.par as number) === -2);
  if (eagle) return named('EAGLE', eagle.holeNo);

  return 'JUST PLAYED';
}

export function AmateurHero({
  userId,
  onOpenRound,
}: {
  userId: string | undefined;
  /** §5 THE HERO IS A DOOR TO THE ROUND, not to the course: the feat the kicker
   *  names must be visible on the scorecard one tap away. */
  onOpenRound?: (scoreId: string, roundUserId: string) => void;
}) {
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

  /* §2 THE SCORE. toParFor is the SHARED rule the Discover friend round row
     uses: true minus U+2212, under par red, over par ink, level muted. */
  const par = row ? toParFor(row) : null;
  const kicker = featKicker(shape);

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
        imageUrl={heroImage.data ?? null}
        /* NEVER A MONOGRAM AT HERO SCALE: no photograph = flat tone + scrim. */
        flatWhenEmpty
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
            /* §5 THE ROUND FIRST. The hero names a feat, so the tap must land on
               the scorecard that carries it. The course page is the FALLBACK for
               a row with no score id (a suggested round with no card), never the
               primary destination. */
            if (row.score_id && onOpenRound) onOpenRound(row.score_id, row.user_id);
            else if (row.course_id) navigate(`/courses/${row.course_id}`);
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
          {/* §1 THE KICKER. It NAMES THE FEAT, which is what explains the gold
              dot on the shape below — the label keys the graphic, so no legend
              is needed. Timing is not repeated here: the row beneath carries it. */}
          <span
            style={{
              ...KICKER,
              display: 'block',
              marginBottom: 6,
              color: 'rgba(255,255,255,0.66)',
              textShadow: '0 1px 2px rgba(0,0,0,0.72)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {kicker}
          </span>

          {/* WHO, on the photograph. */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <SquircleAvatar
              size={30}
              src={row.profile_photo_url ?? undefined}
              alt={row.display_name}
              userId={row.user_id}
              fallback={row.display_name?.slice(0, 2).toUpperCase()}
              hairlineRing
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
            {/* §2 GROSS OVER TO-PAR, right-aligned — the stacked shape and the
                21 / 13 sizes are the Discover FriendRoundRow score column's, so
                the hero states the score the way every round row already does
                instead of inventing a size. GROSS ALWAYS EXISTS, so this block
                survives a round with no hole detail (§4). */}
            {row.gross != null && (
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  textShadow: '0 1px 2px rgba(0,0,0,0.72)',
                }}
              >
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    color: A.INK,
                  }}
                >
                  {row.gross}
                </span>
                {par && (
                  <span
                    className="tabular-nums"
                    style={{
                      marginTop: 2,
                      fontSize: 13,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: par.tone,
                    }}
                  >
                    {par.text}
                  </span>
                )}
              </span>
            )}
          </span>

          {/* THE ROUND SHAPE, over the scrim, 34px.
              §3 TWO QUIET ADDITIONS, BOTH DEPENDENT ON THE HOLE SERIES: the
              level-par rule at 14% white and the hole number under the bead.
              showBaseline stays FALSE so the three-point fallback (no hole
              detail) draws NO rule — a rule under a curve that has no holes
              behind it is a promise the drawing cannot keep (§4). */}
          <span style={{ display: 'block', marginTop: 8 }}>
            <RoundShape
              row={row}
              shape={shape}
              width={320}
              height={AMATEUR_HERO_SHAPE_H}
              showMeta={false}
              showBaseline={false}
              strokeWidth={2}
              baselineColor={HERO_BASELINE}
              beadHoleLabels
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
