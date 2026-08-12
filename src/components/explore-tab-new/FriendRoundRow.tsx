import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { useTranslation } from 'react-i18next';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { formatRelativeMonths } from '@/i18n/format';
import type { FriendRoundRow } from '@/hooks/gam/useFriendsLatestRounds';
import {
  IndexMovement,
  insightFor,
  toParFor,
  InsightGlyph,
  INSIGHT_FONT_SIZE,
  INSIGHT_LINE_HEIGHT,
} from './friendRoundParts';

/**
 * FriendRoundRow — Discover "Friends' latest rounds".
 * Custom row so we can carry an inline chip strip (hcp delta + up to two
 * feats derived from round stats) under the name. Density constants match
 * StatRow "compact" so this section sits flush with the Record Book above
 * and below.
 */


const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const HAIRLINE = '#E2E8F0';
const LAUREL_INK = '#0e8a57'; // hcp drop = green
const RED = '#D2222D';         // hcp rise = red

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


interface Props {
  row: FriendRoundRow;
  isLast?: boolean;
  onPress?: () => void;
  /**
   * Pre-resolved insight from buildInsightMap. Passed by list surfaces so the
   * repetition cap applies down the whole list; omitted, the row resolves its
   * own rarest true line.
   */
  insight?: string | null;
}

export function FriendRoundRow({ row, isLast = false, onPress, insight }: Props) {
  const {
    display_name,
    profile_photo_url,
    user_id,
    play_date,
    course_name,
    gross,
  } = row;



  const { t } = useTranslation('courses');
  const relative = formatRelativeMonths(play_date);
  const toPar = toParFor(row);
  const reference = insight !== undefined ? insight : insightFor(row, t as never)?.text ?? null;



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
        {/* LINE 1 — IDENTITY. The index movement is a fact about the PERSON, not
            about this round, so it ends this line: fixed x on every row whatever
            the insight below does. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            minWidth: 0,
          }}
        >
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
              flex: '0 1 auto',
            }}
          >
            {display_name}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: SLATE_400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {relative}
          </div>
          <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <IndexMovement row={row} />
          </span>
        </div>

        <div
          style={{
            marginTop: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: SUBLINE_SIZE,
            fontWeight: 600,
            color: SLATE_500,
            lineHeight: 1.2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {course_name ?? ''}
          </span>
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
            }}
          >
            <InsightGlyph />
            <span style={{ minWidth: 0 }}>{reference}</span>
          </div>
        )}
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
        </div>
      ) : (
        <div style={{ flexShrink: 0, width: SCORE_COL_W }} />
      )}

    </button>
  );
}

export default FriendRoundRow;
