import React from 'react';
import { X, Crown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import { LEGEND_PALETTE, LOCKED_PALETTE, paletteForShowpiece } from '../_shared/rarityPalette';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';
import { isShowpiece } from '../_shared/showpieces';

interface Props {
  item: TrophyItem;
  index: number;
  total: number;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
}

function paletteFor(item: TrophyItem) {
  if (item.kind === 'legend') return LEGEND_PALETTE;
  const hasProgress = item.earned || (item.currentValue != null && item.currentValue > 0);
  if (!hasProgress) return LOCKED_PALETTE;
  if (isShowpiece(item.badgeId)) return paletteForShowpiece(item.reachedTier, item.badgeId);
  return LEGEND_PALETTE;
}

const RoundBtn: React.FC<{
  onClick?: (() => void) | null;
  ariaLabel: string;
  children: React.ReactNode;
}> = ({ onClick, ariaLabel, children }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    disabled={!onClick}
    onClick={onClick ?? undefined}
    style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      color: 'var(--hcp-t-100)',
      opacity: onClick ? 1 : 0.3,
      padding: 0,
    }}
  >
    {children}
  </button>
);

export const DetailHero: React.FC<Props> = ({ item, index, total, onPrev, onNext, onClose }) => {
  const palette = paletteFor(item);
  const locked =
    item.kind === 'achievement' && !item.earned && (item.currentValue == null || item.currentValue === 0);

  const pillLabel = (() => {
    if (item.kind === 'legend') {
      return item.rank === 1 ? '#1 LEGEND' : `#${item.rank}`;
    }
    return palette.label;
  })();

  return (
    <div
      style={{
        position: 'relative',
        height: 180,
        flexShrink: 0,
        background: palette.heroGradient,
        overflow: 'hidden',
        fontFamily: GAM.FONT_GEIST,
        color: 'var(--hcp-t-100)',
      }}
    >
      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -50,
          bottom: -60,
          width: 280,
          height: 280,
          transform: 'rotate(-8deg)',
          opacity: locked ? 0.05 : 0.16,
          color: palette.color,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderBadgeIcon(item.iconKey, 280, 'currentColor')}
      </div>

      {/* Top bar: prev | page | next & close */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 2,
        }}
      >
        <RoundBtn ariaLabel="Previous" onClick={onPrev}>
          <ChevronLeft size={18} />
        </RoundBtn>

        <div
          style={{
            fontSize: 10,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.08em',
            ...GAM.TABULAR,
          }}
        >
          {index + 1} / {total}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <RoundBtn ariaLabel="Next" onClick={onNext}>
            <ChevronRight size={18} />
          </RoundBtn>
          <RoundBtn ariaLabel="Close" onClick={onClose}>
            <X size={16} />
          </RoundBtn>
        </div>
      </div>

      {/* Bottom: icon tile + pill */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: palette.tint,
            border: `1px solid ${palette.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.color,
          }}
        >
          {locked ? <Lock size={26} /> : renderBadgeIcon(item.iconKey, 28, 'currentColor')}
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: palette.color,
            background: palette.tint,
            border: `1px solid ${palette.border}`,
            borderRadius: 999,
            ...GAM.TABULAR,
          }}
        >
          {item.kind === 'legend' && item.rank === 1 && <Crown size={12} />}
          {pillLabel}
        </span>
      </div>
    </div>
  );
};

export default DetailHero;
