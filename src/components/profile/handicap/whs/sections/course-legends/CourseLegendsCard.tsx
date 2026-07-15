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

const LegendsSquircle: React.FC<{ photoUrl: string | null; muted?: boolean }> = ({
  photoUrl,
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
        position: 'relative',
        width: 40,
        height: 42,
        borderRadius: '34%',
        background: bg,
        flexShrink: 0,
      }}
    >
      {/* Traced hairline (canon: dark surface → 1px white 22%) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '34%',
          border: '1px solid rgba(255,255,255,0.22)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const HolderCell: React.FC<HolderCellProps> = ({ short, holder, selfLabel }) => {
  const isSelf = !!holder?.is_self;
  const isEmpty = !holder;

  const labelColor = isSelf ? 'var(--hcp-amber)' : 'var(--hcp-t-40)';
  const valueColor = isSelf ? '#F7931E' : 'var(--hcp-t-100)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        minWidth: 0,
        flex: 1,
        fontFamily: FONT,
      }}
    >
      <LegendsSquircle photoUrl={holder?.photo_url ?? null} muted={isEmpty} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: labelColor,
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}
        >
          {isSelf && (
            <Crown
              size={11}
              strokeWidth={2.6}
              fill="#F7931E"
              style={{ color: '#F7931E' }}
            />
          )}
          {short}
        </div>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 800,
            color: isEmpty ? 'var(--hcp-t-40)' : 'var(--hcp-t-100)',
            lineHeight: 1.22,
            marginTop: 3,
            minHeight: '2.44em',
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {isEmpty ? 'Unclaimed' : (isSelf ? selfLabel : holder!.display_name)}
        </div>
      </div>

      <div
        style={{
          fontSize: 19,
          fontWeight: 800,
          color: isEmpty ? 'var(--hcp-t-40)' : valueColor,
          ...GAM.TABULAR,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {isEmpty || !holder ? '—' : formatLegendValueCompact(
          (holder.category as LegendCategory),
          holder.value,
        )}
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

  // Claimed slots only — laid out as row-pairs (see grid below).
  const claimed = resolved.filter(({ row }) => !!row);
  const hasAnyClaimed = claimed.length > 0;


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
            top: 0, left: 0, right: 0, height: '30%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 100%)',
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
              color: '#FFFFFF',
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
            onPhoto
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

      {/* 2-col record grid — one anatomy per cell, hairline between row-pairs */}
      {hasAnyClaimed ? (
        <div style={{ padding: '2px 14px 4px' }}>
          {(() => {
            const rowPairs: typeof claimed[] = [];
            for (let i = 0; i < claimed.length; i += 2) {
              rowPairs.push(claimed.slice(i, i + 2));
            }
            return rowPairs.map((pair, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  display: 'flex',
                  gap: 18,
                  padding: '11px 0',
                  borderTop: rowIdx === 0 ? 'none' : '1px solid var(--hcp-line)',
                  alignItems: 'flex-start',
                }}
              >
                {pair.map(({ slot, row, cat }) => (
                  <HolderCell
                    key={slot.key}
                    short={slot.short}
                    holder={row}
                    category={cat}
                    selfLabel={selfLabel}
                  />
                ))}
                {pair.length === 1 && <div style={{ flex: 1 }} />}
              </div>
            ));
          })()}
        </div>
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--hcp-t-60)', fontFamily: FONT }}>
          No champions yet — be the first to claim a title here.
        </div>
      )}


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
