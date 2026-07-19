/**
 * TrophyRoomSpine -- the wall's system layer.
 *
 * Level card (medal-wall level, gem ladder, progress to next level)
 * and the streaks strip. Pure derivation from normalized items;
 * no fetching, no state.
 */

import React, { useState } from 'react';
import type { TrophyItem } from './_shared/normalizeTrophyItem';
import { MATERIAL_HEX } from './_shared/rarityPalette';
import {
  MATERIAL_LADDER,
  medalsOwned,
  levelForMedals,
  nextLevelForMedals,
  levelProgress,
  levelDisplay,
  type WallMaterial,
} from './_shared/levels';
import { TierGem } from '@/components/shared/TierGem';
import { LadderSheet } from './LadderSheet';

const FONT = "'Geist', -apple-system, sans-serif";
const OBSIDIAN_BODY = '#2A2F36';
const OBSIDIAN_EDGE = '#D4A017';

function gemColor(m: WallMaterial): string {
  if (m === 'obsidian') return OBSIDIAN_BODY;
  return (MATERIAL_HEX as Record<string, string>)[m] ?? '#C97B4A';
}

function Gem({ material, dim, size = 15 }: { material: WallMaterial; dim: boolean; size?: number }) {
  const c = gemColor(material);
  const isObsidian = material === 'obsidian';
  return (
    <div
      style={{
        width: size,
        height: size * 1.15,
        flexShrink: 0,
        background: dim
          ? 'rgba(255,255,255,0.07)'
          : `linear-gradient(135deg, ${c}, ${c}55 55%, ${c}CC)`,
        clipPath: 'polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%)',
        boxShadow: dim
          ? 'none'
          : isObsidian
            ? `0 0 10px ${OBSIDIAN_EDGE}66, inset 0 0 0 1px ${OBSIDIAN_EDGE}55`
            : `0 0 10px ${c}55`,
      }}
    />
  );
}

const STREAK_DEFS: Array<{ badgeId: string; label: string; unit?: string; color: string }> = [
  { badgeId: 'round_streak_tier', label: 'Round streak', unit: 'wks', color: '#C084FC' },
  { badgeId: 'sub_80_streak', label: 'Sub-80 run', color: '#5AC8FA' },
  { badgeId: 'cutting_streak', label: 'Cuts in a row', color: '#12B784' },
];

interface Props {
  items: TrophyItem[];
  userId?: string | null;
}

export function TrophyRoomSpine({ items, userId }: Props) {
  const [ladderOpen, setLadderOpen] = useState(false);
  const achievements = items.filter(
    (i): i is Extract<TrophyItem, { kind: 'achievement' }> => i.kind === 'achievement',
  );
  const owned = medalsOwned(items);
  const level = levelForMedals(owned);
  const next = nextLevelForMedals(owned);
  const progress = levelProgress(owned);
  const currentMatIdx = level ? MATERIAL_LADDER.indexOf(level.material) : -1;

  const streaks = STREAK_DEFS.map((def) => {
    const item = achievements.find((a) => a.badgeId === def.badgeId);
    return { ...def, value: item?.currentValue ?? 0 };
  });

  return (
    <div style={{ fontFamily: FONT, marginBottom: 12 }}>
      {/* level card -- tap to open the Ladder */}
      <button
        type="button"
        onClick={() => setLadderOpen(true)}
        style={{
          all: 'unset',
          display: 'block',
          width: '100%',
          borderRadius: 18,
          padding: 16,
          background: 'linear-gradient(170deg, rgba(255,255,255,0.055), rgba(255,255,255,0.015))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: 'transform 120ms ease',
          position: 'relative',
        }}
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.985)'; }}
        onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
        onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontSize: 15,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1,
          }}
        >
          ›
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>
            {level ? <TierGem medals={owned} size="md" /> : null}
            {level ? (
              <span>
                Level {level.level} &middot;{' '}
                <span
                  style={{
                    color:
                      level.material === 'obsidian' ? OBSIDIAN_EDGE : gemColor(level.material),
                  }}
                >
                  {levelDisplay(level, owned)}
                </span>
              </span>
            ) : (
              'Earn your first medal'
            )}
          </span>
          <span
            style={{
              fontSize: 12.5,
              color: 'rgba(255,255,255,0.5)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {owned} {owned === 1 ? 'medal' : 'medals'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, margin: '12px 0 10px' }}>
          {MATERIAL_LADDER.map((m, i) => (
            <Gem key={m} material={m} dim={i > currentMatIdx} />
          ))}
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: '100%',
              background: level
                ? level.material === 'obsidian'
                  ? OBSIDIAN_EDGE
                  : gemColor(level.material)
                : 'rgba(255,255,255,0.3)',
            }}
          />
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          {next
            ? `${next.medalsRequired - owned} ${next.medalsRequired - owned === 1 ? 'medal' : 'medals'} to Level ${next.level} · ${next.label}`
            : 'Every level earned. The wall is yours.'}
        </div>
      </button>

      {/* streaks strip */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {streaks.map((s) => {
          const live = s.value > 0;
          return (
            <div
              key={s.badgeId}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: '11px 8px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.035)',
                border: '1px solid rgba(255,255,255,0.07)',
                opacity: live ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: live ? s.color : 'rgba(255,255,255,0.35)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
                {s.unit ? ` ${s.unit}` : ''}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'rgba(255,255,255,0.45)',
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      <LadderSheet
        open={ladderOpen}
        onClose={() => setLadderOpen(false)}
        owned={owned}
        items={items}
        userId={userId ?? null}
      />
    </div>
  );
}
