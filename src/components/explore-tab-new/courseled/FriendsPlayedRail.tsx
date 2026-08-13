import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useFriendsLatestRounds, type FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import {
  toParFor,
  buildInsightMap,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  INSIGHT_TWO_LINE_RESERVE,
  INSIGHT_CLAMP,
} from '../friendRoundParts';
import { CourseImageFallback } from './CourseImageFallback';
import { relativeDay } from './discoverWhen';

import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { useContentReactions, type ReactionTarget } from './hooks/useContentReactions';
import { ReactionAction, ReactionSlot } from './ReactionAction';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { FriendsRail as FriendsRailShell } from './DiscoverCourseLedSkeleton';

import { A, FIGS, CARD_SHELL, Eyebrow, NEW_CARD_RING, GOLD, InkAction, NUMF, SANS } from './tokens';

/**
 * Section 1 — WHERE YOUR FRIENDS PLAYED (BRIEF_FRIENDS_PLAYED_TILE_GLASS).
 *
 * A horizontal rail: a week of heavy play grows sideways, never down. One card
 * per friend-round, newest first, capped at ten.
 *
 * THE SCORE LIVES ON THE PHOTO as a glass chip, so the white block belongs
 * entirely to the SHAPE of the round — a curve drawn from the same two figures
 * the subline is written from, and therefore incapable of disagreeing with it.
 *
 * A hole in one puts the GOLD ring on the when-chip — the only gold on the card.
 * No friends or no rounds: the section does not render at all.
 */

const RAIL_CAP = 10;
const CARD_W = 224;
const PHOTO_H = 104;

/** Rail scrim — reaches further up now that the score chip sits on the photo. */
const RAIL_SCRIM =
  'linear-gradient(0deg, rgba(10,14,10,0.66) 0%, rgba(10,14,10,0.28) 38%, rgba(10,14,10,0) 72%)';

/* A GLASS CHIP OVER A PHOTO MUST STAY READABLE ON EVERY PHOTO, and the answer
   is STRENGTHENING THE SCRIM UNDER THE CHIP rather than darkening the glass.
   Measured on the brightest images in the catalogue and on a synthetic pure-white
   worst case: this footprint-sized pool holds white text above 4.5:1 even on
   pure white, while leaving the rest of the frame within ~5% of its brightness.
   A wider pool cleared contrast too but visibly muddied the photograph. */
const SCRIM_CHIP =
  'radial-gradient(92% 132% at 2% 86%, rgba(8,12,8,0.86) 0%, rgba(8,12,8,0.52) 56%, rgba(8,12,8,0) 88%)';

/** The base scrim is bottom-weighted, so the when-chip needs its own top band. */
const SCRIM_TOP =
  'linear-gradient(180deg, rgba(8,12,8,0.34) 0%, rgba(8,12,8,0.10) 30%, rgba(8,12,8,0) 52%)';

/* ────────────────────────────── GLASS ────────────────────────────────────
   backdrop-filter is the whole point of this design and it is the property
   most likely to no-op on an older webview. The FLAT, HIGHER-OPACITY fill is
   therefore the BASE, and the blur is layered on as an @supports enhancement —
   never the other way round, which would leave a transparent chip on failure.
   The classes are declared once, inline, so the rail carries its own CSS and
   no global stylesheet has to be edited for one section.                    */

const GLASS_CSS = `
.fpg-chip { background: rgba(255,255,255,0.24); border: 1px solid rgba(255,255,255,0.30); }
.fpg-score { background: rgba(255,255,255,0.24); border: 1px solid rgba(255,255,255,0.28); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .fpg-chip {
    background: rgba(255,255,255,0.18);
    -webkit-backdrop-filter: blur(14px) saturate(160%);
    backdrop-filter: blur(14px) saturate(160%);
  }
  .fpg-score {
    background: rgba(255,255,255,0.16);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
  }
}
`;

/* ───────────────────────────── THE SHAPE ─────────────────────────────────
   THREE POINTS, NOT EIGHTEEN. FriendRoundRow carries front_nine_to_par and
   back_nine_to_par and nothing between them, so the curve is level → the turn
   → the finish. That is EXACTLY what the subline is generated from, so the
   drawing and the sentence can never disagree, and it costs no extra query.

   MONOTONE CUBIC (Fritsch-Carlson), ported from the analytical panels'
   implementation in this same feature family. A Catmull-Rom or basis spline
   OVERSHOOTS a flat run: a level nine gives two equal points and a smoothing
   spline would draw a dip the member never played.

   THE AXIS IS NATURAL: MORE OVER PAR IS HIGHER. A dip is a good stretch.     */

const SHAPE_H = 34;
const SHAPE_PAD_X = 6;

