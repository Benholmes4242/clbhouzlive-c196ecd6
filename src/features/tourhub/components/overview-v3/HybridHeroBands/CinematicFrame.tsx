/**
 * CinematicFrame — Direction A "The Frame" Tour Overview hero (live/results).
 * One full-bleed photo with title block + a frosted-glass leaderboard capsule.
 * Replaces PhotoBand + MiddleBand + LeaderboardBand for live/results states.
 *
 * Upcoming state is unchanged — HybridHero still routes upcoming to the
 * original three-band path.
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
import type { HeroState } from '../HybridHero.utils';
import { fmtScore } from '../HybridHero.utils';
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
function entryPos(e: any, fallback: number): string {
  if (e?.position == null) return String(fallback);
  return e?.position_tied ? `T${e.position}` : String(e.position);
}
function scoreColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return 'rgba(255,255,255,0.85)';
  if (score < 0) return '#34D399';   // under par
  if (score > 0) return '#FCA5A5';   // over par
  return 'rgba(255,255,255,0.85)';   // even
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

  // Top meta: LIVE · ROUND N (live only) or ROUND N (results) — keep simple
  const isLive = state.kind === 'live';
  const roundLabel =
    state.kind === 'live'
      ? `LIVE · ROUND ${state.round}`
      : state.kind === 'results'
        ? 'FINAL'
        : null;

  // Top 3 rows for capsule
  const top3 = (Array.isArray(leaderboard) ? leaderboard : []).slice(0, 3);

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
          bottom: 150,
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
        {top3.length > 0 ? (
          <>
            {top3.map((e, i) => {
              const name = entryName(e);
              const score = e?.score;
              const isLeader = i === 0;
              const avatarUrl =
                e?.player?.photo_url ??
                (name && tourSlug ? safeHeadshot(name, tourSlug) : null);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 10px',
                    borderBottom:
                      i < top3.length - 1
                        ? '0.5px solid rgba(255,255,255,0.08)'
                        : 'none',
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
                    {entryPos(e, i + 1)}
                  </span>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      loading="lazy"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        background: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {name}
                    {isLeader && state.kind === 'results' && (
                      <Crown size={12} color={GOLD} fill={GOLD} strokeWidth={0} />
                    )}
                  </span>
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: scoreColor(score),
                      flexShrink: 0,
                    }}
                  >
                    {fmtScore(score)}
                  </span>
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      width: 18,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.4)',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {entryThru(e)}
                  </span>
                </div>
              );
            })}
          </>
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

function safeHeadshot(name: string, tourSlug: string): string | null {
  try {
    return getPlayerHeadshotUrl(name, tourSlug);
  } catch {
    return null;
  }
}
