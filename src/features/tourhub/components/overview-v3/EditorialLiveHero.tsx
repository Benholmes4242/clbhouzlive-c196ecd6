/**
 * EditorialLiveHero — expanded-state Tour Hero "Live" surface.
 *
 * Source of truth: TOUR_HERO_AND_SCORECARD_BRIEF.
 * Layered atmospheric background, broadcast caption strip, editorial title,
 * leader hero, hole-by-hole sparkline, leaderboard rows, Live Leaderboard
 * CTA, and the All Tours ticker.
 *
 * Derived fields the brief calls "additive" (momentum text, ▲/▼ delta
 * indicators, playersThru/fieldSize) are intentionally omitted when the
 * data isn't available rather than padded with placeholders.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Trophy } from 'lucide-react';
import { tournamentRoute } from '../../routes';
import { HeroAtmosphere } from '../shared/HeroAtmosphere';
import { Shimmer } from '../shared/Shimmer';


import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import {
  navy, navyMid, ink,
  inkSoft, inkFaint, inkGhost,
  hairlineDark, hairlineMid,
  amber, gold, greenLive, danger,
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

function flagFor(country: string | null | undefined): string {
  if (!country) return '';
  return COUNTRY_TO_FLAG[country.toUpperCase()] ?? '';
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

function getTourShort(slug: string): string {
  const map: Record<string, string> = {
    pga: 'PGA Tour', euro: 'DP World', lpga: 'LPGA',
    liv: 'LIV Golf', champ: 'Champions', pgad: 'Korn Ferry',
  };
  return map[slug] ?? slug.toUpperCase();
}


// ---------- Leader hero ----------------------------------------------------

function LeaderHero({
  leaderEntry,
  tourSlug,
}: {
  leaderEntry: any;
  tourSlug: string;
}) {
  const [imgErr, setImgErr] = React.useState(false);
  const p = leaderEntry?.player;
  const team = leaderEntry?.team;
  if (!p && !team) return null;
  const isTeam = !p && !!team;
  const fullName = isTeam
    ? (team.abbr_name || team.display_name || 'Team')
    : (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim());
  const country = isTeam ? team.country : p.country;
  const flag = flagFor(country);
  const tourCode = isTeam ? tourSlug : (p.tour_codes?.[0] ?? tourSlug);
  const photoUrl = isTeam
    ? null
    : getPlayerHeadshotUrl(fullName, tourCode, p.headshot_override);

  const score = leaderEntry.score ?? 0;
  const thru = leaderEntry.thru ?? null;

  // today = score - sum(completed prior rounds)
  const lastCompleted = [4, 3, 2, 1].find(n => leaderEntry[`round_${n}`] != null) ?? 0;
  const derivedRound = lastCompleted === 0 ? 1 : Math.min(lastCompleted + 1, 4);
  const completedTotal = [1, 2, 3, 4]
    .filter(r => r < derivedRound)
    .reduce((s, r) => s + (leaderEntry[`round_${r}`] ?? 0), 0);
  const today = (thru != null && thru >= 1 && thru < 18) ? score - completedTotal : null;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 10, marginBottom: 14 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 50, height: 50, borderRadius: '50%',
            border: `2px solid ${greenLive}`,
            background: 'rgba(0,0,0,0.3)',
            overflow: 'hidden',
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
            <PlayerSilhouette size={26} />
          )}
        </div>
        <div
          style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            background: greenLive, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${navyMid}`,
            fontSize: 9, fontWeight: 800,
          }}
        >
          1
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
            color: inkFaint, marginBottom: 4,
          }}
        >
          LEADER{flag ? ` · ${flag}` : ''}
          {country ? ` ${country.toUpperCase()}` : ''}
        </div>
        <div
          style={{
            fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
            color: '#fff', lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {fullName}
        </div>
        {thru != null && thru >= 1 && thru < 18 && (
          <div
            style={{
              fontSize: 10, color: greenLive, marginTop: 4, fontWeight: 600,
            }}
          >
            Thru {thru} · R{derivedRound}
          </div>
        )}
      </div>
      <div
        style={{
          textAlign: 'right',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em',
            color: '#fff', lineHeight: 0.9,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtScore(score)}
        </div>
        {today != null && (
          <div
            style={{
              fontSize: 9, color: inkFaint, marginTop: 4, letterSpacing: '0.06em',
            }}
          >
            TODAY {fmtScoreSign(today)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Leaderboard row ------------------------------------------------

function LeaderboardRow({
  entry,
  rank,
  isLeader,
  tourSlug,
  onTap,
}: {
  entry: any;
  rank: number;
  isLeader: boolean;
  tourSlug: string;
  onTap?: (entry: any) => void;
}) {
  const p = entry.player;
  const team = entry.team;
  const fullName = p
    ? (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim())
    : (team?.abbr_name || team?.display_name || 'Team');
  const tourCode = p?.tour_codes?.[0] ?? tourSlug;
  const photoUrl = p
    ? getPlayerHeadshotUrl(fullName, tourCode, p.headshot_override)
    : null;
  const [imgErr, setImgErr] = React.useState(false);

  const score = entry.score ?? 0;
  const thruRaw = entry.thru ?? null;
  const thruDisplay =
    entry.status === 'cut' ? 'CUT'
    : entry.status === 'wd' ? 'WD'
    : thruRaw === 18 ? 'F'
    : thruRaw == null || thruRaw === 0 ? '—'
    : `${thruRaw}`;

  const lastCompleted = [4, 3, 2, 1].find(n => entry[`round_${n}`] != null) ?? 0;
  const derivedRound = lastCompleted === 0 ? 1 : Math.min(lastCompleted + 1, 4);
  const completedTotal = [1, 2, 3, 4]
    .filter(r => r < derivedRound)
    .reduce((s, r) => s + (entry[`round_${r}`] ?? 0), 0);
  const today = (thruRaw != null && thruRaw >= 1 && thruRaw < 18)
    ? score - completedTotal
    : null;

  return (
    <button
      type="button"
      onClick={() => onTap?.(entry)}
      style={{
        display: 'grid',
        gridTemplateColumns: '26px 1fr 50px 50px 36px',
        alignItems: 'center',
        padding: '11px 0',
        borderTop: `1px solid ${hairlineDark}`,
        background: 'transparent',
        border: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        width: '100%',
        textAlign: 'left',
        cursor: onTap ? 'pointer' : 'default',
        color: '#fff',
      }}
    >
      <span
        style={{
          fontSize: 11, color: isLeader ? '#fff' : inkFaint,
          fontWeight: isLeader ? 800 : 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {entry.position ?? rank}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: 26, height: 26, borderRadius: '50%',
              objectFit: 'cover', objectPosition: 'center 18%',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: inkFaint, fontWeight: 700, flexShrink: 0,
            }}
          >
            {getInitials(fullName)}
          </div>
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: isLeader ? 800 : 600,
            color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {fullName}
        </span>
      </span>
      <span
        style={{
          textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#fff',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtScore(score)}
      </span>
      <span
        style={{
          textAlign: 'right', fontSize: 12, fontWeight: 700,
          color: today != null && today < 0 ? greenLive : inkFaint,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {today == null || today === 0 ? '—' : fmtScoreSign(today)}
      </span>
      <span
        style={{
          textAlign: 'right', fontSize: 11, color: inkSoft,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {thruDisplay}
      </span>
    </button>
  );
}

// ---------- LiveHeroSkeleton ----------------------------------------------

export function LiveHeroSkeleton() {
  return (
    <HeroAtmosphere style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
          paddingInline: 20,
          paddingBottom: 24,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Caption */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingTop: 12 }}>
          <Shimmer width={36} height={16} radius={4} />
          <Shimmer width={48} height={14} radius={3} />
          <Shimmer width="40%" height={12} radius={3} />
        </div>
        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <Shimmer width="85%" height={30} radius={6} style={{ marginBottom: 8 }} />
          <Shimmer width="55%" height={14} radius={4} />
        </div>
        {/* Leader hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <Shimmer width={86} height={86} radius="50%" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Shimmer width="40%" height={11} radius={3} style={{ marginBottom: 8 }} />
            <Shimmer width="70%" height={24} radius={5} style={{ marginBottom: 8 }} />
            <Shimmer width="50%" height={12} radius={3} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <Shimmer width={90} height={56} radius={6} style={{ marginBottom: 6 }} />
            <Shimmer width={70} height={11} radius={3} style={{ marginLeft: 'auto' }} />
          </div>
        </div>
        {/* Hole strip */}
        <Shimmer width="100%" height={88} radius={14} style={{ marginBottom: 22 }} />
        {/* Leaderboard rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '26px 1fr 50px 50px 36px',
              alignItems: 'center', padding: '11px 0', gap: 8,
              borderTop: i > 0 ? `1px solid ${hairlineDark}` : 'none',
            }}
          >
            <Shimmer height={11} radius={3} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shimmer width={26} height={26} radius="50%" />
              <Shimmer width="60%" height={14} radius={4} />
            </div>
            <Shimmer height={14} radius={4} />
            <Shimmer height={12} radius={4} />
            <Shimmer height={11} radius={3} />
          </div>
        ))}
      </div>
    </HeroAtmosphere>
  );
}

// ---------- Main component -------------------------------------------------

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
  const leaderId = leaderEntry?.player_id ?? leaderEntry?.player?.id ?? null;

  const lastCompleted = leaderEntry
    ? [4, 3, 2, 1].find(n => leaderEntry[`round_${n}`] != null) ?? 0
    : 0;
  const derivedRound = lastCompleted === 0 ? currentRound : Math.min(lastCompleted + 1, 4);

  const top5 = leaderboard.slice(0, 5);

  // Inject pulse keyframes once per mount — scoped via a simple <style> tag.
  useEffect(() => {
    const id = 'hero-pulse-keyframes';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = PULSE_KEYFRAMES;
    document.head.appendChild(tag);
  }, []);

  return (
    <HeroAtmosphere
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
          paddingInline: 20,
          paddingBottom: 24,
          boxSizing: 'border-box',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          height: 'auto',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
          willChange: 'transform',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {/* 1. Broadcast caption strip --------------------------------------- */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            paddingTop: 12,
          }}
        >
          <span
            style={{
              padding: '3px 7px', borderRadius: 4, background: '#fff', color: ink,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            }}
          >
            {getTourCode(tournament.tourSlug)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 6, height: 6, borderRadius: '50%', background: greenLive,
                animation: 'heroPulse 1.6s infinite',
              }}
            />
            <span
              style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
                color: greenLive,
              }}
            >
              LIVE
            </span>
          </div>
          <span style={{ fontSize: 10, color: inkFaint }}>·</span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: inkSoft, letterSpacing: '0.06em',
            }}
          >
            Round {derivedRound} of {totalRounds}
          </span>
        </div>

        {/* 2. Tournament name + venue --------------------------------------- */}
        <div style={{ marginBottom: 14 }}>
          <h1
            style={{
              margin: 0, fontSize: 20, fontWeight: 800,
              letterSpacing: '-0.025em', lineHeight: 1.1, color: '#fff',
            }}
          >
            {tournament.name}
          </h1>
          {(tournament.venueName || tournament.venueCity) && (
            <div
              style={{
                marginTop: 6, fontSize: 11, color: inkFaint,
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <MapPin size={11} strokeWidth={2.2} style={{ opacity: 0.8 }} />
              <span>
                {[tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* 3. Leader hero --------------------------------------------------- */}
        {leaderEntry && (
          <LeaderHero leaderEntry={leaderEntry} tourSlug={tournament.tourSlug} />
        )}

        {/* 5. Leaderboard --------------------------------------------------- */}
        {top5.length > 0 && (
          <div>
            {top5.map((entry, i) => (
              <LeaderboardRow
                key={entry.player_id ?? entry.player?.id ?? entry.team?.id ?? i}
                entry={entry}
                rank={i + 1}
                isLeader={i === 0}
                tourSlug={tournament.tourSlug}
                onTap={onPlayerTap}
              />
            ))}
          </div>
        )}

        {/* 6. Live Leaderboard CTA ------------------------------------------ */}
        <button
          type="button"
          onClick={() => {
            if (onLeaderboardCta) {
              onLeaderboardCta();
            } else {
              const t = tournamentRoute(tournament.id, { kind: 'overview' });
              navigate(t.to, { state: t.state });
            }
          }}
          style={{
            width: '100%', marginTop: 16, padding: '12px',
            background: 'transparent', border: `1px solid ${hairlineMid}`,
            borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            cursor: 'pointer',
          }}
        >
          Live Leaderboard
          <ChevronRight size={14} />
        </button>

      </div>
    </HeroAtmosphere>
  );
}
