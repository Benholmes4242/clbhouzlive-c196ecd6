import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { renderBadgeIcon } from '../badgeIcons';
import { GAM } from '../tokens';
import { rarityColor } from '@/lib/gam/visuals';
import type { TrophyItem } from './_shared/normalizeTrophyItem';
import {
  isShowpiece,
  SHOWPIECE_COUNTER_LABEL,
  SHOWPIECE_LOCKED_HINT,
  shortenShowpieceCaption,
} from './_shared/showpieces';
import {
  MATERIAL_PALETTES,
  FORGE_GOLD,
  materialNameForTier,
  paletteForShowpiece,
} from './_shared/rarityPalette';

// ─── Tokens (hardcoded — sheet portal, no var(--hcp-*)) ─────────────────
const T = {
  card: '#1B1E27',
  raised: '#20242E',
  line: 'rgba(255,255,255,0.08)',
  ink: '#F2F4F7',
  dim: 'rgba(242,244,247,0.55)',
  faint: 'rgba(242,244,247,0.38)',
  faintest: 'rgba(242,244,247,0.22)',
  glyphLocked: 'rgba(242,244,247,0.20)',
  wmLocked: 'rgba(242,244,247,1)', // stroke, opacity applied separately
} as const;

const AMBER = '#F7931E';

