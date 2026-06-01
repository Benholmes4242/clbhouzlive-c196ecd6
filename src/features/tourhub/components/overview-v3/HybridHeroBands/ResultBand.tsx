/**
 * ResultBand — Pass 7 broadcast-style results spread.
 * Replaces ChampionStrip for results.standard state. Conditionally renders
 * narrative + support row only when data exists; never fakes.
 */

import React from 'react';
import { Crown } from 'lucide-react';
import { INK, AMBER, NUMERIC_STYLE } from '../HybridHero.constants';
import { GOLD_DEEP, LEADER_GOLD as GOLD, SLATE_800, WHITE_ALPHA_10, WHITE_ALPHA_65 } from '../../../_shared/tokens';
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

function formatPurse(purse: number, currency: string | null | undefined): string {
  const prefix = currency === 'USD' || !currency ? '$' : '';
  if (purse >= 1_000_000) return `${prefix}${(purse / 1_000_000).toFixed(2)}M`;
  if (purse >= 1_000) return `${prefix}${Math.round(purse / 1_000)}K`;
  return `${prefix}${purse}`;
}

interface ResultBandProps {
  winnerName: string;
  winnerPhotoUrl: string | null;
  winnerScore: string;
  winnerCountry?: string | null;
  scoreLabel?: string;
  narrative?: string | null;
  purse?: number | null;
  currency?: string | null;
  defendingChampion?: string | null;
}

function PlayerHead({ src, size = 56 }: { src?: string | null; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '34%',
        background: src
          ? `url(${src}) center/cover`
          : `linear-gradient(135deg, #475569 0%, ${SLATE_800} 100%)`,
        boxShadow: '0 0 0 1.5px #F7931E, 0 6px 20px rgba(247,147,30,0.18)',
        flexShrink: 0,
      }}
    />
  );
}

interface SupportCellProps {
  label: string;
  value: string;
  align?: 'left' | 'right';
  numeric?: boolean;
}

function SupportCell({ label, value, align = 'left', numeric }: SupportCellProps) {
  const textAlign = align === 'right' ? 'right' : 'left';
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          ...(numeric ? NUMERIC_STYLE : null),
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function ResultBand({
  winnerName,
  winnerPhotoUrl,
  winnerScore,
  winnerCountry,
  scoreLabel = 'TO PAR',
  narrative,
  purse,
  currency,
  defendingChampion,
}: ResultBandProps) {
  const hasNarrative = !!(narrative && narrative.trim().length > 0);
  const hasPurse = !!(purse && purse > 0);
  const hasDefending = !!(defendingChampion && defendingChampion.trim().length > 0);
  const hasAnySupport = hasPurse || hasDefending;
  const flag = countryToFlag(winnerCountry);

  return (
    <div
      style={{
        position: 'relative',
        background: INK,
        padding: '14px 20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Amber chyron stripe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${AMBER} 0%, rgba(247,147,30,0) 70%)`,
        }}
      />

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <PlayerHead src={winnerPhotoUrl} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.18em',
              color: GOLD,
              textTransform: 'uppercase',
              marginBottom: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Trophy size={10} color={GOLD} strokeWidth={2.5} />
            CHAMPION
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 19,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{winnerName}</span>
            {flag && <span style={{ fontSize: 14, flexShrink: 0 }}>{flag}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              ...NUMERIC_STYLE,
              fontSize: 36,
              fontWeight: 300,
              color: GOLD,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {winnerScore}
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.50)',
              letterSpacing: '0.16em',
              marginTop: 3,
            }}
          >
            {scoreLabel}
          </div>
        </div>
      </div>

      {hasNarrative && (
        <div
          aria-label="Tournament narrative"
          style={{
            color: WHITE_ALPHA_65,
            fontSize: 12,
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.4,
            letterSpacing: '-0.005em',
            fontFamily: "'Geist', sans-serif",
          }}
        >
          {narrative}
        </div>
      )}

      {hasAnySupport && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            paddingTop: 10,
            borderTop: `0.5px solid ${WHITE_ALPHA_10}`,
          }}
        >
          {hasPurse && (
            <SupportCell label="TOTAL PURSE" value={formatPurse(purse!, currency)} numeric />
          )}
          {hasDefending && (
            <SupportCell label="REPLACES" value={defendingChampion!} align={hasPurse ? 'right' : 'left'} />
          )}
        </div>
      )}
    </div>
  );
}
