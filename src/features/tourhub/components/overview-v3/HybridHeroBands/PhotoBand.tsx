/**
 * PhotoBand — Tour Overview hero photo band.
 *
 * Composes the state-aware lower third:
 *   1. Eyebrow (state tag · tour · optional MAJOR gold chip)
 *   2. Title (uppercase, 2-line clamp)
 *   3. Venue + state suffix (Final round complete / Round n in play / dates)
 *   4. Insight line (courseAnalysis.insight — optional, 2-line clamp)
 *   5. Moment row — champion (gold ring + Won by n) / leader (avatar + score+THRU)
 *      / defender + countdown (upcoming)
 *   6. TOURNAMENT › affordance
 *
 * Sits above HeroWireTicker inside HybridHero.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { PlayerAvatar } from '../../PlayerAvatar';
import { NUMERIC_STYLE } from '../HybridHero.constants';
import { FONT } from '../../../_shared/tokens';
import type { HeroState } from '../HybridHero.utils';

const AMBER_GRADIENT = 'linear-gradient(135deg, #FDE68A 0%, #F7931E 100%)';
const AMBER = '#F7931E';
const INK = '#0E1013';

const SCRIM =
  'linear-gradient(180deg, rgba(10,14,20,0.25) 0%, rgba(10,14,20,0.02) 34%, rgba(10,14,20,0.72) 78%, rgba(10,14,20,0.88) 100%)';

const FALLBACK_GRADIENT =
  'linear-gradient(140deg, #1a3a2a 0%, #2d5a3d 22%, #4a7a5d 48%, #6b9c7a 70%, #b8d4a8 88%, #d4c89c 100%)';

const CLAMP_2: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export interface PhotoBandChampion {
  name: string;
  score?: string | null;
  avatarUrl?: string | null;
  avatarCandidates?: string[];
  playoffWin?: boolean;
  /** Optional "Won by n" margin string. */
  wonBy?: string | null;
}

export interface PhotoBandDefender {
  name: string;
  photoUrl?: string | null;
  year?: string | number | null;
  tourCode?: string | null;
}

export interface PhotoBandLeader {
  name: string;
  score?: string | null;
  thru?: string | null;
  photoUrl?: string | null;
  tourCode?: string | null;
  /** When >1, renders "TIED LEAD · n" instead of "LEADER". */
  tiedCount?: number | null;
}

interface PhotoBandProps {
  title: string;
  tourLabel?: string | null;
  state: HeroState;
  venueName?: string | null;
  venueCity?: string | null;
  venueImageUrl?: string | null;
  datesString?: string | null;
  isMajor?: boolean;
  isPseudoMajor?: boolean;
  insight?: string | null;
  champion?: PhotoBandChampion | null;
  leader?: PhotoBandLeader | null;
  defender?: PhotoBandDefender | null;
  onTournamentTap?: () => void;
  /** Height contract (must match HybridHero photo-band height). */
  height?: number;
}

function StateEyebrow({
  state,
  tourLabel,
  showMajorTag,
  t,
}: {
  state: HeroState;
  tourLabel?: string | null;
  showMajorTag?: boolean;
  t: (k: string, o?: any) => string;
}) {
  let statusText = '';
  let statusColor = 'rgba(255,255,255,0.75)';
  let showPulse = false;

  if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      statusText = 'CANCELLED';
      statusColor = 'rgba(255,255,255,0.80)';
    } else {
      statusText = t('hero.finalTag', { defaultValue: 'FINAL' });
      statusColor = '#FDE68A';
    }
  } else if (state.kind === 'live') {
    statusText = t('hero.live', { defaultValue: 'LIVE' });
    statusColor = '#FF6B6B';
    showPulse = true;
  } else {
    statusText = t('hero.upcomingTag', { defaultValue: 'UPCOMING' });
    statusColor = 'rgba(255,255,255,0.85)';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: FONT,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: statusColor }}>
        {showPulse && (
          <span
            className="hybrid-live-pulse"
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: '#FF6B6B',
              display: 'inline-block',
            }}
          />
        )}
        {statusText}
      </span>
      {tourLabel && (
        <>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.75)' }}>{tourLabel}</span>
        </>
      )}
      {showMajorTag && (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 3,
            background: AMBER_GRADIENT,
            color: INK,
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: '0.14em',
          }}
        >
          MAJOR
        </span>
      )}
    </div>
  );
}

function VenueLine({
  venueName,
  venueCity,
  state,
  datesString,
  t,
}: {
  venueName?: string | null;
  venueCity?: string | null;
  state: HeroState;
  datesString?: string | null;
  t: (k: string, o?: any) => string;
}) {
  let suffix: string | null = null;
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      suffix = t('hero.eventCancelled', { defaultValue: 'Event cancelled' });
    } else {
      suffix = t('hero.finalRoundComplete', { defaultValue: 'Final round complete' });
    }
  } else if (state.kind === 'live') {
    suffix = t('hero.roundInPlay', { defaultValue: 'Round {{n}} in play', n: state.round });
  } else if (state.kind === 'upcoming') {
    suffix = datesString;
  }

  const venue = [venueName, venueCity].filter(Boolean).join(' · ');
  const parts = [venue, suffix].filter(Boolean);
  if (parts.length === 0) return null;

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.78)',
        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {parts.join(' · ')}
    </div>
  );
}

