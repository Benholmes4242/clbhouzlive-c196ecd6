/**
 * IntelligenceHero — Tournament Intelligence section (carousel rebuild)
 *
 * Replaces the prior ~2k-line editorial layout with a horizontal carousel of
 * three headshot-led pick cards plus a "receipts" tail card. The pattern is
 * locked across all three lifecycle states (upcoming / live / results) — only
 * the pill, meta strip, and tail-card framing adapt.
 *
 * Source of truth for the visual design is the mock at
 * `tournament-intelligence-final.jsx`. This file ports that mock to
 * TypeScript and wires it to the existing data layer:
 *   - useIntelligenceLifecycleState  → state + active payload
 *   - usePredictionTracker            → live + results positional data
 *   - useIntelligenceHistoricalPicks → "receipts" stats (wins / top-5s / hit rate)
 *   - IntelligenceAboutSheet          → about bottom sheet (unchanged)
 *
 * Movement indicator (live state) uses `moveDir` / `moveSpots` derived inside
 * `usePredictionTracker` from a poll-to-poll position cache.
 */

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  ChevronRight,
  ChevronUp,
  Trophy,
  Award,
  Clock,
  MapPin,
} from 'lucide-react';
import {
  useIntelligenceLifecycleState,
  type IntelligenceLifecycleState,
} from '../hooks/useIntelligenceLifecycleState';
import {
  useIntelligenceHistoricalPicks,
} from '../hooks/useIntelligenceHistoricalPicks';
import { usePredictionTracker } from '../hooks/usePredictionTracker';
import type {
  AIPredictionData,
  AITopContender,
} from '../hooks/useAIPredictions';
import type { TrackedPrediction } from './tournament-insights/types';
import { IntelligenceSheet } from './IntelligenceSheet';
import {
  getPlayerHeadshotUrl,
  PLAYER_SILHOUETTE_URL,
} from '@/utils/playerHeadshot';

