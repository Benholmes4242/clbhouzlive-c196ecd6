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
import { Crown } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { ScoreMark } from '@/features/courses/_shared/ScoreMark';
import { beadForScore } from '@/features/courses/_shared/beadForScore';
import { formatWeekdayShortGB, formatDayMonthShortGB } from '@/i18n/format';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

const INK = '#F4F7F9';
const MUTE = 'rgba(255,255,255,0.62)';
const DIM = 'rgba(255,255,255,0.40)';
const AMBER = '#F7931E';
const GREEN = INDEX_DELTA.dark.improved;
const RED = '#FF6B60';
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
  return n < 0 ? RED : MUTE;
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

const LabelRow: React.FC<{ label: string; total: number | null; toPar: number | null }> = ({
  label,
  total,
  toPar,
}) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: DIM,
      }}
    >
      {label}
    </span>
    {total == null ? null : (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ ...NUM, fontSize: 13.5, fontWeight: 700, color: INK }}>{total}</span>
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
const HoleGap: React.FC<{ size?: number }> = ({ size = 27 }) => (
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
const HoleNotPlayed: React.FC<{ size?: number }> = ({ size = 27 }) => (
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
      total += h.gross;
      par += h.par;
      any = true;
    }
  }
  const showTotals = any && !hasGap;
  return (
    <div style={{ marginTop: 12 }}>
      <LabelRow
        label={label}
        total={showTotals ? total : null}
        toPar={showTotals ? total - par : null}
      />
      <div style={{ display: 'flex', gap: 3 }}>
        {holes.map((h) => (
          <div
            key={h.holeNo}
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <span style={{ ...NUM, fontSize: 9, fontWeight: 700, color: DIM, lineHeight: 1.2 }}>
              {h.holeNo}
            </span>
            <span
              style={{ ...NUM, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.26)', lineHeight: 1.3 }}
            >
              {h.par ?? '·'}
            </span>
            {!h.played ? (
              <HoleNotPlayed />
            ) : h.gross == null ? (
              <HoleGap />
            ) : (
              <ScoreMark strokes={h.gross} par={h.par ?? 4} size={27} surface="dark" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const Trajectory: React.FC<{ holes: Hole[]; toPar: number | null }> = ({ holes, toPar }) => {
  // Beads come from the shared beadForScore helper — one rule across the sheet
  // trajectory and this one (CORRECTION_ONE_SCORING_MARK §5).
  //
  // §4.2/§4.3 — THE LINE STOPS AT THE FIRST GAP. A cumulative to-par line has no
  // honest continuation past a hole with no score: the running total after the
  // gap is unknown by exactly the missing stroke count, so a resumed segment
  // would sit at a position the member never held. We therefore draw only the
  // segment up to the gap and stop. No bridge, no dot on the missing hole.
  const { pts, truncated } = useMemo(() => {
    let cum = 0;
    const out: { i: number; cum: number; bead: { tone: string; radius: number } | null }[] = [];
    let cut = false;
    holes.forEach((h, idx) => {
      if (cut) return;
      // A NOT-PLAYED hole adds no strokes and no par — the line carries
      // straight past it, no point plotted, no cut.
      if (!h.played) return;
      if (h.gross == null || h.par == null) {
        cut = true;
        return;
      }
      cum += h.gross - h.par;
      out.push({ i: idx, cum, bead: beadForScore(h.gross, h.par, 'dark') });
    });
    return { pts: out, truncated: cut };
  }, [holes]);

  if (pts.length < 2) return null;


  const w = 320;
  const height = 74;
  const padX = 5;
  const maxAbs = Math.max(...pts.map((p) => Math.abs(p.cum)), 1);
  // Hole-index space, not point-index space: a truncated line must occupy only
  // the part of the axis it actually covers.
  const n = Math.max(holes.length, 2);
  const x = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
  const y0 = height / 2;
  const y = (c: number) => y0 - (c / maxAbs) * (height / 2 - 10);
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.i).toFixed(1)},${y(p.cum).toFixed(1)}`)
    .join(' ');
  // §4.4 — with a gap the line's last point is NOT the round's to-par, so the
  // heading figure falls back to the score row. Complete rounds are unchanged.
  const final = truncated ? toPar : pts[pts.length - 1].cum;


  return (
    <div
      style={{
        marginTop: 12,
        borderRadius: 14,
        padding: '12px 14px 10px',
        border: `1px solid ${HAIRLINE}`,
        background: 'rgba(11,13,16,0.66)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: DIM,
          }}
        >
          Trajectory
        </span>
        <span style={{ ...NUM, fontSize: 12, fontWeight: 700, color: toParColor(final) }}>
          {fmtToPar(final)}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }} aria-hidden>
        <line
          x1={padX}
          x2={w - padX}
          y1={y0}
          y2={y0}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <path
          d={path}
          fill="none"
          stroke={INK}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p) =>
          p.bead ? (
            <circle
              key={p.i}
              cx={x(p.i)}
              cy={y(p.cum)}
              r={p.bead.radius}
              fill={p.bead.tone}
              stroke="#0B0D10"
              strokeWidth={1.5}
            />
          ) : null,
        )}
      </svg>
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
    padding: '14px 14px 16px',
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
              fontSize: 9.5,
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
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: AMBER,
              }}
            >
              {kicker}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 6,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 16,
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
                <div style={{ fontSize: 11.5, color: MUTE, marginTop: 2 }}>{courseRegion}</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexShrink: 0 }}>
              <span
                style={{
                  ...NUM,
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: '#FFFFFF',
                  lineHeight: 1,
                }}
              >
                {gross ?? '—'}
              </span>
              <span style={{ ...NUM, fontSize: 15, fontWeight: 700, color: toParColor(toPar) }}>
                {fmtToPar(toPar)}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 10,
              fontSize: 10.5,
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
            {round.deltaIndex != null && (
              <span style={{ color: DIM, marginLeft: 'auto' }}>
                Index{' '}
                <span style={{ ...NUM, color: round.deltaIndex < 0 ? GREEN : INK }}>
                  {round.deltaIndex > 0 ? '+' : ''}
                  {round.deltaIndex.toFixed(1)}
                </span>
              </span>
            )}
          </div>

          {hasHoles && (
            <>
              <Trajectory holes={holes} toPar={toPar} />
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
            padding: '10px 14px',
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
