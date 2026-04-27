/**
 * PlayerHero - Dispatch-style slate editorial header with headshot.
 *
 * State-aware (D7): consumes usePlayerState to render narrative pills above
 * the masthead instead of the legacy ⚡ CLBHOUZ · PLAYER PROFILE eyebrow chip.
 * Pills follow Live > Recent > In-form > Inactive priority. Ghost rank
 * watermark renders behind the cover story when a world rank exists.
 */

import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { usePlayerState } from '../../hooks/usePlayerState';
import { PillView, type MastheadPill } from '../leaders/LeadersMasthead';
import { LivePulse } from '../shared/LivePulse';
import { TourChipGroup } from '../shared/TourChipGroup';
import { truncateName } from '../../utils/truncateName';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

function buildHeroPills(
  worldRank: number | null,
  seasonWins: number | null,
  state: ReturnType<typeof usePlayerState>,
): MastheadPill[] {
  const pills: MastheadPill[] = [];

  // World rank — always first when present.
  if (worldRank && worldRank > 0) {
    pills.push({ variant: 'highlight', value: `World #${worldRank}` });
  }

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
  const pills = buildHeroPills(worldRank, seasonWins, playerState);

  return (
    <div
      style={{
        position: 'relative',
        background: '#0F172A',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px 0',
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
            bottom: 40,
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
        {/* Narrative pills — replaces eyebrow chip */}
        {pills.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 12,
            }}
          >
            {pills.map((p, i) => (
              <PillView key={i} pill={p} />
            ))}
          </div>
        )}

        {/* Masthead double-rule band */}
        <div style={{ borderTop: '2px solid rgba(255,255,255,0.15)', borderBottom: '0.5px solid rgba(255,255,255,0.08)', padding: '10px 0', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>
            {player.full_name}
          </h1>
          {/* Stat context row — country / age */}
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
          {/* Tour chip group — multi-tour honest (D4) */}
          {player.tour_codes && player.tour_codes.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <TourChipGroup codes={player.tour_codes} />
            </div>
          )}
        </div>

        {/* Cover story row — headshot bottom-anchored */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: 0, minHeight: 88 }}>
          <div style={{ flex: 1, minWidth: 0, paddingBottom: '14px' }} />

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
            { label: 'WORLD', value: worldRank ? `#${worldRank}` : '—', accent: !!worldRank },
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
    </div>
  );
}
