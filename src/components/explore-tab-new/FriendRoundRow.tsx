import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { useTranslation } from 'react-i18next';
import { getInitialsFromName } from '@/lib/avatarFallback';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { HoleShape } from './courseled/hooks/useRoundHoleShapes';
import { RoundShape } from './courseled/RoundShape';
import {
  movementFor,
  insightFor,
  toParFor,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
} from './friendRoundParts';

/**
 * FriendRoundRow — the "Who's been playing" see-all sheet row
 * (BRIEF_WHOS_BEEN_PLAYING_SHEET §3).
 *
 * FOUR COLUMNS: avatar 34 / text / trace 96 / figures.
 *
 * THE TRACE IS THE RAIL'S OWN RENDERER at row scale — the extracted RoundShape,
 * not a second implementation — so a round drawn on the tile is drawn the same
 * way after the tap. NO HOLE DATA MEANS NO TRACE: the column collapses rather
 * than reserving space or drawing a flat line, which would be a claim about a
 * round nobody measured.
 *
 * NO AGE STAMP. The rows sit under a sticky day header ("2 days ago · 6
 * rounds"), so "2d" beside every name would be the same fact twice.
 */


const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const HAIRLINE = '#E2E8F0';

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
/** The trace, at row scale (§1.1). */
const TRACE_W = 96;
const TRACE_H = 22;


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
}

export function FriendRoundRow({ row, isLast = false, onPress, insight, shape = null }: Props) {
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
      className="w-full text-left active:bg-slate-50 transition-colors"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: ROW_MIN_HEIGHT,
        padding: ROW_PADDING,
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        cursor: onPress ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
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
        {/* LINE 1 — THE MEMBER. The whole line is theirs now that the age stamp
            has gone up into the day header. */}
        <div
          style={{
            fontSize: NAME_SIZE,
            fontWeight: 700,
            color: INK,
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
            color: SLATE_500,
            lineHeight: 1.2,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course_name ?? ''}
        </div>

        {/* LINE 3 — the analytical line: the insight, marked by its glyph. */}
        {reference && (
          <div
            className="tabular-nums"
            style={{
              marginTop: 6,
              minWidth: 0,
              display: 'flex',
              alignItems: 'baseline',
              fontSize: INSIGHT_FONT_SIZE,
              lineHeight: INSIGHT_LINE_HEIGHT,
              fontWeight: 600,
              color: SLATE_500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <InsightGlyph />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {reference}
            </span>
          </div>
        )}
      </div>

      {hasTrace && (
        <div style={{ flexShrink: 0, width: TRACE_W, height: TRACE_H }}>
          <RoundShape row={row} shape={shape} width={TRACE_W} height={TRACE_H} showMeta={false} />
        </div>
      )}

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
                color: INK,
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
              color: SLATE_400,
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
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
                color: movement.tone,
                letterSpacing: '-0.01em',
              }}
            >
              {movement.arrow} {movement.figure}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flexShrink: 0, width: SCORE_COL_W }} />
      )}

    </button>
  );
}

export default FriendRoundRow;
