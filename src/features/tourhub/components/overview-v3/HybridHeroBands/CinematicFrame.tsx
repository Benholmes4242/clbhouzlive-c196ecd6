/**
 * CinematicFrame — Direction A "The Frame" Tour Overview hero (live/results).
 * One full-bleed photo with title block + a frosted-glass leaderboard capsule.
 * Replaces PhotoBand + MiddleBand + LeaderboardBand for live/results states.
 *
 * Upcoming state is unchanged — HybridHero still routes upcoming to the
 * original three-band path.
 *
 * IMPORTANT: the capsule renders SLOTS via the same `buildLeaderboardSlots`
 * + `tiedLeaders` machinery the white LeaderboardBand uses. It must NOT
 * render raw `slice(0, 3)` rows — that would break tie handling.
 */

import React from 'react';
import { format } from 'date-fns';
import { ChevronRight, Crown, Trophy } from 'lucide-react';
import {
  CINEMATIC_FRAME_HEIGHT,
  CINEMATIC_FRAME_HEIGHT_RESULTS,
  CINEMATIC_FRAME_HEIGHT_UPCOMING,
  CINEMATIC_SCRIM,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  AMBER,
  GOLD,
  NUMERIC_STYLE,
  SC_BIRDIE,
} from '../HybridHero.constants';
import { AMBER_INK, GOLD_DEEP } from '../../../_shared/tokens';
import type { HeroState, TopTie, TickerRow } from '../HybridHero.utils';
import { fmtScore, formatRank, buildLeaderboardSlots, roundLabel } from '../HybridHero.utils';
import { formatPurse } from '../../shared/TourHeroHelpers';

const TICKER_BAR_H = 34;
const CHAMPION_BAND_H = 62;
const UPCOMING_BAND_H = 104;
const LIVE_BOTTOM_H = CHAMPION_BAND_H + TICKER_BAR_H;
const LIVE_BOARD_H = 210; // header + up to 3 rows + footer
const RESULTS_FOOTER_H = 34;
const BOTTOM_STACK_H = TICKER_BAR_H + CHAMPION_BAND_H;
import { getPlayerHeadshotCandidates } from '@/utils/playerHeadshot';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import type { DefendingChampData } from '../../../hooks/useTournamentDefendingChamp';
import type { FieldStrength } from '../../../hooks/useTournamentFieldStrength';

// ---- helpers --------------------------------------------------------------

