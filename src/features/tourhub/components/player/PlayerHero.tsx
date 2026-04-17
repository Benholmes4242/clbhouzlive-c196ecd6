/**
 * PlayerHero - Dispatch-style slate editorial header with headshot.
 * Mirrors LeadersMasthead structure: amber eyebrow, double-rule band with H1 name,
 * cover story with 72px ghost rank + sub-eyebrow + amber stat, headshot right, 4-col grid.
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
  const tourLabel = player.tour_codes?.[0]?.toUpperCase() ?? 'PGA TOUR';
  const hasWorldRank = playerStats?.world_rank && playerStats.world_rank > 0;

  return (
    <div style={{ background: '#0F172A', padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0' }}>
      {/* Amber eyebrow */}
      <div style={{ fontSize: '15px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: '10px' }}>
        ⚡ CLBHOUZ · PLAYER PROFILE
      </div>

      {/* Masthead double-rule band */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
          {player.full_name}
        </h1>
        {/* Stat context row — country / age / tour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <CountryFlag country={player.country} size="sm" />
          {countryDisplay && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{countryDisplay}</span>
          )}
          {age && (
            <>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>Age {age}</span>
            </>
          )}
        </div>
      </div>

      {/* Cover story — ghost rank + sub-eyebrow + amber stat / headshot right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: 0 }}>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: '14px' }}>
          {hasWorldRank ? (
            <>
              {/* Large ghost rank number */}
              <div style={{ fontSize: '72px', fontWeight: 900, color: 'rgba(247,147,30,0.12)', lineHeight: 0.85, letterSpacing: '-0.05em', marginBottom: '2px' }}>
                {playerStats!.world_rank}
              </div>
              {/* Sub-eyebrow */}
              <div style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
                World Ranking · {tourLabel}
              </div>
              {/* Amber stat value */}
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em' }}>
                World #{playerStats!.world_rank}
              </span>
            </>
          ) : (
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: '6px' }}>
              {tourLabel}
            </div>
          )}
        </div>

        {/* Right — headshot, bottom-anchored */}
        <div style={{ flexShrink: 0, width: '100px', alignSelf: 'flex-end' }}>
          <div style={{ width: '100px', height: '120px', borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
            <img
              src={heroPhotoUrl}
              alt={player.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
              onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
            />
          </div>
        </div>
      </div>

      {/* 4-col key stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        {[
          { label: 'WORLD', value: playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : '—', accent: true },
          { label: 'FEDEX', value: playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : '—', accent: false },
          { label: 'WINS', value: playerStats?.wins != null ? String(playerStats.wins) : '—', accent: playerStats?.wins != null && playerStats.wins > 0 },
          { label: 'EARNED', value: playerStats?.earnings != null && playerStats.earnings > 0
              ? playerStats.earnings >= 1_000_000 ? `$${(playerStats.earnings / 1_000_000).toFixed(1)}M` : `$${Math.round(playerStats.earnings / 1_000)}K`
              : '—', accent: false },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '9px 0 11px', textAlign: 'center', borderRight: i < 3 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ fontSize: '9.5px', fontWeight: 900, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', marginBottom: '3px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: s.accent ? '#F7931E' : '#ffffff', letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
