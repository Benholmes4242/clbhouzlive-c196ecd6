import React from 'react';
import { X, Crown, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { renderBadgeIcon } from '../../badgeIcons';
import { GAM } from '../../tokens';
import {
  LEGEND_PALETTE,
  LOCKED_PALETTE,
  paletteForShowpiece,
  MATERIAL_PALETTES,
  FORGE_GOLD,
  materialNameForTier,
  RARITY_PALETTE,
  type RarityPalette,
} from '../_shared/rarityPalette';
import { rarityColor } from '@/lib/gam/visuals';
import { rgbaOf } from '../TrophyCard';
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

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '148,163,184';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function paletteFor(item: TrophyItem): RarityPalette {
  if (item.kind === 'legend') return LEGEND_PALETTE;
  const hasProgress = item.earned || (item.currentValue != null && item.currentValue > 0);
  if (!hasProgress) return LOCKED_PALETTE;
  if (isShowpiece(item.badgeId)) return paletteForShowpiece(item.reachedTier, item.badgeId);
  // One-shot & non-showpiece tiered — use rarity palette.
  return RARITY_PALETTE[item.rarity];
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
      color: 'rgba(255,255,255,0.96)',
      opacity: onClick ? 1 : 0.3,
      padding: 0,
    }}
  >
    {children}
  </button>
);

