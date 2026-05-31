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
import { ChevronRight, Crown, Star } from 'lucide-react';
import {
  CINEMATIC_FRAME_HEIGHT,
  CINEMATIC_SCRIM,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  AMBER,
  GOLD,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import type { HeroState, TopTie } from '../HybridHero.utils';
import { fmtScore, formatRank, buildLeaderboardSlots } from '../HybridHero.utils';
import { getPlayerHeadshotUrl } from '@/utils/playerHeadshot';

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
  if (score < 0) return '#34D399';   // under par
  if (score > 0) return '#FCA5A5';   // over par
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
            borderRadius: '50%',
            marginLeft: i === 0 ? 0 : -8,
            border: '1.5px solid rgba(255,255,255,0.9)',
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
}: {
  entry: any;
  rank: string;
  avatarUrl: string | null;
  isLeader: boolean;
  isLast: boolean;
  isResultsLeader: boolean;
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
            width: 26, height: 26, borderRadius: '50%', objectFit: 'cover',
            flexShrink: 0, background: 'rgba(255,255,255,0.08)',
          }}
        />
      ) : (
        <div
          style={{
            width: 26, height: 26, borderRadius: '50%',
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
      <span
        style={{
          ...NUMERIC_STYLE,
          width: 18, fontSize: 11, fontWeight: 600,
          color: 'rgba(255,255,255,0.4)', textAlign: 'right', flexShrink: 0,
        }}
      >
        {entryThru(entry)}
      </span>
    </div>
  );
}

function TiedLeadersRowDark({
  count,
  score,
  avatars,
  isLast,
}: {
  count: number;
  score: string;
  avatars: (string | null)[];
  isLast: boolean;
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
          color: '#34D399', flexShrink: 0,
        }}
      >
        {score}
      </span>
      <span style={{ width: 18, flexShrink: 0 }} />
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
}: {
  rank: string;
  count: number;
  score: number;
  avatars: (string | null)[];
  isLast: boolean;
  onTap?: () => void;
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
      <span style={{ width: 18, flexShrink: 0 }} />
    </div>
  );
}

// ---- props ----------------------------------------------------------------

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
  tourSlug?: string | null;
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
  tourSlug,
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
  const metaParts = [dateRange, venueLine].filter(Boolean);
  const metaLine = metaParts.length ? metaParts.join(' · ') : null;

  // Top meta: LIVE · ROUND N (live) or FINAL (results)
  const isLive = state.kind === 'live';
  const roundLabel =
    state.kind === 'live'
      ? `LIVE · ROUND ${state.round}`
      : state.kind === 'results'
        ? 'FINAL'
        : null;

  // ---- Capsule slot construction (mirrors LeaderboardBand live-state) ----
  const safe = Array.isArray(leaderboard) ? leaderboard : [];
  const avatar = (e: any) => resolveAvatar(e, tourSlug);

  type SlotNode = React.ReactNode;
  const slotNodes: SlotNode[] = [];

  if (safe.length > 0) {
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
            />
          );
        }
      });
    } else {
      const leader = safe[0];
      slotNodes.push(
        <SoloRowDark
          key="leader"
          entry={leader}
          rank={String(leader.position ?? 1)}
          avatarUrl={avatar(leader)}
          isLeader={true}
          isLast={false}
          isResultsLeader={state.kind === 'results'}
        />
      );

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
            />
          );
        }
      });
    }
  }

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

      {/* Top meta row */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          right: 18,
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {roundLabel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLive && (
              <span
                aria-hidden="true"
                className="hybrid-live-pulse"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                ...NUMERIC_STYLE,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'white',
                textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              }}
            >
              {roundLabel}
            </span>
          </div>
        ) : <span />}
        {tourLabel && (
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.65)',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tourLabel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Title block — sits above the capsule */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 200,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {metaLine && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.72)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {metaLine}
            </span>
            {isMajor && (
              <Star
                size={12}
                fill={GOLD}
                color={GOLD}
                strokeWidth={0}
                style={{ flexShrink: 0 }}
              />
            )}
            {isSignature && (
              <span
                style={{
                  color: AMBER,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Signature
              </span>
            )}
          </div>
        )}
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
          }}
        >
          {title}
        </h1>
      </div>

      {/* Floating glass capsule */}
      <div
        className="cinematic-capsule"
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 16,
          zIndex: 5,
          borderRadius: 22,
          padding: 6,
          background: 'rgba(20,28,40,0.55)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        {slotNodes.length > 0 ? (
          <>{slotNodes}</>
        ) : (
          <div
            style={{
              padding: '14px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center',
            }}
          >
            Leaderboard updating…
          </div>
        )}

        {/* Footer CTA */}
        <button
          type="button"
          onClick={onCtaTap}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '11px 10px 9px',
            marginTop: 2,
            background: 'transparent',
            border: 'none',
            borderTop: '0.5px solid rgba(255,255,255,0.08)',
            color: AMBER,
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <span>
            Full leaderboard{fieldSize > 0 ? ` · ${fieldSize} players` : ''}
          </span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
