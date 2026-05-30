/**
 * TopThreePeek — Pass 7. Replaces 4-row chaser leaderboard with 3-row peek
 * plus a "FULL LEADERBOARD ›" CTA in the section header.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { INK_15, AMBER, NUMERIC_STYLE } from '../HybridHero.constants';
import { SLATE_50, INK, FONT } from '../../../_shared/tokens';
import { getFlagCode } from '@/utils/countryFlags';

function countryToFlag(country: string | null | undefined): string {
  const code = getFlagCode(country ?? undefined);
  if (!code || code.length !== 2) return '';
  const A = 0x1f1e6;
  const base = 'A'.charCodeAt(0);
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - base),
    A + (code.charCodeAt(1) - base),
  );
}

export interface TopThreePeekRow {
  rank: string;
  name: string;
  photoUrl: string | null;
  country: string | null;
  score: string;
}

interface TopThreePeekProps {
  rows: TopThreePeekRow[];
  onFullLeaderboardTap: () => void;
}

function Avatar({ src }: { src: string | null }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 26,
        height: 26,
        borderRadius: '34%',
        flexShrink: 0,
        background: src
          ? `url(${src}) center/cover`
          : 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
      }}
    />
  );
}

export function TopThreePeek({ rows, onFullLeaderboardTap }: TopThreePeekProps) {
  if (!rows || rows.length === 0) return null;
  const peek = rows.slice(0, 3);

  return (
    <div style={{ background: SLATE_50 }}>
      <div
        style={{
          padding: '14px 20px 8px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          ↘ THE FIELD
        </span>
        <button
          type="button"
          onClick={onFullLeaderboardTap}
          style={{
            background: 'transparent',
            border: 'none',
            color: AMBER,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
            fontFamily: FONT,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            FULL LEADERBOARD
            <ChevronRight size={11} strokeWidth={2.5} color="currentColor" />
          </span>
        </button>
      </div>

      <div style={{ borderTop: `0.5px solid ${INK_15}` }}>
        {peek.map((row, i) => {
          const flag = countryToFlag(row.country);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                height: 38,
                padding: '0 20px',
                borderBottom: i === peek.length - 1 ? 'none' : `0.5px solid ${INK_15}`,
              }}
            >
              <span
                style={{
                  ...NUMERIC_STYLE,
                  width: 26,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(15,23,42,0.55)',
                  flexShrink: 0,
                }}
              >
                {row.rank}
              </span>
              <Avatar src={row.photoUrl} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span>
                {flag && <span style={{ fontSize: 11, flexShrink: 0 }}>{flag}</span>}
              </span>
              <span
                style={{
                  ...NUMERIC_STYLE,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0F172A',
                  flexShrink: 0,
                }}
              >
                {row.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