export const DetailHero: React.FC<Props> = ({ item, index, total, onPrev, onNext, onClose }) => {
  const isAch = item.kind === 'achievement';
  const isTiered = isAch && item.tiers.length > 1;
  const reachedTier = isAch ? item.reachedTier : 0;
  const totalTiers = isAch ? item.tiers.length : 0;
  const locked =
    item.kind === 'achievement' && !item.earned && (item.currentValue == null || item.currentValue === 0);
  // Pre-bronze "started": tiered, not locked, count > 0 but reachedTier still 0.
  const started =
    isTiered && !locked && reachedTier === 0 && ((item as any).currentValue ?? 0) > 0;

  // Neutral slate palette in the "started" state — no material glow yet.
  const palette = started ? LOCKED_PALETTE : paletteFor(item);

  const isObsidian = isTiered && reachedTier >= 5 && !locked && !started && !isRegional(item);
  const nextMaterialTier = isTiered && reachedTier < totalTiers ? reachedTier + 1 : null;
  const nextMaterialPal =
    nextMaterialTier && nextMaterialTier <= 5 ? MATERIAL_PALETTES[nextMaterialTier as 1 | 2 | 3 | 4 | 5] : null;

  const c = palette.color;
  const rgb = hexToRgb(c);
  const rarityStripColor =
    item.kind === 'achievement'
      ? (rarityColor[item.rarity] ?? '#94A3B8')
      : (rarityColor.legendary);
  const rarityLabel =
    item.kind === 'achievement'
      ? String(item.rarity).toUpperCase()
      : 'LEGENDARY';

  // Solid material pill on hero: material-tinted background, near-black ink derived from material.
  const solidPillBg = isTiered && !locked && !started ? (isObsidian ? FORGE_GOLD : c) : null;
  const pillLabel = (() => {
    if (item.kind === 'legend') {
      return item.rank === 1 ? '#1 LEGEND' : `#${item.rank}`;
    }
    if (started) return 'IN PROGRESS';
    if (isTiered && !locked) {
      const label = isObsidian ? 'OBSIDIAN' : palette.label;
      return `${label} · T${reachedTier}/${totalTiers}`;
    }
    return palette.label;
  })();

  // Bronze glow anchor for the started state (muted material being smelted toward).
  const bronzeColor = MATERIAL_PALETTES[1].color;
  const startedFirstPct = started && isAch
    ? Math.max(0, Math.min(100, Math.round(
        (((item as any).currentValue ?? 0) / Math.max(1, (item as any).nextThreshold ?? 1)) * 100
      )))
    : 0;

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        background: palette.heroGradient,
        overflow: 'hidden',
        fontFamily: GAM.FONT_GEIST,
        color: 'rgba(255,255,255,0.96)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top edge glint */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: '8%',
          right: '50%',
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${
            isObsidian ? FORGE_GOLD : `rgba(${rgb},0.9)`
          }, transparent)`,
          zIndex: 3,
        }}
      />

      {/* Body (hero without footer strip) */}
      <div style={{ position: 'relative', height: 210, flexShrink: 0 }}>
        {/* Watermark */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -30,
            bottom: -50,
            width: 230,
            height: 230,
            transform: 'rotate(-8deg)',
            opacity: locked ? 0.05 : isObsidian ? 0.10 : 0.13,
            color: isObsidian ? FORGE_GOLD : palette.color,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderBadgeIcon(item.iconKey, 230, 'currentColor')}
        </div>

        {/* Top bar */}
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
              color: 'rgba(255,255,255,0.55)',
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

        {/* Middle: material journey (tiered only, not locked) */}
        {isTiered && !locked && !isRegional(item) && (
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: 78,
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const earned = n <= reachedTier;
                const p = MATERIAL_PALETTES[n as 1 | 2 | 3 | 4 | 5];
                // Started state: all segments unlit, segment 1 carries a
                // muted-bronze partial glow at the fraction.
                const bg = earned
                  ? n === 5
                    ? FORGE_GOLD
                    : p.color
                  : started && n === 1
                    ? `linear-gradient(90deg, rgba(${hexToRgb(bronzeColor)},0.45) ${startedFirstPct}%, rgba(255,255,255,0.10) ${startedFirstPct}%)`
                    : 'rgba(255,255,255,0.10)';
                return (
                  <div
                    key={n}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 2,
                      background: bg,
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                ...GAM.TABULAR,
              }}
            >
              <span
                style={{
                  color: reachedTier >= 5
                    ? FORGE_GOLD
                    : started
                      ? `rgba(${hexToRgb(bronzeColor)},0.55)`
                      : nextMaterialPal?.color ?? 'rgba(255,255,255,0.55)',
                }}
              >
                {reachedTier >= 5
                  ? 'FULLY FORGED'
                  : nextMaterialPal
                    ? `${Math.max(0, (item as any).nextThreshold - ((item as any).currentValue ?? 0))} TO ${nextMaterialPal.label}`
                    : ''}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.40)' }}>
                OBSIDIAN AT {(isAch ? item.tiers[item.tiers.length - 1]?.threshold : 0) ?? ''}
              </span>
            </div>
          </div>
        )}

        {/* Bottom: identity row */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: isObsidian ? 'rgba(251,188,46,0.15)' : `rgba(${rgb},0.15)`,
                border: `1.5px solid ${isObsidian ? 'rgba(251,188,46,0.55)' : `rgba(${rgb},0.55)`}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isObsidian ? FORGE_GOLD : palette.color,
                flexShrink: 0,
              }}
            >
              {locked ? <Lock size={26} /> : renderBadgeIcon(item.iconKey, 28, 'currentColor')}
            </div>
          </div>

          {solidPillBg ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#0A0A0A',
                background: solidPillBg,
                borderRadius: 999,
                ...GAM.TABULAR,
              }}
            >
              {pillLabel}
            </span>
          ) : (
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
          )}
        </div>
      </div>

      {/* Rarity footer strip — flush at hero's base. */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '9px 16px',
          borderTop: '1px solid rgba(255,255,255,0.10)',
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
            background: 'rgba(242,244,247,0.38)',
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
            color: 'rgba(242,244,247,0.38)',
            ...GAM.TABULAR,
          }}
        >
          RARITY · {rarityLabel}
        </span>
      </div>
    </div>
  );
};

// Regional Top-100 badges are now fully routed through the Forge (material
// hero, journey strip, ladder). Kept as a stub for symmetry; always false.
function isRegional(_item: TrophyItem): boolean {
  return false;
}

export default DetailHero;
