/**
 * PostRoundCard — the scorecard block for a Clubhouse post with a round
 * attached (BRIEF_ROUND_POST_CARD).
 *
 * Full bleed: no radius, no border, no horizontal margin. The course photo
 * backdrop and its glass surface are owned by FeedCard at card level; this
 * block is transparent and applies no backdrop filter of its own.
 *
 * Data comes from the batched `usePostRounds` map at page level — this
 * component NEVER fetches. Scoring marks come from the shared ScoreMark
 * renderer.
 *
 * Analytics:
 *  - round_post_shown  { post_id, notability, has_holes, has_crown } — once
 *    per post per session.
 *  - round_post_tapped { post_id, notability }
 *  - feed_round_card_shown / feed_round_card_tapped — existing, untouched.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import { SC_BIRDIE_DARK } from '@/features/courses/components/holes/_constants';
import { shapeSentence, IndexMovementTriangle, movementFor } from '@/components/explore-tab-new/friendRoundParts';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { formatWeekdayShortGB, formatDayMonthShortGB } from '@/i18n/format';
import type { PostRound } from '@/hooks/feed/usePostRounds';

const INK = '#F4F7F9';
const MUTE = 'rgba(255,255,255,0.62)';
const DIM = 'rgba(255,255,255,0.40)';
const AMBER = '#F7931E';
const HCP_IMPROVING = '#16a34a';
const HCP_DRIFTING = '#dc2626';
const HAIRLINE = 'rgba(255,255,255,0.08)';

const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"zero" 0',
};

/** Once-per-session impression guard. */
const seenRoundPosts = new Set<string>();

function fmtToPar(n: number | null): string {
  if (n == null) return '—';
  return n === 0 ? 'E' : n > 0 ? `+${n}` : `${n}`;
}

function toParColor(n: number | null): string {
  if (n == null) return MUTE;
  if (n === 0) return INK;
  return n < 0 ? HCP_DRIFTING : MUTE;
}

function dateKicker(playDate: string | null): string | null {
  if (!playDate) return null;
  return `${formatWeekdayShortGB(playDate)}, ${formatDayMonthShortGB(playDate)}`;
}

export interface RoundCrown {
  category: string;
  previousHolderName: string;
  margin?: string | null;
}

interface Props {
  round: PostRound;
  onTap?: () => void;
  postId?: string | null;
  notability?: number | null;
  courseName?: string | null;
  courseRegion?: string | null;
  /** Only rendered when a previous holder can be resolved. */
  crown?: RoundCrown | null;
}

type Hole = NonNullable<PostRound['holeShape']>[number];

const LabelRow: React.FC<{
  label: string;
  total: number | null;
  toPar: number | null;
  /**
   * BRIEF_POST_TRAJECTORY_ENDPOINT_DISAGREES §2 — when the nine total is
   * SUPPRESSED (a played hole with no score), the slot the figure would have
   * taken carries the REASON instead. Never a number, never a dash, never the
   * partial sum: the suppression rule (BRIEF_ROUND_STRIP_PARTIAL_HOLES §3.1)
   * stands, it just stops being silent.
   */
  note?: string | null;
}> = ({ label, total, toPar, note }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: DIM,
      }}
    >
      {label}
    </span>
    {total == null ? (
      note ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: DIM,
            whiteSpace: 'nowrap',
          }}
        >
          {note}
        </span>
      ) : null
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...NUM, fontSize: 12.5, fontWeight: 700, color: INK }}>{total}</span>
        <span style={{ ...NUM, fontSize: 12, fontWeight: 700, color: toParColor(toPar) }}>
          {fmtToPar(toPar)}
        </span>
      </span>
    )}
  </div>
);




/**
 * A played hole with no score (the member picked up). BRIEF_ROUND_STRIP_PARTIAL_HOLES
 * §2.1: a distinct muted glyph sized as the score digits — never a zero, never a
 * dash that could be read as level par, never adjusted_gross.
 */
const HoleGap: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span
    aria-label="No score"
    style={{
      width: size,
      height: size,
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1,
      fontSize: Math.round(size * 0.42),
      fontWeight: 700,
      color: 'rgba(255,255,255,0.32)',
    }}
  >
    {'\u00D7'}
  </span>
);

/**
 * A hole the member never started (played = false). BRIEF §1.4: it must NOT
 * look like a picked-up hole — different fact, different mark. A hollow muted
 * squircle: not a digit, not a zero, not a dash.
 */
