/**
 * GemLadder -- horizontal medal summary for a tiered badge.
 *
 * One gem per tier in the Forge material ladder; earned gems lit,
 * locked gems dim. Sits above THE FORGE tier list as the
 * at-a-glance answer to "how many medals do I own here".
 */

import React from 'react';
import type { TrophyTier } from '../_shared/normalizeTrophyItem';
import { MATERIAL_HEX } from '../_shared/rarityPalette';
import { MATERIAL_LADDER } from '../_shared/materials';
import { formatNumber } from '@/i18n/format';

const OBSIDIAN_BODY = '#2A2F36';
const OBSIDIAN_EDGE = '#D4A017';

function gemColor(i: number): string {
  const m = MATERIAL_LADDER[Math.min(i, MATERIAL_LADDER.length - 1)];
  if (m === 'obsidian') return OBSIDIAN_BODY;
  return (MATERIAL_HEX as Record<string, string>)[m] ?? '#C97B4A';
}

export function GemLadder({ tiers }: { tiers: TrophyTier[] }) {
  if (tiers.length <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', padding: '4px 0 12px' }}>
      {tiers.map((t, i) => {
        const c = gemColor(i);
        const isObsidian = MATERIAL_LADDER[Math.min(i, MATERIAL_LADDER.length - 1)] === 'obsidian';
        return (
          <div key={t.tier} style={{ textAlign: 'center', opacity: t.earned ? 1 : 0.4 }}>
            <div
              style={{
                width: 20,
                height: 23,
                margin: '0 auto',
                background: t.earned
                  ? `linear-gradient(135deg, ${c}, ${c}55 55%, ${c}CC)`
                  : 'rgba(255,255,255,0.07)',
                clipPath: 'polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)',
                boxShadow: t.earned
                  ? isObsidian
                    ? `0 0 10px ${OBSIDIAN_EDGE}66, inset 0 0 0 1px ${OBSIDIAN_EDGE}55`
                    : `0 0 10px ${c}55`
                  : 'none',
              }}
            />
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                marginTop: 5,
                color: t.earned ? (isObsidian ? OBSIDIAN_EDGE : c) : 'rgba(255,255,255,0.35)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatNumber(t.threshold)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
