import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import { GAM } from '../../tokens';
import type { TrophyItem } from '../_shared/normalizeTrophyItem';
import { rgbaOf } from '../_shared/rarityPalette';

type LegendItem = Extract<TrophyItem, { kind: 'legend' }>;

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
  width: '100%',
};

/** Short chip label for a legend category. Trims the leading "Most " /
 *  "Best " / "Lowest " noise so multiple chips fit on one line. */
function chipLabelFor(name: string): string {
  const trimmed = name.replace(/^(Most|Best|Lowest)\s+/i, '').trim();
  return trimmed.toUpperCase();
}

interface Props {
  courseName: string;
  records: LegendItem[];
  onTap: (records: LegendItem[]) => void;
}

export const LegendCard: React.FC<Props> = ({ courseName, records, onTap }) => {
  const [pressed, setPressed] = useState(false);
  const c = AMBER;
  const count = records.length;
  const pillLabel = count > 1 ? `${count}x #1` : '#1';

  const visibleChips = records.slice(0, 2);
  const overflow = Math.max(0, records.length - visibleChips.length);
  const chipsText = visibleChips
    .map((r) => `${chipLabelFor(r.name)} ${r.formattedValue}`)
    .join(' · ') + (overflow > 0 ? ` · +${overflow} more` : '');

  return (
    <button
      type="button"
      onClick={() => onTap(records)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        ...CARD_BASE,
        background: `linear-gradient(180deg, ${rgbaOf(c, 0.09)}, ${rgbaOf(c, 0.02)}), ${T.card}`,
        border: `1px solid ${rgbaOf(c, 0.4)}`,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease',
      }}
    >
      {/* Ghost watermark: crown */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -18,
          bottom: -18,
          color: c,
          opacity: 0.09,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <Crown size={96} strokeWidth={1.6} />
      </div>

      {/* Top row: crown chip + count pill */}
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
          <Crown size={14} strokeWidth={2.2} />
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
          {pillLabel}
        </span>
      </div>

      {/* Middle: course name (two lines) */}
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
          {courseName}
        </div>
        {/* Bottom: record chips inline */}
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
          {chipsText}
        </div>
      </div>
    </button>
  );
};
