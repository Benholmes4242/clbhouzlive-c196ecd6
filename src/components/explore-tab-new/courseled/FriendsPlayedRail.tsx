import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';


import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import {
  toParFor,
  buildInsightMap,
  referenceLine,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  INSIGHT_LINE_RESERVE,
  INSIGHT_CLAMP,
  movementFor,
} from '../friendRoundParts';
import { CourseImageFallback } from './CourseImageFallback';
import { relativeDay } from './discoverWhen';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';


import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useRoundHoleShapes } from './hooks/useRoundHoleShapes';
import { RoundShape } from './RoundShape';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';
import { countNewSince, useReportNewCount } from './newSince';
import { FriendsRail as FriendsRailShell } from './DiscoverCourseLedSkeleton';

import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { A, FIGS, KICKER, CARD_SHELL, Eyebrow, GOLD, InkAction, NUMF, SANS } from './tokens';

/**
 * Section 1 — WHO'S BEEN PLAYING (BRIEF_FRIENDS_PLAYED_TILE_GLASS +
 * BRIEF_WHOS_BEEN_PLAYING). One heading for all three states: circle only,
 * circle plus suggested, suggested only — a heading that flips as a member
 * adds people is a change they have to notice and decode.
 *
 * A horizontal rail: a week of heavy play grows sideways, never down. One card
 * per round, circle first then suggested, capped at ten.
 *
 * THE SCORE LIVES ON THE PHOTO as a glass chip, so the band below belongs
 * entirely to the SHAPE of the round: a 19-point cumulative to-par curve from
 * ONE batched read of whs_score_holes (BRIEF_FRIENDS_TILE_HOLE_SHAPE), SPLIT at
 * the level-par rule so under-par golf renders red, with beads from the SHARED
 * beadForScore rule. Rounds without holes keep the three-point
 * fallback drawn from the same two figures the subline is written from.
 *
 * A hole in one puts the GOLD ring on the when-chip — the only gold on the card.
 * Nothing at all to show — no circle rounds and no suggested pool — and the
 * section does not render.
 */

export const RAIL_CAP = 10;
const CARD_W = 224;
const PHOTO_H = 104;

/* Rail scrim — THE STANDOUT-TILE SCRIM. The three-layer base/hotspot/top stack
   is gone: this rail now paints the same single bottom-weighted layer as the
   Standout Rounds and Personal Bests tiles, held once in ./photoScrim. */
const RAIL_SCRIM = SCRIM_STANDOUT;


/* ────────────────────────────── GLASS ────────────────────────────────────
   backdrop-filter is the whole point of this design and it is the property
   most likely to no-op on an older webview. The FLAT, HIGHER-OPACITY fill is
   therefore the BASE, and the blur is layered on as an @supports enhancement —
   never the other way round, which would leave a transparent chip on failure.
   The classes are declared once, inline, so the rail carries its own CSS and
   no global stylesheet has to be edited for one section.                    */

const GLASS_CSS = `
.fpg-chip { background: rgba(24,30,26,0.62); border: 1px solid rgba(255,255,255,0.28); }
.fpg-score { background: rgba(24,30,26,0.62); border: 1px solid rgba(255,255,255,0.28); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .fpg-chip {
    background: rgba(24,30,26,0.40);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
  }
  .fpg-score {
    background: rgba(24,30,26,0.40);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
  }
}

`;

/* ───────────────────────────── THE SHAPE ─────────────────────────────────
   THREE POINTS, NOT EIGHTEEN. CircleRoundRow carries front_nine_to_par and
   back_nine_to_par and nothing between them, so the curve is level → the turn
   → the finish. That is EXACTLY what the subline is generated from, so the
   drawing and the sentence can never disagree, and it costs no extra query.

   MONOTONE CUBIC (Fritsch-Carlson), ported from the analytical panels'
   implementation in this same feature family. A Catmull-Rom or basis spline
   OVERSHOOTS a flat run: a level nine gives two equal points and a smoothing
   spline would draw a dip the member never played.

   THE AXIS IS NATURAL: MORE OVER PAR IS HIGHER. A dip is a good stretch.     */

