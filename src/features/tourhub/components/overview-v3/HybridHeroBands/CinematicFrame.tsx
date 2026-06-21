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
  CINEMATIC_SCRIM,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  AMBER,
  GOLD,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { AMBER_INK, AMBER_TINT_12, GOLD_DEEP } from '../../../_shared/tokens';
import type { HeroState, TopTie, TickerRow } from '../HybridHero.utils';
import { fmtScore, formatRank, buildLeaderboardSlots, roundLabel } from '../HybridHero.utils';
import { Ticker } from './Ticker';

const TICKER_BAR_H = 40;
const CHAMPION_BAND_H = 62;
const UPCOMING_BAND_H = 64;
const BOTTOM_STACK_H = TICKER_BAR_H + CHAMPION_BAND_H;
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';
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
  const direct = e?.player?.photo_url ?? null;
  if (direct) return direct;
  const name = entryName(e);
  if (!name || name === '—' || !tourSlug) return null;
  try { return getPlayerHeadshotUrl(name, tourSlug); } catch { return null; }
}
function scoreColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return 'rgba(255,255,255,0.85)';
  if (score < 0) return '#F87171';   // under par -> red
  if (score > 0) return 'rgba(255,255,255,0.55)'; // over par -> muted white
  return 'rgba(255,255,255,0.85)';   // even
}

// ---- dark-surface row primitives -----------------------------------------

const ROW_BORDER = '0.5px solid rgba(255,255,255,0.08)';

function StackedAvatarsDark({
  urls,
  size = 22,
}: {
  urls: (string | null)[];
  size?: number;
}) {
  const visible = urls.slice(0, 4);
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {visible.map((url, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '34%',
            marginLeft: i === 0 ? 0 : -8,
            border: '1.5px solid #141C28',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: visible.length - i,
            position: 'relative',
          }}
        >
          {url && (
            <img
              src={url}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
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
  avatarUrl: string | null;
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
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          style={{
            width: 26, height: 26, borderRadius: '34%', objectFit: 'cover',
            flexShrink: 0, background: 'rgba(255,255,255,0.08)',
          }}
        />
      ) : (
        <div
          style={{
            width: 26, height: 26, borderRadius: '34%',
            background: 'rgba(255,255,255,0.08)', flexShrink: 0,
          }}
        />
      )}
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
  isLast,
  isResults = false,
}: {
  count: number;
  score: string;
  avatars: (string | null)[];
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
      <StackedAvatarsDark urls={avatars} size={26} />
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
          color: '#F87171', flexShrink: 0,
        }}
      >
        {score}
      </span>
      {!isResults && <span style={{ width: 18, flexShrink: 0 }} />}
    </div>
  );
}