// ─── Tokens (mirrors the mock) ──────────────────────────────────────────────
const ink = '#0F172A';
const inkSoft = '#475569';
const inkFaint = '#94A3B8';
const surface = '#FFFFFF';
const amber = '#F7931E';
const amberDeep = '#D97706';
const amberSoft = '#FEF3E7';
const seasonGreen = '#006747';
const greenLight = '#10B981';
const danger = '#DC2626';
const gold = '#FFB800';
const goldDeep = '#D97706';
const hairline = '#E2E8F0';
const hairlineSoft = '#EDF1F5';
const headlineFont =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ─── Helpers ────────────────────────────────────────────────────────────────
function getInitials(fullName: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function formatPositionString(p: TrackedPrediction): string {
  if (p.performanceStatus === 'cut') return 'MC';
  if (p.performanceStatus === 'withdrawn') return 'WD';
  if (p.actualPosition === null) return '—';
  return `${p.actualPositionTied ? 'T' : ''}${p.actualPosition}`;
}

function formatThru(thru: number | null | undefined, currentRound: number | null | undefined): string {
  if (thru == null) return '—';
  if (thru >= 18) return 'F';
  return String(thru);
}

interface TournamentMetaInfo {
  name: string;
  course: string;
  location: string;
}

function buildTournamentMeta(t: AIPredictionData['tournament'] | undefined | null): TournamentMetaInfo {
  if (!t) return { name: '—', course: '—', location: '' };
  const locParts: string[] = [];
  if (t.venueCity) locParts.push(t.venueCity);
  if (t.venueState) locParts.push(t.venueState);
  if (!locParts.length && t.venueCountry) locParts.push(t.venueCountry);
  return {
    name: t.name || '—',
    course: t.venueName || '—',
    location: locParts.join(', '),
  };
}

// ─── Headshot ───────────────────────────────────────────────────────────────
function PlayerHeadshot({
  name,
  desaturate,
}: {
  name: string;
  desaturate?: boolean;
}) {
  const src = getPlayerHeadshotUrl(name, 'pga');
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, #1E293B, ${ink})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {failed ? (
        <span
          style={{
            fontFamily: headlineFont,
            fontSize: 56,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {getInitials(name)}
        </span>
      ) : (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.endsWith(PLAYER_SILHOUETTE_URL)) setFailed(true);
            else el.src = PLAYER_SILHOUETTE_URL;
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
            filter: desaturate ? 'saturate(0.7)' : 'none',
          }}
        />
      )}
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({
  meta,
  headline,
  onAboutClick,
}: {
  meta: TournamentMetaInfo;
  headline: string;
  onAboutClick: () => void;
}) {
  return (
    <div style={{ padding: '0 16px', marginBottom: 14 }}>
      <button
        onClick={onAboutClick}
        aria-label="About Tournament Intelligence"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: headlineFont,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        }}
      >
        <Brain size={13} color={amber} strokeWidth={2.5} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: amber,
          }}
        >
          TOURNAMENT INTELLIGENCE
        </span>
        <ChevronRight
          size={11}
          color={amber}
          strokeWidth={2.5}
          style={{ marginTop: 1 }}
        />
      </button>

      <div
        style={{
          fontFamily: headlineFont,
          fontSize: 18,
          fontWeight: 800,
          color: ink,
          letterSpacing: '-0.015em',
          lineHeight: 1.2,
        }}
      >
        {headline}
      </div>
      <div style={{ marginTop: 6, fontFamily: headlineFont }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: ink,
            lineHeight: 1.25,
            letterSpacing: '-0.005em',
          }}
        >
          {meta.name}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: inkSoft,
            marginTop: 2,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexWrap: 'wrap',
          }}
        >
          <span>{meta.course}</span>
          {meta.location && (
            <>
              <span style={{ color: inkFaint }}>·</span>
              <MapPin size={10} color={inkFaint} strokeWidth={2} />
              <span>{meta.location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Meta tray (expand-on-tap reasons) ──────────────────────────────────────
function CardMetaTray({
  insight,
  reasons,
}: {
  insight: string;
  reasons: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          padding: '12px 14px 13px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          cursor: 'pointer',
          fontFamily: headlineFont,
          // (size to content; 2-line clamp keeps cards consistent)
        }}
      >
        <div
          style={{
            fontSize: 18,
            color: amber,
            fontWeight: 800,
            lineHeight: 0.6,
            marginTop: 4,
          }}
        >
          “
        </div>
        <div
          style={{
            fontSize: 12,
            color: inkSoft,
            lineHeight: 1.45,
            fontStyle: 'italic',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 99 : 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          "{insight}"
        </div>
        <ChevronUp
          size={14}
          color={inkFaint}
          strokeWidth={2.5}
          style={{
            flexShrink: 0,
            marginTop: 3,
            transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 200ms',
          }}
        />
      </button>

      <div
        style={{
          maxHeight: expanded ? 280 : 0,
          overflow: 'hidden',
          transition: 'max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            padding: '0 14px 14px',
            borderTop: `1px solid ${hairlineSoft}`,
            marginTop: -1,
          }}
        >
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: inkFaint,
              padding: '10px 0 6px',
            }}
          >
            WHY WE PICKED HIM
          </div>
          {reasons.filter((r) => r && r.trim().length > 0).slice(0, 3).map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 0',
                borderTop: i > 0 ? `1px solid ${hairlineSoft}` : 'none',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: amberSoft,
                  color: amberDeep,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: headlineFont,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: inkSoft,
                  lineHeight: 1.45,
                  flex: 1,
                  fontFamily: headlineFont,
                }}
              >
                {r}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Card shell ─────────────────────────────────────────────────────────────
function CardShell({
  children,
  isWinner,
  isLive,
}: {
  children: React.ReactNode;
  isWinner?: boolean;
  isLive?: boolean;
}) {
  return (
    <div
      className={isWinner ? 'ti-trophy-glow' : ''}
      style={{
        flexShrink: 0,
        width: 280,
        scrollSnapAlign: 'start',
        background: surface,
        borderRadius: 18,
        overflow: 'hidden',
        border: isWinner ? `1.5px solid ${gold}` : `1px solid ${hairline}`,
        boxShadow: isWinner ? undefined : '0 1px 3px rgba(15,23,42,0.04)',
        position: 'relative',
      }}
    >
      {isLive && (
        <div
          className="ti-live-stripe"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 2,
          }}
        />
      )}
      {children}
    </div>
  );
}

