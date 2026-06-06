import React, { useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import { formatLegendValueCompact } from '@/lib/gam/visuals';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { CourseEyebrow } from './_shared/CourseEyebrow';
import { getFooterCue, FOOTER_INTENT_STYLE } from './footerCue';
import { CHAMPIONS_ORDER } from './_shared/championsOrder';
import { GAM } from '../../gam/tokens';

const FONT = GAM.FONT_GEIST;

/**
 * Canonical category order — Gross → Aces → Eagle → Birdie → Stableford → Score.
 * The grid receives a window-filtered holder map (90d OR all-time), but the
 * cell needs to map either window's key to the same display slot. We resolve
 * by checking both _90d and _all_time variants per slot.
 */
const SLOTS: Array<{ key: LegendCategory; alt: LegendCategory; short: string; unit: string }> = [
  { key: 'lowest_gross_90d',     alt: 'lowest_gross_all_time',     short: 'GROSS',  unit: 'gross' },
  { key: 'most_aces_90d',        alt: 'most_aces_all_time',        short: 'ACE',    unit: 'aces' },
  { key: 'most_eagles_90d',      alt: 'most_eagles_all_time',      short: 'EAGLE',  unit: 'eagles' },
  { key: 'most_birdies_90d',     alt: 'most_birdies_all_time',     short: 'BIRDIE', unit: 'birdies' },
  { key: 'best_stableford_90d',  alt: 'best_stableford_all_time',  short: 'STBL',   unit: 'pts' },
  { key: 'best_score_diff_90d',  alt: 'best_score_diff_all_time',  short: 'SCORE',  unit: 'diff' },
];

// Keep CHAMPIONS_ORDER referenced so the canonical constant is the source of truth.
void CHAMPIONS_ORDER;

interface HolderCellProps {
  short: string;
  unit: string;
  holder: CourseLegendHolderRow | null;
  category: LegendCategory | null;
  selfLabel: string;
}

const SquircleAvatar: React.FC<{ photoUrl: string | null; size?: number; muted?: boolean }> = ({
  photoUrl,
  size = 30,
  muted = false,
}) => {
  const bg = photoUrl
    ? `url(${photoUrl}) center/cover`
    : muted
      ? 'rgba(255,255,255,0.05)'
      : 'linear-gradient(135deg, rgba(148,163,184,0.45) 0%, rgba(100,116,139,0.65) 100%)';
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: bg,
        boxShadow: muted
          ? 'inset 0 0 0 1px rgba(255,255,255,0.06)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.10)',
        flexShrink: 0,
      }}
    />
  );
};

const HolderCell: React.FC<HolderCellProps> = ({ short, unit, holder, selfLabel }) => {
  const isSelf = !!holder?.is_self;
  const isEmpty = !holder;

  const nameColor = isSelf
    ? GAM.DEEP_AMBER
    : `var(--hcp-t-100, ${GAM.INK})`;
  const valueColor = nameColor;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        background: isSelf ? 'rgba(247,147,30,0.08)' : 'transparent',
        border: isSelf
          ? '1px solid rgba(247,147,30,0.22)'
          : '1px solid transparent',
        borderRadius: 10,
        minWidth: 0,
        boxSizing: 'border-box',
        fontFamily: FONT,
      }}
    >
      {/* Champion squircle with crown badge overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <SquircleAvatar photoUrl={holder?.photo_url ?? null} size={30} muted={isEmpty} />
        {!isEmpty && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              lineHeight: 0,
            }}
          >
            <Crown
              size={12}
              strokeWidth={2.2}
              fill={GAM.GOLD}
              style={{ color: GAM.DEEP_AMBER, display: 'block' }}
            />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: GAM.AMBER,
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {short}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: isEmpty ? `var(--hcp-t-40, ${GAM.INK_40})` : nameColor,
            lineHeight: 1.25,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}
        >
          {isEmpty ? '—' : (isSelf ? selfLabel : holder!.display_name)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 1,
        }}
      >
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: isEmpty ? `var(--hcp-t-40, ${GAM.INK_40})` : valueColor,
            ...GAM.TABULAR,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          {isEmpty || !holder ? '—' : formatLegendValueCompact(
            (holder.category as LegendCategory),
            holder.value,
          )}
        </div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 600,
            color: `var(--hcp-t-50, ${GAM.INK_55})`,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          {unit}
        </div>
      </div>
    </div>
  );
};

interface Props {
  courseId: string;
  courseName: string;
  courseRegion: string | null;
  courseCountry: string | null;
  courseType: string | null;
  /** Hero strip background image (course photo). Falls back to gradient if null. */
  courseHeaderImage?: string | null;
  /** Pre-filtered (by current window) holders map keyed by category. */
  holdersByCategory: Map<LegendCategory, CourseLegendHolderRow>;
  onTap: () => void;
  /** Friend view: show friend's name instead of "YOU" in self cells. */
  friendName?: string | null;
}

