/**
 * SignatureFooter — Pass 7 / 7.0.2. Broadcast-style lower-third closing the hero zone.
 * Left side: state dot + label + freshness ("1 DAY AGO" derived from endDate).
 * Right side: course context (PAR · YDS) — or Pass 7.1 player/cut stats when wired.
 */

import React from 'react';
import { INK } from '../HybridHero.constants';
import { STATUS_LIVE, AMBER } from '../../../_shared/tokens';
import type { HeroState } from '../HybridHero.utils';

interface SignatureFooterProps {
  state: HeroState;
  /** Tournament end date (ISO) — derives "1 DAY AGO" etc. for results state */
  endDate?: string | null;
  /** Course par from venuePar */
  venuePar?: number | null;
  /** Course yardage from venueYardage */
  venueYardage?: number | null;
  /** Pass 7.1 placeholders — left as-is */
  lastSyncedAt?: string | null;
  playerCount?: number | null;
  cutLine?: string | null;
}

function formatTimeSince(endDateIso: string | null | undefined): string | null {
  if (!endDateIso) return null;
  const end = new Date(`${endDateIso}T23:59:59`);
  if (isNaN(end.getTime())) return null;
  const now = Date.now();
  const diffMs = now - end.getTime();
  if (diffMs < 0) return null;

  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'TODAY';
  if (days === 1) return '1 DAY AGO';
  if (days < 7) return `${days} DAYS AGO`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 WK AGO';
  if (weeks < 5) return `${weeks} WKS AGO`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 MO AGO';
  return `${months} MO AGO`;
}

function formatCourseContext(
  par: number | null | undefined,
  yardage: number | null | undefined,
): string | null {
  const parts: string[] = [];
  if (par) parts.push(`PAR ${par}`);
  if (yardage) parts.push(`${yardage.toLocaleString()} YDS`);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

export function SignatureFooter({
  state,
  endDate,
  venuePar,
  venueYardage,
  lastSyncedAt,
  playerCount,
  cutLine,
}: SignatureFooterProps) {
  const isLive = state.kind === 'live';
  const isResults = state.kind === 'results';
  const isUpcoming = state.kind === 'upcoming';

  const stateLabel = isLive ? 'LIVE' : isResults ? 'FINAL' : 'UPCOMING';
  const dotColor = isLive ? '#10B981' : '#F7931E';
  const dotHaloColor = isLive ? 'rgba(16,185,129,0.22)' : 'rgba(247,147,30,0.22)';

  let leftSecondary: string | null = null;
  if (isResults) {
    leftSecondary = formatTimeSince(endDate);
  } else if (isLive && (state as any).round && (state as any).thruLabel) {
    leftSecondary = `R${(state as any).round} · ${(state as any).thruLabel}`;
  } else if (isUpcoming && (state as any).countdown) {
    leftSecondary = (state as any).countdown;
  }

  const courseContext = formatCourseContext(venuePar, venueYardage);

  const rightContent: string | null = (() => {
    if (playerCount || cutLine) {
      const parts: string[] = [];
      if (playerCount) parts.push(`${playerCount} PLAYERS`);
      if (cutLine) parts.push(`CUT ${cutLine}`);
      return parts.join(' · ');
    }
    return courseContext;
  })();

  // lastSyncedAt is a Pass 7.1 placeholder — kept in signature, not yet rendered.
  void lastSyncedAt;

  return (
    <div
      style={{
        background: INK,
        padding: '11px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* LEFT — state dot + label + secondary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          aria-hidden="true"
          className={isLive ? 'hybrid-live-pulse' : undefined}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 2.5px ${dotHaloColor}`,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        <span
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: "'Geist', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"zero" 0',
          }}
        >
          {stateLabel}
          {leftSecondary && (
            <>
              {' · '}
              <span style={{ color: 'white' }}>{leftSecondary}</span>
            </>
          )}
        </span>
      </div>

      {/* RIGHT — course context, or Pass 7.1 player/cut stats */}
      {rightContent && (
        <span
          style={{
            color: 'rgba(255,255,255,0.40)',
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: "'Geist', sans-serif",
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"zero" 0',
            textAlign: 'right',
            flexShrink: 0,
          }}
        >
          {rightContent}
        </span>
      )}
    </div>
  );
}