// ─── rgba helper ────────────────────────────────────────────────────────
// Accepts '#RRGGBB' or 'rgb[a](r,g,b[,a])'. Applying a new alpha to an
// rgba() input REPLACES its alpha — this prevents high-alpha palette
// entries (e.g. common='rgba(148,163,184,0.6)') from leaking as a solid
// light slab when passed through a "wash" stop.
export function rgbaOf(input: string, a: number): string {
  if (!input) return input;
  if (input.startsWith('#')) {
    const h = input.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
  return input;
}

interface Props {
  item: TrophyItem;
  onTap: (item: TrophyItem) => void;
}

// Slate accent used for common / unmapped rarities so earned cards still
// read as EARNED (never identical to #20242E locked ghosts).
const SLATE_ACCENT = '#F2F4F7';

// Rarity color for an achievement (falls back to slate for common /
// unmapped, so tint stops render as a subtle wash rather than a slab).
function achievementColor(item: TrophyItem): string {
  if (item.kind === 'achievement') {
    if (item.rarity === 'common') return SLATE_ACCENT;
    const c = rarityColor[item.rarity];
    if (!c || !c.startsWith('#')) return SLATE_ACCENT;
    return c;
  }
  return AMBER;
}

// ─── Watermark (kept, toned) ────────────────────────────────────────────
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

// ─── Shared card shell ──────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────
// StandardCard — locked + earned states
// ─────────────────────────────────────────────────────────────────────────
const StandardCard: React.FC<Props> = ({ item, onTap }) => {
  const [pressed, setPressed] = useState(false);
  const isAch = item.kind === 'achievement';
  const locked = isAch && !item.earned && (item.currentValue == null || item.currentValue === 0);
  const isTiered = isAch && item.tiers.length > 1;

  // Tiered cards wear the user's CURRENT MATERIAL. One-shots keep rarity colour.
  const reachedIdx =
    isTiered && !locked
      ? (Math.max(1, Math.min(5, (item as Extract<TrophyItem,{kind:'achievement'}>).reachedTier || 1)) as 1|2|3|4|5)
      : 1;
  const materialPal = isTiered && !locked ? MATERIAL_PALETTES[reachedIdx] : null;
  const isObsidian = Boolean(materialPal) && isTiered && !locked && (item as any).reachedTier >= 5;
  const c = materialPal ? materialPal.color : achievementColor(item);

  const bg = locked
    ? T.raised
    : isObsidian
      ? 'linear-gradient(170deg,#12151C 0%,#07080C 100%)'
      : `linear-gradient(180deg, ${rgbaOf(c, materialPal ? 0.13 : 0.09)}, ${rgbaOf(c, 0.02)}${materialPal ? ' 70%' : ''}), ${T.card}`;
  const border = locked
    ? `1px solid ${T.line}`
    : isObsidian
      ? 'none'
      : `1px solid ${rgbaOf(c, 0.45)}`;
  const boxShadow = isObsidian
    ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(251,188,46,0.5), 0 6px 22px rgba(0,0,0,0.55)'
    : materialPal
      ? `inset 0 1px 0 ${rgbaOf(c, 0.18)}`
      : undefined;

  const chipBg = locked ? 'transparent' : rgbaOf(c, materialPal ? 0.14 : 0.12);
  const chipBorder = locked ? `1.5px dashed ${T.faintest}` : `1px solid ${rgbaOf(c, materialPal ? 0.42 : 0.35)}`;
  const glyphColor = locked ? T.glyphLocked : c;

  const title = isAch ? item.name : '';
  const statusLabel = locked
    ? (isTiered ? 'UNFORGED' : 'LOCKED')
    : (isTiered ? 'FORGED' : 'EARNED');
  const statusColor = locked ? T.faint : c;

  const pillText = isAch && item.tiers.length > 1
    ? (materialPal
        ? (isObsidian
            ? `OBSIDIAN · T${item.reachedTier}/${item.tiers.length}`
            : `${materialPal.label} · T${Math.max(1, item.reachedTier || 1)}/${item.tiers.length}`)
        : `T${Math.max(1, item.reachedTier || 1)}`)
    : '';

  return (
    <button
      type="button"
      onClick={() => onTap(item)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        ...CARD_BASE,
        padding: isTiered && !locked ? '13px 13px 0' : CARD_BASE.padding,
        background: bg,
        border,
        boxShadow,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease',
      }}
    >
      {isObsidian && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '42%',
            height: 1.5,
            background: 'linear-gradient(90deg,transparent,#FBBC2E,transparent)',
            zIndex: 2,
          }}
        />
      )}
      <Watermark
        iconKey={item.iconKey}
        color={locked ? '#F2F4F7' : c}
        opacity={locked ? 0.05 : isObsidian ? 0.08 : materialPal ? 0.10 : 0.09}
      />

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
            width: materialPal ? 31 : 30,
            height: materialPal ? 31 : 30,
            borderRadius: 9,
            background: chipBg,
            border: chipBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: glyphColor,
            flexShrink: 0,
          }}
        >
          {locked && !item.iconKey ? (
            <Lock size={14} strokeWidth={2} />
          ) : (
            renderBadgeIcon(item.iconKey, 14, 'currentColor')
          )}
        </div>
        {pillText && (
          <span
            style={{
              padding: '2px 6px',
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: locked ? T.faint : c,
              border: `1px solid ${locked ? T.line : rgbaOf(c, materialPal ? 0.42 : 0.35)}`,
              background: locked ? 'transparent' : materialPal ? rgbaOf(c, 0.10) : 'transparent',
              borderRadius: 6,
              ...GAM.TABULAR,
            }}
          >
            {pillText}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.2,
            color: locked ? T.dim : T.ink,
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: statusColor,
            ...GAM.TABULAR,
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Rarity footer strip — tiered forged cards only. One-shots keep rarity in body. */}
      {isTiered && !locked && isAch && <RarityFooterStrip rarity={item.rarity} />}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// RarityFooterStrip — full-bleed strip at the base of forged/one-shot cards.
// (Option B: gem + rarity word, tinted by rarity.)
// ─────────────────────────────────────────────────────────────────────────
const RARITY_LABEL: Record<string, string> = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
};

