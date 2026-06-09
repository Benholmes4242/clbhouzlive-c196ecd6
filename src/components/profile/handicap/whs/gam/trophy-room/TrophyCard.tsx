import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { renderBadgeIcon } from '../badgeIcons';
import { GAM } from '../tokens';
import { LEGEND_PALETTE, LOCKED_PALETTE, paletteForShowpiece, type RarityPalette } from './_shared/rarityPalette';
import { rarityColor } from '@/lib/gam/visuals';
import type { TrophyItem } from './_shared/normalizeTrophyItem';
import {
  isShowpiece,
  SHOWPIECE_COUNTER_LABEL,
  SHOWPIECE_LOCKED_HINT,
  shortenShowpieceCaption,
} from './_shared/showpieces';

function rgbaFrom(hex: string, a: number): string {
  if (!hex.startsWith('#')) return hex;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

interface Props {
  item: TrophyItem;
  onTap: (item: TrophyItem) => void;
}

function paletteFor(item: TrophyItem): RarityPalette {
  if (item.kind === 'legend') return LEGEND_PALETTE;
  const hasProgress = item.earned || (item.currentValue != null && item.currentValue > 0);
  if (!hasProgress) return LOCKED_PALETTE;
  if (isShowpiece(item.badgeId)) return paletteForShowpiece(item.reachedTier, item.badgeId);
  return LEGEND_PALETTE;
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

// ─────────────────────────────────────────────────────────────────────────────
// StandardCard — existing trophy card layout, scaled down for 3-col grid.
// ─────────────────────────────────────────────────────────────────────────────
const StandardCard: React.FC<Props> = ({ item, onTap }) => {
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
        aspectRatio: '1 / 1.22',
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: palette.cardSweep,
        overflow: 'hidden',
        padding: 9,
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
          right: -8,
          bottom: 4,
          transform: 'rotate(-12deg)',
          opacity: dimmed ? 0.04 : 0.08,
          color: palette.color,
          pointerEvents: 'none',
        }}
      >
        {renderBadgeIcon(item.iconKey, 92, 'currentColor')}
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
            width: 24,
            height: 24,
            borderRadius: 7,
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
            <Lock size={11} strokeWidth={2.0} />
          ) : (
            renderBadgeIcon(item.iconKey, 11, 'currentColor')
          )}
        </div>
        {pill && (
          <span
            style={{
              padding: '2px 6px',
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: palette.color,
              background: `linear-gradient(180deg, ${palette.tint}, rgba(255,255,255,0.01))`,
              border: `1px solid ${palette.border}`,
              borderRadius: 6,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              ...GAM.TABULAR,
            }}
          >
            {pill}
          </span>
        )}
      </div>

      {/* Bottom: name + meta */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 12,
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

// ─────────────────────────────────────────────────────────────────────────────
// ShowpieceCard — Option B layout for the 8 lifetime IDs. Big hero number,
// animated count-up + progress bar on first paint, inline next-tier signpost.
// ─────────────────────────────────────────────────────────────────────────────
const ShowpieceCard: React.FC<Props> = ({ item, onTap }) => {
  if (item.kind !== 'achievement') return null;
  const [pressed, setPressed] = useState(false);

  const currentValue = item.currentValue ?? 0;
  const locked = !item.earned && currentValue === 0;
  const palette = locked ? LOCKED_PALETTE : paletteForShowpiece(item.reachedTier, item.badgeId);

  const totalTiers = item.tiers.length;
  const atMax = !locked && item.reachedTier >= totalTiers && totalTiers > 0;

  // Next tier object (0-indexed array, reachedTier is count → tiers[reachedTier] is next)
  const nextTier = !atMax && item.reachedTier < totalTiers ? item.tiers[item.reachedTier] : null;
  const prevThreshold = item.reachedTier > 0 ? item.tiers[item.reachedTier - 1].threshold : 0;
  const nextThreshold = nextTier ? nextTier.threshold : (item.tiers[totalTiers - 1]?.threshold ?? currentValue);

  const numer = currentValue - prevThreshold;
  const denom = nextThreshold - prevThreshold;
  const targetPct = atMax
    ? 1
    : Math.max(0, Math.min(1, denom > 0 ? numer / denom : 0));

  // Animations — first paint only
  const [animatedPct, setAnimatedPct] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(locked ? 0 : 0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (animatedRef.current) return;
    animatedRef.current = true;
    if (locked) {
      setAnimatedPct(0);
      setAnimatedValue(0);
      return;
    }
    const barT = setTimeout(() => setAnimatedPct(targetPct), 80);

    if (currentValue === 0) {
      setAnimatedValue(0);
    } else {
      const duration = 700;
      const start = performance.now();
      let frame = 0;
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
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
    ? 'LOCKED'
    : atMax
      ? 'MAX'
      : totalTiers > 1
        ? `T${item.reachedTier}/${totalTiers}`
        : '';

  return (
    <button
      type="button"
      onClick={() => onTap(item)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        position: 'relative',
        aspectRatio: '1 / 1.22',
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: palette.cardSweep,
        overflow: 'hidden',
        padding: 9,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: locked ? 0.62 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease, opacity 160ms ease',
        fontFamily: GAM.FONT_GEIST,
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--hcp-t-100)',
        boxShadow: palette.outerGlow
          ? `inset 0 1px 0 rgba(255,255,255,0.05), ${palette.outerGlow}`
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
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
            width: 22,
            height: 22,
            borderRadius: 7,
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
            <Lock size={10} strokeWidth={2.0} />
          ) : (
            renderBadgeIcon(item.iconKey, 11, 'currentColor')
          )}
        </div>
        {!locked && pillLabel && (
          <span
            style={{
              padding: '2px 6px',
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: palette.color,
              background: `linear-gradient(180deg, ${palette.tint}, rgba(255,255,255,0.01))`,
              border: `1px solid ${palette.border}`,
              borderRadius: 6,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
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
          gap: 2,
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontSize: 32,
            fontWeight: 300,
            letterSpacing: '-0.045em',
            color: locked ? 'var(--hcp-t-60)' : palette.color,
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"kern" 1, "liga" 1',
            textShadow: !locked && palette.outerGlow ? `0 0 24px ${palette.color}30` : undefined,
          }}
        >
          {locked ? '—' : animatedValue.toLocaleString()}
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            lineHeight: 1.3,
          }}
        >
          {caption}
        </span>
      </div>

      {/* Next-tier signpost + progress bar + endpoints */}
      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 700,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: 11,
            ...GAM.TABULAR,
          }}
        >
          {locked
            ? (lockedHint ?? '\u00A0')
            : atMax
              ? '\u00A0'
              : nextTier
                ? `Next: ${nextTier.threshold.toLocaleString()} → T${nextTier.tier}`
                : '\u00A0'}
        </div>
        {/* Progress bar track */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 2,
            borderRadius: 1,
            background: 'rgba(241,245,249,0.10)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${animatedPct * 100}%`,
              height: '100%',
              background: palette.color,
              opacity: 0.85,
              borderRadius: 1,
              transition: 'width 700ms cubic-bezier(0.22,0.61,0.36,1)',
            }}
          />
        </div>
        {/* Endpoints */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontSize: 8,
            fontWeight: 700,
            color: 'var(--hcp-t-60)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            ...GAM.TABULAR,
          }}
        >
          <span>{currentValue.toLocaleString()}</span>
          <span>{atMax ? 'MAX' : nextThreshold.toLocaleString()}</span>
        </div>
      </div>
    </button>
  );
};

export const TrophyCard: React.FC<Props> = ({ item, onTap }) => {
  if (item.kind === 'achievement' && isShowpiece(item.badgeId)) {
    return <ShowpieceCard item={item} onTap={onTap} />;
  }
  return <StandardCard item={item} onTap={onTap} />;
};

export default TrophyCard;