const HoleNotPlayed: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <span
    aria-label="Not played"
    style={{
      width: size,
      height: size,
      flex: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span
      style={{
        width: Math.round(size * 0.42),
        height: Math.round(size * 0.42),
        borderRadius: '34%',
        border: '1px solid rgba(255,255,255,0.26)',
        background: 'transparent',
      }}
    />
  </span>
);

const NineGrid: React.FC<{ label: string; holes: Hole[] }> = ({ label, holes }) => {
  if (holes.length === 0) return null;
  // §3.1 — a nine containing an unscored played hole prints NO total and NO
  // to-par. Not the partial sum, not a dash. The other nine is unaffected.
  // A NOT-PLAYED hole is not a gap: it takes no strokes and carries no par for
  // this round, so the nine still totals honestly. Only a PICKED-UP hole voids.
  const hasGap = holes.some((h) => h.played && h.gross == null);
  let total = 0;
  let par = 0;
  let any = false;
  for (const h of holes) {
    if (h.played && h.gross != null && h.par != null) {
      // MICRO_BRIEF_ROUND_CARD_GROSS_RECONCILIATION — THE NINE TOTALS READ THE
      // SUBMITTED VALUE, the same figure the header's gross is the sum of. It
      // used to read `gross` (the actual strokes), so a net-double-bogey cap on
      // one hole made OUT + IN total a different round from the header 20px
      // above. The CELLS below still print `gross`: the member sees the strokes
      // they took, the totals state the round of record, and the faint
      // played/adjusted line beneath the nines explains the gap.
      total += h.adjGross ?? h.gross;
      par += h.par;
      any = true;
    }
  }
  const showTotals = any && !hasGap;
  return (
    <div style={{ marginTop: 10 }}>
      <LabelRow
        label={label}
        total={showTotals ? total : null}
        toPar={showTotals ? total - par : null}
        note={any && hasGap ? 'No total \u00B7 picked up' : null}
      />


      <div style={{ display: 'flex', gap: 3 }}>
        {holes.map((h) => (
          <div
            key={h.holeNo}
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <span style={{ ...NUM, fontSize: 11, fontWeight: 700, color: DIM, lineHeight: 1.15 }}>
              {h.holeNo}
            </span>
            <span
              style={{ ...NUM, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.26)', lineHeight: 1.2 }}
            >
              {h.par ?? '·'}
            </span>
            {!h.played ? (
              <HoleNotPlayed />
            ) : h.gross == null ? (
              <HoleGap />
            ) : (
              <ScoreMark strokes={h.gross} par={h.par ?? 4} size={22} surface="dark" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Trajectory: React.FC<{ holes: Hole[]; toPar: number | null }> = ({ holes, toPar }) => {
  // ONE IMPLEMENTATION, TWO SURFACES (BRIEF_TRAJECTORY_CONTINUITY_AND_REUSE §2).
  // The local chart is gone: the scorecard sheet's TrajectoryLine already carries
  // the treatment — the to-par split, the fill to the level rule, earned red, the
  // field stroke, the beads — so this panel is chrome plus that component on the
  // dark surface.
  //
  // §1.2 — THE LINE READS lineGross (gross ?? adjusted_gross). Cells and nine
  // totals read `gross`. A picked-up hole prints no number but the round's shape
  // still passes through where it actually stood.
  const { series, endpoint } = useMemo(() => {
    const s = holes.map((h) => ({
      holeNo: h.holeNo,
      par: h.par,
      strokes: h.lineGross,
      played: h.played,
    }));
    // The final cumulative, computed from the same values the line draws — but
    // the FIGURE may only claim a to-par the cells support
    // (BRIEF_POST_TRAJECTORY_ENDPOINT_DISAGREES §1).
    //
    // Testing `lineGross == null` is INSUFFICIENT: §1.2 defines lineGross as
    // `gross ?? adjusted_gross`, so it is essentially never null and the old
    // guard was close to dead code. A picked-up hole has no gross but does have
    // an adjusted_gross, so `cum` counted it at a value the header's submitted
    // gross does not imply — two to-par figures for one round, 200px apart.
    //
    // So `broken` ALSO fires on the same test NineGrid uses for suppression,
    // `h.played && h.gross == null`. The LINE is untouched and still draws
    // through lineGross: drawing through an adjusted value is honest, PRINTING
    // it as the round's to-par is not. When broken, the endpoint falls back to
    // the score row's figure (§4.2), so panel and header always agree.
    let cum = 0;
    let broken = false;
    for (const h of holes) {
      if (h.played === false) continue;
      if (h.gross == null || h.lineGross == null || h.par == null) {
        broken = true;
        continue;
      }
      cum += h.lineGross - h.par;
    }
    return { series: s, endpoint: broken ? toPar : cum };

  }, [holes, toPar]);

  const scored = series.filter((h) => h.played !== false && h.strokes != null && h.par != null);
  if (scored.length < 2) return null;

  return (
    <div
      style={{
        marginTop: 10,
        borderRadius: 14,
        padding: '10px 12px 6px',
        border: `1px solid ${HAIRLINE}`,
        background: 'rgba(11,13,16,0.66)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          Trajectory
        </span>
        <span style={{ ...NUM, fontSize: 12, fontWeight: 700, color: toParColor(endpoint) }}>
          {fmtToPar(endpoint)}
        </span>
      </div>
      <TrajectoryLine holes={series} height={70} surface="dark" />
    </div>
  );
};

/**
 * BreakdownBar — the breakdown and the shape in words (§3/§4).
 *
 * Both come from the holes the card ALREADY has: usePostRounds supplies them
 * batched at page level and this component never fetches. The counts are
 * derived from the same series the trajectory reads, so the chart and the bar
 * can never disagree.
 *
 * The sentence is generated by shapeSentence in friendRoundParts — the SAME
 * generator the friends rail's 'nines' insight uses, so the two surfaces word
 * the same round identically. A round whose nines are absent or level renders
 * no sentence at all.
 */
const BreakdownBar: React.FC<{ holes: PostRound['holeShape'] }> = ({ holes }) => {
  const { t } = useTranslation('courses');

  const { buckets, front, back, total } = useMemo(() => {
    let birdie = 0, par = 0, bogey = 0, doub = 0;
    let f: number | null = null;
    let b: number | null = null;
    let fCum = 0, bCum = 0, fOk = true, bOk = true;
    for (const h of holes ?? []) {
      if (h.par == null) continue;
      if (h.played === false || h.gross == null) {
        if (h.holeNo <= 9) fOk = false;
        else bOk = false;
        continue;
      }
      const d = h.gross - h.par;
      if (d <= -1) birdie += 1;
      else if (d === 0) par += 1;
      else if (d === 1) bogey += 1;
      else doub += 1;
      if (h.holeNo <= 9) fCum += d;
      else bCum += d;
    }
    if (fOk) f = fCum;
    if (bOk) b = bCum;
    return {
      buckets: [
        { key: 'birdie', label: 'Birdie+', n: birdie, tone: SC_BIRDIE_DARK },
        { key: 'par', label: 'Par', n: par, tone: 'rgba(255,255,255,0.55)' },
        { key: 'bogey', label: 'Bogey', n: bogey, tone: 'rgba(255,255,255,0.30)' },
        { key: 'doub', label: 'Double+', n: doub, tone: 'rgba(255,255,255,0.16)' },
      ],
      front: f,
      back: b,
      total: birdie + par + bogey + doub,
    };
  }, [holes]);

  if (total === 0) return null;

  const sentence = shapeSentence(front, back, t);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 3, height: 4 }}>
        {buckets.map((b) => (
          <div
            key={b.key}
            style={{
              // A ZERO BUCKET keeps a hairline segment at reduced opacity so
              // the grammar of four holds, without claiming a result.
              flex: b.n > 0 ? b.n : 0,
              width: b.n > 0 ? undefined : 8,
              flexGrow: b.n > 0 ? b.n : 0,
              borderRadius: 2,
              background: b.tone,
              opacity: b.n > 0 ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
        {buckets.map((b) => (
          <span key={b.key} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: DIM,
              }}
            >
              {b.label}
            </span>
            <span style={{ ...NUM, fontSize: 12.5, fontWeight: 700, color: b.n > 0 ? INK : DIM }}>
              {b.n}
            </span>
          </span>
        ))}
      </div>
      {sentence && (
        <div
          style={{
            marginTop: 8,
            paddingBottom: 8,
            borderBottom: `1px solid ${HAIRLINE}`,
            fontSize: 12.5,
            fontWeight: 600,
            color: MUTE,
          }}
        >
          {sentence}
        </div>
      )}
    </div>
  );
};

export const PostRoundCard: React.FC<Props> = ({

  round,
  onTap,
  postId,
  notability,
  courseName,
  courseRegion,
  crown,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  const holes = round.holeShape ?? [];
  const hasHoles = holes.length > 0;
  // §5 — has_holes is now true for PARTIAL cards too, so a reading needs both
  // counts to tell a complete card from a partial one. The shape now carries
  // all eighteen positions, so played_holes counts the played ones.
  const playedHoles = holes.filter((h) => h.played).length;
  const scoredHoles = holes.filter((h) => h.played && h.gross != null).length;
  const showCrown = (notability ?? 0) === 3 && !!crown && !!crown.previousHolderName;

  useEffect(() => {
    const el = ref.current;
    if (!el || firedRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || firedRef.current) return;
        firedRef.current = true;
        io.disconnect();
        analyticsEvents.track('feed_round_card_shown', {
          has_holes: hasHoles,
          played_holes: playedHoles,
          scored_holes: scoredHoles,
        });
        const key = postId ?? round.whsScoreId;
        if (!seenRoundPosts.has(key)) {
          seenRoundPosts.add(key);
          // round_post_shown — once per post per session
          analyticsEvents.track('round_post_shown', {
            post_id: postId ?? null,
            notability: notability ?? null,
            has_holes: hasHoles,
            played_holes: playedHoles,
            scored_holes: scoredHoles,
            has_crown: showCrown,
          });
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasHoles, playedHoles, scoredHoles, postId, notability, showCrown, round.whsScoreId]);

  const gross = round.grossScore;
  const toPar = gross != null && round.coursePar != null ? gross - round.coursePar : null;
  const kicker = dateKicker(round.playDate);

  // The card-level backdrop and glass now live in FeedCard. This block is
  // transparent and never applies a backdrop filter of its own.
  const panelStyle: React.CSSProperties = {
    background: 'transparent',
    padding: '13px 13px 14px',
  };


  const handleTap = onTap
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        analyticsEvents.track('feed_round_card_tapped', { whs_score_id: round.whsScoreId });
        // round_post_tapped
        analyticsEvents.track('round_post_tapped', {
          post_id: postId ?? null,
          notability: notability ?? null,
        });
        onTap();
      }
    : undefined;

  return (
    <div
      ref={ref}
      role={onTap ? 'button' : undefined}
      tabIndex={onTap ? 0 : undefined}
      onClick={handleTap}
      style={{ cursor: onTap ? 'pointer' : 'default', background: 'transparent' }}
    >
      <div style={{ position: 'relative' }}>
        {showCrown && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              margin: '12px 0 0 14px',
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(11,13,16,0.66)',
              border: `1px solid ${HAIRLINE}`,
              color: AMBER,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <Crown size={11} color={AMBER} aria-hidden />
            {crown?.category}
          </div>
        )}



        <div style={panelStyle}>
          {kicker && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AMBER,
              }}
            >
              {kicker}
            </div>
          )}

          {/* THE COURSE BLOCK TAKES THE FULL WIDTH (§2). The score used to sit
              on this row and squeezed the name into half of it — a long name
              like "Sundridge Park Golf Club (East Course)" then wrapped or
              truncated. The score now lives in the author row, which had empty
              space on its right and costs no height at all. */}
          <div style={{ minWidth: 0, marginTop: 6 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {courseName ?? ''}
            </div>
            {courseRegion && (
              <div style={{ fontSize: 12.5, color: MUTE, marginTop: 2 }}>{courseRegion}</div>
            )}
          </div>


          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 10,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {round.coursePar != null && (
              <span style={{ color: DIM }}>
                Par <span style={{ ...NUM, color: INK }}>{round.coursePar}</span>
              </span>
            )}
            {round.slopeRating != null && (
              <span style={{ color: DIM }}>
                Slope <span style={{ ...NUM, color: INK }}>{round.slopeRating}</span>
              </span>
            )}
            {/* INDEX MOVEMENT — arrow = direction, colour = good or bad, figure =
                magnitude. The figure is ABSOLUTE: a signed number beside an arrow
                states direction twice. Gated by the SHARED movementFor floor
                (0.05), so a 0.0 (or a 0.04 that rounds to it) renders nothing at
                all — no label, no figure, no arrow, no reserved space. */}
            {movementFor({ hcp_delta: round.deltaIndex } as CircleRoundRow) && round.deltaIndex != null && (
              <span style={{ color: DIM, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: DIM }}>Index</span>
                <span style={{ ...NUM, color: round.deltaIndex < 0 ? HCP_IMPROVING : HCP_DRIFTING, fontWeight: 700 }}>
                  {Math.abs(round.deltaIndex).toFixed(1)}
                </span>
                <IndexMovementTriangle
                  direction={round.deltaIndex < 0 ? 'down' : 'up'}
                  color={round.deltaIndex < 0 ? HCP_IMPROVING : HCP_DRIFTING}
                  size={7}
                />
              </span>
            )}
          </div>

          {hasHoles && (
            <>
              <Trajectory holes={holes} toPar={toPar} />
              <BreakdownBar holes={holes} />
              <NineGrid label="Out" holes={holes.filter((h) => h.holeNo <= 9)} />
              <NineGrid label="In" holes={holes.filter((h) => h.holeNo > 9 && h.holeNo <= 18)} />
            </>
          )}

        </div>
      </div>


      {showCrown && crown && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 13px',
            borderTop: `1px solid ${HAIRLINE}`,
            background: 'transparent',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <Crown size={13} color={AMBER} aria-hidden />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Took {crown.category} from {crown.previousHolderName}
            </span>
          </span>
          {crown.margin && (
            <span style={{ ...NUM, fontSize: 12, fontWeight: 700, color: AMBER, flexShrink: 0 }}>
              {crown.margin}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PostRoundCard;
