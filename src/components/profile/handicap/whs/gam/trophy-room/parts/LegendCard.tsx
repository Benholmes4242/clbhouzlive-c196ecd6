import React, { useState } from 'react';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';
import { rgbaOf } from '../_shared/rarityPalette';

const T = {
  card: '#1B1E27',
  ink: '#F2F4F7',
} as const;

const AMBER = '#F7931E';

const CARD_BASE: React.CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  borderRadius: 16,
  overflow: 'hidden',
  padding: '13px 13px 12px',
  minHeight: 148,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: GAM.FONT_GEIST,
  cursor: 'pointer',
  textAlign: 'left',
  color: T.ink,
};

const Watermark: React.FC<{ iconKey: string; color: string; opacity: number }> = ({
  iconKey,
  color,
  opacity,
}) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      right: -18,
      bottom: -18,
      color,
      opacity,
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    {renderBadgeIcon(iconKey, 96, 'currentColor', 1.6)}
  </div>
);

interface Props {
  item: TrophyItem;
  onTap: (item: TrophyItem) => void;
}

export const LegendCard: React.FC<Props> = ({ item, onTap }) => {
  if (item.kind !== 'legend') return null;
  const [pressed, setPressed] = useState(false);
  const c = AMBER;

  return (
    <button
      type="button"
      onClick={() => onTap(item)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        ...CARD_BASE,
        background: `linear-gradient(180deg, ${rgbaOf(c, 0.09)}, ${rgbaOf(c, 0.02)}), ${T.card}`,
        border: `1px solid ${rgbaOf(c, 0.40)}`,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease',
      }}
    >
      <Watermark iconKey={item.iconKey} color={c} opacity={0.09} />

      {/* Top row: icon chip + #rank pill */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: rgbaOf(c, 0.12),
            border: `1px solid ${rgbaOf(c, 0.35)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: c,
            flexShrink: 0,
          }}
        >
          {renderBadgeIcon(item.iconKey, 14, 'currentColor')}
        </div>
        <span
          style={{
            padding: '2px 6px',
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: c,
            border: `1px solid ${rgbaOf(c, 0.35)}`,
            borderRadius: 6,
            ...GAM.TABULAR,
          }}
        >
          #{item.rank}
        </span>
      </div>

      {/* Bottom: course name (two lines) + category */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: 12 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            lineHeight: 1.25,
            color: T.ink,
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.courseName}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: c,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...GAM.TABULAR,
          }}
        >
          {item.name} · {item.formattedValue}
        </div>
      </div>
    </button>
  );
};
