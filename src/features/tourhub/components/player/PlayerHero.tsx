/**
 * PlayerHero - Dispatch-style slate editorial header with headshot.
 *
 * Restructured to match the Stat Watch / College Franchise masthead family:
 *   1. Amber eyebrow (⚡ CLBHOUZ · PLAYER)
 *   2. Double-rule band (section title + tour codes)
 *   3. Cover story row (status eyebrow → flag → name → hero amber stat → photo)
 *   4. Narrative pills row (Live / Recent / Form / Inactive)
 *
 * State-aware via usePlayerState; pills follow Live > Recent > In-form > Inactive
 * priority. Ghost rank watermark renders behind the cover story when world rank
 * exists.
 */

import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { usePlayerState } from '../../hooks/usePlayerState';
import { PillView, type MastheadPill } from '../leaders/LeadersMasthead';
import { LivePulse } from '../shared/LivePulse';
import { truncateName } from '../../utils/truncateName';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

/**
 * Format earnings number as compact currency string ($6.7M / $850K).
 */
function formatEarnings(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

/**
 * Pure helper — pick the single most relevant hero stat for the player.
 * Priority: live score > recent finish > season earnings > world rank > age.
 * Always returns something (never null).
 */
function chooseHeroStat(
  player: TourPlayer,
  playerStats: TourPlayerStatistics | null,
  playerState: ReturnType<typeof usePlayerState>,
): { primary: string } {
  // 1. Live tournament
  if (playerState.state === 'live' && playerState.liveData) {
    const ld = playerState.liveData;
    const round = ld.currentRound ? ` · R${ld.currentRound}` : '';
    return { primary: `${ld.scoreText}${round}` };
  }

  // 2. Recent finish (within 14 days, per usePlayerState window)
  if (playerState.state === 'recent' && playerState.recentData) {
    const rd = playerState.recentData;
    const ctx = rd.context ? ` at ${truncateName(rd.context, 18)}` : '';
    return { primary: `${rd.label}${ctx}` };
  }

  // 3. Season earnings
  if (playerStats?.earnings && playerStats.earnings > 0) {
    return { primary: `${formatEarnings(playerStats.earnings)} earned` };
  }

  // 4. World rank fallback
  if (playerStats?.world_rank && playerStats.world_rank > 0) {
    return { primary: `World #${playerStats.world_rank}` };
  }

  // 5. Age fallback
  if (player.birth_date) {
    const age = Math.floor(
      (Date.now() - new Date(player.birth_date).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );
    if (age > 0) return { primary: `Age ${age}` };
  }

  return { primary: 'Player profile' };
}

function buildHeroPills(
  seasonWins: number | null,
  state: ReturnType<typeof usePlayerState>,
): MastheadPill[] {
  const pills: MastheadPill[] = [];

  switch (state.state) {
    case 'live': {
      const ld = state.liveData!;
      const truncated = truncateName(ld.tournamentName, 20);
      pills.push({
        variant: 'live',
        value: `${ld.scoreText} at ${truncated}`,
        prefix: <LivePulse />,
      });
      if (ld.currentRound) {
        pills.push({ variant: 'normal', value: `Round ${ld.currentRound}` });
      }
      break;
    }
    case 'recent': {
      const rd = state.recentData!;
      pills.push({ variant: 'normal', value: rd.label });
      if (rd.context) {
        pills.push({ variant: 'normal', value: truncateName(rd.context, 24) });
      }
      break;
    }
    case 'inform': {
      pills.push({
        variant: 'normal',
        value: `${state.eventsLast12mo} starts last 12 mo`,
      });
      if (seasonWins && seasonWins > 0) {
        pills.push({
          variant: 'normal',
          value: `${seasonWins} ${seasonWins === 1 ? 'win' : 'wins'} this season`,
        });
      }
      break;
    }
    case 'inactive': {
      pills.push({
        variant: 'normal',
        value: `Last played ${state.inactiveData!.lastEventLabel}`,
      });
      break;
    }
  }

  return pills;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const heroPhotoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;
  const worldRank = playerStats?.world_rank && playerStats.world_rank > 0
    ? playerStats.world_rank
    : null;
  const seasonWins = playerStats?.wins ?? null;

  const playerState = usePlayerState(player.id);
  const pills = buildHeroPills(seasonWins, playerState);
  const heroStat = chooseHeroStat(player, playerStats, playerState);

  // Status eyebrow — WORLD #N · AGE NN (or PLAYER · AGE NN)
  const statusEyebrow = [
    worldRank ? `WORLD #${worldRank}` : 'PLAYER',
    age ? `AGE ${age}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        position: 'relative',
        background: '#0F172A',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 14px',
        overflow: 'hidden',
      }}
    >
      {/* Ghost rank watermark — behind cover story */}
      {worldRank && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -10,
            bottom: 80,
            fontSize: '220px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.04)',
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            pointerEvents: 'none',
            zIndex: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {worldRank}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 1. Amber eyebrow */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 900,
            color: '#F7931E',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          ⚡ CLBHOUZ · PLAYER
        </div>

        {/* 2. Masthead double-rule band — section descriptor + tour codes */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
            Player Profile
          </h1>
          {player.tour_codes && player.tour_codes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Tours</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 }}>
                {player.tour_codes.map(c => c.toUpperCase()).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* 3. Cover story row — identity stack + headshot */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 0 }}>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            {/* Status eyebrow */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: '#F7931E', letterSpacing: '0.12em' }}>
                {statusEyebrow}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <CountryFlag country={player.country_code || player.country} size="sm" />
                {countryDisplay && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{countryDisplay}</span>
                )}
              </div>
            </div>

            {/* Player name */}
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
              {player.full_name}
            </div>

            {/* Hero amber stat */}
            <span style={{ fontSize: 20, fontWeight: 900, color: '#F7931E', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {heroStat.primary}
            </span>
          </div>

          {/* RIGHT — headshot, bottom-anchored */}
          <div style={{ flexShrink: 0, width: 100, alignSelf: 'flex-end' }}>
            <div style={{ width: 100, height: 120, borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
              <img
                src={heroPhotoUrl}
                alt={player.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            </div>
          </div>
        </div>

        {/* 4. Narrative pills — bottom of band */}
        {pills.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 12,
            }}
          >
            {pills.map((p, i) => (
              <PillView key={i} pill={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
