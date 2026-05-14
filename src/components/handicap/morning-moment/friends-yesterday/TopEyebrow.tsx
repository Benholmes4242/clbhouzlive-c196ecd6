import React from 'react';
import { BadgeCheck, Trophy } from 'lucide-react';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { firstNameOf } from './deriveHeroState';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  friend: FriendYesterday;
  variant: 'hero' | 'mini';
  rightPill: 'best' | 'rank' | null;
  rank?: number;
}

export const TopEyebrow: React.FC<Props> = ({ friend, variant, rightPill, rank }) => {
  const isHero = variant === 'hero';
  const avatarSize = isHero ? 28 : 22;
  const nameSize = isHero ? 16 : 13;
  const badgeSize = isHero ? 13 : 11;
  const initial = firstNameOf(friend.name).slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        position: 'absolute',
        top: isHero ? 12 : 8,
        left: isHero ? 14 : 10,
        right: isHero ? 14 : 10,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: '34%',
            overflow: 'hidden',
            border: '0.5px solid rgba(255,255,255,0.25)',
            background: friend.thumbnail_url
              ? 'rgba(15,23,42,0.06)'
              : 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {friend.thumbnail_url ? (
            <img
              src={friend.thumbnail_url}
              alt={friend.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: isHero ? 10 : 9, fontWeight: 800, color: '#FFFFFF' }}>
              {initial}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: nameSize,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          {firstNameOf(friend.name)}
        </p>
        {friend.is_clbhouz_user && (
          <span aria-label="Verified Clbhouz user" style={{ display: 'inline-flex', flexShrink: 0 }}>
            <BadgeCheck size={badgeSize} strokeWidth={2.5} color="#FFFFFF" fill="#16A34A" />
          </span>
        )}
      </div>

      {rightPill === 'best' && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(251,188,46,0.30) 0%, rgba(247,147,30,0.30) 100%)',
            border: '0.5px solid rgba(251,188,46,0.55)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: '#FCE38A',
            textTransform: 'uppercase',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <Trophy size={10} strokeWidth={2.5} color="#FCE38A" />
          BEST OF GROUP
        </span>
      )}
      {rightPill === 'rank' && rank != null && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 7px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            fontSize: 10,
            fontWeight: 700,
            color: '#FFFFFF',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>
      )}
    </div>
  );
};

export default TopEyebrow;