/* THE CURVE NEEDS AMPLITUDE (was 34). At 34px a plus-eight round and a level
   round drew nearly the same flat line: the shape was unreadable, not compact.
   60 is the smallest height where a two-shot swing is legible, and the tile has
   the room — the body below is one insight line and a member row. */

/* monotonePath now lives in @/lib/charts/monotonePath — ONE copy, shared with
   the scorecard sheet's trajectory chart. */


/* ── UNDER PAR: SPLIT AT THE LEVEL LINE, NOT TONED BY THE FINAL SCORE ──────
   The curve is RED where it sits BELOW level par and INK where it sits ABOVE.
   A member two under through twelve who finishes plus one WAS in front for
   most of the afternoon; colouring that round entirely ink erases it.
   TO-PAR CONVENTION ONLY. The index-delta pair (A.IMPROVED / A.DRIFTED) means
   MOVEMENT and must never appear on this tile.                              */
/* TOPAR_UNDER_LIGHT (#D2222D) is too dark to read on glass over a photograph,
   so the CHIP'S under-par figure — and only that — uses a lighter red. */
const GLASS_UNDER = '#FF8A80';

/* THE INDEX-DELTA PAIR ON DARK GLASS. NOT A.IMPROVED / A.DRIFTED, which are
   light-surface values and fail over a photograph. Same colours, different
   substrate - see the same split on TOPAR_UNDER_LIGHT / TOPAR_UNDER_DARK. */
const INDEX_DARK_FELL = '#7BE8A6';
const INDEX_DARK_ROSE = '#FF8A7A';


/**
 * THE ROUND'S SHAPE.
 *
 *   holes present, 9+ played          → the 19-point cumulative curve with dots
 *   holes absent, both nines present  → the THREE-POINT fallback, no dots
 *   holes absent AND a nine null      → no curve, the band collapses
 *
 * A straight line from zero to the total would be a claim about a round that
 * was not measured, so the last case draws nothing at all.
 */



interface Props {
  userId: string | undefined;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  onCardPress: (row: CircleRoundRow) => void;
  onSeeAll: () => void;
}