function entryName(e: any): string {
  const p = e?.player;
  return p?.full_name || `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || '—';
}
function entryThru(e: any): string {
  if (e?.thru === 18 || e?.thru === 'F') return 'F';
  if (e?.thru == null) return '—';
  return String(e.thru);
}
function resolveAvatar(e: any, tourSlug?: string | null): string | null {
  return resolveAvatarCandidates(e, tourSlug)[0] ?? null;
}
/**
 * Ordered headshot candidates for a leaderboard entry. Tries event-tour
 * folder first, then PGA Tour, then the rest — covers cross-tour players
 * (e.g. PGA player at a co-sanctioned/euro major). DB photo_url short-circuits.
 *
 * Thin wrapper around the canonical {@link resolvePlayerAvatarCandidates}
 * so the hero and every Players surface share one implementation.
 */
function resolveAvatarCandidates(e: any, tourSlug?: string | null): string[] {
  return resolvePlayerAvatarCandidates({
    name: entryName(e),
    photoUrl: e?.player?.photo_url ?? null,
    tourSlug: tourSlug ?? null,
  });
}
function nameCandidates(name: string | null | undefined, tourSlug?: string | null): string[] {
  if (!name || !tourSlug) return [];
  try { return getPlayerHeadshotCandidates(name, tourSlug); } catch { return []; }
}

function scoreColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return 'rgba(255,255,255,0.85)';
  if (score < 0) return SC_BIRDIE;   // under par -> teal (GOOD)
  if (score > 0) return 'rgba(255,255,255,0.55)'; // over par -> muted white
  return 'rgba(255,255,255,0.85)';   // even
}

// ---- dark-surface row primitives -----------------------------------------

const ROW_BORDER = '0.5px solid rgba(255,255,255,0.08)';

type StackedAvatarItem = {
  url?: string | null;
  candidates?: string[];
  name?: string;
  userId?: string | null;
};

function StackedAvatarsDark({
  urls,
  items,
  size = 22,
}: {
  urls?: (string | null)[];
  items?: StackedAvatarItem[];
  size?: number;
}) {
  const resolved: StackedAvatarItem[] =
    items ?? (urls ?? []).map((u) => ({ url: u }));
  const visible = resolved.slice(0, 4);
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {visible.map((it, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '34%',
            marginLeft: i === 0 ? 0 : -8,
            border: '1.5px solid #141C28',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: visible.length - i,
            position: 'relative',
          }}
        >
          <SquircleAvatar
            src={it.candidates && it.candidates.length > 0 ? undefined : it.url}
            srcCandidates={it.candidates}
            alt={it.name || ''}
            userId={it.userId ?? null}
            size={size - 3}
            hideRing
          />
        </div>
      ))}
    </div>
  );
}


function SoloRowDark({
  entry,
  rank,
  avatarUrl,
  isLeader,
  isLast,
  isResultsLeader,
  isResults = false,
}: {
  entry: any;
  rank: string;
  avatarUrl: string | string[] | null;
  isLeader: boolean;
  isLast: boolean;
  isResultsLeader: boolean;
  isResults?: boolean;
}) {
  const name = entryName(entry);
  const score = entry?.score;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 10px',
        borderBottom: isLast ? 'none' : ROW_BORDER,
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          width: 22,
          fontSize: 12,
          fontWeight: 700,
          color: isLeader ? AMBER : 'rgba(255,255,255,0.5)',
          textAlign: 'left',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <SquircleAvatar
        src={Array.isArray(avatarUrl) ? undefined : avatarUrl} srcCandidates={Array.isArray(avatarUrl) ? avatarUrl : undefined}
        alt={name}
        userId={entry?.player?.id ?? null}
        size={26}
        hideRing
      />

      <span
        style={{
          flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: 'white',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {name}
        {isResultsLeader && (
          <Crown size={12} color={GOLD} fill={GOLD} strokeWidth={0} />
        )}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
          color: scoreColor(score), flexShrink: 0,
        }}
      >
        {fmtScore(score)}
      </span>
      {!isResults && (
        <span
          style={{
            ...NUMERIC_STYLE,
            width: 18, fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.4)', textAlign: 'right', flexShrink: 0,
          }}
        >
          {entryThru(entry)}
        </span>
      )}
    </div>
  );
}

function TiedLeadersRowDark({
  count,
  score,
  avatars,
  items,
  isLast,
  isResults = false,
}: {
  count: number;
  score: string;
  avatars?: (string | null)[];
  items?: StackedAvatarItem[];
  isLast: boolean;
  isResults?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 10px',
        borderBottom: isLast ? 'none' : ROW_BORDER,
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          width: 22, fontSize: 12, fontWeight: 700,
          color: AMBER, textAlign: 'left', flexShrink: 0,
        }}
      >
        T1
      </span>
      <StackedAvatarsDark urls={avatars} items={items} size={26} />
      <span
        style={{
          flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: 'white',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {count} tied for the lead
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
          color: scoreColor(scoreStringToNumber(score)), flexShrink: 0,
        }}
      >
        {score}
      </span>
      {!isResults && <span style={{ width: 18, flexShrink: 0 }} />}
    </div>
  );
}

function scoreStringToNumber(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  if (typeof s === 'number') return s;
  if (s === 'E' || s === 'EVEN') return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function TiedChasersRowDark({
  rank,
  count,
  score,
  avatars,
  items,
  isLast,
  onTap,
  isResults = false,
}: {
  rank: string;
  count: number;
  score: number;
  avatars?: (string | null)[];
  items?: StackedAvatarItem[];
  isLast: boolean;
  onTap?: () => void;
  isResults?: boolean;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 10px',
        borderBottom: isLast ? 'none' : ROW_BORDER,
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          width: 22, fontSize: 12, fontWeight: 700,
          color: 'rgba(255,255,255,0.5)', textAlign: 'left', flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <StackedAvatarsDark urls={avatars} items={items} size={26} />
      <span
        style={{
          flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'white',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {count} players
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
          color: scoreColor(score), flexShrink: 0,
        }}
      >
        {fmtScore(score)}
      </span>
      {!isResults && <span style={{ width: 18, flexShrink: 0 }} />}
    </div>
  );
}

// ---- results: champion hero row (gold-ringed, CHAMPION eyebrow) ----------

function ChampionRowDark({
  entry,
  avatarUrl,
  isLast,
}: {
  entry: any;
  avatarUrl: string | string[] | null;
  isLast: boolean;
}) {
  const name = entryName(entry);
  const score = entry?.score;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 10px 14px',
        borderBottom: isLast ? 'none' : ROW_BORDER,
      }}
    >
      <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Crown size={14} strokeWidth={2.5} fill={GOLD} style={{ color: GOLD_DEEP }} />
      </span>
      <span style={{ flexShrink: 0, display: 'inline-flex', boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', borderRadius: '34%' }}>
        <SquircleAvatar
          src={Array.isArray(avatarUrl) ? undefined : avatarUrl} srcCandidates={Array.isArray(avatarUrl) ? avatarUrl : undefined}
          alt={name}
          userId={entry?.player?.id ?? null}
          size={38}
          ringColor={GOLD}
          thinRing
        />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: GOLD,
            textTransform: 'uppercase',
          }}
        >
          Champion
        </span>
        <span
          style={{
            fontSize: 17, fontWeight: 800, color: 'white',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}
        >
          {name}
        </span>
      </div>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 19, fontWeight: 900, letterSpacing: '-0.02em',
          color: scoreColor(score), flexShrink: 0,
        }}
      >
        {fmtScore(score)}
      </span>
    </div>
  );
}

// ---- upcoming: defending champion hero row -------------------------------

function DefendingChampionRowDark({
  data,
  avatarUrl,
}: {
  data: DefendingChampData;
  avatarUrl: string | string[] | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 10px',
      }}
    >
      <span style={{ flexShrink: 0, display: 'inline-flex', boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', borderRadius: '34%' }}>
        <SquircleAvatar
          src={Array.isArray(avatarUrl) ? undefined : avatarUrl} srcCandidates={Array.isArray(avatarUrl) ? avatarUrl : undefined}
          alt={data.name}
          size={40}
          ringColor={GOLD}
          thinRing
        />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: GOLD,
            textTransform: 'uppercase',
          }}
        >
          Defending Champion
        </span>
        <span
          style={{
            fontSize: 18, fontWeight: 800, color: 'white',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
          }}
        >
          {data.name}
        </span>
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 11.5,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Won {data.year} · {data.score}
        </span>
      </div>
      <Trophy size={16} color={GOLD} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.8 }} />
    </div>
  );
}

// ---- upcoming: field-strength fallback row -------------------------------

function FieldStrengthRowDark({ data }: { data: FieldStrength }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 10px',
      }}
    >
      <StackedAvatarsDark urls={data.headshots.slice(0, 4)} size={30} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          Field Strength
        </span>
        <span
          style={{
            fontSize: 15, fontWeight: 700, color: 'white',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {data.totalPlayers} players
          {data.topRanked != null ? ` · #${data.topRanked} world` : ''}
        </span>
      </div>
    </div>
  );
}



