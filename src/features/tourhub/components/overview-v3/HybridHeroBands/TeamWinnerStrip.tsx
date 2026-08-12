/**
 * TeamWinnerStrip — gold-tinted team-event winner strip.
 * Used by Results state when the winning entry is a team (LIV team events).
 * Per HYBRID_HERO_PATCH_01_BRIEF §3.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { INK, GOLD, NUMERIC_STYLE, STRIP_HEIGHT } from '../HybridHero.constants';

import { SLATE_800, WHITE_ALPHA_55 } from '../../../_shared/tokens';

export interface TeamWinnerStripProps {
  teamName: string;
  members: { fullName: string; photoUrl: string | null }[];
  score: string;
  scoreLabel?: string;
  eyebrow?: string;
  eyebrowIcon?: LucideIcon;
  teamColor?: string;
  teamCrestUrl?: string | null;
}

function surnameOnly(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function TeamCrestTile({
  teamName,
  teamColor,
  teamCrestUrl,
}: {
  teamName: string;
  teamColor?: string;
  teamCrestUrl?: string | null;
}) {
  const size = 42;
  if (teamCrestUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          background: `url(${teamCrestUrl}) center/cover, ${teamColor || SLATE_800}`,
          boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
    );
  }

  const initial = teamName.charAt(0).toUpperCase() || '·';
  const bg = teamColor
    ? `linear-gradient(135deg, ${teamColor} 0%, ${teamColor} 100%)`
    : 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: bg,
        boxShadow: '0 0 0 2px rgba(251,188,46,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        ...NUMERIC_STYLE,
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: '-0.02em',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export function TeamWinnerStrip({
  teamName,
  members,
  score,
  scoreLabel,
  eyebrow,
  eyebrowIcon: EyebrowIcon = Trophy,
  teamColor,
  teamCrestUrl,
}: TeamWinnerStripProps) {
  const { t } = useTranslation('tourhub');
  const eyebrowText = eyebrow ?? t('overview.teamWinnerStrip.eyebrow');
  const membersDisplay = members
    .slice(0, 4)
    .map(m => surnameOnly(m.fullName))
    .filter(Boolean)
    .join(' · ');

  // Auto-derive label: vs-par formatting → labelVsPar, else strokes total
  const derivedLabel =
    scoreLabel ??
    (score.startsWith('\u2212') || score.startsWith('+') || score === 'E'
      ? t('overview.teamWinnerStrip.labelVsPar')
      : t('overview.teamWinnerStrip.labelStrokes'));

  return (
    <div
      style={{
        background: INK,
        padding: '10px 20px',
        minHeight: STRIP_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 100% at 0% 50%, rgba(251,188,46,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <TeamCrestTile teamName={teamName} teamColor={teamColor} teamCrestUrl={teamCrestUrl} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: GOLD, marginBottom: 2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <EyebrowIcon size={10} color={GOLD} strokeWidth={2.5} />
          {eyebrowText}
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.1,
          }}
        >
          {teamName}
        </div>
        {membersDisplay && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: WHITE_ALPHA_55,
              letterSpacing: '0.02em',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {membersDisplay}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', position: 'relative' }}>
        <div
          style={{
            ...NUMERIC_STYLE,
            fontSize: 26,
            fontWeight: 300,
            color: GOLD,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFeatureSettings: '"tnum" 1, "kern" 1',
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.50)',
            letterSpacing: '0.16em',
            marginTop: 2,
          }}
        >
          {derivedLabel}
        </div>
      </div>
    </div>
  );
}
