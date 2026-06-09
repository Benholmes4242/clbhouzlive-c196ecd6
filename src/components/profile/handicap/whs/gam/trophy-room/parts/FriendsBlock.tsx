import React from 'react';
import { GAM } from '../../tokens';
import { relativeTime } from '@/lib/gam/visuals';
import { useFriendsWhoEarnedBadge } from '@/hooks/gam/useFriendsWhoEarnedBadge';
import { useFriendsWhoHeldLegend } from '@/hooks/gam/useFriendsWhoHeldLegend';
import { MATERIAL_PALETTES } from '../_shared/rarityPalette';
import type { LegendCategory } from '@/lib/gam/types';

interface Props {
  badgeId?: string;
  legendCategory?: LegendCategory;
  legendCourseId?: string;
  viewerUserId: string;
}

const SectionHeader: React.FC<{ label: string; action?: { label: string; onClick: () => void } }> = ({
  label,
  action,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--hcp-t-60)',
      }}
    >
      {label}
    </div>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: GAM.AMBER,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {action.label}
      </button>
    )}
  </div>
);

const FriendInitial: React.FC<{ name: string; size?: number }> = ({ name, size = 32 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '34%',
      background: 'var(--hcp-bg-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--hcp-t-80)',
      fontSize: size * 0.4,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    {name.slice(0, 1).toUpperCase()}
  </div>
);

const FriendAvatar: React.FC<{ name: string; url: string | null; size?: number }> = ({ name, url, size }) => {
  if (!url) return <FriendInitial name={name} size={size} />;
  return (
    <img
      src={url}
      alt={name}
      style={{
        width: size ?? 32,
        height: size ?? 32,
        borderRadius: '34%',
        objectFit: 'cover',
        flexShrink: 0,
        background: 'var(--hcp-bg-3)',
      }}
      loading="lazy"
    />
  );
};

const TierBadge: React.FC<{ tier: number }> = ({ tier }) => {
  const idx = Math.max(1, Math.min(5, tier)) as 1 | 2 | 3 | 4 | 5;
  const pal = MATERIAL_PALETTES[idx];
  return (
    <div
      style={{
        flexShrink: 0,
        minWidth: 22,
        height: 22,
        padding: '0 7px',
        borderRadius: 7,
        background: pal.tint,
        border: `0.5px solid ${pal.border}`,
        color: pal.color,
        fontSize: 11,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
      }}
      aria-label={`Tier ${tier}`}
    >
      T{tier}
    </div>
  );
};

const FriendRowAchievement: React.FC<{ name: string; url: string | null; earnedAt: string; tier: number | null }> = ({
  name,
  url,
  earnedAt,
  tier,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0',
      borderBottom: '0.5px solid var(--hcp-line)',
    }}
  >
    <FriendAvatar name={name} url={url} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-100)' }}>{name}</div>
      <div style={{ fontSize: 10.5, color: 'var(--hcp-t-60)', ...GAM.TABULAR }}>{relativeTime(earnedAt)}</div>
    </div>
    {tier != null && tier >= 1 && <TierBadge tier={tier} />}
  </div>
);

const FriendRowLegend: React.FC<{ name: string; url: string | null; rank: number; value: number }> = ({
  name,
  url,
  rank,
  value,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 0',
      borderBottom: '0.5px solid var(--hcp-line)',
    }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        background: 'var(--hcp-bg-2)',
        color: 'var(--hcp-t-80)',
        fontSize: 10,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...GAM.TABULAR,
      }}
    >
      #{rank}
    </div>
    <FriendAvatar name={name} url={url} size={28} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--hcp-t-100)' }}>{name}</div>
    </div>
    <div style={{ fontSize: 12, color: 'var(--hcp-t-80)', fontWeight: 700, ...GAM.TABULAR }}>{value}</div>
  </div>
);

const FriendsSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          height: 44,
          background: 'var(--hcp-line)',
          borderRadius: 10,
          animation: 'gamPulse 1.6s ease-in-out infinite',
        }}
      />
    ))}
  </div>
);

export const FriendsBlock: React.FC<Props> = ({ badgeId, legendCategory, legendCourseId, viewerUserId }) => {
  const [expanded, setExpanded] = React.useState(false);
  const badgeQuery = useFriendsWhoEarnedBadge(badgeId, badgeId ? viewerUserId : undefined, 20);
  const legendQuery = useFriendsWhoHeldLegend(
    legendCategory,
    legendCourseId,
    legendCategory && legendCourseId ? viewerUserId : undefined,
    20,
  );

  const isBadge = Boolean(badgeId);
  const isLoading = isBadge ? badgeQuery.isLoading : legendQuery.isLoading;

  if (isLoading) {
    return (
      <div>
        <SectionHeader label="FRIENDS WHO EARNED IT" />
        <FriendsSkeleton />
      </div>
    );
  }

  if (isBadge) {
    const rows = badgeQuery.data ?? [];
    if (rows.length === 0) {
      return (
        <div>
          <SectionHeader label="FRIENDS WHO EARNED IT" />
          <div style={{ fontSize: 12, color: 'var(--hcp-t-60)', lineHeight: 1.5 }}>
            No friends have earned this yet — be the first to share.
          </div>
        </div>
      );
    }
    const shown = expanded ? rows : rows.slice(0, 3);
    return (
      <div>
        <SectionHeader
          label={`FRIENDS WHO EARNED IT · ${rows.length}`}
          action={rows.length > 3 && !expanded ? { label: 'SEE ALL', onClick: () => setExpanded(true) } : undefined}
        />
        {shown.map((f) => (
          <FriendRowAchievement
            key={f.friend_user_id}
            name={f.friend_name}
            url={f.friend_avatar_url}
            earnedAt={f.earned_at}
            tier={f.friend_tier}
          />
        ))}
      </div>
    );
  }

  const rows = legendQuery.data ?? [];
  if (rows.length === 0) {
    return (
      <div>
        <SectionHeader label="YOUR CHASERS" />
        <div style={{ fontSize: 12, color: 'var(--hcp-t-60)', lineHeight: 1.5 }}>
          No friends are ranked at this course yet.
        </div>
      </div>
    );
  }
  const shown = expanded ? rows : rows.slice(0, 3);
  return (
    <div>
      <SectionHeader
        label={`YOUR CHASERS · ${rows.length}`}
        action={rows.length > 3 && !expanded ? { label: 'SEE ALL', onClick: () => setExpanded(true) } : undefined}
      />
      {shown.map((f) => (
        <FriendRowLegend
          key={f.friend_user_id}
          name={f.friend_name}
          url={f.friend_avatar_url}
          rank={f.rank}
          value={f.value}
        />
      ))}
    </div>
  );
};

export default FriendsBlock;
