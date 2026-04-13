/**
 * NextUpPickCard — Flat dispatch ruled rows for AI tournament picks.
 * Expandable rows with tier labels, course fit bars, and bullet points.
 */

import React, { useState } from 'react';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { WinnerProfile, ContenderCard, ConfidenceTier } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NextUpPickCardProps {
  featured: WinnerProfile;
  cards: ContenderCard[];
  withdrawnPlayerIds?: Set<string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTierLabel(index: number): string {
  if (index === 0) return 'Top Pick';
  if (index === 1) return 'Strong Contender';
  return 'In Contention';
}

function getTierColor(tier: ConfidenceTier): string {
  if (tier === 'elite') return '#F7931E';
  if (tier === 'high') return '#2563EB';
  return '#9CA3AF';
}

// ─── Single flat pick row — expandable ───────────────────────────────────────

function PickRow({
  item,
  index,
  isTop,
  isWithdrawn,
}: {
  item: WinnerProfile | ContenderCard;
  index: number;
  isTop: boolean;
  isWithdrawn: boolean;
}) {
  const [open, setOpen] = useState(isTop);
  const tier = (item as WinnerProfile).confidenceTier ?? (item as ContenderCard).confidenceTier ?? 'medium';
  const bullets = (item as WinnerProfile).fitBullets ?? (item as ContenderCard).fitBullets ?? [];
  const color = getTierColor(tier);
  const matchPct = tier === 'elite' ? 95 : tier === 'high' ? 88 : 78;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          padding: '0', background: 'transparent', border: 'none',
          borderLeft: isTop ? '3px solid #F7931E' : '3px solid transparent',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          cursor: 'pointer', textAlign: 'left' as const,
          opacity: isWithdrawn ? 0.5 : 1,
        }}
      >
        <div style={{ flex: 1, padding: '12px 12px 12px 12px' }}>
          {/* Tier label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, color, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
              {getTierLabel(index)}
            </span>
            {isWithdrawn && (
              <span style={{ fontSize: 8.5, fontWeight: 700, color: '#EF4444', letterSpacing: '0.08em' }}>· WITHDRAWN</span>
            )}
          </div>

          {/* Player row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: isTop ? 36 : 30, height: isTop ? 36 : 30, borderRadius: '34%', background: 'rgba(15,23,42,0.07)', flexShrink: 0, overflow: 'hidden' }}>
              <img
                src={getPlayerHeadshotUrl(item.name, 'pga') || PLAYER_SILHOUETTE_URL}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isTop ? 15 : 13, fontWeight: isTop ? 900 : 700, color: '#0F172A', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {item.name}
              </div>
              {/* Course fit bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <div style={{ width: 64, height: 3, background: 'rgba(15,23,42,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${matchPct}%`, height: '100%', background: color, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color }}>{matchPct}%</span>
                <span style={{ fontSize: 9, color: '#94A3B8' }}>course fit</span>
              </div>
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 12, color: '#CBD5E1', paddingRight: 14,
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s', display: 'inline-block', flexShrink: 0,
        }}>›</span>
      </button>

      {/* Expanded bullets */}
      {open && bullets.length > 0 && (
        <div style={{ background: 'rgba(15,23,42,0.01)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          {bullets.map((b, bi) => (
            <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px', borderBottom: bi < bullets.length - 1 ? '0.5px solid rgba(15,23,42,0.05)' : 'none' }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#475569' }}>{b}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function NextUpPickCard({
  featured,
  cards,
  withdrawnPlayerIds,
}: NextUpPickCardProps) {
  const allItems: Array<WinnerProfile | ContenderCard> = [
    featured,
    ...cards.filter(c => c.type === 'contender').slice(0, 2),
  ];

  return (
    <div>
      {/* Section header */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
            AI Tournament Picks
          </span>
          <span style={{ fontSize: 9, color: '#94A3B8', letterSpacing: '0.06em' }}>
            CLAUDE · GPT-4 · GEMINI
          </span>
        </div>
      </div>

      {/* Flat ruled table */}
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        {allItems.map((item, i) => (
          <PickRow
            key={item.id}
            item={item}
            index={i}
            isTop={i === 0}
            isWithdrawn={!!withdrawnPlayerIds?.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
