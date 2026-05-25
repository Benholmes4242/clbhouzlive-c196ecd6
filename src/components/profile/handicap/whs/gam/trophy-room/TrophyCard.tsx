import React from 'react';
import { Lock } from 'lucide-react';
import { renderBadgeIcon } from '../badgeIcons';
import { GAM } from '../tokens';
import { RARITY_PALETTE, LEGEND_PALETTE, LOCKED_PALETTE, type RarityPalette } from './_shared/rarityPalette';
import type { TrophyItem } from './_shared/normalizeTrophyItem';

interface Props {
  item: TrophyItem;
  onTap: (item: TrophyItem) => void;
}

function paletteFor(item: TrophyItem): RarityPalette {
  if (item.kind === 'legend') return LEGEND_PALETTE;
  if (!item.earned && (item.currentValue == null || item.currentValue === 0)) return LOCKED_PALETTE;
  return RARITY_PALETTE[item.rarity];
}

function metaLine(item: TrophyItem): string {
  if (item.kind === 'legend') {
    return item.rank === 1 ? `#1 · ${item.formattedValue}` : `#${item.rank} · ${item.formattedValue}`;
  }
  if (item.earned) {
    return item.tiers.length > 1
      ? `Tier ${item.reachedTier} of ${item.tiers.length}`
      : 'Earned';
  }
  if (item.nextThreshold != null && item.currentValue != null) {
    return `${item.currentValue} / ${item.nextThreshold}`;
  }
  return 'Locked';
}

function pillContent(item: TrophyItem): string {
  if (item.kind === 'legend') return `#${item.rank}`;
  if (item.tiers.length > 1) return `T${Math.max(1, item.reachedTier || 1)}`;
  return '';
}

export const TrophyCard: React.FC<Props> = ({ item, onTap }) => {
  const [pressed, setPressed] = React.useState(false);
  const palette = paletteFor(item);
  const locked =
    item.kind === 'achievement' && !item.earned && (item.currentValue == null || item.currentValue === 0);
  const dimmed = locked;
  const pill = pillContent(item);

  return (
    <button
      type="button"
      onClick={() => onTap(item)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1.18',
        borderRadius: 14,
        border: `1px solid ${palette.border}`,
        background: palette.cardSweep,
        overflow: 'hidden',
        padding: 11,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: dimmed ? 0.62 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease, opacity 160ms ease',
        fontFamily: GAM.FONT_GEIST,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'var(--hcp-t-100)',
        boxShadow: palette.outerGlow
          ? `inset 0 1px 0 rgba(255,255,255,0.05), ${palette.outerGlow}`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Legendary top stripe — present only when token defines one */}
      {palette.topStripe && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: palette.topStripe,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Watermark */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -22,
          bottom: -28,
          width: 130,
          height: 130,
          transform: 'rotate(-6deg)',
          opacity: dimmed ? 0.05 : 0.10,
          color: palette.color,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {renderBadgeIcon(item.iconKey, 130, 'currentColor')}
      </div>

      {/* Top row: icon tile + pill */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: `linear-gradient(180deg, ${palette.tint}, rgba(255,255,255,0.01))`,
            border: `1px solid ${palette.border}`,
            boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.color,
          }}
        >
          {locked ? (
            <Lock size={14} strokeWidth={2.0} />
          ) : (
            renderBadgeIcon(item.iconKey, 14, 'currentColor')
          )}
        </div>
        {pill && (
          <span
            style={{
              padding: '3px 8px',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: palette.color,
              background: `linear-gradient(180deg, ${palette.tint}, rgba(255,255,255,0.01))`,
              border: `1px solid ${palette.border}`,
              borderRadius: 7,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              ...GAM.TABULAR,
            }}
          >
            {pill}
          </span>
        )}
      </div>

      {/* Bottom: name + meta */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--hcp-t-100)',
            letterSpacing: '-0.015em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.kind === 'legend' ? item.courseName : item.name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 9.5,
            fontWeight: 700,
            color: palette.metaColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: dimmed ? 0.7 : 0.95,
            ...GAM.TABULAR,
          }}
        >
          {item.kind === 'legend' ? item.name : metaLine(item)}
        </div>
      </div>
    </button>
  );
};

export default TrophyCard;
