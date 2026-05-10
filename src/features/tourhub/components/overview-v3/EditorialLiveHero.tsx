/**
 * EditorialLiveHero — expanded-state Tour Hero "Live" surface.
 *
 * C2 Editorial · Elastic redesign:
 * - Light theme on #F8FAFC, 70dvh hard cap, no internal scroll
 * - ElasticZone wraps eyebrow + status + title + venue (above the LEADER divider)
 * - LEADER block + 3 chasers + CTA are flex-shrink:0 below the divider
 *
 * The header band scales with viewport height via `t` (0..1) so titles grow on
 * Pro Max and tighten on mini, with no empty band below the CTA on tall devices.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentRoute } from '../../routes';
import { Shimmer } from '../shared/Shimmer';
import { ElasticZone, useElasticT, lerp } from '../shared/ElasticZone';
import {
  TournamentTitleBlock,
  TourBadge,
  StatusBadge,
} from '../shared/TournamentTitleBlock';
import { HeroCTA } from '../shared/HeroCTA';

import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import {
  ink, amber, gold, greenLive,
  lightBg, slate100, slate200, slate300, slate400, slate500,
  fmtScore, fmtScoreSign, PULSE_KEYFRAMES,
} from '../../utils/heroAtmosphere';

const COUNTRY_TO_FLAG: Record<string, string> = {
  'UNITED STATES': '🇺🇸', 'USA': '🇺🇸',
  'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'NORTHERN IRELAND': '🇮🇪',
  'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'WALES': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'IRELAND': '🇮🇪',
  'AUSTRALIA': '🇦🇺', 'CANADA': '🇨🇦', 'JAPAN': '🇯🇵', 'SOUTH AFRICA': '🇿🇦',
  'SPAIN': '🇪🇸', 'GERMANY': '🇩🇪', 'FRANCE': '🇫🇷', 'SWEDEN': '🇸🇪',
  'NORWAY': '🇳🇴', 'DENMARK': '🇩🇰', 'SOUTH KOREA': '🇰🇷', 'CHINA': '🇨🇳',
  'THAILAND': '🇹🇭', 'NEW ZEALAND': '🇳🇿', 'ARGENTINA': '🇦🇷',
  'COLOMBIA': '🇨🇴', 'CHILE': '🇨🇱', 'ITALY': '🇮🇹', 'BELGIUM': '🇧🇪',
};

const COUNTRY_TO_CODE: Record<string, string> = {
  'UNITED STATES': 'USA', 'USA': 'USA',
  'ENGLAND': 'ENG', 'NORTHERN IRELAND': 'NIR',
  'SCOTLAND': 'SCO', 'WALES': 'WAL', 'IRELAND': 'IRL',
  'AUSTRALIA': 'AUS', 'CANADA': 'CAN', 'JAPAN': 'JPN', 'SOUTH AFRICA': 'RSA',
  'SPAIN': 'ESP', 'GERMANY': 'GER', 'FRANCE': 'FRA', 'SWEDEN': 'SWE',
  'NORWAY': 'NOR', 'DENMARK': 'DEN', 'SOUTH KOREA': 'KOR', 'CHINA': 'CHN',
  'THAILAND': 'THA', 'NEW ZEALAND': 'NZL', 'ARGENTINA': 'ARG',
  'COLOMBIA': 'COL', 'CHILE': 'CHI', 'ITALY': 'ITA', 'BELGIUM': 'BEL',
};

function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRY_TO_FLAG[country.toUpperCase()] ?? '';
}
function codeFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRY_TO_CODE[country.toUpperCase()] ?? country.slice(0, 3).toUpperCase();
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTourCode(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA', euro: 'DPW', lpga: 'LPGA', liv: 'LIV',
    champ: 'CHAMP', pgad: 'KFT',
  };
  return map[slug] ?? slug.toUpperCase();
}

// Compute today/thru once
function deriveTodayThru(entry: any) {
  const score = entry?.score ?? 0;
  const thruRaw = entry?.thru ?? null;
  const lastCompleted = [4, 3, 2, 1].find(n => entry?.[`round_${n}`] != null) ?? 0;
  const derivedRound = lastCompleted === 0 ? 1 : Math.min(lastCompleted + 1, 4);
  const completedTotal = [1, 2, 3, 4]
    .filter(r => r < derivedRound)
    .reduce((s, r) => s + (entry?.[`round_${r}`] ?? 0), 0);
  const today = (thruRaw != null && thruRaw >= 1 && thruRaw < 18)
    ? score - completedTotal
    : null;
  return { score, thru: thruRaw, today, derivedRound };
}

// ---------- LEADER block ----------------------------------------------------

function LeaderBlock({ entry, tourSlug, t = 0 }: { entry: any; tourSlug: string; t?: number }) {
  const [imgErr, setImgErr] = useState(false);
  const p = entry?.player;
  const team = entry?.team;
  if (!p && !team) return null;

  const isTeam = !p && !!team;
  const fullName = isTeam
    ? (team.abbr_name || team.display_name || 'Team')
    : (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim());
  const country = isTeam ? team.country : p.country;
  const flag = flagFor(country);
  const ccode = codeFor(country);
  const tourCode = isTeam ? tourSlug : (p.tour_codes?.[0] ?? tourSlug);
  const photoUrl = isTeam
    ? null
    : getPlayerHeadshotUrl(fullName, tourCode, p.headshot_override);

  const { score, thru, today } = deriveTodayThru(entry);

  // Elastic scaling
  const avatarSize = lerp(44, 64, t);
  const padY = lerp(12, 22, t);
  const gap = lerp(12, 16, t);
  const nameSize = lerp(15, 20, t);
  const scoreSize = lerp(30, 42, t);
  const metaSize = lerp(10, 12, t);

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: `1px solid ${slate200}`,
        borderBottom: `1px solid ${slate200}`,
        padding: `${padY}px 0`,
        display: 'flex',
        alignItems: 'center',
        gap,
      }}
    >
      <div
        style={{
          width: avatarSize, aspectRatio: '1 / 1.05', borderRadius: '34%',
          border: `2px solid ${greenLive}`,
          background: slate100,
          overflow: 'hidden', flexShrink: 0,
        }}
      >
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 18%',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlayerSilhouette size={Math.round(avatarSize * 0.56)} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
          color: amber, marginBottom: 4,
        }}>
          LEADER
        </div>
        <div style={{
          fontSize: nameSize, fontWeight: 800, color: ink,
          letterSpacing: '-0.02em', lineHeight: 1.05,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {fullName}
        </div>
        <div style={{
          marginTop: 3, display: 'flex', alignItems: 'center', gap: 6,
          fontSize: metaSize, color: slate500, fontWeight: 600,
        }}>
          {flag && <span aria-hidden="true">{flag}</span>}
          {ccode && <span style={{ letterSpacing: '0.06em' }}>{ccode}</span>}
          {today != null && (
            <>
              <span style={{ color: slate300 }}>·</span>
              <span style={{ color: greenLive, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                Today {fmtScoreSign(today)}
              </span>
            </>
          )}
          {thru != null && thru >= 1 && thru < 18 && (
            <>
              <span style={{ color: slate300 }}>·</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>Thru {thru}</span>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: scoreSize, fontWeight: 900, letterSpacing: '-0.04em',
          color: ink, lineHeight: 0.9,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtScore(score)}
        </div>
        <div style={{
          marginTop: 4, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
          color: slate400,
        }}>
          TO PAR
        </div>
      </div>
    </div>
  );
}

// ---------- Chaser row ------------------------------------------------------

function ChaserRow({
  entry, rank, tourSlug, isFirst, onTap,
}: {
  entry: any; rank: number; tourSlug: string; isFirst: boolean;
  onTap?: (e: any) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const p = entry.player;
  const team = entry.team;
  const fullName = p
    ? (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim())
    : (team?.abbr_name || team?.display_name || 'Team');
  const tourCode = p?.tour_codes?.[0] ?? tourSlug;
  const photoUrl = p
    ? getPlayerHeadshotUrl(fullName, tourCode, p.headshot_override)
    : null;

  const { score, thru, today } = deriveTodayThru(entry);
  const thruDisplay =
    entry.status === 'cut' ? 'CUT'
    : entry.status === 'wd' ? 'WD'
    : thru === 18 ? 'F'
    : thru == null || thru === 0 ? '—'
    : `${thru}`;

  return (
    <button
      type="button"
      onClick={() => onTap?.(entry)}
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1fr 56px 36px',
        alignItems: 'center',
        gap: 8,
        padding: '10px 0',
        borderTop: isFirst ? 'none' : `1px solid ${slate200}`,
        background: 'transparent',
        border: 'none',
        borderLeft: 'none', borderRight: 'none',
        borderBottom: 'none',
        width: '100%',
        textAlign: 'left',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <span style={{
        fontSize: 11, color: slate500, fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {entry.position ?? rank}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: 22, aspectRatio: '1 / 1.05', borderRadius: '34%',
              objectFit: 'cover', objectPosition: 'center 18%', flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: 22, aspectRatio: '1 / 1.05', borderRadius: '34%',
            background: slate100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: slate500, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(fullName)}
          </div>
        )}
        <span style={{
          fontSize: 13, fontWeight: 700, color: ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {fullName}
        </span>
      </span>
      <span style={{
        textAlign: 'right', fontSize: 13, fontWeight: 800, color: ink,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {fmtScore(score)}
        {today != null && today < 0 && (
          <span style={{
            marginLeft: 4, fontSize: 10, color: greenLive, fontWeight: 700,
          }}>
            {fmtScoreSign(today)}
          </span>
        )}
      </span>
      <span style={{
        textAlign: 'right', fontSize: 11, color: slate500, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {thruDisplay}
      </span>
    </button>
  );
}

// ---------- Skeleton --------------------------------------------------------

export function LiveHeroSkeleton() {
  return (
    <div style={{
      height: '100%', background: lightBg,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
      paddingInline: 20, paddingBottom: 16,
      boxSizing: 'border-box', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Shimmer width="50%" height={11} radius={3} style={{ marginBottom: 12 }} />
        <Shimmer width="30%" height={12} radius={3} style={{ marginBottom: 14 }} />
        <Shimmer width="85%" height={36} radius={6} style={{ marginBottom: 8 }} />
        <Shimmer width="60%" height={36} radius={6} style={{ marginBottom: 12 }} />
        <Shimmer width="55%" height={11} radius={3} />
      </div>
      <Shimmer width="100%" height={70} radius={6} style={{ marginBottom: 6 }} />
      <Shimmer width="100%" height={140} radius={6} style={{ marginBottom: 12 }} />
      <Shimmer width="100%" height={42} radius={14} />
    </div>
  );
}

// ---------- Main ------------------------------------------------------------

export interface EditorialLiveHeroProps {
  tournament: {
    id: string;
    name: string;
    tourSlug: string;
    venueName: string | null;
    venueCity: string | null;
    startDate: string;
  };
  leaderboard: any[];
  currentRound: number;
  totalRounds?: number;
  onPlayerTap?: (entry: any) => void;
  onLeaderboardCta?: () => void;
}

export function EditorialLiveHero({
  tournament,
  leaderboard,
  currentRound,
  totalRounds = 4,
  onPlayerTap,
  onLeaderboardCta,
}: EditorialLiveHeroProps) {
  const navigate = useNavigate();

  const leaderEntry = leaderboard[0] ?? null;
  const chasers = leaderboard.slice(1, 3); // T2/T3 (top 3 total incl. leader)

  const lastCompleted = leaderEntry
    ? [4, 3, 2, 1].find(n => leaderEntry[`round_${n}`] != null) ?? 0
    : 0;
  const derivedRound = lastCompleted === 0 ? currentRound : Math.min(lastCompleted + 1, 4);

  const fieldThru = leaderEntry?.thru;
  const fieldThruLabel =
    fieldThru == null ? null
    : fieldThru === 18 ? 'F'
    : `${fieldThru}`;

  // Inject pulse keyframes once per mount.
  useEffect(() => {
    const id = 'hero-pulse-keyframes';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(tag);
  }, []);

  const handleCta = () => {
    if (onLeaderboardCta) {
      onLeaderboardCta();
    } else {
      const t = tournamentRoute(tournament.id, { kind: 'overview' });
      navigate(t.to, { state: t.state });
    }
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: lightBg,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
        paddingInline: 20,
        paddingBottom: 16,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Elastic header band ------------------------------------------------ */}
      <ElasticZone minH={120} maxH={260}>
        {(t) => (
          <TournamentTitleBlock
            t={t}
            eyebrowLabel="LIVE THIS HOUR"
            eyebrowRight={`R${derivedRound}/${totalRounds}`}
            statusRow={
              <>
                <TourBadge code={getTourCode(tournament.tourSlug)} />
                <StatusBadge
                  label="LIVE"
                  color={greenLive}
                  bg="rgba(16,185,129,0.094)"
                  pulse
                />
                {fieldThruLabel && (
                  <>
                    <span style={{ fontSize: 10, color: slate300 }}>·</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: slate500,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {fieldThruLabel} thru
                    </span>
                  </>
                )}
              </>
            }
            title={tournament.name}
            venueName={tournament.venueName}
            venueCity={tournament.venueCity}
          />
        )}
      </ElasticZone>

      {/* LEADER (also serves as the first divider) -------------------------- */}
      {leaderEntry && (
        <LeaderBlock entry={leaderEntry} tourSlug={tournament.tourSlug} />
      )}

      {/* Chasers — T2/T3/T4 fixed ------------------------------------------ */}
      {chasers.length > 0 && (
        <div style={{ flexShrink: 0, paddingTop: 2 }}>
          {chasers.map((entry, i) => (
            <ChaserRow
              key={entry.player_id ?? entry.player?.id ?? entry.team?.id ?? i}
              entry={entry}
              rank={i + 2}
              tourSlug={tournament.tourSlug}
              isFirst={i === 0}
              onTap={onPlayerTap}
            />
          ))}
        </div>
      )}

      {/* CTA --------------------------------------------------------------- */}
      <HeroCTA
        label="Open Live Leaderboard"
        onClick={handleCta}
        style={{ marginTop: 12 }}
      />
    </div>
  );
}
