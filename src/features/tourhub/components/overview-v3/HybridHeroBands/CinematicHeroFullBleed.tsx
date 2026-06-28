/**
 * CinematicHeroFullBleed — full-bleed cinematic tournament hero.
 *
 * Supports three states as one system:
 *   - LIVE        : top-3 standings band + LIVE/PLAYOFF eyebrow
 *   - RESULTS     : champion celebration block + runners-up + FINAL eyebrow
 *   - UPCOMING    : countdown pills + defending champion + UPCOMING eyebrow
 *
 * Shared DNA across all three:
 *   - Full-bleed venue image bleeding into the notch
 *   - Dark gradient ramp at base
 *   - Uppercase title, eyebrow, amber TOURNAMENT › CTA
 *
 * Ties (live + completed): stacked avatars (up to 3 + N chip).
 * Playoffs: awaiting-playoff eyebrow + WON IN PLAYOFF gold badge on winner.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../../_shared/resolvePlayerAvatar';
import {
  fmtScore,
  formatRank,
  buildLeaderboardSlots,
  type HeroState,
  type TopTie,
} from '../HybridHero.utils';
import { roundLabel } from '../HybridHero.utils';
import { NUMERIC_STYLE, AMBER } from '../HybridHero.constants';
import type { DefendingChampData } from '../../../hooks/useTournamentDefendingChamp';

// ---- tokens ---------------------------------------------------------------

const LEADER_GREEN = '#5BD6A0';
const LEADER_GREEN_RING = 'rgba(91,214,160,0.55)';
const GOLD = '#E8C26A';
const GOLD_TINT = 'rgba(232,194,106,0.16)';
const GOLD_RING = 'rgba(232,194,106,0.65)';
const INK_BASE = '#0D1E16';

const RANK_W = 20;
const COL_TOTAL = 38;
const COL_THRU = 30;
const COL_TODAY = 32;

const FALLBACK_GRADIENT = 'linear-gradient(180deg,#1E4D38,#0F172A)';
const IMAGE_FOCAL = 'center 40%';

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

function entryToday(e: any, round: number | undefined): number | null {
  const rounds = e?.raw_data?.rounds;
  if (!Array.isArray(rounds) || !round || rounds.length < round) return null;
  const r = rounds[round - 1];
  if (!r || r.score == null) return null;
  return r.score ?? null;
}

function avatarFor(e: any, tourSlug?: string | null): string[] {
  return resolvePlayerAvatarCandidates({
    name: entryName(e),
    photoUrl: e?.player?.photo_url ?? null,
    tourSlug: tourSlug ?? 'pga',
  });
}

function scoreColour(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'rgba(255,255,255,0.85)';
  if (n < 0) return LEADER_GREEN;
  if (n > 0) return 'rgba(255,255,255,0.55)';
  return 'rgba(255,255,255,0.85)';
}

function scoreStringToNumber(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  if (typeof s === 'number') return s;
  if (s === 'E') return 0;
  const cleaned = String(s).replace('\u2212', '-');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ---- Stacked avatars (ties) ----------------------------------------------

interface StackedItem {
  candidates: string[];
  name: string;
  userId: string | null;
}

function StackedAvatars({
  items,
  count,
  ringColor,
  size = 24,
  overlap = 9,
  ringWidth = 1.5,
}: {
  items: StackedItem[];
  count: number;
  ringColor?: string;
  size?: number;
  overlap?: number;
  ringWidth?: number;
}) {
  const visible = items.slice(0, 3);
  const extra = count - visible.length;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      {visible.map((item, i) => (
        <div
          key={`${item.userId ?? item.name}-${i}`}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: visible.length - i,
            borderRadius: 9,
            boxShadow: `0 0 0 ${ringWidth}px ${ringColor ?? 'rgba(13,30,22,0.95)'}`,
            display: 'inline-block',
          }}
        >
          <SquircleAvatar
            srcCandidates={item.candidates}
            alt={item.name}
            userId={item.userId}
            size={size}
            hideRing
          />
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            marginLeft: -overlap,
            zIndex: 0,
            width: size,
            height: size,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.16)',
            boxShadow: `0 0 0 ${ringWidth}px ${ringColor ?? 'rgba(13,30,22,0.95)'}`,
            color: 'rgba(255,255,255,0.92)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...NUMERIC_STYLE,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ---- Champion data type ---------------------------------------------------

export interface ChampionData {
  name: string;
  country?: string;
  score: string;
  avatarUrl?: string | null;
  avatarCandidates?: string[];
  playoffWin?: boolean;
}

// ---- Countdown (upcoming) -------------------------------------------------

function CountdownPills({ hoursUntilStart }: { hoursUntilStart: number }) {
  if (!Number.isFinite(hoursUntilStart) || hoursUntilStart <= 0) return null;

  const totalMin = Math.max(0, Math.floor(hoursUntilStart * 60));
  if (totalMin < 1) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: GOLD,
          textTransform: 'uppercase',
          ...NUMERIC_STYLE,
        }}
      >
        Teeing off soon
      </span>
    );
  }

  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;

  const pills: { value: number; label: string }[] = [];
  if (hoursUntilStart >= 24) {
    pills.push({ value: d, label: 'DAYS' });
    pills.push({ value: h, label: 'HRS' });
    pills.push({ value: m, label: 'MIN' });
  } else if (hoursUntilStart >= 1) {
    pills.push({ value: h, label: 'HRS' });
    pills.push({ value: m, label: 'MIN' });
  } else {
    pills.push({ value: m, label: 'MIN' });
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {pills.map(p => (
        <div
          key={p.label}
          style={{
            minWidth: 56,
            padding: '8px 10px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '0.5px solid rgba(255,255,255,0.14)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'white',
              lineHeight: 1,
            }}
          >
            {p.value}
          </span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---- props ----------------------------------------------------------------

export interface CinematicHeroFullBleedProps {
  title: string;
  tourLabel: string | null;
  state: HeroState;
  leaderboard: any[];
  tiedLeaders: TopTie | null;
  fieldSize: number;
  venueImageUrl?: string | null;
  tourSlug?: string | null;
  onCtaTap?: () => void;
  // Results-only
  champion?: ChampionData;
  // Upcoming-only
  defendingChamp?: DefendingChampData | null;
  courseStats?: { par: number | null; yardage: number | null } | null;
  hoursUntilStart?: number;
  venueName?: string | null;
  datesString?: string | null;
}

// ---- component ------------------------------------------------------------

export function CinematicHeroFullBleed({
  title,
  tourLabel,
  state,
  leaderboard,
  tiedLeaders,
  fieldSize,
  venueImageUrl,
  tourSlug,
  onCtaTap,
  champion,
  defendingChamp,
  courseStats,
  hoursUntilStart,
  venueName,
  datesString,
}: CinematicHeroFullBleedProps) {
  const isLive = state.kind === 'live';
  const isResults = state.kind === 'results';
  const isUpcoming = state.kind === 'upcoming';
  if (!isLive && !isResults && !isUpcoming) return null;

  // Cancelled never reaches this component (HybridHero gates).
  const awaitingPlayoff =
    isResults && (state as any).variant === 'awaiting-playoff';

  const safe = Array.isArray(leaderboard) ? leaderboard : [];

  // ----- Background composition (shared across all states) -----
  const gradientScrim =
    'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0) 26%, rgba(15,23,42,0.5) 54%, rgba(13,30,22,0.97) 100%)';
  const background = venueImageUrl
    ? `${gradientScrim}, url(${venueImageUrl}) ${IMAGE_FOCAL} / cover no-repeat`
    : FALLBACK_GRADIENT;

  // ----- Eyebrow -----
  let eyebrowGold = false;
  let eyebrowText = '';
  if (isLive) {
    eyebrowText = `LIVE · ${roundLabel(state.round, state.totalRounds).toUpperCase()}${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`;
  } else if (awaitingPlayoff) {
    eyebrowText = `PLAYOFF${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`;
    eyebrowGold = true;
  } else if (isResults) {
    eyebrowText = `🏆 FINAL${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`;
    eyebrowGold = true;
  } else if (isUpcoming) {
    eyebrowText = `UPCOMING${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`;
  }

  // ----- Rows for live / awaiting-playoff (top-3 with ties) -----
  type Row =
    | { kind: 'solo'; entry: any; rank: string; isLeader: boolean }
    | {
        kind: 'tie';
        rank: string;
        count: number;
        score: string | number;
        items: StackedItem[];
        isLeader: boolean;
      };

  const rows: Row[] = [];
  const showLiveBand = isLive || awaitingPlayoff;
  if (showLiveBand && safe.length > 0) {
    if (tiedLeaders) {
      const topScore = safe[0]?.score ?? safe[0]?.total;
      const firstChaser = safe.findIndex(e => (e?.score ?? e?.total) !== topScore);
      const chasers = firstChaser >= 0 ? safe.slice(firstChaser) : safe.slice(tiedLeaders.count);
      const tiedItems = safe
        .filter(e => (e?.score ?? e?.total) === topScore)
        .slice(0, 4)
        .map(e => ({
          candidates: avatarFor(e, tourSlug),
          name: entryName(e),
          userId: e?.player?.id ?? null,
        }));
      rows.push({
        kind: 'tie',
        rank: 'T1',
        count: tiedLeaders.count,
        score: tiedLeaders.score,
        items: tiedItems,
        isLeader: true,
      });
      const chaserSlots = buildLeaderboardSlots(chasers, 2);
      chaserSlots.forEach((slot: any) => {
        if (slot.kind === 'tie') {
          rows.push({
            kind: 'tie',
            rank: slot.rank,
            count: slot.count,
            score: slot.score,
            isLeader: false,
            items: slot.members.map((m: any) => ({
              candidates: avatarFor(m, tourSlug),
              name: entryName(m),
              userId: m?.player?.id ?? null,
            })),
          });
        } else {
          rows.push({ kind: 'solo', entry: slot.entry, rank: formatRank(slot.entry), isLeader: false });
        }
      });
    } else {
      const leader = safe[0];
      rows.push({ kind: 'solo', entry: leader, rank: String(leader?.position ?? 1), isLeader: true });
      const chaserSlots = buildLeaderboardSlots(safe.slice(1), 2);
      chaserSlots.forEach((slot: any) => {
        if (slot.kind === 'tie') {
          rows.push({
            kind: 'tie',
            rank: slot.rank,
            count: slot.count,
            score: slot.score,
            isLeader: false,
            items: slot.members.map((m: any) => ({
              candidates: avatarFor(m, tourSlug),
              name: entryName(m),
              userId: m?.player?.id ?? null,
            })),
          });
        } else {
          rows.push({ kind: 'solo', entry: slot.entry, rank: formatRank(slot.entry), isLeader: false });
        }
      });
    }
  }

  const round = isLive ? state.round : undefined;
  const anyToday =
    isLive && rows.some(r => r.kind === 'solo' && entryToday(r.entry, round) != null);

  // ----- Results: champion-block runners-up (skip winner from rows) -----
  type ResRow =
    | { kind: 'solo'; entry: any; rank: string }
    | { kind: 'tie'; rank: string; count: number; score: string | number; items: StackedItem[] };

  const runnersUp: ResRow[] = [];
  if (isResults && !awaitingPlayoff && safe.length > 1) {
    const chaserSlots = buildLeaderboardSlots(safe.slice(1), 2);
    chaserSlots.forEach((slot: any) => {
      if (slot.kind === 'tie') {
        runnersUp.push({
          kind: 'tie',
          rank: slot.rank,
          count: slot.count,
          score: slot.score,
          items: slot.members.map((m: any) => ({
            candidates: avatarFor(m, tourSlug),
            name: entryName(m),
            userId: m?.player?.id ?? null,
          })),
        });
      } else {
        runnersUp.push({ kind: 'solo', entry: slot.entry, rank: formatRank(slot.entry) });
      }
    });
  }

  // ----- Results: margin computation -----
  const winnerScoreNum = champion ? scoreStringToNumber(champion.score) : null;
  const runnerUpScoreNum = (() => {
    if (!isResults || safe.length < 2) return null;
    const second = safe.find((e: any, i: number) => i > 0 && (e?.score ?? e?.total) !== (safe[0]?.score ?? safe[0]?.total));
    if (!second) return null;
    return scoreStringToNumber(second.score ?? second.total);
  })();
  const margin =
    winnerScoreNum != null && runnerUpScoreNum != null
      ? Math.abs(runnerUpScoreNum - winnerScoreNum)
      : null;

  // ----- Defending champ avatar -----
  const defChampAvatars = defendingChamp?.name
    ? resolvePlayerAvatarCandidates({
        name: defendingChamp.name,
        photoUrl: null,
        tourSlug: tourSlug ?? 'pga',
      })
    : [];

  // ----- Shared eyebrow span -----
  const EyebrowSpan = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {isLive && (
        <span
          aria-hidden
          className="hybrid-live-pulse"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: LEADER_GREEN,
            boxShadow: '0 0 10px rgba(91,214,160,0.7)',
            display: 'inline-block',
          }}
        />
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: eyebrowGold ? GOLD : 'rgba(255,255,255,0.78)',
          textTransform: 'uppercase',
        }}
      >
        {eyebrowText}
      </span>
    </div>
  );

  // ----- Sub line (upcoming) -----
  const upcomingSub = isUpcoming
    ? [venueName, datesString].filter(Boolean).join(' · ')
    : '';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '78vh',
        background,
        backgroundColor: INK_BASE,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Spacer */}
      <div style={{ flex: 1, minHeight: 220 }} />

      {/* Title block */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '0 18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {EyebrowSpan}

        <h1
          style={{
            margin: 0,
            fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 'clamp(24px, 7.8vw, 30px)',
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: '-0.01em',
            color: 'white',
            textTransform: 'uppercase',
            textShadow: '0 2px 14px rgba(0,0,0,0.45)',
            textWrap: 'balance' as any,
          }}
        >
          {title}
        </h1>

        {isUpcoming && upcomingSub && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {upcomingSub}
          </div>
        )}

        {isUpcoming && hoursUntilStart != null && Number.isFinite(hoursUntilStart) && (
          <div style={{ marginTop: 14 }}>
            <CountdownPills hoursUntilStart={hoursUntilStart} />
          </div>
        )}
      </div>

      {/* ============ RESULTS: Champion celebration block ============ */}
      {isResults && !awaitingPlayoff && champion && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px 18px 18px',
            borderTop: '0.5px solid rgba(255,255,255,0.10)',
            background:
              'linear-gradient(180deg, rgba(232,194,106,0.06) 0%, rgba(232,194,106,0) 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              boxShadow: `0 0 0 2px ${GOLD_RING}, 0 4px 18px rgba(232,194,106,0.25)`,
            }}
          >
            <SquircleAvatar
              srcCandidates={champion.avatarCandidates ?? (champion.avatarUrl ? [champion.avatarUrl] : [])}
              alt={champion.name}
              size={56}
              hideRing
            />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: GOLD,
                textTransform: 'uppercase',
              }}
            >
              ★ Champion
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {champion.name}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  ...NUMERIC_STYLE,
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: LEADER_GREEN,
                }}
              >
                {champion.score}
              </span>
              {champion.playoffWin ? (
                <span
                  style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: GOLD,
                    background: GOLD_TINT,
                    border: `0.5px solid ${GOLD_RING}`,
                    borderRadius: 999,
                    padding: '3px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  Won in playoff
                </span>
              ) : margin != null && margin > 0 ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Won by {margin}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ============ RESULTS: Runners-up band ============ */}
      {isResults && !awaitingPlayoff && runnersUp.length > 0 && (
        <button
          type="button"
          onClick={onCtaTap}
          aria-label="Final tournament"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: onCtaTap ? 'pointer' : 'default',
            display: 'block',
          }}
        >
          {runnersUp.slice(0, 2).map((row, i) => {
            const rowStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 18px',
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
            };
            if (row.kind === 'solo') {
              return (
                <div key={`ru-solo-${i}`} style={rowStyle}>
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      width: RANK_W,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.5)',
                      textAlign: 'left',
                      flexShrink: 0,
                    }}
                  >
                    {row.rank}
                  </span>
                  <SquircleAvatar
                    srcCandidates={avatarFor(row.entry, tourSlug)}
                    alt={entryName(row.entry)}
                    userId={row.entry?.player?.id ?? null}
                    size={26}
                    hideRing
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entryName(row.entry)}
                  </span>
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      width: COL_TOTAL,
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: scoreColour(row.entry?.score),
                    }}
                  >
                    {fmtScore(row.entry?.score)}
                  </span>
                </div>
              );
            }
            const tieScoreNum = scoreStringToNumber(row.score);
            const label = `${row.count} players`;
            return (
              <div key={`ru-tie-${i}`} style={rowStyle}>
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: RANK_W,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    textAlign: 'left',
                    flexShrink: 0,
                  }}
                >
                  {row.rank}
                </span>
                <StackedAvatars items={row.items} count={row.count} />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: COL_TOTAL,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: scoreColour(tieScoreNum),
                  }}
                >
                  {typeof row.score === 'number' ? fmtScore(row.score) : row.score}
                </span>
              </div>
            );
          })}
          <Footer
            leftText="Final results"
            isLive={false}
          />
        </button>
      )}

      {/* ============ LIVE / AWAITING-PLAYOFF: standings band ============ */}
      {showLiveBand && (
        <button
          type="button"
          onClick={onCtaTap}
          aria-label="Open tournament"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: onCtaTap ? 'pointer' : 'default',
            display: 'block',
          }}
        >
          {rows.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 18px 4px',
              }}
            >
              <span style={{ width: RANK_W, flexShrink: 0 }} />
              <span style={{ width: 26, flexShrink: 0 }} />
              <span style={{ flex: 1 }} />
              {anyToday && (
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: COL_TODAY,
                    textAlign: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  TODAY
                </span>
              )}
              <span
                style={{
                  ...NUMERIC_STYLE,
                  width: COL_TOTAL,
                  textAlign: 'center',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                TOT
              </span>
              {isLive && (
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: COL_THRU,
                    textAlign: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                >
                  THRU
                </span>
              )}
            </div>
          )}

          {rows.slice(0, 3).map((row, i) => {
            const rowStyle: React.CSSProperties = {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 18px',
              borderTop: '0.5px solid rgba(255,255,255,0.08)',
            };
            if (row.kind === 'solo') {
              const today = entryToday(row.entry, round);
              const liveThru = row.entry?.raw_data?.rounds?.[(round ?? 1) - 1]?.thru;
              const thruDisplay =
                isLive
                  ? liveThru === 18
                    ? 'F'
                    : liveThru != null
                      ? String(liveThru)
                      : entryThru(row.entry)
                  : 'F';
              return (
                <div key={`solo-${i}`} style={rowStyle}>
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      width: RANK_W,
                      fontSize: 12,
                      fontWeight: 700,
                      color: row.isLeader ? LEADER_GREEN : 'rgba(255,255,255,0.5)',
                      textAlign: 'left',
                      flexShrink: 0,
                    }}
                  >
                    {row.rank}
                  </span>
                  <SquircleAvatar
                    srcCandidates={avatarFor(row.entry, tourSlug)}
                    alt={entryName(row.entry)}
                    userId={row.entry?.player?.id ?? null}
                    size={26}
                    hideRing
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 14,
                      fontWeight: row.isLeader ? 700 : 600,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {entryName(row.entry)}
                  </span>
                  {anyToday && (
                    <span
                      style={{
                        ...NUMERIC_STYLE,
                        width: COL_TODAY,
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: scoreColour(today),
                      }}
                    >
                      {today == null ? '—' : fmtScore(today)}
                    </span>
                  )}
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      width: COL_TOTAL,
                      textAlign: 'center',
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: row.isLeader ? LEADER_GREEN : scoreColour(row.entry?.score),
                    }}
                  >
                    {fmtScore(row.entry?.score)}
                  </span>
                  {isLive && (
                    <span
                      style={{
                        ...NUMERIC_STYLE,
                        width: COL_THRU,
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {thruDisplay}
                    </span>
                  )}
                </div>
              );
            }
            // tie row — stacked avatars
            const label = awaitingPlayoff && row.isLeader
              ? `${row.count} in playoff`
              : row.isLeader
                ? `${row.count} tied for the lead`
                : `${row.count} players`;
            const tieScoreNum = scoreStringToNumber(row.score);
            return (
              <div key={`tie-${i}`} style={rowStyle}>
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: RANK_W,
                    fontSize: 12,
                    fontWeight: 700,
                    color: row.isLeader ? (awaitingPlayoff ? GOLD : LEADER_GREEN) : 'rgba(255,255,255,0.5)',
                    textAlign: 'left',
                    flexShrink: 0,
                  }}
                >
                  {row.rank}
                </span>
                <StackedAvatars
                  items={row.items}
                  count={row.count}
                  ringColor={row.isLeader ? (awaitingPlayoff ? GOLD_RING : LEADER_GREEN_RING) : undefined}
                />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: row.isLeader ? 700 : 600,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label}
                </span>
                {anyToday && <span style={{ width: COL_TODAY, flexShrink: 0 }} />}
                <span
                  style={{
                    ...NUMERIC_STYLE,
                    width: COL_TOTAL,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: row.isLeader ? (awaitingPlayoff ? GOLD : LEADER_GREEN) : scoreColour(tieScoreNum),
                  }}
                >
                  {typeof row.score === 'number' ? fmtScore(row.score) : row.score}
                </span>
                {isLive && <span style={{ width: COL_THRU, flexShrink: 0 }} />}
              </div>
            );
          })}

          <Footer
            leftText={`${fieldSize} in the field`}
            isLive
          />
        </button>
      )}

      {/* ============ UPCOMING: defending champ + CTA ============ */}
      {isUpcoming && (
        <button
          type="button"
          onClick={onCtaTap}
          aria-label="Open tournament"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: onCtaTap ? 'pointer' : 'default',
            display: 'block',
          }}
        >
          {defendingChamp && defendingChamp.name ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderTop: '0.5px solid rgba(255,255,255,0.10)',
              }}
            >
              <SquircleAvatar
                srcCandidates={defChampAvatars}
                alt={defendingChamp.name}
                size={40}
                hideRing
                hairlineRing
                ringColor={GOLD_RING}
              />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    color: GOLD,
                    textTransform: 'uppercase',
                  }}
                >
                  ★ Defending champion
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {defendingChamp.name}
                </span>
                {(defendingChamp.year || defendingChamp.score) && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.55)',
                      letterSpacing: '0.02em',
                      ...NUMERIC_STYLE,
                    }}
                  >
                    {[defendingChamp.year, defendingChamp.score].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          ) : courseStats && (courseStats.par != null || courseStats.yardage != null) ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '14px 18px',
                borderTop: '0.5px solid rgba(255,255,255,0.10)',
              }}
            >
              {courseStats.par != null && (
                <CourseStat label="PAR" value={String(courseStats.par)} />
              )}
              {courseStats.yardage != null && (
                <CourseStat label="YARDS" value={courseStats.yardage.toLocaleString()} />
              )}
            </div>
          ) : null}

          <Footer leftText="" isLive={false} />
        </button>
      )}
    </div>
  );
}

// ---- shared footer --------------------------------------------------------

function Footer({ leftText, isLive }: { leftText: string; isLive: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 18px 14px',
        borderTop: '0.5px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.02em',
        }}
      >
        {leftText}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            ...NUMERIC_STYLE,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: AMBER,
          }}
        >
          TOURNAMENT
        </span>
        <ChevronRight size={13} strokeWidth={2.5} color={AMBER} style={{ flexShrink: 0 }} />
      </span>
      {/* underscores to silence unused-var lints across forks */}
      <span style={{ display: 'none' }}>{isLive ? '1' : '0'}</span>
    </div>
  );
}

function CourseStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 8.5,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...NUMERIC_STYLE,
          fontSize: 18,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>
    </div>
  );
}
