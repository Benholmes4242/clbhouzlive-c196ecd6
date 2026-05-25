/**
 * HeroContextLine — Brief 07 B3.
 * One quiet 13px row directly under the CHAMPION / LEADER strip with a
 * subtle hairline above. Renders state-conditional context:
 *   - results: champion summary (margin / closing round / view champion round)
 *   - live:    "Live · Round {n} · {thru} holes played →"
 *   - upcoming: "Tee times in {n} days →"
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { HeroState } from '../HybridHero.utils';
import { INK, INK_15, INK_60 } from '../HybridHero.constants';

interface HeroContextLineProps {
  state: HeroState;
  champion?: { name: string; score: string } | undefined;
  onTap?: () => void;
}

function buildLabel(state: HeroState, champion?: { score: string }): string | null {
  if (state.kind === 'results') {
    if (state.variant === 'cancelled' || state.variant === 'awaiting-playoff') return null;
    // Try to derive margin from champion score (e.g. "-30") — fallback to generic CTA.
    const raw = champion?.score?.replace(/[^\d.\-−+]/g, '');
    const n = raw ? Number(raw.replace('−', '-')) : NaN;
    if (Number.isFinite(n) && n <= -5) {
      return `Closed at ${champion!.score} →`;
    }
    return 'View champion round →';
  }
  if (state.kind === 'live') {
    return `Live · Round ${state.round} · ${state.thruLabel} →`;
  }
  // upcoming
  if (state.meta) return `${state.meta} · ${state.countdown || 'View tournament'} →`;
  return state.countdown ? `${state.countdown} →` : null;
}

export function HeroContextLine({ state, champion, onTap }: HeroContextLineProps) {
  const label = buildLabel(state, champion);
  if (!label) return null;

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        width: '100%',
        background: '#F8FAFC',
        borderTop: `0.5px solid ${INK_15}`,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        color: INK_60,
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.01em',
        textAlign: 'right',
      }}
    >
      <span style={{ color: INK }}>{label.replace(/\s*→$/, '')}</span>
      <ChevronRight size={14} strokeWidth={2.2} />
    </button>
  );
}
