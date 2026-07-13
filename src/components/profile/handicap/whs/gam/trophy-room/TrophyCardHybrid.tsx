/**
 * TrophyCardHybrid -- the medal-wall card.
 *
 * One grammar for every achievement: material-tinted card, tier
 * chip, big counter (or earned check), NEXT line, progress
 * hairline, rarity plaque rail, ghost icon watermark tinted by
 * the badge's current material.
 *
 * Legend showcase rows delegate to the legacy TrophyCard. */

import React from 'react';
import type { TrophyItem } from './_shared/normalizeTrophyItem';
import { MATERIAL_HEX } from './_shared/rarityPalette';
import { MATERIAL_LADDER, materialForTier } from './_shared/levels';
import { renderBadgeIcon } from '../badgeIcons';
// Legend cards are grouped by course in TrophyRoomSheet and render
// LegendCard directly. TrophyCardHybrid only handles achievements.
import { statusForEarned, statusCopy } from './_shared/statusBadges';

const FONT = "'Geist', -apple-system, sans-serif";
const OBSIDIAN_EDGE = '#D4A017';
const EARNED_GOLD = '#F5C842';
const IN_PROGRESS_BLUE = '#8CA3B8';

function matColor(mat: string): string {
  if (mat === 'obsidian') return OBSIDIAN_EDGE;
  return (MATERIAL_HEX as Record<string, string>)[mat] ?? '#C97B4A';
}

function matName(mat: string): string {
  return mat.charAt(0).toUpperCase() + mat.slice(1);
}

interface Props {
  item: TrophyItem;
  onTap: (item: TrophyItem) => void;
  /** Owner's current WHS handicap index -- powers LOSABLE STATUS layer
   *  for single_figures / scratch. null for every other badge or when the
   *  owner has no index recorded yet. */
  currentIndex?: number | null;
}