function ChampionRow({
  champion,
  t,
}: {
  champion: PhotoBandChampion;
  t: (k: string, o?: any) => string;
}) {
  const avatarSrc = champion.avatarUrl ?? champion.avatarCandidates?.[0] ?? null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          padding: 2,
          borderRadius: 12,
          background: AMBER_GRADIENT,
          boxShadow: '0 4px 16px rgba(247,147,30,0.35)',
        }}
      >
        <PlayerAvatar
          playerId={champion.name}
          playerName={champion.name}
          photoUrl={avatarSrc}
          size="md"
          ringColor="rgba(0,0,0,0)"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 3 }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: '#FDE68A',
            textTransform: 'uppercase',
          }}
        >
          ★ {t('hero.champion', { defaultValue: 'Champion' })}
          {champion.playoffWin ? ` · ${t('hero.playoff', { defaultValue: 'Playoff' })}` : ''}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 800,
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {champion.name}
        </span>
        {(champion.score || champion.wonBy) && (
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.78)',
              letterSpacing: '0.02em',
            }}
          >
            {champion.score ?? ''}
            {champion.score && champion.wonBy ? ' · ' : ''}
            {champion.wonBy ? t('hero.wonBy', { defaultValue: 'Won by {{margin}}', margin: champion.wonBy }) : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function LeaderRow({
  leader,
  t,
}: {
  leader: PhotoBandLeader;
  t: (k: string, o?: any) => string;
}) {
  const label = (leader.tiedCount ?? 0) > 1
    ? t('hero.tiedLead', { defaultValue: 'Tied lead · {{n}}', n: leader.tiedCount })
    : t('hero.leader', { defaultValue: 'Leader' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <PlayerAvatar
        playerId={leader.name}
        playerName={leader.name}
        photoUrl={leader.photoUrl ?? null}
        tourCode={leader.tourCode ?? 'pga'}
        size="md"
      />
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 3 }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: '#FF6B6B',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 800,
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {leader.name}
        </span>
        {(leader.score || leader.thru) && (
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.82)',
              letterSpacing: '0.02em',
            }}
          >
            {leader.score ?? ''}
            {leader.score && leader.thru ? ' · ' : ''}
            {leader.thru ?? ''}
          </span>
        )}
      </div>
    </div>
  );
}

function DefenderRow({
  defender,
  countdown,
  t,
}: {
  defender: PhotoBandDefender;
  countdown?: string | null;
  t: (k: string, o?: any) => string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <PlayerAvatar
          playerId={defender.name}
          playerName={defender.name}
          photoUrl={defender.photoUrl ?? null}
          tourCode={defender.tourCode ?? 'pga'}
          size="md"
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 3 }}>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.16em',
              color: '#FDE68A',
              textTransform: 'uppercase',
            }}
          >
            {t('hero.defends', { defaultValue: 'Defends' })}
            {defender.year != null ? ` · ${defender.year}` : ''}
          </span>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 800,
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {defender.name}
          </span>
        </div>
      </div>
      {countdown && (
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 13,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.55)',
          }}
        >
          {countdown}
        </span>
      )}
    </div>
  );
}

export function PhotoBand({
  title,
  tourLabel,
  state,
  venueName,
  venueCity,
  venueImageUrl,
  datesString,
  isMajor,
  isPseudoMajor,
  insight,
  champion,
  leader,
  defender,
  onTournamentTap,
  height = 480,
}: PhotoBandProps) {
  const { t } = useTranslation('tourhub');
  const showMajorTag = !!(isMajor && !isPseudoMajor);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        flexShrink: 0,
        background: FALLBACK_GRADIENT,
      }}
    >
      {venueImageUrl && (
        <img
          src={venueImageUrl}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0,
          }}
        />
      )}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: SCRIM, zIndex: 1 }} />

      {/* Lower third */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <StateEyebrow state={state} tourLabel={tourLabel} showMajorTag={showMajorTag} t={t} />

        <h1
          className="hybrid-hero-title"
          style={{
            margin: 0,
            fontFamily: FONT,
            fontSize: 'clamp(24px, 8.5vw, 38px)',
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: '-0.025em',
            color: 'white',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
            textTransform: 'uppercase',
            ...CLAMP_2,
          }}
        >
          {title}
        </h1>

        <VenueLine
          venueName={venueName}
          venueCity={venueCity}
          state={state}
          datesString={datesString}
          t={t}
        />

        {insight && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'rgba(255,255,255,0.86)',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              ...CLAMP_2,
            }}
          >
            {insight}
          </div>
        )}

        <div style={{ marginTop: 4 }}>
          {state.kind === 'results' && champion && <ChampionRow champion={champion} t={t} />}
          {state.kind === 'live' && leader && <LeaderRow leader={leader} t={t} />}
          {state.kind === 'upcoming' && defender && (
            <DefenderRow
              defender={defender}
              countdown={state.countdown || null}
              t={t}
            />
          )}
        </div>

        {onTournamentTap && (
          <button
            type="button"
            onClick={onTournamentTap}
            style={{
              alignSelf: 'flex-start',
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 0',
              background: 'transparent',
              border: 'none',
              color: AMBER,
              fontFamily: FONT,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
            }}
          >
            {t('hero.tournamentCta', { defaultValue: 'Tournament' })}
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PhotoBand;
