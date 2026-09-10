/**
 * CircleRow — THE ONE circle-leaderboard row, used by BOTH the handicap page's
 * CircleSection and the see-all FullLeaderboardSheet.
 *
 * The page's inline markup was the correct starting point and was MOVED here,
 * not rewritten: every settled treatment travels with it —
 *
 *   position 16px . 30px avatar (radius 9) . name 14/600 . club 11/DIM single
 *   line with ellipsis . index right 16 tabular. Hairline between rows, none
 *   above the first.
 *
 * AMBER TEXT ONLY for the viewing member — position, name and figure. There is
 * no tinted band, no bleed margin and no highlight box: the sheet's row used to
 * apply all three, which is three treatments doing one job.
 *
 * NO RANK-MOVEMENT COLUMN. The 26px chip slot rendered nothing on held
 * positions, unknown deltas and every stale row, so its "30D RANK" header read
 * as a label for the index column beside it. One labelled quantity, sorted on
 * that quantity.
 *
 * THE FLAME stays and is the only thing on this list about form rather than
 * standing: index improved by half a shot or more over 30 days
 * (handicap_30d_delta <= -0.5). It is labelled by CircleFlameLegend, which
 * renders only when a flame is on screen.
 *
 * Tones are the CHART literals, so this renders identically on the page and
 * inside a portalled BottomSheet (no var(--hcp-*) dependency).
 */
import React, { useState } from 'react';
import { CHART } from '../../charts/tokens';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

const FIG: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

/** Half a shot or better over 30 days, and never on a stale row. */
export function hasFlame(entry: FriendLeaderboardEntry, stale = false): boolean {
  return !stale && entry.handicap_30d_delta != null && entry.handicap_30d_delta <= -0.5;
}

export const FlameIcon: React.FC<{ size?: number }> = ({ size = 11 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={CHART.AMBER}
    aria-hidden
    style={{ flexShrink: 0 }}
  >
    <path d="M12 2c.4 3 2 5 4 7 2 2 3 4 3 7a7 7 0 1 1-14 0c0-2 1-4 2-5 0 2 1 3 2 3 0-3 1-7 3-12Z" />
  </svg>
);

/** ONE line beneath the list. Callers render it only when a flame is on screen. */
export const CircleFlameLegend: React.FC<{ label: string }> = ({ label }) => (
  <p
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      margin: '10px 0 0',
      fontSize: 11,
      color: CHART.DIM,
      lineHeight: 1.4,
    }}
  >
    <FlameIcon />
    <span>{label}</span>
  </p>
);

const StalePill: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      background: 'rgba(247,147,30,0.14)',
      color: '#854F0B',
      padding: '1px 5px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.14em',
      flexShrink: 0,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

export interface CircleRowProps {
  entry: FriendLeaderboardEntry;
  /** 1-based position in the active cohort. null renders an empty cell. */
  position: number | null;
  /** Already-resolved club string (see useCircleClubs). */
  club: string | null;
  /** Label used in place of the member's own name. */
  selfLabel: string;
  /** First row in a list draws no rule above itself. */
  isFirst?: boolean;
  /** Omit to render an inert row (no button, no pointer). */
  onPress?: () => void;
  /** Inactive rows: 0.6 opacity and a STALE pill before the club. */
  stale?: boolean;
  /** Copy for the stale pill. Only read when `stale`. */
  staleLabel?: string;
}

export const CircleRow: React.FC<CircleRowProps> = ({
  entry,
  position,
  club,
  selfLabel,
  isFirst = false,
  onPress,
  stale = false,
  staleLabel = 'STALE',
}) => {
  const isYou = entry.is_self;
  const name = isYou ? selfLabel : reformatFriendName(entry.friend_name);
  const avatarSrc = pickAvatarSrc(entry.friend_thumbnail_url, entry.friend_profile_photo_url);
  const flame = hasFlame(entry, stale);
  const tappable = !!onPress;
  const Tag: React.ElementType = tappable ? 'button' : 'div';

  return (
    <Tag
      type={tappable ? 'button' : undefined}
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '11px 0',
        background: 'none',
        border: 'none',
        borderTop: isFirst ? 'none' : `1px solid ${CHART.BORDER}`,
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
        opacity: stale ? 0.6 : 1,
        cursor: tappable ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          width: 16,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
          color: isYou ? CHART.AMBER : CHART.DIM,
          ...FIG,
        }}
      >
        {position ?? ''}
      </span>

      {/* 30px avatar, radius 9. A broken source used to leave an empty square
          because the initials only render when the source is absent; onError
          drops back to the initials instead. */}
      <Avatar
        src={avatarSrc}
        name={entry.friend_name}
        seed={entry.friend_user_id ?? entry.friend_row_id ?? entry.friend_name}
      />

      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              minWidth: 0,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: isYou ? CHART.AMBER : CHART.INK,
              overflowWrap: 'anywhere',
            }}
          >
            {name}
          </span>
          {flame && <FlameIcon />}
        </span>
        {(club || stale) && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 2,
              fontSize: 11,
              color: CHART.DIM,
              lineHeight: 1.35,
              minWidth: 0,
            }}
          >
            {stale && <StalePill label={staleLabel} />}
            <span
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {club ?? ''}
            </span>
          </span>
        )}
      </span>

      <span
        style={{
          flexShrink: 0,
          fontSize: 16,
          fontWeight: 700,
          color: isYou ? CHART.AMBER : CHART.INK,
          ...FIG,
        }}
      >
        {fmtHcp(entry.friend_handicap_index)}
      </span>
    </Tag>
  );
};

/** Initials are the fallback for BOTH an absent source and a failed load. */
const Avatar: React.FC<{ src: string | null; name: string; seed: string }> = ({ src, name, seed }) => {
  const [failed, setFailed] = useState(false);
  const showImg = !!src && !failed;
  return (
    <span
      style={{
        position: 'relative',
        width: 30,
        height: 30,
        borderRadius: 9,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: showImg ? CHART.PANEL_2 : getAvatarFallbackGradient(seed),
        color: CHART.INK,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {showImg ? (
        <img
          src={src as string}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{getInitialsFromName(name) || '?'}</span>
      )}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          border: '1px solid rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};

export default CircleRow;
