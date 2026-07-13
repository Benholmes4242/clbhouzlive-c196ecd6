/**
 * Top100Immersive
 *
 * Full-screen portalled overlay for Top-100 achievement badges. Replaces
 * the last remaining GamSheet flow in the trophy-room detail apparatus.
 * Hero zone uses the same bloom grammar as AchievementImmersive; the
 * scroll region embeds the existing Top100Body unchanged (its played /
 * unplayed tabs, course rows, and MatchRequestSheet wiring all come with
 * it).
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import { paletteFor } from './DetailHero';
import { materialNameForTier } from '../_shared/rarityPalette';
import { GemLadder } from './GemLadder';
import { Top100Body } from './Top100Body';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';

interface Props {
  item: Extract<TrophyItem, { kind: 'achievement' }>;
  ownerUserId: string;
  viewerUserId: string;
  onClose: () => void;
  onShare?: () => void;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '148,163,184';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export const Top100Immersive: React.FC<Props> = ({
  item,
  ownerUserId,
  viewerUserId,
  onClose,
  onShare,
}) => {
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

  const summary = isTiered
    ? `${earnedTiers} of ${totalTiers} medals earned . ${materialName || 'Bronze'}`
    : item.description;

  const stop = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation();

  const overlay = (
    <div
      role="dialog"
      aria-label={item.name}
      style={{
        position: 'fixed',
        inset: 0,
        // Must clear: BottomSheet surface (~1401, src/components/ui/BottomSheet.tsx),
        // Z.sheet (12003), Z.toast (12000), Z.header (1000, ChromeIsland).
        // MatchRequestSheet is intentionally set to 12600 so it clears this layer.
        zIndex: 12500,
        background: `radial-gradient(ellipse 120% 90% at 50% 16%, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 32%, #0A0B0D 62%), #0A0B0D`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* TOP CHROME - fixed, above everything */}
      <div
        style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top, 0px), 20px)',
          right: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 2,
        }}
      >
        {onShare && (
          <button
            type="button"
            aria-label="Share"
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            style={ROUND_BTN}
          >
            <Share2 size={16} />
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={ROUND_BTN}
        >
          <X size={16} />
        </button>
      </div>

      {/* SCROLL REGION - contains hero + Top100Body */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* HERO ZONE - tap closes */}
        <div
          onClick={onClose}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
            padding: '72px 24px 24px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
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

          <div
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.4,
              maxWidth: 360,
              ...GAM.TABULAR,
            }}
          >
            {summary}
          </div>

          {isTiered && (
            <div style={{ width: '100%', maxWidth: 360 }}>
              <GemLadder tiers={item.tiers} />
            </div>
          )}

          {isTiered && next != null && remaining != null && remaining > 0 && (
            <div
              style={{
                width: '100%',
                maxWidth: 360,
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
                <span style={{ color: materialColor, fontWeight: 700 }}>
                  {remaining.toLocaleString()}
                </span>{' '}
                more until your next medal
              </div>
            </div>
          )}
        </div>

        {/* SCROLL BODY - Top100Body unchanged; taps do NOT close */}
        <div onClick={stop} onTouchStart={stop}>
          <Top100Body
            item={item}
            ownerUserId={ownerUserId}
            viewerUserId={viewerUserId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(overlay, document.body) : null;
};

const ROUND_BTN: React.CSSProperties = {
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
};

export default Top100Immersive;