function CardHero({
  name,
  desaturate,
  isWinner,
  children,
}: {
  name: string;
  desaturate?: boolean;
  isWinner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', height: 220, background: ink }}>
      <PlayerHeadshot name={name} desaturate={desaturate} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      {isWinner && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40%',
                height: '100%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                animation: 'ti-goldShine 3.5s ease-in-out infinite',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: -14,
              transform: 'translateY(-55%)',
              opacity: 0.18,
              pointerEvents: 'none',
            }}
          >
            <Trophy size={130} color={gold} strokeWidth={1.4} />
          </div>
        </>
      )}
      {children}
    </div>
  );
}

// ─── Pick cards (one per state) ─────────────────────────────────────────────
interface UpcomingPick {
  rank: number;
  name: string;
  insight: string;
  reasons: string[];
  courseFit: number | null;
}

function UpcomingCard({ pick }: { pick: UpcomingPick }) {
  return (
    <CardShell>
      <CardHero name={pick.name}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: amber,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: headlineFont,
          }}
        >
          <Clock size={10} strokeWidth={3} /> TO PLAY
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            right: 14,
            color: '#fff',
            fontFamily: headlineFont,
          }}
        >
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {pick.name}
          </div>
          {pick.courseFit != null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.65)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                COURSE FIT
              </span>
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, pick.courseFit))}%`,
                    height: '100%',
                    background: amber,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: amber,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(pick.courseFit)}
              </span>
            </div>
          )}
        </div>
      </CardHero>
      <CardMetaTray insight={pick.insight} reasons={pick.reasons} />
    </CardShell>
  );
}

interface LivePick {
  rank: number;
  name: string;
  insight: string;
  reasons: string[];
  position: string;
  score: string;
  thru: string;
  moveDir: 'up' | 'down' | 'flat';
  moveSpots: number;
  finished: boolean;
}

function LiveCard({ pick }: { pick: LivePick }) {
  const moveColor =
    pick.moveDir === 'up'
      ? greenLight
      : pick.moveDir === 'down'
      ? danger
      : inkFaint;
  const moveSymbol =
    pick.moveDir === 'up' ? '▲' : pick.moveDir === 'down' ? '▼' : '—';

  return (
    <CardShell isLive={!pick.finished}>
      <CardHero name={pick.name}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: pick.finished ? 'rgba(0,0,0,0.55)' : seasonGreen,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: headlineFont,
          }}
        >
          {!pick.finished && (
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#fff',
                animation: 'ti-pulse 1.4s ease-in-out infinite',
              }}
            />
          )}
          {pick.finished ? 'FINISHED' : 'LIVE'}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            right: 14,
            color: '#fff',
            fontFamily: headlineFont,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              marginBottom: 6,
            }}
          >
            {pick.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.1em',
                  marginBottom: -2,
                }}
              >
                POS
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pick.position}
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                background: 'rgba(255,255,255,0.15)',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.1em',
                  marginBottom: -2,
                }}
              >
                SCORE
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: amber,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pick.score}
              </div>
            </div>
            <div
              style={{
                width: 1,
                height: 32,
                background: 'rgba(255,255,255,0.15)',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.1em',
                  marginBottom: -2,
                }}
              >
                THRU
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1.4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {pick.thru}
              </div>
            </div>
            {pick.moveSpots > 0 && (
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  color: moveColor,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: headlineFont,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span style={{ fontSize: 10 }}>{moveSymbol}</span>
                {pick.moveSpots}
              </div>
            )}
          </div>
        </div>
      </CardHero>
      <CardMetaTray insight={pick.insight} reasons={pick.reasons} />
    </CardShell>
  );
}

interface ResultsPick {
  rank: number;
  name: string;
  insight: string;
  reasons: string[];
  finished: string; // formatted final position
  score: string;
  outcome: 'win' | 'top5' | 'top10' | 'miss';
}

function ResultsCard({ pick }: { pick: ResultsPick }) {
  const isWinner = pick.outcome === 'win';
  const outcomeConfig = {
    win: {
      bg: gold,
      label: 'WE CALLED IT',
      color: ink,
      weight: 800 as const,
    },
    top5: {
      bg: seasonGreen,
      label: `✓ TOP 5 · ${pick.finished}`,
      color: '#fff',
      weight: 700 as const,
    },
    top10: {
      bg: greenLight,
      label: `TOP 10 · ${pick.finished}`,
      color: '#fff',
      weight: 700 as const,
    },
    miss: {
      bg: 'rgba(0,0,0,0.55)',
      label: `FINISHED ${pick.finished}`,
      color: '#fff',
      weight: 700 as const,
    },
  } as const;
  const cfg = outcomeConfig[pick.outcome];

  return (
    <CardShell isWinner={isWinner}>
      <CardHero
        name={pick.name}
        desaturate={pick.outcome === 'miss'}
        isWinner={isWinner}
      >
        <div
          className={isWinner ? 'ti-called-it' : ''}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: cfg.bg,
            padding: '6px 11px',
            borderRadius: 8,
            fontSize: isWinner ? 10 : 9.5,
            fontWeight: cfg.weight,
            letterSpacing: isWinner ? '0.12em' : '0.08em',
            color: cfg.color,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: isWinner
              ? '0 4px 12px rgba(255,184,0,0.4)'
              : undefined,
            fontFamily: headlineFont,
          }}
        >
          {isWinner && <Trophy size={11} strokeWidth={3} color={ink} />}
          {cfg.label}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            right: 14,
            color: '#fff',
            fontFamily: headlineFont,
          }}
        >
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {pick.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginTop: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>
              Final:{' '}
              <strong style={{ color: isWinner ? gold : '#fff' }}>
                {pick.finished}
              </strong>
            </span>
            <span>·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {pick.score}
            </span>
          </div>
        </div>
      </CardHero>
      <CardMetaTray insight={pick.insight} reasons={pick.reasons} />
    </CardShell>
  );
}

// ─── Receipts tail card + dots rail ─────────────────────────────────────────
interface ReceiptsStats {
  wins: number;
  topFives: number;
  hitRatePct: number;
}

function ReceiptsTailCard({
  stats,
  hasWinner,
  onClick,
}: {
  stats: ReceiptsStats;
  hasWinner: boolean;
  onClick: () => void;
}) {
  const accent = hasWinner ? goldDeep : amberDeep;
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 220,
        minHeight: 240,
        scrollSnapAlign: 'start',
        borderRadius: 18,
        overflow: 'hidden',
        padding: 0,
        cursor: 'pointer',
        background: hasWinner
          ? 'linear-gradient(160deg, rgba(255,184,0,0.18), rgba(247,147,30,0.08))'
          : 'linear-gradient(160deg, rgba(247,147,30,0.10), rgba(247,147,30,0.02))',
        border: hasWinner ? `1.5px solid ${gold}` : `1px solid ${amber}30`,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        fontFamily: headlineFont,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -20,
          bottom: -16,
          opacity: hasWinner ? 0.18 : 0.1,
          pointerEvents: 'none',
        }}
      >
        {hasWinner ? (
          <Trophy size={140} color={gold} strokeWidth={1.4} />
        ) : (
          <Award size={140} color={amber} strokeWidth={1.4} />
        )}
      </div>

      <div
        style={{
          padding: '16px 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {hasWinner ? (
          <Trophy size={11} color={goldDeep} strokeWidth={2.5} />
        ) : (
          <Award size={11} color={amberDeep} strokeWidth={2.5} />
        )}
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: hasWinner ? goldDeep : amberDeep,
          }}
        >
          {hasWinner ? 'ANOTHER WINNER' : 'BACKED BY RESULTS'}
        </span>
      </div>

      <div
        style={{
          padding: '10px 16px 0',
          fontSize: 18,
          fontWeight: 800,
          color: ink,
          lineHeight: 1.15,
          letterSpacing: '-0.015em',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {stats.wins} winners.
        <br />
        <span style={{ color: accent }}>{stats.topFives} top-5s.</span>
      </div>

      <div
        style={{
          padding: '6px 16px 0',
          fontSize: 11,
          color: inkSoft,
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
        }}
      >
        On the PGA Tour this season.
      </div>

      <div
        style={{
          marginTop: 'auto',
          padding: '0 16px 16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: accent,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {stats.hitRatePct}%
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: inkSoft,
            }}
          >
            TOP-5 HIT RATE
          </div>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 600,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          See how we pick <ChevronRight size={11} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

function DotsRail({
  idx,
  stats,
  hasWinner,
}: {
  idx: number;
  stats: ReceiptsStats;
  hasWinner: boolean;
}) {
  const accent = hasWinner ? goldDeep : amberDeep;
  return (
    <div
      style={{
        marginTop: 14,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === idx ? ink : hairline,
              transition: 'all 200ms',
            }}
          />
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: headlineFont,
          minWidth: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {hasWinner && (
          <Trophy
            size={11}
            color={goldDeep}
            strokeWidth={2.5}
            style={{ flexShrink: 0 }}
          />
        )}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: accent, fontWeight: 800 }}>{stats.wins}</span>
          <span style={{ color: inkSoft, fontWeight: 600 }}> WINS</span>
          <span style={{ color: inkFaint, margin: '0 4px' }}>·</span>
          <span style={{ color: accent, fontWeight: 800 }}>{stats.topFives}</span>
          <span style={{ color: inkSoft, fontWeight: 600 }}> TOP-5s</span>
          <span style={{ color: inkFaint, margin: '0 4px' }}>·</span>
          <span style={{ color: accent, fontWeight: 800 }}>{stats.hitRatePct}%</span>
          <span style={{ color: inkSoft, fontWeight: 600, marginLeft: 2 }}>T5</span>
        </span>
      </div>
    </div>
  );
}

// ─── Carousel ───────────────────────────────────────────────────────────────
function Carousel({
  children,
  stats,
  hasWinner,
}: {
  children: React.ReactNode;
  stats: ReceiptsStats;
  hasWinner: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    // Cards (280) + 12 gap = 292; tail card (220) + 12 gap = 232. Use ~270 average
    // — same heuristic as the mock; precision isn't critical for a dot indicator.
    setIdx(Math.min(3, Math.max(0, Math.round(el.scrollLeft / 270))));
  };

  return (
    <>
      <div
        ref={ref}
        onScroll={onScroll}
        className="ti-scroll"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: 12,
          padding: '0 16px 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {children}
      </div>
      <DotsRail idx={idx} stats={stats} hasWinner={hasWinner} />
    </>
  );
}

// ─── State adapters: turn raw data into card props ──────────────────────────
function buildInsight(c: AITopContender): string {
  const fromQuote = (c.pulledQuote ?? '').trim();
  if (fromQuote) return fromQuote;
  return (c.reasons?.[0] ?? '').trim();
}

function buildUpcomingPicks(data: AIPredictionData | null): UpcomingPick[] {
  if (!data) return [];
  return data.topContenders.slice(0, 3).map((c) => ({
    rank: c.rank,
    name: c.playerName,
    insight: buildInsight(c),
    reasons: c.reasons ?? [],
    courseFit: c.courseFitScore,
  }));
}

function buildLivePicks(
  data: AIPredictionData | null | undefined,
  tracker: { predictions: TrackedPrediction[] } | undefined,
): LivePick[] {
  if (!data || !tracker) return [];
  const trackerByName = new Map(
    tracker.predictions.map((t) => [t.playerName.toLowerCase(), t]),
  );
  return data.topContenders.slice(0, 3).map((c) => {
    const t = trackerByName.get(c.playerName.toLowerCase());
    const finished =
      t?.thru != null && t.thru >= 18 ? true : t?.performanceStatus === 'cut' || t?.performanceStatus === 'withdrawn';
    return {
      rank: c.rank,
      name: c.playerName,
      insight: buildInsight(c),
      reasons: c.reasons ?? [],
      position: t ? formatPositionString(t) : '—',
      score: formatScore(t?.score ?? null),
      thru: formatThru(t?.thru ?? null, t?.currentRound ?? null),
      moveDir: t?.moveDir ?? 'flat',
      moveSpots: t?.moveSpots ?? 0,
      finished,
    };
  });
}

function classifyPickOutcome(
  position: number | null,
): 'win' | 'top5' | 'top10' | 'miss' {
  if (position === 1) return 'win';
  if (position != null && position <= 5) return 'top5';
  if (position != null && position <= 10) return 'top10';
  return 'miss';
}

function buildResultsPicks(
  data: AIPredictionData | null | undefined,
  tracker: { predictions: TrackedPrediction[] } | undefined,
): ResultsPick[] {
  if (!data || !tracker) return [];
  const trackerByName = new Map(
    tracker.predictions.map((t) => [t.playerName.toLowerCase(), t]),
  );
  return data.topContenders.slice(0, 3).map((c) => {
    const t = trackerByName.get(c.playerName.toLowerCase());
    const finishedStr = t ? formatPositionString(t) : '—';
    const outcome = classifyPickOutcome(t?.actualPosition ?? null);
    return {
      rank: c.rank,
      name: c.playerName,
      insight: buildInsight(c),
      reasons: c.reasons ?? [],
      finished: finishedStr,
      score: formatScore(t?.score ?? null),
      outcome,
    };
  });
}

// ─── Empty / loading states ────────────────────────────────────────────────
function StateMessage({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        fontFamily: headlineFont,
        fontSize: 13,
        color: inkSoft,
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export const IntelligenceHero = memo(function IntelligenceHero() {
  const {
    state,
    activeTournamentId,
    data,
    nextTournamentPredictions,
    isLoading,
  } = useIntelligenceLifecycleState();
  const { data: tournaments = [] } = useIntelligenceHistoricalPicks();

  const trackerEnabled = state === 'live' || state === 'results';
  const { data: tracker } = usePredictionTracker(
    trackerEnabled ? activeTournamentId : null,
    trackerEnabled ? data : null,
  );

  // Receipts: hit rate counts a tournament as a "top-5 hit" if ANY of the
  // three picks finished T5 or better — matches IntelligenceAboutSheet logic
  // (win + top5 outcomes from classifyOutcome both indicate a top-5 hit).
  const stats: ReceiptsStats = useMemo(() => {
    const totalResolved = tournaments.length;
    const wins = tournaments.filter((t) => t.outcome === 'win').length;
    const topFives = tournaments.filter(
      (t) => t.outcome === 'win' || t.outcome === 'top5',
    ).length;
    const hitRatePct =
      totalResolved > 0 ? Math.round((topFives / totalResolved) * 100) : 0;
    return { wins, topFives, hitRatePct };
  }, [tournaments]);

  const [aboutOpen, setAboutOpen] = useState(false);
  const handleOpenAbout = () => setAboutOpen(true);
  const handleCloseAbout = () => setAboutOpen(false);

  // Choose payload + card-set for the active state.
  const activeData =
    state === 'upcoming' ? nextTournamentPredictions ?? data : data;

  const meta = useMemo(
    () => buildTournamentMeta(activeData?.tournament),
    [activeData],
  );

  const upcomingPicks = useMemo(
    () => (state === 'upcoming' ? buildUpcomingPicks(activeData ?? null) : []),
    [state, activeData],
  );
  const livePicks = useMemo(
    () =>
      state === 'live'
        ? buildLivePicks(activeData, tracker as any)
        : [],
    [state, activeData, tracker],
  );
  const resultsPicks = useMemo(
    () =>
      state === 'results'
        ? buildResultsPicks(activeData, tracker as any)
        : [],
    [state, activeData, tracker],
  );

  const headline =
    state === 'live'
      ? 'Tracking our 3 picks live.'
      : 'Our 3 picks for the week.';

  const hasWinner = state === 'results' && resultsPicks.some((p) => p.outcome === 'win');

  // Decide what to render in the carousel.
  let cards: React.ReactNode = null;
  let renderEmpty: React.ReactNode = null;
  if (isLoading) {
    renderEmpty = <StateMessage label="Loading Intelligence…" />;
  } else if (state === 'upcoming') {
    if (upcomingPicks.length === 0) {
      renderEmpty = (
        <StateMessage label="Picks for the next event drop soon." />
      );
    } else {
      cards = upcomingPicks.map((p) => <UpcomingCard key={p.rank} pick={p} />);
    }
  } else if (state === 'live') {
    if (livePicks.length === 0) {
      renderEmpty = <StateMessage label="Tracking our picks live…" />;
    } else {
      cards = livePicks.map((p) => <LiveCard key={p.rank} pick={p} />);
    }
  } else if (state === 'results') {
    if (resultsPicks.length === 0) {
      renderEmpty = <StateMessage label="Final results coming in…" />;
    } else {
      cards = resultsPicks.map((p) => <ResultsCard key={p.rank} pick={p} />);
    }
  }

  return (
    <section
      aria-label="Tournament Intelligence"
      style={{ padding: '0', fontFamily: headlineFont }}
    >
      <style>{`
        @keyframes ti-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes ti-goldGlow {
          0%, 100% { box-shadow: 0 0 0 1px ${gold}, 0 8px 24px rgba(255,184,0,0.25); }
          50% { box-shadow: 0 0 0 1px ${gold}, 0 12px 32px rgba(255,184,0,0.45); }
        }
        @keyframes ti-goldShine {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes ti-calledItIn {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes ti-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ti-scroll::-webkit-scrollbar { display: none; }
        .ti-trophy-glow { animation: ti-goldGlow 2.5s ease-in-out infinite; }
        .ti-called-it { animation: ti-calledItIn 400ms cubic-bezier(0.4, 0, 0.2, 1); }
        .ti-live-stripe {
          background: linear-gradient(90deg, transparent, ${greenLight}, transparent);
          background-size: 200% 100%;
          animation: ti-shimmer 2s linear infinite;
        }
      `}</style>

      <SectionHeader
        meta={meta}
        headline={headline}
        onAboutClick={handleOpenAbout}
      />

      {renderEmpty ?? (
        <Carousel stats={stats} hasWinner={hasWinner}>
          {cards}
          <ReceiptsTailCard
            stats={stats}
            hasWinner={hasWinner}
            onClick={handleOpenAbout}
          />
        </Carousel>
      )}

      <IntelligenceSheet
        open={aboutOpen}
        onClose={handleCloseAbout}
        trackRecord={{ wins: stats.wins, topFives: stats.topFives }}
      />
    </section>
  );
});
