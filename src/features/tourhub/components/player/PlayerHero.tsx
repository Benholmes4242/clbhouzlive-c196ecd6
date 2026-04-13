/**
 * PlayerHero - Dispatch-style slate editorial header with headshot.
 */

import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const heroPhotoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;

  return (
    <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
      {/* Amber eyebrow */}
      <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
        ⚡ CLBHOUZ · PLAYER PROFILE
      </div>

      {/* Identity row — text left, headshot right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: 0 }}>
        {/* Left — rank eyebrow + name + country */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: '14px' }}>
          {/* World rank eyebrow */}
          {playerStats?.world_rank && playerStats.world_rank > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'rgba(247,147,30,0.2)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                {playerStats.world_rank}
              </span>
              <div>
                <div style={{ fontSize: '8.5px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em' }}>WORLD RANKING</div>
                <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>
                  {player.tour_codes?.[0]?.toUpperCase() ?? 'PGA TOUR'}
                </div>
              </div>
            </div>
          )}

          {/* Player name */}
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 6px' }}>
            {player.full_name}
          </h1>

          {/* Country + age */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CountryFlag country={player.country} size="sm" />
            {countryDisplay && (
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{countryDisplay}</span>
            )}
            {age && (
              <>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Age {age}</span>
              </>
            )}
          </div>
        </div>

        {/* Right — headshot, bottom-anchored */}
        <div style={{ flexShrink: 0, width: '110px', alignSelf: 'flex-end' }}>
          <div style={{ width: '110px', height: '130px', borderRadius: '14px 14px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
            <img
              src={heroPhotoUrl}
              alt={player.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
              onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          </div>
        </div>
      </div>

      {/* 4-col key stats grid — flat, on slate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        {[
          { label: 'WORLD', value: playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : '—', accent: true },
          { label: 'FEDEX', value: playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : '—', accent: false },
          { label: 'WINS', value: playerStats?.wins != null ? String(playerStats.wins) : '—', accent: playerStats?.wins != null && playerStats.wins > 0 },
          { label: 'EARNED', value: playerStats?.earnings != null && playerStats.earnings > 0
              ? playerStats.earnings >= 1_000_000 ? `$${(playerStats.earnings / 1_000_000).toFixed(1)}M` : `$${Math.round(playerStats.earnings / 1_000)}K`
              : '—', accent: false },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '10px 0 12px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: '8.5px', fontWeight: 900, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: '3px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: s.accent ? '#F7931E' : '#ffffff', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