export interface CinematicFrameProps {
  title: string;
  venueName: string | null;
  venueCity: string | null;
  venueImageUrl: string | null;
  state: HeroState;
  tourLabel: string | null;
  isMajor?: boolean;
  isSignature?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  leaderboard: any[];
  tiedLeaders: TopTie | null;
  fieldSize: number;
  top10: TickerRow[];
  tourSlug?: string | null;
  defendingChamp?: DefendingChampData | null;
  fieldStrength?: FieldStrength | null;
  
  venuePar?: number | null;
  venueYardage?: number | null;
  purse?: number | null;
  winningShare?: number | null;
  onCtaTap?: () => void;
}

// ---- component ------------------------------------------------------------

export function CinematicFrame({
  title,
  venueName,
  venueCity,
  venueImageUrl,
  state,
  tourLabel,
  isMajor,
  isSignature,
  startDate,
  endDate,
  leaderboard,
  tiedLeaders,
  fieldSize,
  top10,
  tourSlug,
  defendingChamp = null,
  fieldStrength = null,
  
  venuePar = null,
  venueYardage = null,
  purse = null,
  winningShare = null,
  onCtaTap,
}: CinematicFrameProps) {
  const useDusk =
    state.kind === 'results' &&
    (state as any).variant !== 'standard' &&
    (state as any).variant !== 'playoff';

  // Meta line: "May 28–31 · Colonial CC, Fort Worth"
  const startD = startDate ? new Date(startDate) : null;
  const endD = endDate ? new Date(endDate) : null;
  let dateRange: string | null = null;
  if (startD && endD) {
    const sameMonth = startD.getMonth() === endD.getMonth();
    dateRange = sameMonth
      ? `${format(startD, 'MMM d')}–${format(endD, 'd')}`
      : `${format(startD, 'MMM d')} – ${format(endD, 'MMM d')}`;
  } else if (endD) {
    dateRange = format(endD, 'MMM d');
  }
  const venueLine = [venueName, venueCity].filter(Boolean).join(', ');

  // Top meta: LIVE · ROUND N (live), FINAL RESULT (results), UPCOMING pill (upcoming)
  const isLive = state.kind === 'live';
  const isResults = state.kind === 'results';
  const isUpcoming = state.kind === 'upcoming';
  
  const roundLabel_ =
    state.kind === 'live'
      ? `LIVE · ${roundLabel(state.round, state.totalRounds).toUpperCase()}`
      : isResults
        ? 'FINAL RESULT'
        : null;

  // ---- Capsule slot construction (mirrors LeaderboardBand live-state) ----
  const safe = Array.isArray(leaderboard) ? leaderboard : [];
  const avatar = (e: any) => resolveAvatarCandidates(e, tourSlug);

  type SlotNode = React.ReactNode;
  const slotNodes: SlotNode[] = [];

  if (!isUpcoming && safe.length > 0) {
    if (tiedLeaders) {
      // Find first chaser (first entry whose score differs from the leader's)
      const topScore = safe[0]?.score ?? safe[0]?.total;
      const firstChaser = safe.findIndex(e => (e?.score ?? e?.total) !== topScore);
      const chasers =
        firstChaser >= 0
          ? safe.slice(firstChaser)
          : safe.slice(tiedLeaders.count);

      const tiedItems: StackedAvatarItem[] = safe
        .filter(e => (e?.score ?? e?.total) === topScore)
        .slice(0, Math.min(tiedLeaders.count, 4))
        .map(e => ({ candidates: avatar(e), name: entryName(e), userId: e?.player?.id ?? null }));

      slotNodes.push(
        <TiedLeadersRowDark
          key="tied-leaders"
          count={tiedLeaders.count}
          score={tiedLeaders.score}
          items={tiedItems}
          isLast={false}
          isResults={isResults}
        />
      );

      const chaserSlots = buildLeaderboardSlots(chasers, 2);
      chaserSlots.forEach((slot, i) => {
        const isLast = i === chaserSlots.length - 1;
        if (slot.kind === 'tie') {
          slotNodes.push(
            <TiedChasersRowDark
              key={`c-tie-${i}`}
              rank={slot.rank}
              count={slot.count}
              score={slot.score}
              items={slot.members.map((m: any) => ({ candidates: avatar(m), name: entryName(m), userId: m?.player?.id ?? null }))}
              isLast={isLast}
              onTap={onCtaTap}
              isResults={isResults}
            />
          );
        } else {
          slotNodes.push(
          <SoloRowDark
            key={`c-solo-${i}`}
            entry={slot.entry}
            rank={formatRank(slot.entry)}
            avatarUrl={avatar(slot.entry)}
            isLeader={false}
            isLast={isLast}
            isResultsLeader={false}
            isResults={isResults}
          />
          );
        }
      });
    } else {
      const leader = safe[0];
      // Results: champion hero row (gold-ringed, CHAMPION eyebrow, trophy marker).
      // Live: standard solo row with amber leader rank.
      if (isResults) {
        slotNodes.push(
          <ChampionRowDark
            key="champion"
            entry={leader}
            avatarUrl={avatar(leader)}
            isLast={false}
          />
        );
      } else {
        slotNodes.push(
        <SoloRowDark
          key="leader"
          entry={leader}
          rank={String(leader.position ?? 1)}
          avatarUrl={avatar(leader)}
          isLeader={true}
          isLast={false}
          isResultsLeader={false}
          isResults={isResults}
        />
        );
      }

      const chaserSlots = buildLeaderboardSlots(safe.slice(1), 2);
      chaserSlots.forEach((slot, i) => {
        const isLast = i === chaserSlots.length - 1;
        if (slot.kind === 'tie') {
          slotNodes.push(
            <TiedChasersRowDark
              key={`c-tie-${i}`}
              rank={slot.rank}
              count={slot.count}
              score={slot.score}
              items={slot.members.map((m: any) => ({ candidates: avatar(m), name: entryName(m), userId: m?.player?.id ?? null }))}
              isLast={isLast}
              onTap={onCtaTap}
              isResults={isResults}
            />
          );
        } else {
          slotNodes.push(
          <SoloRowDark
            key={`c-solo-${i}`}
            entry={slot.entry}
            rank={formatRank(slot.entry)}
            avatarUrl={avatar(slot.entry)}
            isLeader={false}
            isLast={isLast}
            isResultsLeader={false}
            isResults={isResults}
          />
          );
        }
      });
    }
  }

  // ---- Upcoming capsule: defending champion → field strength → no capsule ---
  let upcomingCapsule: React.ReactNode = null;
  let upcomingFooter: string | null = null;
  if (isUpcoming) {
    if (defendingChamp) {
      const headshotCandidates = nameCandidates(defendingChamp.name, tourSlug);
      upcomingCapsule = (
        <DefendingChampionRowDark data={defendingChamp} avatarUrl={headshotCandidates} />
      );

      upcomingFooter = 'View tournament';
    } else if (fieldStrength && fieldStrength.totalPlayers > 0) {
      upcomingCapsule = <FieldStrengthRowDark data={fieldStrength} />;
      upcomingFooter = 'View tournament';
    }
    // else: no capsule — countdown chip carries the frame.
  }

  // Countdown chip (upcoming only) — uses state.countdown when present.
  const countdownText = isUpcoming
    ? ((state as any).countdown as string | undefined) || null
    : null;

  // Render decisions
  const hasCapsule = isUpcoming ? upcomingCapsule !== null : true;
  const capsuleFooter = isUpcoming
    ? upcomingFooter
    : `Full leaderboard${fieldSize > 0 ? ` · ${fieldSize} players` : ''}`;

  // ---- GlassPills (floating over photo, under venue) ------------------------
  const GlassPills = () => {
    const pills = [
      { label: 'PURSE', value: purse != null ? (formatPurse(purse) || '—') : '—' },
      { label: 'PAR', value: venuePar != null ? String(venuePar) : '—' },
      { label: 'YDS', value: venueYardage != null ? venueYardage.toLocaleString() : '—' },
    ];
    return (
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 6 }}>
        {pills.map((p) => (
          <div key={p.label} style={{
            display: 'flex', alignItems: 'baseline', gap: 5,
            background: 'rgba(10,14,20,0.50)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            borderRadius: 8, padding: '5px 9px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.60)' }}>{p.label}</span>
            <span style={{ ...NUMERIC_STYLE, fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };



  const frameHeight = isResults
    ? CINEMATIC_FRAME_HEIGHT_RESULTS
    : isUpcoming
      ? CINEMATIC_FRAME_HEIGHT_UPCOMING
      : CINEMATIC_FRAME_HEIGHT;


  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: frameHeight,
        overflow: 'hidden',
        background: useDusk ? COURSE_GRADIENT_DUSK : COURSE_GRADIENT,
        flexShrink: 0,
      }}
    >
      {/* Layer 1: photo */}
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
            zIndex: 1,
          }}
        />
      )}

      {/* Layer 2: cinematic scrim */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: isResults
          ? 'linear-gradient(180deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.2) 28%, rgba(10,14,20,0.5) 58%, rgba(10,14,20,0.97) 100%)'
          : CINEMATIC_SCRIM, zIndex: 2 }}
      />

      {/* Flex content column — top meta, spacer, title, capsule */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          padding: `18px 14px ${
            isLive ? 16 + LIVE_BOARD_H
            : isResults ? 16
            : (isUpcoming && defendingChamp) ? 16 + UPCOMING_BAND_H
            : isUpcoming ? 16
            : 16
          }px`,
        }}
      >
        {/* Top meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '0 4px',
          }}
        >
          {isUpcoming ? (
            countdownText ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(10,14,20,0.50)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255,255,255,0.18)',
                borderRadius: 999, padding: '5px 11px', alignSelf: 'flex-start',
              }}>
                <span style={{ ...NUMERIC_STYLE, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.16em', color: '#fff', textTransform: 'uppercase' }}>TEES OFF IN</span>
                <span style={{ ...NUMERIC_STYLE, fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{countdownText}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: AMBER, flexShrink: 0 }} />
                <span style={{ ...NUMERIC_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: AMBER, textShadow: '0 1px 3px rgba(0,0,0,0.45)', textTransform: 'uppercase' }}>Upcoming</span>
              </div>
            )
          ) : roundLabel_ ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isResults && (
                <Trophy
                  size={12}
                  strokeWidth={2.5}
                  style={{ color: GOLD, flexShrink: 0 }}
                  aria-hidden
                />
              )}
              <span
                style={{
                  ...NUMERIC_STYLE,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: isResults ? GOLD : 'white',
                  textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                }}
              >
                {roundLabel_}
              </span>
            </div>
          ) : <span />}
          {dateRange && (
            <span
              style={{
                ...NUMERIC_STYLE,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {dateRange}
            </span>
          )}
        </div>

        {/* Spacer absorbs slack so title+capsule sit at the base (live/upcoming).
            For results, title hugs the top and the poster centres below. */}
        {!isResults && <div style={{ flex: 1, minHeight: 16 }} />}

        {/* Title block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '0 6px',
            marginBottom: 4,
            marginTop: isResults ? 10 : 0,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: 'white',
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: isResults ? 28 : 'clamp(28px, 8vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.02,
              textShadow: isResults ? 'none' : '0 2px 30px rgba(0,0,0,0.40)',
              textWrap: 'balance' as any,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical' as any,
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>
          {venueLine && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {venueLine}
            </div>
          )}
          {(purse != null || venuePar != null || venueYardage != null) && <GlassPills />}
          {/* over-photo countdown chip removed — countdown lives in base band */}
        </div>

        {/* Results — centred champion moment (Layout G): avatar + CHAMPION + name + score */}
        {isResults && safe[0] && (() => {
          const winner = safe[0];
          const winnerAvatarCandidates = resolveAvatarCandidates(winner, tourSlug);

          return (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px 72px', minWidth: 0 }}>
                <span style={{ display: 'inline-flex', boxShadow: '0 0 40px rgba(255,184,0,0.45)', borderRadius: '34%', marginBottom: 14 }}>
                  <SquircleAvatar
                    srcCandidates={winnerAvatarCandidates}
                    alt={entryName(winner)}
                    userId={(winner as any)?.player?.id ?? null}
                    size={92}
                    ringColor={GOLD}
                  />
                </span>
                <div style={{ ...NUMERIC_STYLE, fontSize: 10, fontWeight: 800, letterSpacing: '0.22em', color: GOLD, textTransform: 'uppercase' }}>
                  Champion
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#fff',
                    marginTop: 6,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entryName(winner)}
                </div>
                <div style={{ ...NUMERIC_STYLE, fontSize: 30, fontWeight: 900, color: scoreColor(winner.score), marginTop: 8, letterSpacing: '-0.02em' }}>
                  {fmtScore(winner.score)}
                </div>
              </div>
            </>
          );
        })()}

        {/* Upcoming — defending champion band + footer, pinned to base (flat ink) */}
        {isUpcoming && defendingChamp && (() => {
          const fieldCount = fieldStrength?.totalPlayers && fieldStrength.totalPlayers > 0
            ? fieldStrength.totalPlayers
            : null;
          const viewTournamentLabel = fieldCount
            ? `View tournament · ${fieldCount} in the field`
            : 'View tournament';
          return (
          <button
            type="button"
            onClick={onCtaTap}
            aria-label="View tournament"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
              border: 'none', padding: 0, margin: 0, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', background: 'rgba(10,14,20,0.50)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderTop: '0.5px solid rgba(255,255,255,0.18)' }}>
              {(() => {
                const headshotCandidates = nameCandidates(defendingChamp.name, tourSlug);
                return (
                  <SquircleAvatar
                    srcCandidates={headshotCandidates}
                    alt={defendingChamp.name}
                    size={42}
                    ringColor={GOLD}
                  />

                );
              })()}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase' }}>
                  {defendingChamp.year ? `${defendingChamp.year} Defending Champion` : 'Defending Champion'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{defendingChamp.name}</span>
                  {defendingChamp.score
                    ? <span style={{ ...NUMERIC_STYLE, fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{defendingChamp.score}</span>
                    : null}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '9px 16px', background: 'rgba(10,14,20,0.50)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderTop: '0.5px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {viewTournamentLabel}
              <ChevronRight size={14} strokeWidth={2.5} />
            </div>
          </button>
          );
        })()}

        {/* Countdown now lives top-left as a pill; base is reserved for defending-champ band / footer */}

        {/* Upcoming, no defending champ, no countdown — no base band */}
      </div>

      {/* Live — broadcast board (TODAY / TOTAL / THRU) pinned to bottom */}
      {isLive && (() => {
        const COL_TODAY = 30;
        const COL_TOTAL = 34;
        const COL_THRU = 22;
        const RANK_W = 18;

        // Live pre-play fallback: no leaderboard yet → field-strength preview
        if (safe.length === 0) {
          return (
            <button
              type="button"
              onClick={onCtaTap}
              aria-label="Open leaderboard"
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
                border: 'none', padding: 0, margin: 0, cursor: 'pointer',
                display: 'block', width: '100%', textAlign: 'left',
                background: 'rgba(10,14,20,0.42)',
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                borderTop: '0.5px solid rgba(255,255,255,0.18)',
              }}
            >
              {fieldStrength ? (
                <FieldStrengthRowDark data={fieldStrength} />
              ) : (
                <div style={{ padding: '16px 16px', ...NUMERIC_STYLE, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                  Round 1 · Awaiting scores
                </div>
              )}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 16px calc(9px + env(safe-area-inset-bottom, 0px))',
                  borderTop: '0.5px solid rgba(255,255,255,0.12)',
                }}
              >
                <span style={{ ...NUMERIC_STYLE, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                  {fieldStrength?.totalPlayers != null ? `n = ${fieldStrength.totalPlayers} in the field` : ''}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ ...NUMERIC_STYLE, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: AMBER }}>LEADERBOARD</span>
                  <ChevronRight size={13} strokeWidth={2.5} color={AMBER} style={{ flexShrink: 0 }} />
                </span>
              </div>
            </button>
          );
        }

        // Build rows: leader (solo or tie) + up to 2 chasers
        type Row =
          | { kind: 'solo'; entry: any; rank: string; isLeader: boolean }
          | { kind: 'tie'; rank: string; count: number; score: string | number; items: StackedAvatarItem[]; isLeader: boolean };

        const rows: Row[] = [];
        if (tiedLeaders) {
          const topScore = safe[0]?.score ?? safe[0]?.total;
          const firstChaser = safe.findIndex(e => (e?.score ?? e?.total) !== topScore);
          const chasers = firstChaser >= 0 ? safe.slice(firstChaser) : safe.slice(tiedLeaders.count);
          const tiedItems: StackedAvatarItem[] = safe
            .filter(e => (e?.score ?? e?.total) === topScore)
            .slice(0, 4)
            .map(e => ({ candidates: avatar(e), name: entryName(e), userId: e?.player?.id ?? null }));
          rows.push({ kind: 'tie', rank: 'T1', count: tiedLeaders.count, score: tiedLeaders.score, items: tiedItems, isLeader: true });
          const chaserSlots = buildLeaderboardSlots(chasers, 2);
          chaserSlots.forEach((slot: any) => {
            if (slot.kind === 'tie') {
              rows.push({
                kind: 'tie', rank: slot.rank, count: slot.count, score: slot.score, isLeader: false,
                items: slot.members.map((m: any) => ({ candidates: avatar(m), name: entryName(m), userId: m?.player?.id ?? null })),
              });
            } else {
              rows.push({ kind: 'solo', entry: slot.entry, rank: formatRank(slot.entry), isLeader: false });
            }
          });
        } else {
          const leader = safe[0];
          rows.push({ kind: 'solo', entry: leader, rank: String(leader.position ?? 1), isLeader: true });
          const chaserSlots = buildLeaderboardSlots(safe.slice(1), 2);
          chaserSlots.forEach((slot: any) => {
            if (slot.kind === 'tie') {
              rows.push({
                kind: 'tie', rank: slot.rank, count: slot.count, score: slot.score, isLeader: false,
                items: slot.members.map((m: any) => ({ candidates: avatar(m), name: entryName(m), userId: m?.player?.id ?? null })),
              });
            } else {
              rows.push({ kind: 'solo', entry: slot.entry, rank: formatRank(slot.entry), isLeader: false });
            }
          });
        }

        // Dynamic TODAY column: only render when at least one solo row carries a value.
        const anyToday = rows.some((r: any) => r?.kind === 'solo' && r?.entry?.today != null);

        return (
          <button
            type="button"
            onClick={onCtaTap}
            aria-label="Open full leaderboard"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
              border: 'none', padding: 0, margin: 0, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'left',
              background: 'rgba(10,14,20,0.42)',
              backdropFilter: 'blur(20px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
              borderTop: '0.5px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            {/* Seam feather: gradient bridge from photo into glass board */}
            <div
              aria-hidden
              style={{
                position: 'absolute', left: 0, right: 0, top: -24,
                height: 24, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(10,14,20,0) 0%, rgba(10,14,20,0.42) 100%)',
              }}
            />
            {/* Column header row */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 16px 4px',
              }}
            >
              <span style={{ width: RANK_W, flexShrink: 0 }} />
              <span style={{ width: 26, flexShrink: 0 }} />
              <span style={{ flex: 1 }} />
              {anyToday && <span style={{ ...NUMERIC_STYLE, width: COL_TODAY, textAlign: 'right', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>TODAY</span>}
              <span style={{ ...NUMERIC_STYLE, width: COL_TOTAL, textAlign: 'right', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>TOTAL</span>
              <span style={{ ...NUMERIC_STYLE, width: COL_THRU, textAlign: 'right', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>THRU</span>
            </div>

            {/* Score rows */}
            {rows.map((row, i) => {
              const rowStyle: React.CSSProperties = {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px',
                borderTop: '0.5px solid rgba(255,255,255,0.08)',
              };
              if (row.kind === 'solo') {
                const entry = row.entry;
                const name = entryName(entry);
                const today = entry?.today;
                return (
                  <div key={`solo-${i}`} style={rowStyle}>
                    <span style={{ ...NUMERIC_STYLE, width: RANK_W, fontSize: 12, fontWeight: 700, color: row.isLeader ? AMBER : 'rgba(255,255,255,0.5)', textAlign: 'left', flexShrink: 0 }}>{row.rank}</span>
                    <SquircleAvatar
                      src={undefined}
                      srcCandidates={avatar(entry)}
                      alt={name}
                      userId={entry?.player?.id ?? null}
                      size={26}
                      hideRing
                    />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                    {anyToday && (
                      <span style={{ ...NUMERIC_STYLE, width: COL_TODAY, textAlign: 'right', fontSize: 13, fontWeight: 700, color: scoreColor(today) }}>
                        {today == null ? '—' : fmtScore(today)}
                      </span>
                    )}
                    <span style={{ ...NUMERIC_STYLE, width: COL_TOTAL, textAlign: 'right', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(entry?.score) }}>
                      {fmtScore(entry?.score)}
                    </span>
                    <span style={{ ...NUMERIC_STYLE, width: COL_THRU, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                      {entryThru(entry)}
                    </span>
                  </div>
                );
              }
              // tie row — shared TOTAL only; spacers for TODAY/THRU
              const label = row.isLeader
                ? `${row.count} tied for the lead`
                : `${row.count} players`;
              return (
                <div key={`tie-${i}`} style={rowStyle}>
                  <span style={{ ...NUMERIC_STYLE, width: RANK_W, fontSize: 12, fontWeight: 700, color: row.isLeader ? AMBER : 'rgba(255,255,255,0.5)', textAlign: 'left', flexShrink: 0 }}>{row.rank}</span>
                  <StackedAvatarsDark items={row.items} size={26} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: row.isLeader ? 700 : 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                  {anyToday && <span style={{ width: COL_TODAY, flexShrink: 0 }} />}
                  <span style={{ ...NUMERIC_STYLE, width: COL_TOTAL, textAlign: 'right', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(scoreStringToNumber(row.score)) }}>
                    {typeof row.score === 'number' ? fmtScore(row.score) : row.score}
                  </span>
                  <span style={{ width: COL_THRU, flexShrink: 0 }} />
                </div>
              );
            })}

            {/* Footer */}
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 16px calc(9px + env(safe-area-inset-bottom, 0px))',
                borderTop: '0.5px solid rgba(255,255,255,0.12)',
              }}
            >
              <span style={{ ...NUMERIC_STYLE, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                n = {fieldSize} in the field
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ ...NUMERIC_STYLE, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: AMBER }}>LEADERBOARD</span>
                <ChevronRight size={13} strokeWidth={2.5} color={AMBER} style={{ flexShrink: 0 }} />
              </span>
            </div>
          </button>
        );
      })()}

      {/* Results — data strip + final leaderboard footer CTA */}
      {isResults && (
        <button
          type="button"
          onClick={onCtaTap}
          aria-label="Final leaderboard"
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            border: 'none', borderTop: '0.5px solid rgba(255,255,255,0.18)', cursor: 'pointer',
            background: 'rgba(10,14,20,0.50)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            padding: '9px 18px calc(9px + env(safe-area-inset-bottom, 0px))',
            width: '100%',
          }}
        >
          <span style={{ ...NUMERIC_STYLE, fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: GOLD }}>
            FINAL LEADERBOARD · {safe.length}
          </span>
          <ChevronRight size={14} strokeWidth={2.5} color={GOLD} style={{ flexShrink: 0 }} />
        </button>
      )}
    </div>
  );
}

