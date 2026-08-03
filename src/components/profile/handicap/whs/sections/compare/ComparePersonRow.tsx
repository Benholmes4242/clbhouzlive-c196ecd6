/**
 * ComparePersonRow - one selectable player in the compare sheet's list state.
 *
 * Avatar, name, two LABEL lines (when + last course, then the shared-round
 * standing), their index as a FIGURE, then a chevron.
 *
 * The shared-round count is fetched by the ROW, not the list, so only mounted
 * rows cost a query and the list stays cheap.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { useSharedRounds } from '@/lib/whs/hooks';
import { formatRelativeAgo } from '@/i18n/format';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  viewerUserId: string;
  entry: FriendLeaderboardEntry;
  onSelect: (targetUserId: string, sharedRounds: number) => void;
}

export const ComparePersonRow: React.FC<Props> = ({
  viewerUserId,
  entry,
  onSelect,
}) => {
  const { t } = useTranslation('common');
  const targetUserId = entry.friend_user_id;
  const { data: shared } = useSharedRounds(viewerUserId, targetUserId);
  const sharedCount = shared?.shared_rounds_count ?? 0;

  const avatarSrc = pickAvatarSrc(
    entry.friend_thumbnail_url,
    entry.friend_profile_photo_url,
  );
  const fbBg = getAvatarFallbackColor(
    targetUserId ?? entry.friend_row_id ?? entry.friend_name,
  );

  const when = entry.last_round_played_at
    ? formatRelativeAgo(entry.last_round_played_at, { yesterday: true })
    : '';
  const course = entry.last_round_course_name ?? '';
  const contextLine = [when, course].filter(Boolean).join(' . ');

  return (
    <button
      type="button"
      disabled={!targetUserId}
      onClick={() => targetUserId && onSelect(targetUserId, sharedCount)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        background: 'none',
        border: 'none',
        borderTop: `1px solid ${CHART.BORDER}`,
        textAlign: 'left',
        cursor: targetUserId ? 'pointer' : 'default',
        fontFamily: CHART_FONT,
        opacity: targetUserId ? 1 : 0.5,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 33,
          height: 33,
          borderRadius: '34%',
          overflow: 'hidden',
          background: avatarSrc ? CHART.PANEL_2 : fbBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: CHART.INK,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{getInitialsFromName(entry.friend_name) || '?'}</span>
        )}
        {/* Canonical traced hairline ring - dark surface token. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: '1px solid rgba(255,255,255,0.22)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: CHART.INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entry.friend_name}
        </div>
        {contextLine && (
          <div
            style={{
              ...LABEL_STYLE,
              marginTop: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {contextLine}
          </div>
        )}
        <div style={{ ...LABEL_STYLE, marginTop: 3, color: CHART.MUTE }}>
          {sharedCount > 0
            ? t('handicap.compare.sharedRounds', { count: sharedCount })
            : t('handicap.compare.neverPlayed')}
        </div>
      </div>

      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: CHART.INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
          flexShrink: 0,
        }}
      >
        {entry.friend_handicap_index != null
          ? entry.friend_handicap_index.toFixed(1)
          : '-'}
      </span>
      <ChevronRight
        size={15}
        strokeWidth={2.2}
        color={CHART.DIM}
        style={{ flexShrink: 0 }}
      />
    </button>
  );
};

export default ComparePersonRow;
