import React, { useState } from 'react';
import { ChevronRight, Crown } from 'lucide-react';
import type { LegendCategory } from '@/lib/gam/types';
import { formatLegendValueCompact } from '@/lib/gam/visuals';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { CourseEyebrow } from './_shared/CourseEyebrow';
import { getFooterCue, FOOTER_INTENT_STYLE } from './footerCue';
import { CHAMPIONS_ORDER_90D, CHAMPIONS_ORDER_ALL_TIME } from './_shared/championsOrder';
import { GAM } from '../../gam/tokens';

const FONT = GAM.FONT_GEIST;

/**
 * Canonical category order — derived from championsOrder so the Compete-tab
 * grid stays in lock-step with the drilldown (Gross → Stbl → Ace → Alb →
 * Eagle → Birdie → Score). The grid receives a window-filtered holder map
 * (90d OR all-time), but the cell needs to map either window's key to the
 * same display slot. We resolve by checking both _90d and _all_time variants.
 *
 * NOTE: `most_rounds_*` is DELIBERATELY excluded here — the Compete-tab card
 * stays at 7 slots and the hero badge stays `N/7`. The Rounds category is
 * only surfaced in the Champions drilldown (CourseLegendsDrilldown). Adding
 * it to SLOT_META would re-enable it here; the filter below is the single
 * source of truth for the exclusion.
 */
const SLOT_META: Record<string, { short: string }> = {
  lowest_gross:     { short: 'GROSS' },
  best_stableford:  { short: 'STBL' },
  most_aces:        { short: 'ACE' },
  most_albatrosses: { short: 'ALB' },
  most_eagles:      { short: 'EAGLE' },
  most_birdies:     { short: 'BIRDIE' },
  best_score_diff:  { short: 'SCORE' },
};

const SLOTS: Array<{ key: LegendCategory; alt: LegendCategory; short: string }> =
  CHAMPIONS_ORDER_90D
    .map((key, i) => ({ key, alt: CHAMPIONS_ORDER_ALL_TIME[i] }))
    .filter(({ key }) => !key.startsWith('most_rounds'))
    .map(({ key, alt }) => {
      const base = key.replace(/_90d$/, '');
      return { key, alt, short: SLOT_META[base].short };
    });

interface HolderCellProps {
  short: string;
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
      ? 'var(--hcp-bg-2)'
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
          ? 'inset 0 0 0 1px var(--hcp-line)'
          : 'inset 0 0 0 1px var(--hcp-line-2)',
        flexShrink: 0,
      }}
    />
  );
};

const HolderCell: React.FC<HolderCellProps> = ({ short, holder, selfLabel }) => {
  const isSelf = !!holder?.is_self;
  const isEmpty = !holder;

  const nameColor = 'var(--hcp-t-100)';
  const valueColor = nameColor;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '8px 10px',
        background: isSelf ? 'rgba(251,188,46,0.07)' : 'transparent',
        border: isSelf
          ? '1px solid rgba(251,188,46,0.45)'
          : '1px solid transparent',
        borderRadius: 10,
        minWidth: 0,
        boxSizing: 'border-box',
        fontFamily: FONT,
      }}
    >
      <SquircleAvatar photoUrl={holder?.photo_url ?? null} size={30} muted={isEmpty} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--hcp-t-100)',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {isSelf && (
            <Crown
              size={9}
              strokeWidth={2.6}
              fill="#FBBC2E"
              style={{ color: '#B26818' }}
            />
          )}
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
          {isEmpty ? 'Unclaimed' : (isSelf ? selfLabel : holder!.display_name)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexShrink: 0,
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
              border: '1px solid rgba(255,255,255,0.30)',
              color: 'var(--hcp-t-100)',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.04em',
              ...GAM.TABULAR,
            }}
          >
            <Crown size={10} strokeWidth={2.4} fill="#FFFFFF" style={{ color: '#FFFFFF' }} />
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