export const CourseLegendsCard: React.FC<Props> = ({
  courseName,
  courseRegion,
  courseCountry,
  courseType,
  courseHeaderImage,
  holdersByCategory,
  onTap,
  friendName,
}) => {
  const [pressed, setPressed] = useState(false);

  // Resolve each slot to whichever window key has data.
  const resolved = SLOTS.map((slot) => {
    const row =
      holdersByCategory.get(slot.key) ??
      holdersByCategory.get(slot.alt) ??
      null;
    const cat = row ? (holdersByCategory.has(slot.key) ? slot.key : slot.alt) : null;
    return { slot, row, cat };
  });

  const visibleHolders = new Map<LegendCategory, CourseLegendHolderRow>();
  resolved.forEach(({ row, cat }) => {
    if (row && cat) visibleHolders.set(cat, row);
  });

  const heldCount = Array.from(visibleHolders.values()).filter((r) => r.is_self).length;
  const totalSlots = SLOTS.length;

  if (visibleHolders.size === 0) return null;

  const cue = getFooterCue(visibleHolders);
  const cueStyle = FOOTER_INTENT_STYLE[cue.intent];
  const selfLabel = friendName ? friendName : 'YOU';

  // Row-major split into 2-column grid
  const left = resolved.filter((_, i) => i % 2 === 0);
  const right = resolved.filter((_, i) => i % 2 === 1);

  return (
    <div
      onClick={onTap}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      style={{
        background: 'var(--hcp-bg-1)',
        border: '1px solid var(--hcp-line)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.99)' : 'scale(1)',
        transition: 'transform 140ms cubic-bezier(0.22, 0.61, 0.36, 1)',
        fontFamily: FONT,
      }}
    >
      {/* Hero strip with photo + scrims + overlaid title + N/6 titles badge */}
      <div
        style={{
          position: 'relative',
          height: 88,
          width: '100%',
          background: courseHeaderImage
            ? undefined
            : 'var(--hcp-bg-1)',
          overflow: 'hidden',
        }}
      >
        {courseHeaderImage && (
          <img
            src={courseHeaderImage}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '40%',
            background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, height: '55%',
            background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* N/6 titles badge */}
        {heldCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid rgba(251,188,46,0.40)',
              color: GAM.GOLD,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              ...GAM.TABULAR,
            }}
          >
            <Crown size={10} strokeWidth={2.4} fill={GAM.GOLD} style={{ color: GAM.DEEP_AMBER }} />
            {heldCount}/{totalSlots} titles
          </div>
        )}

        {/* Overlaid title block */}
        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            minWidth: 0,
          }}
        >
          <CourseEyebrow
            type={courseType}
            region={courseRegion}
            country={courseCountry}
          />
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '0 1px 3px rgba(0,0,0,0.55)',
              marginTop: 2,
            }}
          >
            {courseName}
          </div>
        </div>
      </div>

      {/* 2-col row-major grid of champion cells */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {left.map(({ slot, row, cat }) => (
              <HolderCell
                key={slot.key}
                short={slot.short}
                unit={slot.unit}
                holder={row}
                category={cat}
                selfLabel={selfLabel}
              />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {right.map(({ slot, row, cat }) => (
              <HolderCell
                key={slot.key}
                short={slot.short}
                unit={slot.unit}
                holder={row}
                category={cat}
                selfLabel={selfLabel}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 12,
          borderTop: '1px solid var(--hcp-line)',
          padding: '10px 14px 11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: cueStyle.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: cueStyle.color,
            letterSpacing: '0.01em',
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {cue.label}
        </span>
        <ChevronRight size={14} strokeWidth={2.4} color="var(--hcp-t-60)" />
      </div>
    </div>
  );
};

export default CourseLegendsCard;