function monotonePath(pts: { x: number; y: number }[]): string {
  const n = pts.length;
  if (n < 2) return '';
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    slope.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0;
    } else {
      const avg = (slope[i - 1] + slope[i]) / 2;
      const cap = 3 * Math.min(Math.abs(slope[i - 1]), Math.abs(slope[i]));
      m[i] = Math.sign(slope[i - 1]) * Math.min(Math.abs(avg), cap);
    }
  }
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const c1x = pts[i].x + dx / 3;
    const c1y = pts[i].y + (m[i] * dx) / 3;
    const c2x = pts[i + 1].x - dx / 3;
    const c2y = pts[i + 1].y - (m[i + 1] * dx) / 3;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1].x.toFixed(2)},${pts[i + 1].y.toFixed(2)}`;
  }
  return d;
}

/**
 * THE ROUND'S SHAPE. Null on either nine means NO CURVE — a straight line from
 * zero to the total would be a claim about a round that was not measured.
 */
function RoundShape({ row, tone }: { row: FriendRoundRow; tone: string }) {
  const front = row.front_nine_to_par;
  const back = row.back_nine_to_par;

  // WHEN EITHER NINE IS NULL: draw nothing and let the area collapse.
  if (front == null || back == null || !Number.isFinite(front) || !Number.isFinite(back)) {
    return null;
  }

  const values = [0, front, front + back];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // A flat round still needs a band to sit in, so never divide by zero.
  const span = Math.max(hi - lo, 2);
  const top = 7;
  const bottom = SHAPE_H - 7;

  // MORE OVER PAR IS HIGHER: the larger value maps to the SMALLER y.
  const yFor = (v: number) => bottom - ((v - lo) / span) * (bottom - top);

  const innerW = CARD_W - SHAPE_PAD_X * 2;
  const pts = values.map((v, i) => ({
    x: SHAPE_PAD_X + (i / (values.length - 1)) * innerW,
    y: yFor(v),
  }));

  const d = monotonePath(pts);
  // THE FILL RUNS FLAT TO BOTH CARD EDGES so the colour stays full bleed,
  // while the POINTS are inset so the terminal dot cannot clip.
  const fillD = `M0,${SHAPE_H} L0,${pts[0].y.toFixed(2)} L${d.slice(1)} L${CARD_W},${pts[pts.length - 1].y.toFixed(2)} L${CARD_W},${SHAPE_H} Z`;
  const end = pts[pts.length - 1];
  const gid = `fps-${row.round_id}`;

  return (
    <svg
      width="100%"
      height={SHAPE_H}
      viewBox={`0 0 ${CARD_W} ${SHAPE_H}`}
      preserveAspectRatio="none"
      style={{ display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.3} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gid})`} />
      {/* THE WHITE HALO UNDER THE DATA STROKE is what stops the band looking
          flat against the fill. Do not drop it. */}
      <path
        d={d}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.75}
        strokeWidth={5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        stroke={tone}
        strokeWidth={2.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={end.x} cy={end.y} r={5} fill="#FFFFFF" />
      <circle cx={end.x} cy={end.y} r={2.6} fill={tone} />
    </svg>
  );
}

interface Props {
  userId: string | undefined;
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  onCardPress: (row: FriendRoundRow) => void;
  onSeeAll: () => void;
}

export function FriendsPlayedRail({ userId, lastSeen = null, onCardPress, onSeeAll }: Props) {
  const { t } = useTranslation('courses');
  const roundsQuery = useFriendsLatestRounds(userId, {
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
        {t('discover.friendsPlayed', 'Where your friends played')}
      </Eyebrow>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', alignItems: 'stretch', gap: 10, overflowX: 'auto' }}
      >
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          const hasAce = r.feats.some((f) => f.key === 'holes_in_one');
          const isNew = isNewSince(r.play_date, lastSeen);
          // A ROUND SCORE IS A SCORE, NOT A MOVEMENT: under par is TOPAR red,
          // over par is INK, level is muted. The index-delta pair
          // (A.IMPROVED / A.DRIFTED) means MOVEMENT and must never appear here.
          const toPar = toParFor(r);
          const shapeTone = toPar?.tone ?? A.MUTE;
          const insight = insights.get(r.round_id)?.text ?? null;

          return (
            <button
              key={r.round_id}
              type="button"
              onClick={() => onCardPress(r)}
              style={{
                ...CARD_SHELL,
                ...(isNew ? NEW_CARD_RING : null),
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
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_CHIP }} />
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_TOP }} />

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
                          color: '#FFFFFF',
                          lineHeight: 1,
                        }}
                      >
                        {toPar.text}
                      </span>
                    )}
                    {r.course_par != null && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(255,255,255,0.66)',
                          lineHeight: 1,
                        }}
                      >
                        {t('discover.friendsRail.par', {
                          defaultValue: 'Par {{par}}',
                          par: r.course_par,
                        })}
                      </span>
                    )}
                  </span>

                  <span
                    style={{
                      display: 'block',
                      marginTop: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-0.015em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m?.name ?? r.course_name ?? t('discover.unknownCourse', 'Course')}
                  </span>
                </div>
              </CourseImageFallback>

              {/* THE SHAPE, full bleed, directly under the photo. Collapses to
                  nothing when either nine is unmeasured. */}
              <RoundShape row={r} tone={shapeTone} />

              <div style={{ padding: '9px 11px 10px' }}>
                {/* THE SUBLINE. Its wording is generated elsewhere and is
                    unchanged; the drawing above is built from the same two
                    figures, so the two can never disagree. Two lines of height
                    are reserved on every card so the rail holds one height. */}
                <div style={{ minHeight: INSIGHT_TWO_LINE_RESERVE }}>
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
                    marginTop: 9,
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