export function FriendsPlayedRail({ userId, lastSeen = null, onCardPress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  const roundsQuery = useCircleLatestRounds(userId, {
    limit: RAIL_CAP,
    allowMultiplePerFriend: true,
  });
  const rounds = roundsQuery.data;

  const rows = useMemo(() => (rounds ?? []).slice(0, RAIL_CAP), [rounds]);
  const courseIds = useMemo(
    () => rows.map((r) => r.course_id).filter((v): v is string => !!v),
    [rows],
  );
  const metaQuery = useCourseCardMeta(courseIds);
  const meta = metaQuery.data;

  // UNRESOLVED IS NOT ABSENT (BRIEF_DISCOVER_LOADING_STATES).
  const roundsPending = !!userId && roundsQuery.isPending;
  const metaPending = courseIds.length > 0 && metaQuery.isPending;
  const pending = roundsPending || metaPending;

  // REACTIONS (BRIEF_DISCOVER_REACTIONS): one read for the whole rail, keyed by
  // the round's whs_score id. content_reactions is canonical for rounds.
  const reactionTargets = useMemo<ReactionTarget[]>(
    () =>
      rows
        .filter((r) => !!r.score_id)
        .map((r) => ({ type: 'round' as const, id: r.score_id as string })),
    [rows],
  );
  const reactions = useContentReactions(reactionTargets);

  // HOLE SHAPES: ONE batched read for the whole rail, mirroring the reactions
  // read above. Never one query per card in a horizontally scrolling rail.
  const scoreIds = useMemo(() => rows.map((r) => r.score_id), [rows]);
  const holeShapes = useRoundHoleShapes(scoreIds);

  // THE INSIGHT SET (BRIEF_FRIENDS_INSIGHT_SET): resolved for the rail as a
  // whole, not per card, so the repetition cap can see its neighbours.
  const insights = useMemo(() => buildInsightMap(rows, t as never), [rows, t]);

  const newCount = pending ? 0 : countNewSince(rows, (r) => r.play_date, lastSeen);
  useReportNewCount('friends', newCount);

  if (pending) return <FriendsRailShell />;
  if (rows.length === 0) return null;

  return (
    <section>
      <style>{GLASS_CSS}</style>
      <Eyebrow
        dot={newCount > 0}
        aside={<InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>}
      >
        {t('discover.whosBeenPlaying', "Who's been playing")}
      </Eyebrow>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          const hasAce = r.feats.some((f) => f.key === 'holes_in_one');
          // A ROUND SCORE IS A SCORE, NOT A MOVEMENT: under par is TOPAR red,
          // over par is INK, level is muted. The index-delta pair
          // (A.IMPROVED / A.DRIFTED) means MOVEMENT and must never appear here.
          const toPar = toParFor(r);
          const toParUnder = toPar?.tone === TOPAR_RED;
          const movement = movementFor(r);
          const insight = insights.get(r.round_id)?.text ?? referenceLine(r, t);

          return (
            <button
              key={r.round_id}
              type="button"
              onClick={() => onCardPress(r)}
              style={{
                ...CARD_SHELL,
                /* No new-card ring on this rail: the ink outline read as a
                   stray black border on some cards and not others. */
                width: CARD_W,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                padding: 0,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <CourseImageFallback
                courseId={r.course_id}
                courseName={m?.name ?? r.course_name}
                imageUrl={m?.imageUrl}
                style={{ height: PHOTO_H, flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', inset: 0, background: RAIL_SCRIM }} />

                {/* THE WHEN-CHIP, GLASS. The GOLD ring for a hole in one is the
                    only gold on the card and is unchanged. */}
                <span
                  className="fpg-chip"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    borderRadius: 999,
                    padding: '3px 7px',
                    ...(hasAce ? { border: `1px solid ${GOLD}` } : null),
                  }}
                >
                  {relativeDay(r.play_date, t)}
                </span>

                {/* THE SUGGESTED MARK (BRIEF_WHOS_BEEN_PLAYING 3.5). A round
                    from outside the circle says so, in the KICKER token, inside
                    the tile's EXISTING chrome — the same glass chip the when
                    label uses, so it stays legible over a bright sky where a
                    bare white label would disappear. No follow button: this
                    card's whole job is to show a round. */}
                {r.suggested && (
                  <span
                    className="fpg-chip"
                    style={{
                      ...KICKER,
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      color: '#FFFFFF',
                      borderRadius: 999,
                      padding: '3px 7px',
                    }}
                  >
                    {t('discover.suggestedMark', 'SUGGESTED')}
                  </span>
                )}


                {/* THE GLASS SCORE CHIP. Lifting the score onto the photo makes
                    the photo carry data rather than decoration, and gives the
                    white block entirely to the shape. */}
                <div
                  style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    bottom: 8,
                  }}
                >
                  <span
                    className="fpg-score"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'baseline',
                      gap: 6,
                      borderRadius: 10,
                      padding: '4px 9px 5px',
                    }}
                  >
                    <span
                      style={{
                        ...NUMF,
                        fontSize: 25,
                        fontWeight: 700,
                        letterSpacing: '-0.05em',
                        color: '#FFFFFF',
                        lineHeight: 0.9,
                      }}
                    >
                      {r.gross ?? '\u2014'}
                    </span>
                    {toPar && (
                      <span
                        style={{
                          ...NUMF,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: toParUnder ? GLASS_UNDER : 'rgba(255,255,255,0.92)',
                          lineHeight: 1,
                        }}
                      >
                        {toPar.text}
                      </span>
                    )}
                    {movement && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                        }}
                      >
                        {/* A figure with an ARROW is a MOVEMENT; the signed
                            figure next to it is a SCORE. Under-par score is
                            RED, a falling index is GREEN - opposite conventions,
                            both legible on dark glass. */}
                        <span
                          style={{
                            width: 1,
                            alignSelf: 'stretch',
                            background: 'rgba(255,255,255,0.28)',
                            marginRight: 9,
                          }}
                        />
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'baseline',
                            gap: 3,
                          }}
                        >
                          <span
                            style={{
                              ...NUMF,
                              fontSize: 11,
                              fontWeight: 700,
                              color: movement.arrow === '\u2193' ? INDEX_DARK_FELL : INDEX_DARK_ROSE,
                              lineHeight: 1,
                            }}
                          >
                            {movement.arrow}
                          </span>
                          <span
                            style={{
                              ...NUMF,
                              fontSize: 11,
                              fontWeight: 700,
                              color: movement.arrow === '\u2193' ? INDEX_DARK_FELL : INDEX_DARK_ROSE,
                              lineHeight: 1,
                            }}
                          >
                            {movement.figure}
                          </span>
                        </span>
                      </span>
                    )}
                  </span>

                  {/* TWO LINES, CLAMPED. A single truncated line cut the
                      parenthetical — "(East Course)" is the only thing telling
                      one course at a club from another, so it must survive. The
                      block sits in the photo's bottom-anchored overlay, so a
                      second line grows UPWARD into the photograph and the tile
                      height is unchanged. Type size is not reduced. */}
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      marginTop: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                    }}
                  >
                    {m?.name ?? r.course_name ?? t('discover.unknownCourse', 'Course')}
                  </span>

                </div>
              </CourseImageFallback>

              {/* THE SHAPE, full bleed, directly under the photo. Collapses to
                  nothing when either nine is unmeasured. THE 6px IS A REAL WHITE
                  GAP between the photograph and the curve, and it lives OUT HERE:
                  raising RoundShape's internal `top` would compress the plot
                  instead, so the gap would vary with the shape of the round. */}
              <div style={{ marginTop: 6 }}>
                <RoundShape row={r} shape={holeShapes?.get(r.score_id ?? '') ?? null} />
              </div>

              {/* THE LOWER BLOCK OWNS THE REMAINING HEIGHT. The rail stretches
                  every tile to one height, so the block below the photo must be
                  a column that FILLS what is left — otherwise a tile whose meta
                  row is empty (a zero-birdie round) pulls its footer up and the
                  name and reaction sit above their neighbours'. */}
              <div
                style={{
                  padding: '9px 11px 10px',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* THE SUBLINE. Its wording is generated elsewhere; the drawing
                    above is built from the same two figures, so the two can
                    never disagree. ONE line of height on every card — every
                    insight state is written to fit it (BRIEF_FRIENDS_RAIL_ONE_LINE). */}

                <div style={{ minHeight: INSIGHT_LINE_RESERVE, marginBottom: 9 }}>
                  {insight && (
                    <div
                      style={{
                        ...FIGS,
                        fontSize: INSIGHT_FONT_SIZE,
                        lineHeight: INSIGHT_LINE_HEIGHT,
                        fontWeight: 600,
                        color: A.BODY,
                        ...INSIGHT_CLAMP,
                      }}
                    >
                      <span style={{ display: 'inline' }}>
                        <InsightGlyph />
                        {insight}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    /* marginTop AUTO, not a fixed gap: the footer rests on the
                       tile's bottom edge whatever the meta row above contains.
                       No placeholder and no fixed-height meta row — either would
                       reinstate the gap the hole count left behind. */
                    marginTop: 'auto',
                    borderTop: `1px solid ${A.BORDER}`,
                    paddingTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      minWidth: 0,
                      flex: '1 1 auto',
                    }}
                  >
                    <SquircleAvatar
                      src={r.profile_photo_url}
                      userId={r.user_id}
                      size={20}
                      alt={r.display_name}
                      hideRing
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: A.BODY,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.display_name}
                    </span>
                  </span>
                  {/* THE FIXED-WIDTH TRAILING SLOT renders on every row whether
                      or not a control appears, so figures do not go ragged. */}
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ReactionSlot>
                      {(() => {
                        const st = reactions.stateFor('round', r.score_id);
                        return (
                          <ReactionAction
                            hidden={!r.score_id || !reactions.viewerId || reactions.unavailable}
                            readOnly={!!reactions.viewerId && r.user_id === reactions.viewerId}
                            count={st.count}
                            reacted={st.mine}
                            onToggle={() => reactions.toggle('round', r.score_id)}
                            label={t('discover.reactions.action', 'Like this round')}
                          />
                        );
                      })()}
                    </ReactionSlot>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FriendsPlayedRail;