const RarityFooterStrip: React.FC<{ rarity: string }> = ({ rarity }) => {
  const label = RARITY_LABEL[rarity] ?? String(rarity).toUpperCase();
  const muted = 'rgba(242,244,247,0.38)';
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        margin: '10px -13px 0',
        padding: '7px 13px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          background: muted,
          transform: 'rotate(45deg)',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: muted,
          ...GAM.TABULAR,
        }}
      >
        RARITY · {label}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// ShowpieceCard — TIERED, wears user's CURRENT MATERIAL. T5 = OBSIDIAN.
// ─────────────────────────────────────────────────────────────────────────
const ShowpieceCard: React.FC<Props> = ({ item, onTap }) => {
  if (item.kind !== 'achievement') return null;
  const [pressed, setPressed] = useState(false);

  const currentValue = item.currentValue ?? 0;
  const locked = !item.earned && currentValue === 0;

  const totalTiers = item.tiers.length;
  const atMax = !locked && item.reachedTier >= totalTiers && totalTiers > 0;
  const nextTier = !atMax && item.reachedTier < totalTiers ? item.tiers[item.reachedTier] : null;
  const prevThreshold = item.reachedTier > 0 ? item.tiers[item.reachedTier - 1].threshold : 0;
  const nextThreshold = nextTier
    ? nextTier.threshold
    : (item.tiers[totalTiers - 1]?.threshold ?? currentValue);

  const numer = currentValue - prevThreshold;
  const denom = nextThreshold - prevThreshold;
  const targetPct = atMax ? 1 : Math.max(0, Math.min(1, denom > 0 ? numer / denom : 0));

  // Material palette — every tiered showpiece (including regional Top 100)
  // wears the user's CURRENT material. Region lives in the label, not the colour.
  const reachedIdx = locked
    ? 1
    : (Math.max(1, Math.min(5, item.reachedTier || 1)) as 1 | 2 | 3 | 4 | 5);
  const materialPal = MATERIAL_PALETTES[reachedIdx];
  const pal = materialPal;
  const c = pal.color;

  const isObsidian = !locked && item.reachedTier >= 5;

  const [animatedPct, setAnimatedPct] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    if (locked) return;
    const barT = setTimeout(() => setAnimatedPct(targetPct), 80);
    if (currentValue === 0) {
      setAnimatedValue(0);
    } else {
      const duration = 700;
      const start = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedValue(Math.round(currentValue * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      return () => {
        clearTimeout(barT);
        cancelAnimationFrame(frame);
      };
    }
    return () => clearTimeout(barT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caption = shortenShowpieceCaption(
    SHOWPIECE_COUNTER_LABEL[item.badgeId] ?? item.name,
  );
  const lockedHint = SHOWPIECE_LOCKED_HINT[item.badgeId] ?? null;

  const pillLabel = locked
    ? 'UNFORGED'
    : isObsidian
      ? `OBSIDIAN · T${item.reachedTier}/${totalTiers}`
      : totalTiers > 1
        ? `${pal.label} · T${item.reachedTier}/${totalTiers}`
        : pal.label;

  // Backgrounds
  const bg = locked
    ? T.raised
    : isObsidian
      ? 'linear-gradient(170deg,#12151C 0%,#07080C 100%)'
      : `linear-gradient(180deg, ${rgbaOf(c, 0.13)}, ${rgbaOf(c, 0.02)} 70%), ${T.card}`;
  const border = locked
    ? `1px solid ${T.line}`
    : isObsidian
      ? 'none'
      : `1px solid ${rgbaOf(c, 0.45)}`;
  const boxShadow = isObsidian
    ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(251,188,46,0.5), 0 6px 22px rgba(0,0,0,0.55)'
    : locked
      ? undefined
      : `inset 0 1px 0 ${rgbaOf(c, 0.18)}`;

  const chipBg = locked ? 'transparent' : rgbaOf(c, 0.14);
  const chipBorder = locked ? `1.5px dashed ${T.faintest}` : `1px solid ${rgbaOf(c, 0.42)}`;
  const glyphColor = locked ? T.glyphLocked : c;

  return (
    <button
      type="button"
      onClick={() => onTap(item)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        ...CARD_BASE,
        padding: '13px 13px 0', // strip owns bottom padding
        minHeight: 164,
        borderRadius: 18,
        background: bg,
        border,
        boxShadow,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease',
      }}
    >
      {/* Obsidian glint */}
      {isObsidian && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '42%',
            height: 1.5,
            background: 'linear-gradient(90deg,transparent,#FBBC2E,transparent)',
            zIndex: 2,
          }}
        />
      )}

      <Watermark
        iconKey={item.iconKey}
        color={locked ? '#F2F4F7' : c}
        opacity={locked ? 0.05 : isObsidian ? 0.08 : 0.10}
      />

      {/* Top row */}
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
            width: 31,
            height: 31,
            borderRadius: 9,
            background: chipBg,
            border: chipBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: glyphColor,
            flexShrink: 0,
          }}
        >
          {locked ? <Lock size={13} strokeWidth={2} /> : renderBadgeIcon(item.iconKey, 14, 'currentColor')}
        </div>
        {pillLabel && (
          <span
            style={{
              padding: '2px 6px',
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: locked ? T.faint : c,
              border: `1px solid ${locked ? T.line : rgbaOf(c, 0.42)}`,
              background: locked ? 'transparent' : rgbaOf(c, 0.10),
              borderRadius: 6,
              ...GAM.TABULAR,
            }}
          >
            {pillLabel}
          </span>
        )}
      </div>

      {/* Hero number + caption */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 3,
          marginTop: 8,
        }}
      >
        <span
          style={{
            fontSize: 33,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: locked ? T.dim : isObsidian ? '#F8F4E8' : c,
            lineHeight: 1,
            textShadow: isObsidian ? '0 0 16px rgba(251,188,46,0.35)' : undefined,
            ...GAM.TABULAR,
          }}
        >
          {locked ? '—' : animatedValue.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: T.faint,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            lineHeight: 1.25,
          }}
        >
          {caption}
        </span>
      </div>

      {/* Next signpost + progress bar */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            color: isObsidian ? 'rgba(251,188,46,0.7)' : T.faint,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: 11,
            ...GAM.TABULAR,
          }}
        >
          {locked
            ? (lockedHint ?? '\u00A0')
            : isObsidian
              ? 'FULLY FORGED'
              : nextTier
                ? `NEXT: ${nextTier.threshold.toLocaleString()} → ${materialNameForTier(nextTier.tier).toUpperCase()}`
                : atMax
                  ? '\u00A0'
                  : '\u00A0'}
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 4,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(isObsidian ? 1 : animatedPct) * 100}%`,
              height: '100%',
              background: isObsidian
                ? 'linear-gradient(90deg, rgba(251,188,46,0.9), rgba(247,147,30,0.9))'
                : locked
                  ? T.faint
                  : c,
              borderRadius: 99,
              transition: 'width 700ms cubic-bezier(0.22,0.61,0.36,1)',
            }}
          />
        </div>
      </div>

      {/* Rarity footer strip — every forged card. Locked has no pedigree. */}
      {!locked && <RarityFooterStrip rarity={item.rarity} />}
      {locked && (
        <div style={{ height: 10, flexShrink: 0 }} />
      )}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// LegendCard — Course Legends grid card
// ─────────────────────────────────────────────────────────────────────────
const LegendCard: React.FC<Props> = ({ item, onTap }) => {
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

// ─── Router ─────────────────────────────────────────────────────────────
export const TrophyCard: React.FC<Props> = ({ item, onTap }) => {
  if (item.kind === 'legend') return <LegendCard item={item} onTap={onTap} />;
  if (item.kind === 'achievement' && isShowpiece(item.badgeId)) {
    return <ShowpieceCard item={item} onTap={onTap} />;
  }
  return <StandardCard item={item} onTap={onTap} />;
};

export default TrophyCard;
