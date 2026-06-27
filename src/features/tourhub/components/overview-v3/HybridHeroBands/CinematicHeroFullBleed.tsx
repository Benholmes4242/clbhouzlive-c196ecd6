/**
 * CinematicHeroFullBleed — Stage 1 of the cinematic tournament hero redesign.
 *
 * Full-bleed leader photo with a dark gradient ramp, low-positioned title
 * + eyebrow, and a top-3 standings band fused at the base. Renders for the
 * LIVE and RESULTS states only. Upcoming continues to use the existing
 * CinematicFrame for now.
 *
 * Reuses the exact `buildLeaderboardSlots` + `tiedLeaders` machinery so the
 * top-3 (and tie collapsing) match the Leaderboards tab — DO NOT re-derive
 * positions here.
 *
 * Stage 1 deliberately renders in the normal page flow BELOW the existing
 * chrome. Safe-area padding is wired now so Stage 2 only needs to lift the
 * surface up under the chrome.
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

// ---- tokens ---------------------------------------------------------------

const LEADER_GREEN = '#5BD6A0';
const LEADER_GREEN_RING = 'rgba(91,214,160,0.55)';
const INK_BASE = '#0D1E16';

const RANK_W = 20;
const COL_TOTAL = 38;
const COL_THRU = 30;
const COL_TODAY = 32;

const FALLBACK_GRADIENT = 'linear-gradient(180deg,#1E4D38,#0F172A)';

// Single dial for hero photo crop. Tuned for typical golf action/headshot
// framing — keeps faces comfortably in the upper third without cutting heads.
// One-line knob if we need to nudge later.
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
  const cleaned = s.replace('\u2212', '-');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// ---- props ----------------------------------------------------------------

export interface CinematicHeroFullBleedProps {
  title: string;
  tourLabel: string | null;
  state: HeroState;
  leaderboard: any[];
  tiedLeaders: TopTie | null;
  fieldSize: number;
  leaderPhotoUrl?: string | null;
  tourSlug?: string | null;
  onCtaTap?: () => void;
}

// ---- component ------------------------------------------------------------

export function CinematicHeroFullBleed({
  title,
  tourLabel,
  state,
  leaderboard,
  tiedLeaders,
  fieldSize,
  leaderPhotoUrl,
  tourSlug,
  onCtaTap,
}: CinematicHeroFullBleedProps) {
  const isLive = state.kind === 'live';
  const isResults = state.kind === 'results';
  if (!isLive && !isResults) return null;

  const safe = Array.isArray(leaderboard) ? leaderboard : [];

  // Build top-3 rows using shared slot machinery (handles ties correctly).
  type Row =
    | { kind: 'solo'; entry: any; rank: string; isLeader: boolean }
    | {
        kind: 'tie';
        rank: string;
        count: number;
        score: string | number;
        items: { candidates: string[]; name: string; userId: string | null }[];
        isLeader: boolean;
      };

  const rows: Row[] = [];
  if (safe.length > 0) {
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
  const totalRounds = isLive ? state.totalRounds : 4;
  const anyToday =
    isLive && rows.some(r => r.kind === 'solo' && entryToday(r.entry, round) != null);

  // Background composition
  const gradientScrim =
    'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0) 26%, rgba(15,23,42,0.5) 54%, rgba(13,30,22,0.97) 100%)';

  const background = leaderPhotoUrl
    ? `${gradientScrim}, url(${leaderPhotoUrl}) ${PHOTO_FOCAL} / cover no-repeat`
    : FALLBACK_GRADIENT;

  // Eyebrow text
  const eyebrowText = isLive
    ? `LIVE · ${roundLabel(state.round, state.totalRounds).toUpperCase()}${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`
    : `FINAL${tourLabel ? ` · ${tourLabel.toUpperCase()}` : ''}`;

  void totalRounds;

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
        // Inner padding pushes content below the notch while the IMAGE bleeds
        // up behind. Stage 2 will remove the chrome offset above this surface.
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Spacer to push title block low */}
      <div style={{ flex: 1, minHeight: 220 }} />

      {/* Title block — low, left */}
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
        {/* Eyebrow */}
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
              color: 'rgba(255,255,255,0.78)',
              textTransform: 'uppercase',
            }}
          >
            {eyebrowText}
          </span>
        </div>

        {/* Title */}
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
      </div>

      {/* Standings band — fused at base */}
      <button
        type="button"
        onClick={onCtaTap}
        aria-label={isLive ? 'Open tournament' : 'Final tournament'}
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
        {/* Column hints */}
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

        {/* Rows */}
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
            const liveThru = row.entry?.raw_data?.rounds?.[
              (round ?? 1) - 1
            ]?.thru;
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
                  hideRing={!row.isLeader}
                  hairlineRing={row.isLeader}
                  ringColor={row.isLeader ? LEADER_GREEN_RING : undefined}
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
          // tie row
          const label = row.isLeader ? `${row.count} tied for the lead` : `${row.count} players`;
          const tieScoreNum = scoreStringToNumber(row.score);
          return (
            <div key={`tie-${i}`} style={rowStyle}>
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
              <div style={{ width: 26, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {row.items[0] && (
                  <SquircleAvatar
                    srcCandidates={row.items[0].candidates}
                    alt={row.items[0].name}
                    userId={row.items[0].userId}
                    size={26}
                    hideRing={!row.isLeader}
                    hairlineRing={row.isLeader}
                    ringColor={row.isLeader ? LEADER_GREEN_RING : undefined}
                  />
                )}
              </div>
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
                  color: row.isLeader ? LEADER_GREEN : scoreColour(tieScoreNum),
                }}
              >
                {typeof row.score === 'number' ? fmtScore(row.score) : row.score}
              </span>
              {isLive && <span style={{ width: COL_THRU, flexShrink: 0 }} />}
            </div>
          );
        })}

        {/* Footer */}
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
            {fieldSize} in the field
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
        </div>
      </button>
    </div>
  );
}
