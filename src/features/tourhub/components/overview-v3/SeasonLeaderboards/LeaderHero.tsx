/**
 * LeaderHero - Cinematic Champion Spotlight Card
 * 
 * Full-width, softly elevated. Discipline-tinted gradient.
 * Big stat number with subtle glow. "SEASON LEADER" label.
 * Apple Fitness hero energy — not gaming UI.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '@/components/ui/country-flag';
import type { LeaderboardPlayer } from './types';
import type { CategoryId } from './StatCategoryIcons';
import { CATEGORY_ACCENT_COLORS } from './constants';
import { getPgaTourHeadshotUrl } from '@/features/tourhub/utils/resolvePhotoUrl';

interface LeaderHeroProps {
  player: LeaderboardPlayer;
  accentColor: CategoryId;
}

function formatCountryName(country: string | null): string {
  if (!country) return '';
  return country.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export const LeaderHero = memo(function LeaderHero({ player, accentColor }: LeaderHeroProps) {
  const navigate = useNavigate();
  const photoUrl = player.photoUrl || (player.playerId ? getPgaTourHeadshotUrl(player.playerId) : null);
  const accent = CATEGORY_ACCENT_COLORS[accentColor];

  return (
    <button
      onClick={() => navigate(`/tourhub/player/${player.playerId}`)}
      className="w-full text-left relative overflow-hidden active:scale-[0.99] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        padding: '28px 24px',
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        outlineColor: accent.primary,
      }}
      aria-label={`Season leader: ${player.playerName}, ${player.statDisplayValue} ${player.statUnit}`}
    >
      {/* Subtle discipline-tinted gradient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${accent.bgLight} 0%, transparent 50%, ${accent.bgLight}44 100%)`,
          borderRadius: '20px',
        }}
      />

      <div className="relative">
        {/* Row 1: Avatar + Name + "SEASON LEADER" badge */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          {/* Avatar with subtle accent ring */}
          <div className="relative flex-shrink-0">
            <div
              className="overflow-hidden"
              style={{
                width: '68px', height: '68px', borderRadius: '18px',
                border: `2px solid ${accent.border}`,
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={player.playerName}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                    if (fb) (fb as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="fallback-initials w-full h-full flex items-center justify-center"
                style={{
                  display: photoUrl ? 'none' : 'flex',
                  background: `linear-gradient(135deg, ${accent.bgMedium} 0%, ${accent.bgLight} 100%)`,
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 700, color: accent.textMuted }}>
                  {player.initials}
                </span>
              </div>
            </div>

            {/* #1 badge */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: '-5px', right: '-5px',
                width: '22px', height: '22px', borderRadius: '8px',
                background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.primary}dd 100%)`,
                border: '2px solid #FFFFFF',
                boxShadow: `0 2px 6px ${accent.shadow}`,
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>1</span>
            </div>
          </div>

          {/* Name + Country */}
          <div className="flex-1 min-w-0">
            <span
              className="block truncate"
              style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em', color: 'hsl(var(--foreground))' }}
            >
              {player.playerName}
            </span>
            <div className="flex items-center mt-1" style={{ gap: '5px' }}>
              <div style={{ width: '14px', height: '10px', borderRadius: '1px' }}>
                <CountryFlag country={player.countryCode} size="sm" />
              </div>
              <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                {formatCountryName(player.countryCode)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Hero stat number with soft glow */}
        <div className="relative" style={{ marginTop: '20px' }}>
          {/* Very soft gradient glow behind number */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-10px', left: '-20px', right: '-20px', bottom: '-10px',
              background: `radial-gradient(ellipse at center, ${accent.bgLight} 0%, transparent 70%)`,
              opacity: 0.6,
            }}
          />
          <div className="relative flex items-baseline" style={{ gap: '4px' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '52px', fontWeight: 800, letterSpacing: '-2.5px', lineHeight: 1,
                color: accent.primary,
                transition: 'color 0.3s ease',
              }}
            >
              {player.statDisplayValue}
            </span>
            {player.statUnit && (
              <span style={{ fontSize: '18px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginLeft: '4px' }}>
                {player.statUnit}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: "SEASON LEADER" label */}
        <p
          className="m-0"
          style={{
            marginTop: '6px', fontSize: '10px', fontWeight: 700,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            color: accent.textMuted,
            transition: 'color 0.3s ease',
          }}
        >
          Season Leader
        </p>
      </div>
    </button>
  );
});