export const TrophyCardHybrid: React.FC<Props> = ({ item, onTap, currentIndex = null }) => {
  if (item.kind !== 'achievement') return null;

  const tiered = item.tiers.length > 1;
  // For tiered badges, "active" derives from live tier state --
  // item.earned is raw row existence and can be stale after
  // threshold reworks (see normalizeTrophyItem ghost-forward note).
  const earned = tiered ? item.reachedTier > 0 : item.earned;
  const reached = tiered ? item.reachedTier : earned ? 1 : 0;
  const inProgress = tiered && !earned && (item.currentValue ?? 0) > 0;
  const mat = tiered && reached > 0 ? materialForTier(reached) : null;
  const accent = earned
    ? (mat ? matColor(mat) : EARNED_GOLD)
    : inProgress
      ? IN_PROGRESS_BLUE
      : 'rgba(255,255,255,0.35)';

  // LOSABLE STATUS -- single_figures / scratch only, derived from live index.
  // Gated on milestoneEarned: a user who never earned the badge shows no
  // status chrome (renders as plain LOCKED like any other locked binary).
  const status = statusForEarned(item.badgeId, currentIndex, earned);
  const sCopy = status && status !== 'held' && currentIndex != null
    ? statusCopy(item.badgeId, status, currentIndex)
    : null;
  // "Milestone kept but status lost": user has earned it before, live status
  // dropped. Render a small "EARNED" tick on the plaque rail so the medal
  // record is never invisible.
  const milestoneKeptStatusLost = status === 'lost' && earned;

  

  const nextThreshold = tiered ? item.nextThreshold : null;
  const nextMat = tiered && nextThreshold != null ? matName(MATERIAL_LADDER[Math.min(reached, MATERIAL_LADDER.length - 1)]) : null;

  const earnedDate = item.earnedAt
    ? new Date(item.earnedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null;

  const chipText = tiered
    ? reached > 0
      ? `${matName(mat as string).toUpperCase()} · T${reached}/${item.tiers.length}`
      : inProgress
        ? 'IN PROGRESS'
        : `T0/${item.tiers.length}`
    : earned
      ? earnedDate
        ? earnedDate.toUpperCase()
        : 'EARNED'
      : 'LOCKED';

  const baseSubline = tiered
    ? nextThreshold != null
      ? `NEXT: ${nextThreshold.toLocaleString()} -> ${nextMat?.toUpperCase()}`
      : 'ALL TIERS EARNED'
    : earned
      ? item.description
      : 'LOCKED';
  // Status subline (at_risk / lost) overrides the base subline so the live
  // state is what the user reads first. Held keeps the base subline.
  const subline = sCopy ? sCopy.subline.toUpperCase() : baseSubline;

  const progressPct =
    tiered && nextThreshold != null
      ? Math.min(100, Math.max(0, ((item.currentValue ?? 0) / nextThreshold) * 100))
      : null;

  // Card border + fill treatment. 'lost' status dims the whole card even if
  // the milestone was earned; 'at_risk' keeps it lit and adds an amber pulse.
  const isLostDimmed = sCopy?.dimmed === true;
  const isAtRiskPulse = sCopy?.pulse === true;
  const cardBorderColor = isLostDimmed
    ? 'rgba(255,255,255,0.10)'
    : isAtRiskPulse
      ? sCopy!.chipBorder
      : earned || inProgress
        ? `${accent}55`
        : 'rgba(255,255,255,0.07)';
  const cardOpacity = isLostDimmed ? 0.55 : earned || inProgress ? 1 : 0.6;
  const cardBackground = isLostDimmed
    ? 'rgba(255,255,255,0.025)'
    : earned || inProgress
      ? `linear-gradient(165deg, ${accent}14, rgba(255,255,255,0.02))`
      : 'rgba(255,255,255,0.025)';

  return (
    <button
      onClick={() => onTap(item)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT,
        color: 'inherit',
        width: '100%',
        borderRadius: 16,
        padding: '13px 13px 0',
        background: cardBackground,
        border: `1px solid ${cardBorderColor}`,
        opacity: cardOpacity,
        boxShadow: isAtRiskPulse ? `0 0 0 2px ${sCopy!.chipBg}` : undefined,
        animation: isAtRiskPulse ? 'gamPulse 1.8s ease-in-out infinite' : undefined,
      }}
    >
      {/* ghost watermark */}
      <div
        style={{
          position: 'absolute',
          right: -14,
          bottom: -10,
          opacity: 0.09,
          pointerEvents: 'none',
        }}
      >
        {renderBadgeIcon(item.iconKey, 92, earned || inProgress ? accent : '#FFFFFF', 1.5)}
      </div>

      {/* one-shot sheen for newly-earned badges (isNew) */}
      {item.isNew && (
        <div
          aria-hidden
          className="trophy-sheen-layer"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            borderRadius: 16,
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              bottom: '-20%',
              left: 0,
              width: '45%',
              background:
                'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)',
              transform: 'translateX(-110%) skewX(-18deg)',
              animation: 'trophySheen 1.4s ease-out 1 both',
              animationDelay: '120ms',
            }}
          />
        </div>
      )}

      {/* top row: icon chip (tiered only) + tier chip (status chip overrides when present) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        {tiered && (
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: `${accent}1E`,
              border: `1px solid ${accent}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderBadgeIcon(item.iconKey, 15, accent, 2.2)}
          </div>
        )}
        {sCopy ? (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: sCopy.chipColor,
              background: sCopy.chipBg,
              border: `1px solid ${sCopy.chipBorder}`,
              borderRadius: 999,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            {sCopy.chipLabel}
          </span>
        ) : (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: earned || inProgress ? accent : 'rgba(255,255,255,0.4)',
              border: `1px solid ${earned || inProgress ? `${accent}55` : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 999,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            {chipText}
          </span>
        )}
      </div>

      {/* counter (tiered) or badge icon (binary) */}
      <div
        style={{
          height: 30,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {tiered ? (
          <span
            style={{
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: earned || inProgress ? accent : 'rgba(255,255,255,0.35)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {(item.currentValue ?? 0).toLocaleString()}
          </span>
        ) : earned ? (
          renderBadgeIcon(item.iconKey, 34, accent, 1.8)
        ) : (
          renderBadgeIcon(item.iconKey, 34, 'rgba(255,255,255,0.25)', 1.8)
        )}
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: 'rgba(255,255,255,0.65)',
          marginTop: 5,
        }}
      >
        {item.name.toUpperCase()}
      </div>
      {subline && (
        <div
          style={{
            fontSize: 9.5,
            color: sCopy ? sCopy.chipColor : 'rgba(255,255,255,0.45)',
            marginTop: 3,
            fontVariantNumeric: 'tabular-nums',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {subline}
        </div>
      )}

      {/* progress hairline */}
      {progressPct != null && (
        <div
          style={{
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            marginTop: 9,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${progressPct}%`, height: '100%', background: accent }} />
        </div>
      )}

      {/* rarity plaque rail -- owns the card bottom. Persistent EARNED tick
          appears when the milestone was ever achieved but the live status is
          now lost, so the medal record stays visible. */}
      <div
        style={{
          margin: '10px -13px 0',
          padding: '6px 13px',
          background: 'rgba(0,0,0,0.3)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 8, color: earned || inProgress ? accent : 'rgba(255,255,255,0.3)' }}>
          {'\u25C6'}
        </span>
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          RARITY · {item.rarity.toUpperCase()}
        </span>
        {milestoneKeptStatusLost && (
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: '#F7931E',
            }}
            aria-label="Milestone earned"
          >
            <span style={{ fontSize: 9 }}>{'\u2713'}</span>
            EARNED
          </span>
        )}
      </div>
    </button>
  );
};

