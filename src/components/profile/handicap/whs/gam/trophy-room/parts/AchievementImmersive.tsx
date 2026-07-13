/**
 * AchievementImmersive
 *
 * Minimal full-screen detail view for non-Top-100 achievement badges.
 * Replaces the sheet flow for these items. Closes on any tap outside
 * the share icon and friends line.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import { paletteFor } from './DetailHero';
import { materialNameForTier } from '../_shared/rarityPalette';
import { SHOWPIECE_LOCKED_HINT } from '../_shared/showpieces';
import { GemLadder } from './GemLadder';
import { useFriendsWhoEarnedBadge } from '@/hooks/gam/useFriendsWhoEarnedBadge';
import { getFirstName } from '@/components/friend-sheet/parts/_shared/formatName';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'achievement' }>;
  viewerUserId: string;
  onClose: () => void;
  onShare: () => void;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '148,163,184';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

const FriendInitial: React.FC<{ name: string; size: number }> = ({ name, size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '34%',
      background: '#272C37',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.72)',
      fontSize: size * 0.42,
      fontWeight: 700,
      flexShrink: 0,
      border: '1px solid #0A0B0D',
    }}
  >
    {name.slice(0, 1).toUpperCase()}
  </div>
);

const FriendAvatar: React.FC<{ name: string; url: string | null; size: number }> = ({ name, url, size }) => {
  if (!url) return <FriendInitial name={name} size={size} />;
  return (
    <img
      src={url}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        objectFit: 'cover',
        flexShrink: 0,
        background: '#272C37',
        border: '1px solid #0A0B0D',
      }}
      loading="lazy"
    />
  );
};

export const AchievementImmersive: React.FC<Props> = ({ item, viewerUserId, onClose, onShare }) => {
  const palette = paletteFor(item);
  const materialColor = palette.color;
  const rgb = hexToRgb(materialColor.startsWith('#') ? materialColor : '#94A3B8');

  const isTiered = item.tiers.length > 1;
  const earnedTiers = item.tiers.filter((t) => t.earned).length;
  const totalTiers = item.tiers.length;
  const materialName = isTiered ? materialNameForTier(item.reachedTier) : '';
  const currentValue = item.currentValue ?? 0;
  const next = item.nextThreshold;
  const remaining = next != null ? Math.max(0, next - currentValue) : null;
  const progressPct = next != null ? Math.min(100, Math.round((currentValue / Math.max(1, next)) * 100)) : 0;

  const summary = (() => {
    if (isTiered) {
      const base = `${earnedTiers} of ${totalTiers} medals earned`;
      return item.reachedTier > 0 ? `${base} · ${materialName}` : base;
    }
    if (item.earned && item.earnedAt) {
      return `Earned ${format(new Date(item.earnedAt), 'MMM d, yyyy')}`;
    }
    return SHOWPIECE_LOCKED_HINT[item.badgeId] ?? item.description;
  })();

  const friends = useFriendsWhoEarnedBadge(item.badgeId, viewerUserId, 5);
  const friendRows = friends.data ?? [];
  const topThree = friendRows.slice(0, 3);
  const friendsLine = (() => {
    if (friendRows.length === 0) return null;
    const first = getFirstName(friendRows[0].friend_name);
    const others = friendRows.length - 1;
    if (others <= 0) return `${first} earned this`;
    return `${first} + ${others} friend${others === 1 ? '' : 's'} earned this`;
  })();

  const stop = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  const overlay = (
    <div
      role="dialog"
      aria-label={item.name}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        // Must clear: BottomSheet surface (~1401, from src/components/ui/BottomSheet.tsx),
        // Z.sheet (12003), Z.toast (12000), and Z.header (1000, ChromeIsland).
        // Kept below Z.logHud (13000) so the perf debug pill still overlays.
        zIndex: 12500,
        background: `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 32%, #0A0B0D 62%), #0A0B0D`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Share (top-right) */}
      <button
        type="button"
        aria-label="Share"
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top, 0px), 20px)',
          right: 18,
          width: 36,
          height: 36,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Share2 size={16} />
      </button>

      {/* Centred content column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Glyph */}
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: materialColor,
            filter: `drop-shadow(0 0 24px ${materialColor}66) drop-shadow(0 0 8px ${materialColor}88)`,
          }}
        >
          {renderBadgeIcon(item.iconKey, 96, materialColor, 1.4)}
        </div>

        {/* Counter (tiered only) */}
        {isTiered && (
          <div
            style={{
              fontSize: 54,
              fontWeight: 200,
              lineHeight: 1,
              color: 'rgba(255,255,255,0.98)',
              letterSpacing: '-0.03em',
              ...GAM.TABULAR,
            }}
          >
            {currentValue.toLocaleString()}
          </div>
        )}

        {/* Name */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'rgba(255,255,255,0.96)',
          }}
        >
          {item.name}
        </div>

        {/* Summary */}
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.4,
            ...GAM.TABULAR,
          }}
        >
          {summary}
        </div>

        {/* Gem ladder (tiered) */}
        {isTiered && (
          <div style={{ width: '100%' }}>
            <GemLadder tiers={item.tiers} />
          </div>
        )}

        {/* Next-medal module (tiered, not fully forged) */}
        {isTiered && next != null && remaining != null && remaining > 0 && (
          <div
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                height: 4,
                width: '100%',
                borderRadius: 2,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: materialColor,
                  borderRadius: 2,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
                ...GAM.TABULAR,
              }}
            >
              <span style={{ color: materialColor, fontWeight: 700 }}>{remaining.toLocaleString()}</span>{' '}
              more until your next medal
            </div>
          </div>
        )}

        {/* Friends line */}
        {friendsLine && (
          <div
            onClick={stop}
            onTouchStart={stop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 10px',
            }}
          >
            <div style={{ display: 'flex' }}>
              {topThree.map((f, i) => (
                <div key={f.friend_user_id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <FriendAvatar name={f.friend_name} url={f.friend_avatar_url} size={22} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{friendsLine}</div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          textAlign: 'center',
          fontSize: 10.5,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Tap anywhere to close
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
};

export default AchievementImmersive;