function TiedChasersRowDark({
  rank,
  count,
  score,
  avatars,
  isLast,
  onTap,
  isResults = false,
}: {
  rank: string;
  count: number;
  score: number;
  avatars: (string | null)[];
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
      <StackedAvatarsDark urls={avatars} size={26} />
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
  avatarUrl: string | null;
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
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          style={{
            width: 38, height: 38, borderRadius: '34%', objectFit: 'cover',
            flexShrink: 0, background: 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${GOLD}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
          }}
        />
      ) : (
        <div
          style={{
            width: 38, height: 38, borderRadius: '34%',
            background: 'rgba(255,255,255,0.08)', flexShrink: 0,
            border: `1.5px solid ${GOLD}`,
          }}
        />
      )}
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
  avatarUrl: string | null;
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
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          style={{
            width: 40, height: 40, borderRadius: '34%', objectFit: 'cover',
            flexShrink: 0, background: 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${GOLD}`,
            boxShadow: `0 0 0 1px rgba(0,0,0,0.4)`,
          }}
        />
      ) : (
        <div
          style={{
            width: 40, height: 40, borderRadius: '34%',
            background: 'rgba(255,255,255,0.08)', flexShrink: 0,
            border: `1.5px solid ${GOLD}`,
          }}
        />
      )}
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
  const showTicker = isLive && Array.isArray(top10) && top10.length > 0;
  const roundLabel_ =
    state.kind === 'live'
      ? `LIVE · ${roundLabel(state.round, state.totalRounds).toUpperCase()}`
      : isResults
        ? 'FINAL RESULT'
        : null;

  // ---- Capsule slot construction (mirrors LeaderboardBand live-state) ----
  const safe = Array.isArray(leaderboard) ? leaderboard : [];
  const avatar = (e: any) => resolveAvatar(e, tourSlug);

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

      const tiedAvatars = safe
        .filter(e => (e?.score ?? e?.total) === topScore)
        .slice(0, Math.min(tiedLeaders.count, 4))
        .map(e => avatar(e));

      slotNodes.push(
        <TiedLeadersRowDark
          key="tied-leaders"
          count={tiedLeaders.count}
          score={tiedLeaders.score}
          avatars={tiedAvatars}
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
              avatars={slot.members.map((m: any) => avatar(m))}
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
              avatars={slot.members.map((m: any) => avatar(m))}
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
      const headshot = (() => {
        if (!tourSlug || !defendingChamp.name) return null;
        try { return getPlayerHeadshotUrl(defendingChamp.name, tourSlug); }
        catch { return null; }
      })();
      upcomingCapsule = (
        <DefendingChampionRowDark data={defendingChamp} avatarUrl={headshot} />
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


  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: CINEMATIC_FRAME_HEIGHT,
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
        style={{ position: 'absolute', inset: 0, background: CINEMATIC_SCRIM, zIndex: 2 }}
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
            showTicker ? 16 + BOTTOM_STACK_H
            : (isUpcoming && defendingChamp) ? 16 + UPCOMING_BAND_H
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
            <span
              style={{
                ...NUMERIC_STYLE,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 9px',
                borderRadius: 999,
                background: AMBER_TINT_12,
                border: `1px solid ${AMBER}`,
                color: AMBER,
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Upcoming
            </span>
          ) : roundLabel_ ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isResults && (
                <Trophy
                  size={12}
                  strokeWidth={2.5}
                  style={{ color: GOLD_DEEP, flexShrink: 0 }}
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

        {/* Spacer absorbs slack so title+capsule sit at the base */}
        <div style={{ flex: 1, minHeight: 16 }} />

        {/* Title block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '0 6px',
            marginBottom: 16,
          }}
        >
          <h1
            style={{
              margin: 0,
              color: 'white',
              fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
              textShadow: '0 2px 30px rgba(0,0,0,0.40)',
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
          {countdownText && (
            <div
              style={{
                marginTop: 4,
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                WebkitBackdropFilter: 'blur(12px)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: AMBER, flexShrink: 0,
                }}
              />
              <span
                style={{
                  ...NUMERIC_STYLE,
                  fontSize: 12, fontWeight: 700, color: 'white',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}
              >
                {countdownText}
              </span>
            </div>
          )}
        </div>

        {/* Upcoming — defending champion band, pinned to base (flat ink) */}
        {isUpcoming && defendingChamp && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#0A0E14', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              {(() => {
                const headshot = (tourSlug && defendingChamp.name)
                  ? (() => { try { return getPlayerHeadshotUrl(defendingChamp.name, tourSlug); } catch { return null; } })()
                  : null;
                return headshot
                  ? <img src={headshot} alt="" loading="lazy" style={{ width: 42, height: 42, borderRadius: '34%', objectFit: 'cover', border: `2px solid ${GOLD}`, flexShrink: 0 }} />
                  : <div style={{ width: 42, height: 42, borderRadius: '34%', background: 'rgba(255,255,255,0.08)', border: `2px solid ${GOLD}`, flexShrink: 0 }} />;
              })()}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase' }}>Defending Champion</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{defendingChamp.name}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 13, fontWeight: 800, color: '#fff' }}>{defendingChamp.score}</div>
                <div style={{ ...NUMERIC_STYLE, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{defendingChamp.year}</div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Champion band + ticker — pinned to the bottom edge, whole thing opens full board */}
      {showTicker && (() => {
        const leader = safe[0];
        return (
          <button
            type="button"
            onClick={onCtaTap}
            aria-label="Open full leaderboard"
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
              border: 'none', padding: 0, margin: 0, cursor: 'pointer',
              display: 'block', width: '100%', textAlign: 'left',
            }}
          >
            {/* Champion band — flat ink, trophy emoji, tie-aware */}
            {(leader || tiedLeaders) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '13px 16px 11px',
                  background: '#0A0E14',
                  borderTop: '0.5px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Trophy emoji */}
                <span
                  aria-hidden
                  style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}
                >
                  🏆
                </span>
                {/* Eyebrow + name (tie-aware) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...NUMERIC_STYLE, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase' }}>
                    {tiedLeaders ? 'Tied for the lead' : 'Tournament Leader'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tiedLeaders ? `${tiedLeaders.count} players tied` : entryName(leader)}
                  </div>
                </div>
                {/* Score + thru */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...NUMERIC_STYLE, fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, color: tiedLeaders ? (tiedLeaders.score.startsWith('-') ? '#F87171' : '#fff') : scoreColor(leader.score) }}>
                    {tiedLeaders ? tiedLeaders.score : fmtScore(leader.score)}
                  </div>
                  <div style={{ ...NUMERIC_STYLE, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                    {tiedLeaders ? 'SHARED LEAD' : `THRU ${entryThru(leader)}`}
                  </div>
                </div>
              </div>
            )}
            {/* Ticker */}
            <Ticker rows={top10} />
          </button>
        );
      })()}
    </div>
  );
}

