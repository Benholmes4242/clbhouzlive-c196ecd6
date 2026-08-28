import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { useTranslation } from 'react-i18next';
import { getInitialsFromName } from '@/lib/avatarFallback';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape } from './courseled/hooks/useRoundHoleShapes';
import { TrajectoryLine } from '@/features/courses/_shared/scorecard/TrajectoryLine';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ReactionAction, ReactionSlot } from './courseled/ReactionAction';
import {
  movementFor,
  insightFor,
  toParFor,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
  IndexMovementTriangle,
} from './friendRoundParts';

/**
 * FriendRoundRow — the "Who's been playing" see-all sheet row
 * (BRIEF_WHOS_BEEN_PLAYING_SHEET §3).
 *
 * TWO ROWS: avatar / identity / figures, then insight / trace. At the narrowest
 * supported viewport the old four-column row left only 52px for all three text
 * lines, so the meaning of every insight was clipped away.
 *
 * THE TRACE IS THE CANONICAL SCORECARD TrajectoryLine at row scale, imported
 * directly so the graded stroke, earned-red fill and gold-only beads cannot
 * drift. NO HOLE DATA MEANS NO TRACE: the column collapses rather
 * than reserving space or drawing a flat line, which would be a claim about a
 * round nobody measured.
 *
 * NO AGE STAMP. The rows sit under a sticky day header ("2 days ago · 6
 * rounds"), so "2d" beside every name would be the same fact twice.
 */


// Compact density (canonical Discover/Champions).
const ROW_MIN_HEIGHT = 56;
const ROW_PADDING = '13px 16px';
const AVATAR_SIZE = 34;
const NAME_SIZE = 13.5;
const SUBLINE_SIZE = 12;
const STAT_VALUE_SIZE = 21;
const STAT_LABEL_SIZE = 6.5;
/** Fixed score column: with no separators the grid is what aligns the sheet. */
const SCORE_COL_W = 76;
/** The trace, at row scale (§1.1). Width unchanged; the band is TALLER
    (CORRECTION_SHEET_TRACE_HEIGHT §1) — 22px could not tell a -3 from a +14,
    which is the same finding FriendsPlayedRail already recorded. The row grows
    with it (§3): text and avatar are NOT compressed to hold 56px. */
const TRACE_W = 96;
const TRACE_H = 38;


interface Props {
  row: CircleRoundRow;
  isLast?: boolean;
  onPress?: () => void;
  /**
   * Pre-resolved insight from buildInsightMap. Passed by list surfaces so the
   * repetition cap applies down the whole list; omitted, the row resolves its
   * own rarest true line.
   */
  insight?: string | null;
  /**
   * Hole shape from the SHEET-LEVEL batched read (useRoundHoleShapes). Never
   * fetched per row — thirty rows would be thirty queries.
   */
  shape?: HoleShape | null;
  /**
   * OPTIONAL REACTION CONTROL (BRIEF_DISCOVER_LOOSE_ENDS §S2). Supplied by the
   * Recent-rounds see-all sheet so a round carries the same heart it carries on
   * the rail one tap up. Omitted, the row renders exactly as before — the trailing
   * slot is not even present, so surfaces without reactions keep their geometry.
   * The slot is fixed-width and the glyph's 44px target is absorbed by negative
   * margins, so ROW HEIGHT IS IDENTICAL at counts 0, 1 and 3 digits (§2.6).
   */
  reaction?: {
    count: number;
    mine: boolean;
    hidden: boolean;
    readOnly: boolean;
    label: string;
    onToggle: () => void;
  } | null;
}

export function FriendRoundRow({ row, isLast = false, onPress, insight, shape = null, reaction = null }: Props) {
  const {
    display_name,
    profile_photo_url,
    user_id,
    course_name,
    gross,
  } = row;



  const { t } = useTranslation('courses');
  const toPar = toParFor(row);
  const reference = insight !== undefined ? insight : insightFor(row, t as never)?.text ?? null;
  /* THE HANDICAP DELTA IS A MOVEMENT, NOT A SCORE (§3.5). Green for a drop and
     red for a rise here does NOT collide with the under-par RED in the figure
     beside it: a score's axis is to-par (under par is red because it is good
     golf), a delta's axis is direction of travel (down is better). Both live in
     this row and both are correct. movementFor already encodes the sign
     convention: negative hcp_delta = the handicap dropped = good. */
  const movement = movementFor(row);
  /* NO SHAPE, NO TRACE — and no reserved column either (§1.4). */
  const hasTrace = Boolean(shape);



  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left transition-colors"
      style={{
        display: 'block',
        width: '100%',
        minHeight: ROW_MIN_HEIGHT,
        padding: ROW_PADDING,
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${A.BORDER}`,
        cursor: onPress ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>
          <SquircleAvatar
            size={AVATAR_SIZE}
            srcCandidates={profile_photo_url ? [profile_photo_url] : []}
            alt={display_name}
            fallback={getInitialsFromName(display_name)}
            userId={user_id ?? undefined}
            hairlineRing
          />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: NAME_SIZE,
              fontWeight: 700,
              color: A.INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {display_name}
          </div>

          <div
            style={{
              marginTop: 3,
              fontSize: SUBLINE_SIZE,
              fontWeight: 600,
              color: A.INK,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {course_name ?? ''}
          </div>
        </div>

        {gross != null ? (
          <div
            style={{
              flexShrink: 0,
              width: SCORE_COL_W,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div
                className="tabular-nums"
                style={{
                  fontSize: STAT_VALUE_SIZE,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: A.INK,
                  letterSpacing: '-0.03em',
                }}
              >
                {gross}
              </div>
              {toPar && (
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: toPar.tone,
                  }}
                >
                  {toPar.text}
                </div>
              )}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: STAT_LABEL_SIZE,
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: A.MUTE,
                lineHeight: 1,
              }}
            >
              {row.course_par != null ? `PAR ${row.course_par}` : 'GROSS'}
            </div>
            {movement && (
              <div
                className="tabular-nums"
                style={{
                  marginTop: 5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: movement.tone,
                  letterSpacing: '-0.01em',
                }}
              >
                <IndexMovementTriangle
                  direction={movement.arrow === '\u2193' ? 'down' : 'up'}
                  color={movement.tone}
                  size={7}
                />
                <span>{movement.figure}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flexShrink: 0, width: SCORE_COL_W }} />
        )}

        {reaction && !reaction.hidden && (
          <ReactionSlot>
            <ReactionAction
              count={reaction.count}
              reacted={reaction.mine}
              readOnly={reaction.readOnly}
              onToggle={reaction.onToggle}
              label={reaction.label}
            />
          </ReactionSlot>
        )}
      </div>

      {(reference || hasTrace) && (
        <div
          style={{
            marginTop: 7,
            marginLeft: AVATAR_SIZE + 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
          }}
        >
          {reference && (
            <div
              className="tabular-nums"
              style={{
                minWidth: 0,
                flex: 1,
                display: 'flex',
                alignItems: 'baseline',
                fontSize: INSIGHT_FONT_SIZE,
                lineHeight: INSIGHT_LINE_HEIGHT,
                fontWeight: 600,
                color: A.INK,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <InsightGlyph />
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {reference}
              </span>
            </div>
          )}
          {hasTrace && shape && (
            <div style={{ flexShrink: 0, width: TRACE_W, height: TRACE_H }}>
              <TrajectoryLine
                holes={shape.holes}
                surface="dark"
                height={TRACE_H}
                viewWidth={TRACE_W}
                showTicks={false}
                padY={0}
              />
            </div>
          )}
        </div>
      )}

    </button>
  );
}

export default FriendRoundRow;
