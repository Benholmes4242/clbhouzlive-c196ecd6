/**
 * IntelligenceHero — Tour Hub LEAD section
 *
 * Lead-section refresh per "Tournament Intelligence · Lead-Section Refresh
 * (Prototype A)" brief. The previous full-bleed dark-green sub-brand is
 * scrapped — Intelligence is now the LEAD section of the Tour Hub Overview,
 * presented on a quiet cream surface with sentence-based editorial headlines,
 * but every other token (amber 3px bar, hairline rows, ink-on-paper type)
 * matches the page's existing canon.
 *
 * Project memory rule: Geist font only, no serifs. The brief's serif headline
 * spec is overridden — sentence headlines render in Geist 700 with tight
 * letter-spacing instead.
 *
 * Phase A:
 *   - Cream LEAD_BG outer surface with hairline borders top + bottom
 *   - LeadSectionHeader (3×14 amber bar + Sparkles glyph + status pill)
 *   - CredibilityBand directly below the header, amber-tint stat strip
 *   - Editorial sentence headlines per lifecycle state (live / results /
 *     upcoming) with three calibrated miss tones via getMissTone()
 *   - HeroPick (56px avatar + pulled-quote reasoning) for rank-1 pick
 *   - CompactPick (chevron-expand) for ranks 2 + 3
 *   - Tournament Winner card for non-win results outcomes
 *   - TrackRecordPanel ("Why Trust Us") between picks and CTA
 *   - Single unified CTA: "All Intelligence picks"
 *   - Live-state pulse on hero pick position number
 *
 * Phase B: CredibilityBand + TrackRecordPanel wired to existing useMemo.
 *
 * Phase C — Editorial layer:
 *   - `framingSentence` — per-tournament italic preface above the headline.
 *     Sourced from `data.editorialFraming`. Renders null if the data layer
 *     hasn't populated it. Daily editorial production is out of scope here.
 *   - `pulledQuote` (per pick) — Hero pick's reasoning shown as italic
 *     pulled-quote. Falls back to `pick.reasons[0]` if not populated.
 */

import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Award,
  Trophy,
  Quote,
} from 'lucide-react';
import type { IntelligenceOutcome } from '../utils/outcomeClassifier';
import { useCountdown } from '@/hooks/useCountdown';
import {
  useIntelligenceLifecycleState,
  type IntelligenceLifecycleState,
} from '../hooks/useIntelligenceLifecycleState';
import { useIntelligenceHistoricalPicks } from '../hooks/useIntelligenceHistoricalPicks';
import { usePredictionTracker } from '../hooks/usePredictionTracker';
import type { AIPredictionData, AITopContender } from '../hooks/useAIPredictions';
import type { TrackedPrediction, PredictionTrackerData } from './tournament-insights/types';
import { getVenueRequirements } from '../utils/editorialFallbacks';
import { IntelligenceAllPicksSheet } from './IntelligenceAllPicksSheet';
import { IntelligenceAboutSheet } from './IntelligenceAboutSheet';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';

// ─── Headshot helper ─────────────────────────────────────────────────────────
// All Tournament Intelligence states pull headshots from the same R2 source as
// the Tour Overview hero. PGA-only per Sportradar coverage constraint.
function PlayerHeadshot({
  name,
  size,
  radius,
  bg,
  border,
  initialsColor,
  initialsFontSize,
}: {
  name: string;
  size: number;
  radius: number | string;
  bg: string;
  border: string;
  initialsColor: string;
  initialsFontSize: number;
}) {
  const initials = getInitials(name);
  const src = getPlayerHeadshotUrl(name, 'pga');
  const [failed, setFailed] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        background: bg,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {failed && (
        <span
          style={{
            fontFamily: headlineFont,
            fontSize: initialsFontSize,
            fontWeight: 700,
            color: initialsColor,
          }}
        >
          {initials}
        </span>
      )}
      {!failed && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.endsWith(PLAYER_SILHOUETTE_URL)) {
              setFailed(true);
            } else {
              el.src = PLAYER_SILHOUETTE_URL;
            }
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 18%',
          }}
        />
      )}
    </div>
  );
}

// ─── Tokens ──────────────────────────────────────────────────────────────────

const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Page-canon ink + slates
const INK = '#0F172A';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_300 = '#CBD5E1';
const SLATE_200 = '#E2E8F0';
const SLATE_150 = '#EDF1F5';
const SLATE_100 = '#F1F5F9';

const AMBER_ACCENT = '#F7931E';
const AMBER_DEEP = '#B85F00';
const AMBER_TINT = 'rgba(247,147,30,0.08)';
const AMBER_TINT_STRONG = 'rgba(247,147,30,0.14)';
const GREEN_DEEP_INK = '#0A5A3C';
const GREEN_LIGHT = '#10B981';

// Geist-only headline / mono helpers (project memory: no serifs)
const headlineFont =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const monoLabel: React.CSSProperties = {
  fontFamily: headlineFont,
  fontWeight: 700,
  textTransform: 'uppercase',
};

// ─── Helpers (preserved from prior revision) ─────────────────────────────────

function getFirstName(fullName: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/);
  return parts[0] || fullName || '';
}

function getInitials(fullName: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type MissTone = {
  eyebrow: string;
  eyebrowColor: string;
  headlineRender: (
    winnerFirstName: string,
    ourPickFirstName: string,
    ourPickPosition: string,
  ) => React.ReactNode;
  contextLine: (numInTop10: number, missedCuts: number) => string;
};

function getMissTone(outcome: IntelligenceOutcome): MissTone {
  if (outcome === 'top5') {
    return {
      eyebrow: 'Closest call.',
      eyebrowColor: AMBER_DEEP,
      headlineRender: (winner, ourPick, ourPos) => (
        <>
          {winner} won.{' '}
          <span style={{ color: SLATE_500, fontWeight: 600 }}>
            {ourPick} took {ourPos}.
          </span>
        </>
      ),
      contextLine: (top10, mc) =>
        `Strong contender finish · ${top10} pick${top10 !== 1 ? 's' : ''} in T10 · ${
          mc === 0 ? 'No missed cuts' : `${mc} missed cut${mc > 1 ? 's' : ''}`
        }`,
    };
  }
  if (outcome === 'partial') {
    return {
      eyebrow: 'Solid week.',
      eyebrowColor: SLATE_600,
      headlineRender: (winner, ourPick, ourPos) => (
        <>
          {winner} won.{' '}
          <span style={{ color: SLATE_500, fontWeight: 600 }}>
            {ourPick} finished {ourPos}.
          </span>
        </>
      ),
      contextLine: (top10, mc) =>
        `Top pick in form · ${top10} pick${top10 !== 1 ? 's' : ''} in T10 · ${
          mc === 0 ? 'No missed cuts' : `${mc} missed cut${mc > 1 ? 's' : ''}`
        }`,
    };
  }
  return {
    eyebrow: 'Tough one.',
    eyebrowColor: SLATE_600,
    headlineRender: (winner, ourPick, ourPos) => (
      <>
        {winner} won —{' '}
        <span style={{ color: SLATE_500, fontWeight: 600 }}>
          we had {ourPick} at {ourPos}.
        </span>
      </>
    ),
    contextLine: (top10, mc) =>
      `Winner not in top 3 · ${top10} pick${top10 !== 1 ? 's' : ''} in T10 · ${
        mc === 0 ? 'No missed cuts' : `${mc} missed cut${mc > 1 ? 's' : ''}`
      }`,
  };
}

function formatPosition(p: TrackedPrediction): string {
  if (p.performanceStatus === 'cut') return 'MC';
  if (p.performanceStatus === 'withdrawn') return 'WD';
  if (p.actualPosition === null) return '—';
  return `${p.actualPositionTied ? 'T' : ''}${p.actualPosition}`;
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.getDate()} ${MONTHS_ABBR[start.getMonth()]} – ${end.getDate()} ${MONTHS_ABBR[end.getMonth()]}`;
}

function formatLocation(t: AIPredictionData['tournament']): string {
  const left: string[] = [];
  if (t.venueCity) left.push(t.venueCity);
  if (t.venueState) left.push(t.venueState);
  const leftStr = left.join(', ');
  if (t.venueCountry) {
    return leftStr ? `${leftStr} · ${t.venueCountry}` : t.venueCountry;
  }
  return leftStr;
}

function getVenueBullets(t: AIPredictionData['tournament']): string[] {
  const bullets: string[] = [];
  if (t.par && t.yardage) {
    bullets.push(`Par ${t.par} · ${t.yardage.toLocaleString()} yards`);
  }
  const fallback = getVenueRequirements(t.name);
  if (fallback?.surface) bullets.push(fallback.surface);
  if (fallback?.demands) bullets.push(fallback.demands);
  return bullets;
}

function formatStateLabel(
  state: IntelligenceLifecycleState,
  data: AIPredictionData | null | undefined,
  nextTournamentPredictions: AIPredictionData | null,
  tracker: PredictionTrackerData | undefined,
): string {
  if (state === 'live') {
    const lead = tracker?.predictions[0];
    const noScoresYet =
      !!lead &&
      (lead.thru === null || lead.thru === 0) &&
      (lead.currentRound === null || lead.currentRound === 1);
    if (noScoresYet) return 'TEES OFF SOON';
    const round = lead?.currentRound ?? 1;
    return `LIVE · ROUND ${round}`;
  }
  if (state === 'results' && data?.tournament?.startDate && data?.tournament?.endDate) {
    return formatDateRange(data.tournament.startDate, data.tournament.endDate);
  }
  const t = nextTournamentPredictions?.tournament ?? data?.tournament;
  if (t?.startDate && t?.endDate) {
    return formatDateRange(t.startDate, t.endDate);
  }
  return 'UPCOMING';
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

  const { wins, topFives, topFiveRate } = useMemo(() => {
    const w = tournaments.filter(t => t.outcome === 'win').length;
    const t5 = tournaments.filter(t => t.outcome === 'win' || t.outcome === 'top5').length;
    const total = tournaments.length || 1;
    const rate = Math.round((t5 / total) * 100);
    return { wins: w, topFives: t5, topFiveRate: rate };
  }, [tournaments]);

  const stateLabel = useMemo(
    () => formatStateLabel(state, data, nextTournamentPredictions, tracker),
    [state, data, nextTournamentPredictions, tracker],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const handleOpenSheet = () => setSheetOpen(true);
  const handleCloseSheet = () => setSheetOpen(false);
  const handleOpenAbout = () => setAboutOpen(true);
  const handleCloseAbout = () => setAboutOpen(false);

  // Live-state pulse for hero pick position number — every 6s.
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (state !== 'live') return;
    const id = setInterval(() => {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 800);
      return () => clearTimeout(timeout);
    }, 6000);
    return () => clearInterval(id);
  }, [state]);

  // Map lifecycle state → simplified UI state.
  const uiState: 'upcoming' | 'live' | 'results' =
    state === 'live' ? 'live' : state === 'results' ? 'results' : 'upcoming';

  return (
    <section
      aria-label="clbhouz Intelligence"
      style={{
        // Sits directly on page slate-50 bg — matches sibling sections
        // (ComingUpCalendar / WorldRankingsHero / StatOfTheWeek)
        padding: '0 16px',
      }}
    >
      <style>{`
        @keyframes intel_liveDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>

      <LeadSectionHeader
        statusLabel={stateLabel}
        state={uiState}
        onInfoTap={handleOpenAbout}
      />

      <div style={{ borderTop: `1px solid ${SLATE_150}`, marginBottom: 18 }} />

      {isLoading ? (
        <StateMessage label="Loading Intelligence…" />
      ) : (
        <>
          {state === 'live' && (
            <LiveStateBlock
              data={data}
              tracker={tracker}
              pulse={pulse}
              framingSentence={data?.editorialFraming ?? null}
            />
          )}
          {state === 'results' && (
            <ResultsStateBlock
              data={data}
              tracker={tracker}
              pulse={pulse}
              framingSentence={data?.editorialFraming ?? null}
            />
          )}
          {state === 'upcoming' && (
            <UpcomingStateBlock
              data={nextTournamentPredictions ?? data ?? null}
              framingSentence={
                (nextTournamentPredictions ?? data)?.editorialFraming ?? null
              }
            />
          )}
        </>
      )}

      <TrackRecordPanel
        wins={wins}
        topFives={topFives}
        topFiveRate={topFiveRate}
        totalTournaments={tournaments.length}
      />

      <CTA onOpenSheet={handleOpenSheet} />

      <IntelligenceAllPicksSheet open={sheetOpen} onClose={handleCloseSheet} />
      <IntelligenceAboutSheet
        open={aboutOpen}
        onClose={handleCloseAbout}
        trackRecord={{ wins, topFives }}
      />
    </section>
  );
});

// ─── Lead-section header ─────────────────────────────────────────────────────

function LeadSectionHeader({
  statusLabel,
  state,
  onInfoTap,
}: {
  statusLabel: string;
  state: 'upcoming' | 'live' | 'results';
  onInfoTap: () => void;
}) {
  const dotColor =
    state === 'live' ? GREEN_LIGHT
    : state === 'upcoming' ? AMBER_ACCENT
    : SLATE_500;

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Top row: eyebrow + status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={onInfoTap}
          aria-label="About Tournament Intelligence"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: headlineFont,
              fontSize: 24,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Tournament <span style={{ color: AMBER_DEEP }}>Intelligence</span>
            <Sparkles
              size={18}
              color={INK}
              fill={INK}
              strokeWidth={2}
              style={{ marginLeft: 1 }}
            />
          </span>
        </button>
        {state !== 'live' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'transparent',
              border: `1px solid ${SLATE_150}`,
              borderRadius: 4,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: dotColor,
                animation: 'none',
              }}
            />
            <span
              style={{
                ...monoLabel,
                fontSize: 9,
                color: dotColor,
                letterSpacing: '0.16em',
              }}
            >
              {statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* Section title — Geist 700 (project memory: no serifs) */}
      <h2
        style={{
          margin: 0,
          fontFamily: headlineFont,
          fontSize: 24,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: 6,
        }}
      >
        Tournament picks, signed and dated.
      </h2>

      {/* Explainer line */}
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 400,
          color: SLATE_600,
          lineHeight: 1.5,
          maxWidth: 480,
        }}
      >
        Our in-house AI picks three players each PGA tournament — using latest form & player statistics, course fit, weather, news and historical data.
      </p>
    </div>
  );
}

// ─── Credibility band (always visible) ───────────────────────────────────────

function CredibilityBand({
  wins,
  topFives,
  topFiveRate,
  season = '2026 SEASON',
}: {
  wins: number;
  topFives: number;
  topFiveRate: number;
  season?: string;
}) {
  const stats = [
    { val: `${wins}`, label: 'WINS' },
    { val: `${topFives}`, label: 'TOP-5s' },
    { val: `${topFiveRate}%`, label: 'HIT RATE' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        background: AMBER_TINT,
        border: `1px solid ${AMBER_TINT_STRONG}`,
        borderRadius: 8,
        marginBottom: 18,
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Award size={11} color={AMBER_DEEP} strokeWidth={2.5} />
        <span style={{ ...monoLabel, fontSize: 9, color: AMBER_DEEP, letterSpacing: '0.20em' }}>
          {season}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontFamily: headlineFont,
                  fontSize: 14,
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.val}
              </span>
              <span style={{ ...monoLabel, fontSize: 8, color: SLATE_500, letterSpacing: '0.16em' }}>
                {s.label}
              </span>
            </div>
            {i < stats.length - 1 && (
              <div style={{ width: 1, height: 10, background: AMBER_TINT_STRONG }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Editorial headline + context line atoms ─────────────────────────────────

/**
 * Phase C — per-tournament italic framing sentence above the headline.
 * Renders nothing when `text` is null, so the headline lands directly under
 * the credibility band when no editorial copy is provided.
 */
function FramingSentence({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <p
      style={{
        margin: '0 0 8px',
        fontFamily: headlineFont,
        fontStyle: 'italic',
        fontSize: 14,
        fontWeight: 500,
        color: SLATE_600,
        letterSpacing: '-0.005em',
        lineHeight: 1.4,
      }}
    >
      {text}
    </p>
  );
}

function EditorialHeadline({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: headlineFont,
        fontSize: 30,
        fontWeight: 700,
        color: INK,
        letterSpacing: '-0.030em',
        lineHeight: 1.08,
      }}
    >
      {children}
    </h1>
  );
}

function ContextLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...monoLabel,
        fontWeight: 700,
        fontSize: 10,
        color: SLATE_500,
        letterSpacing: '0.06em',
        marginTop: 12,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function TournamentLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: SLATE_500, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function ResultsEyebrow({
  text,
  color,
  icon,
}: {
  text: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...monoLabel,
        fontSize: 9,
        color,
        letterSpacing: '0.20em',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {text}
    </div>
  );
}

// ─── Hero pick (rank-1, magazine lead treatment) ─────────────────────────────

type PositionAccent = 'amber' | 'ink' | 'green';

function HeroPick({
  initials,
  name,
  subtitle,
  pulledQuote,
  reasons,
  position,
  positionLabel,
  positionAccent = 'amber',
  pulse = false,
  defaultExpanded = false,
}: {
  initials: string;
  name: string;
  subtitle?: string | null;
  pulledQuote?: string | null;
  reasons?: string[];
  position: string;
  positionLabel: string;
  positionAccent?: PositionAccent;
  pulse?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const accent =
    positionAccent === 'amber' ? AMBER_DEEP
    : positionAccent === 'green' ? GREEN_LIGHT
    : INK;
  const visibleReasons = (reasons ?? []).filter(Boolean).slice(0, 3);

  return (
    <div
      style={{
        borderTop: `1px solid ${SLATE_150}`,
        borderBottom: `1px solid ${SLATE_150}`,
        marginBottom: 14,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          padding: '20px 0 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <PlayerHeadshot
            name={name}
            size={56}
            radius={14}
            bg={AMBER_TINT}
            border={`1px solid ${AMBER_TINT_STRONG}`}
            initialsColor={AMBER_DEEP}
            initialsFontSize={17}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                ...monoLabel,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 8,
                color: AMBER_DEEP,
                letterSpacing: '0.18em',
                marginBottom: 5,
              }}
            >
              <Sparkles size={9} color={AMBER_DEEP} fill={AMBER_DEEP} strokeWidth={2} />
              TOP PICK
            </div>
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 20,
                fontWeight: 700,
                color: INK,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 12,
                  color: SLATE_500,
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div
            style={{
              textAlign: 'right',
              transform: pulse ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 30,
                fontWeight: 700,
                color: accent,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.025em',
                lineHeight: 1,
                textShadow: pulse ? `0 0 12px ${AMBER_TINT_STRONG}` : 'none',
                transition: 'text-shadow 400ms ease',
              }}
            >
              {position}
            </div>
            <div
              style={{
                ...monoLabel,
                fontSize: 8,
                color: SLATE_500,
                letterSpacing: '0.16em',
                marginTop: 4,
              }}
            >
              {positionLabel}
            </div>
          </div>

          <div
            style={{
              marginLeft: 4,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 240ms ease',
              flexShrink: 0,
            }}
          >
            <ChevronDown size={18} color={SLATE_400} strokeWidth={2.5} />
          </div>
        </div>

        {!expanded && pulledQuote && (
          <div style={{ paddingTop: 14 }}>
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 14.5,
                fontWeight: 500,
                fontStyle: 'italic',
                color: SLATE_700,
                lineHeight: 1.45,
                letterSpacing: '-0.005em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Quote
                size={14}
                color={AMBER_ACCENT}
                fill={AMBER_ACCENT}
                strokeWidth={0}
                style={{ display: 'inline-block', verticalAlign: 'baseline', marginRight: 0, transform: 'scaleX(-1) translateY(2px)' }}
              />
              {pulledQuote}
              <Quote
                size={14}
                color={AMBER_ACCENT}
                fill={AMBER_ACCENT}
                strokeWidth={0}
                style={{ display: 'inline-block', verticalAlign: 'baseline', marginLeft: 4, transform: 'translateY(2px)' }}
              />
            </div>
          </div>
        )}
      </button>

      <div
        style={{
          maxHeight: expanded ? 240 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 320ms ease, opacity 240ms ease',
        }}
      >
        <div style={{ padding: '0 0 16px 0' }}>
          {pulledQuote && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: headlineFont,
                  fontSize: 14.5,
                  fontWeight: 500,
                  fontStyle: 'italic',
                  color: SLATE_700,
                  lineHeight: 1.45,
                  letterSpacing: '-0.005em',
                }}
              >
                <Quote
                  size={14}
                  color={AMBER_ACCENT}
                  fill={AMBER_ACCENT}
                  strokeWidth={0}
                  style={{ display: 'inline-block', verticalAlign: 'baseline', marginRight: 0, transform: 'scaleX(-1) translateY(2px)' }}
                />
                {pulledQuote}
                <Quote
                  size={14}
                  color={AMBER_ACCENT}
                  fill={AMBER_ACCENT}
                  strokeWidth={0}
                  style={{ display: 'inline-block', verticalAlign: 'baseline', marginLeft: 4, transform: 'translateY(2px)' }}
                />
              </div>
            </div>
          )}

          {visibleReasons.length > 0 && (
            <div style={{ padding: '2px 0 0 0' }}>
              {visibleReasons.map((r, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: i < arr.length - 1 ? 8 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: AMBER_DEEP,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      color: SLATE_700,
                      lineHeight: 1.55,
                    }}
                  >
                    {r}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Compact pick (ranks 2 + 3, chevron-expand) ──────────────────────────────

type CompactTier = 'STRONG' | 'CONTENTION';

function CompactPick({
  initials,
  name,
  tier,
  reason,
  reasons,
  position,
  positionLabel,
}: {
  initials: string;
  name: string;
  tier: CompactTier;
  reason?: string;
  reasons: string[];
  position: string;
  positionLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const accent = 'transparent';
  const accentInk = SLATE_500;
  const tierLabel = tier === 'STRONG' ? 'STRONG CONTENDER' : 'IN CONTENTION';
  const visibleReasons = reasons.filter(Boolean).slice(0, 3);

  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        borderBottom: `1px solid ${SLATE_150}`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          padding: '13px 12px 13px 11px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <PlayerHeadshot
          name={name}
          size={38}
          radius={10}
          bg={SLATE_100}
          border={`1px solid ${SLATE_150}`}
          initialsColor={SLATE_700}
          initialsFontSize={12}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: 14.5,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          {!expanded && reason && (
            <div
              style={{
                fontSize: 12,
                color: SLATE_500,
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {reason}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: headlineFont,
              fontSize: 19,
              fontWeight: 700,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {position}
          </div>
          <div
            style={{
              ...monoLabel,
              fontSize: 8,
              color: SLATE_500,
              letterSpacing: '0.16em',
              marginTop: 3,
            }}
          >
            {positionLabel}
          </div>
        </div>
        <div
          style={{
            marginLeft: 4,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 240ms ease',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={15} color={SLATE_400} strokeWidth={2.5} />
        </div>
      </button>
      <div
        style={{
          maxHeight: expanded ? 240 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 320ms ease, opacity 240ms ease',
        }}
      >
        <div style={{ padding: '0 12px 14px 11px' }}>
          <div>
            {visibleReasons.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: i < visibleReasons.length - 1 ? 8 : 0,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: AMBER_DEEP,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 12.5, color: SLATE_700, lineHeight: 1.55 }}>
                  {r}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tournament Winner card (results · non-win only) ─────────────────────────

function TournamentWinnerCard({
  name,
  score,
}: {
  name: string;
  score: number | null;
}) {
  const initials = getInitials(name);
  const scoreNum = score ?? 0;
  return (
    <div
      style={{
        marginTop: 16,
        marginBottom: 4,
        padding: '12px 14px',
        background: '#fff',
        border: `1px solid ${SLATE_150}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          ...monoLabel,
          fontSize: 8,
          color: SLATE_500,
          letterSpacing: '0.20em',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Trophy size={9} strokeWidth={2.5} />
        Tournament Winner
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PlayerHeadshot
          name={name}
          size={36}
          radius={9}
          bg={SLATE_100}
          border={`1px solid ${SLATE_150}`}
          initialsColor={SLATE_700}
          initialsFontSize={11}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.015em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div
            style={{
              ...monoLabel,
              fontSize: 8,
              color: SLATE_500,
              marginTop: 3,
              letterSpacing: '0.16em',
            }}
          >
            Final score
          </div>
        </div>
        <div
          style={{
            fontFamily: headlineFont,
            fontSize: 24,
            fontWeight: 600,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {scoreNum < 0 ? '\u2212' : ''}{Math.abs(scoreNum) || 'E'}
        </div>
      </div>
    </div>
  );
}

// ─── Track-record panel ──────────────────────────────────────────────────────

function TrackRecordPanel({
  wins,
  topFives,
  topFiveRate,
  totalTournaments,
}: {
  wins: number;
  topFives: number;
  topFiveRate: number;
  totalTournaments: number;
}) {
  const tiles = [
    { val: `${wins}`, label: 'WINNERS\nCALLED' },
    { val: `${topFives}`, label: 'TOP-5\nFINISHES' },
    { val: `${topFiveRate}%`, label: 'TOP-5\nHIT RATE' },
  ];
  return (
    <div
      style={{
        marginTop: 22,
        padding: 16,
        background: AMBER_TINT,
        border: `1px solid ${AMBER_TINT_STRONG}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          ...monoLabel,
          fontSize: 9,
          color: AMBER_DEEP,
          letterSpacing: '0.24em',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Award size={10} strokeWidth={2.5} />
        Backed by results
      </div>
      <div
        style={{
          fontFamily: headlineFont,
          fontSize: 17,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.015em',
          lineHeight: 1.3,
          marginBottom: 14,
        }}
      >
        We've called{' '}
        <span style={{ color: AMBER_DEEP }}>
          {wins} winner{wins !== 1 ? 's' : ''}
        </span>{' '}
        and{' '}
        <span style={{ color: AMBER_DEEP }}>
          {topFives} top-5{topFives !== 1 ? 's' : ''}
        </span>{' '}
        this season.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {tiles.map(t => (
          <div
            key={t.label}
            style={{
              padding: '10px 8px',
              background: '#fff',
              border: `1px solid ${SLATE_150}`,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: headlineFont,
                fontSize: 22,
                fontWeight: 700,
                color: AMBER_DEEP,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t.val}
            </div>
            <div
              style={{
                ...monoLabel,
                fontSize: 8,
                color: SLATE_500,
                letterSpacing: '0.14em',
                whiteSpace: 'pre-line',
                lineHeight: 1.3,
              }}
            >
              {t.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: SLATE_600, lineHeight: 1.5 }}>
        Our model has called the winner in {wins} of the last {totalTournaments} PGA tournaments.
      </div>
    </div>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────

function CTA({ onOpenSheet }: { onOpenSheet: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenSheet}
      style={{
        width: '100%',
        marginTop: 18,
        padding: 14,
        background: '#fff',
        border: `1px solid ${SLATE_150}`,
        borderRadius: 10,
        color: INK,
        fontFamily: headlineFont,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      All Intelligence picks
      <ChevronRight size={12} strokeWidth={2.5} />
    </button>
  );
}

// ─── State blocks ────────────────────────────────────────────────────────────

function LiveStateBlock({
  data,
  tracker,
  pulse,
  framingSentence,
}: {
  data: AIPredictionData | null | undefined;
  tracker: PredictionTrackerData | undefined;
  pulse: boolean;
  framingSentence: string | null;
}) {
  const picks = useMemo(() => {
    const raw = tracker?.predictions ?? [];
    return [...raw].sort((a, b) => {
      const aOut = a.performanceStatus === 'cut' || a.performanceStatus === 'withdrawn';
      const bOut = b.performanceStatus === 'cut' || b.performanceStatus === 'withdrawn';
      if (aOut !== bOut) return aOut ? 1 : -1;
      const aPos = a.actualPosition;
      const bPos = b.actualPosition;
      if (aPos === null && bPos === null) return a.predictedRank - b.predictedRank;
      if (aPos === null) return 1;
      if (bPos === null) return -1;
      if (aPos !== bPos) return aPos - bPos;
      return a.predictedRank - b.predictedRank;
    });
  }, [tracker?.predictions]);

  const topPick = useMemo(
    () => (tracker?.predictions ?? []).find(p => p.predictedRank === 1) ?? null,
    [tracker?.predictions],
  );
  const bestPick = useMemo(() => {
    const inPlay = picks.filter(
      p => p.actualPosition !== null && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn',
    );
    return inPlay[0] ?? null;
  }, [picks]);

  // Headline: top pick leading > best pick leading > generic.
  const headlineNode = useMemo<React.ReactNode>(() => {
    if (!topPick && !bestPick) return 'Our picks are in play.';
    if (topPick && bestPick && topPick.playerId === bestPick.playerId) {
      return (
        <>
          {getFirstName(topPick.playerName)} leads{' '}
          <span style={{ color: AMBER_DEEP }}>our picks</span> at{' '}
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
            {formatScore(topPick.score)}
          </span>
          .
        </>
      );
    }
    if (bestPick) {
      return (
        <>
          {getFirstName(bestPick.playerName)} leads{' '}
          <span style={{ color: AMBER_DEEP }}>our picks</span> at{' '}
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
            {formatScore(bestPick.score)}
          </span>
          .
        </>
      );
    }
    return 'Our picks are in play.';
  }, [topPick, bestPick]);

  const numInTop5 = picks.filter(
    p => p.actualPosition !== null && p.actualPosition <= 5,
  ).length;
  const currentRound = picks[0]?.currentRound ?? 1;
  const topPickPreRank = topPick?.predictedRank ?? 1;
  const topPickLivePos = topPick ? formatPosition(topPick) : '—';

  // Hero pick = the leading pick (best-performing). Falls back to top pick.
  const heroPick = bestPick ?? topPick ?? picks[0] ?? null;
  const supporting = picks.filter(p => heroPick && p.playerId !== heroPick.playerId).slice(0, 2);

  return (
    <div>
      <FramingSentence text={framingSentence} />
      <EditorialHeadline>{headlineNode}</EditorialHeadline>
      {data?.tournament?.name && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: SLATE_500, fontWeight: 600 }}>
              {data.tournament.name}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: GREEN_LIGHT,
                  animation: 'intel_liveDot 1.6s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: GREEN_LIGHT,
                }}
              >
                {`LIVE · ROUND ${currentRound}`}
              </span>
            </div>
          </div>
          {(data.tournament.venueName || formatLocation(data.tournament)) && (
            <div style={{ fontSize: 11, color: SLATE_500, marginTop: 2, marginBottom: 12 }}>
              {[data.tournament.venueName, formatLocation(data.tournament)].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      )}

      {heroPick && (
        <HeroPick
          initials={getInitials(heroPick.playerName)}
          name={heroPick.playerName}
          subtitle={null}
          pulledQuote={heroPick.pulledQuote ?? heroPick.reasons[0] ?? null}
          reasons={heroPick.reasons}
          defaultExpanded={false}
          position={formatPosition(heroPick)}
          positionLabel={formatScore(heroPick.score)}
          positionAccent={heroPick.actualPosition === 1 ? 'amber' : 'ink'}
          pulse={pulse}
        />
      )}

      {supporting.length > 0 && (
        <>
          <SupportingLabel />
          <div style={{ borderTop: `1px solid ${SLATE_150}` }}>
            {supporting.map((p, i) => (
              <CompactPick
                key={p.playerId}
                initials={getInitials(p.playerName)}
                name={p.playerName}
                tier={i === 0 ? 'STRONG' : 'CONTENTION'}
                reason={p.reasons[0]}
                reasons={p.reasons}
                position={formatPosition(p)}
                positionLabel={formatScore(p.score)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResultsStateBlock({
  data,
  tracker,
  pulse,
  framingSentence,
}: {
  data: AIPredictionData | null | undefined;
  tracker: PredictionTrackerData | undefined;
  pulse: boolean;
  framingSentence: string | null;
}) {
  const picks = tracker?.predictions ?? [];
  const topPick = picks.find(p => p.predictedRank === 1) ?? picks[0] ?? null;
  const topPickWon = !!topPick && topPick.actualPosition === 1;

  const winnerFromTracker = picks.find(p => p.actualPosition === 1) ?? null;
  const winnerName =
    winnerFromTracker?.playerName ?? (topPickWon ? topPick!.playerName : 'The winner');
  const winnerFirstName = getFirstName(winnerName);

  const numInTop10 = picks.filter(
    p => p.actualPosition !== null && p.actualPosition <= 10,
  ).length;
  const missedCutCount = picks.filter(
    p => p.performanceStatus === 'cut' || p.performanceStatus === 'withdrawn',
  ).length;

  // ── WIN branch ────────────────────────────────────────────────────────────
  if (topPickWon && topPick) {
    const others = picks.filter(p => p.playerId !== topPick.playerId);
    const second = others
      .filter(p => p.actualPosition !== null)
      .sort((a, b) => a.actualPosition! - b.actualPosition!)[0];
    const winnerScore = topPick.score ?? 0;
    const secondScore = second?.score ?? winnerScore;
    const margin = Math.max(0, secondScore - winnerScore);
    const supporting = others.slice(0, 2);

    return (
      <div>
        <ResultsEyebrow
          text="We called it."
          color={GREEN_DEEP_INK}
          icon={<Check size={11} strokeWidth={3} />}
        />
        <FramingSentence text={framingSentence} />
        <EditorialHeadline>
          <span style={{ color: AMBER_DEEP }}>{winnerFirstName}</span>{' '}
          {margin === 0 ? (
            <>won in a playoff.</>
          ) : (
            <>
              won by{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
                {margin}
              </span>
              .
            </>
          )}
        </EditorialHeadline>
        <ContextLine>
          {`TOP PICK WON · ${Math.max(0, numInTop10 - 1)} OTHER PICKS T10 · ${
            missedCutCount === 0 ? 'NO MISSED CUTS' : `${missedCutCount} MISSED CUT${missedCutCount > 1 ? 'S' : ''}`
          }`}
        </ContextLine>
        {data?.tournament?.name && (
          <TournamentLabel>{data.tournament.name}</TournamentLabel>
        )}

        <HeroPick
          initials={getInitials(topPick.playerName)}
          name={topPick.playerName}
          subtitle={`Final · 1st · Won by ${margin || 'playoff'}`}
          pulledQuote={topPick.pulledQuote ?? topPick.reasons[0] ?? null}
          reasons={topPick.reasons}
          defaultExpanded={false}
          position="1"
          positionLabel={formatScore(topPick.score)}
          positionAccent="amber"
          pulse={pulse}
        />

        {supporting.length > 0 && (
          <>
            <SupportingLabel />
            <div style={{ borderTop: `1px solid ${SLATE_150}` }}>
              {supporting.map((p, i) => (
                <CompactPick
                  key={p.playerId}
                  initials={getInitials(p.playerName)}
                  name={p.playerName}
                  tier={i === 0 ? 'STRONG' : 'CONTENTION'}
                  reason={p.reasons[0]}
                  reasons={p.reasons}
                  position={formatPosition(p)}
                  positionLabel={formatScore(p.score)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── MISS branches: top5 / partial / miss ──────────────────────────────────
  const positions = picks
    .map(p => p.actualPosition)
    .filter((n): n is number => n !== null);
  const bestPosition = positions.length ? Math.min(...positions) : null;
  const outcome: IntelligenceOutcome =
    bestPosition === null ? 'miss'
    : bestPosition === 1 ? 'win'
    : bestPosition <= 5 ? 'top5'
    : bestPosition <= 15 ? 'partial'
    : 'miss';

  const bestPick = picks.find(p => p.actualPosition === bestPosition) ?? topPick;
  const tone = getMissTone(outcome);

  // For top5: hero is the close-finishing pick. Otherwise hero stays as top pick.
  const heroPickResolved =
    outcome === 'top5' && bestPick ? bestPick : topPick;
  const supporting = picks.filter(p => heroPickResolved && p.playerId !== heroPickResolved.playerId).slice(0, 2);

  const heroAccent: PositionAccent = outcome === 'miss' ? 'ink' : 'amber';
  const headlinePickFirstName = topPick ? getFirstName(topPick.playerName) : '—';
  const headlinePickPos = topPick ? formatPosition(topPick) : '—';

  return (
    <div>
      <ResultsEyebrow text={tone.eyebrow} color={tone.eyebrowColor} />
      <FramingSentence text={framingSentence} />
      <EditorialHeadline>
        {tone.headlineRender(winnerFirstName, headlinePickFirstName, headlinePickPos)}
      </EditorialHeadline>
      <ContextLine>{tone.contextLine(numInTop10, missedCutCount).toUpperCase()}</ContextLine>
      {data?.tournament?.name && (
        <TournamentLabel>{data.tournament.name}</TournamentLabel>
      )}

      {winnerFromTracker && (
        <TournamentWinnerCard
          name={winnerFromTracker.playerName}
          score={winnerFromTracker.score}
        />
      )}

      {heroPickResolved && (
        <HeroPick
          initials={getInitials(heroPickResolved.playerName)}
          name={heroPickResolved.playerName}
          subtitle={`Our #${heroPickResolved.predictedRank} pick · Final ${formatPosition(heroPickResolved)}`}
          pulledQuote={heroPickResolved.pulledQuote ?? heroPickResolved.reasons[0] ?? null}
          reasons={heroPickResolved.reasons}
          defaultExpanded={false}
          position={formatPosition(heroPickResolved)}
          positionLabel={formatScore(heroPickResolved.score)}
          positionAccent={heroAccent}
        />
      )}

      {supporting.length > 0 && (
        <>
          <SupportingLabel />
          <div style={{ borderTop: `1px solid ${SLATE_150}` }}>
            {supporting.map((p, i) => (
              <CompactPick
                key={p.playerId}
                initials={getInitials(p.playerName)}
                name={p.playerName}
                tier={i === 0 ? 'STRONG' : 'CONTENTION'}
                reason={p.reasons[0]}
                reasons={p.reasons}
                position={formatPosition(p)}
                positionLabel={formatScore(p.score)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UpcomingStateBlock({
  data,
  framingSentence,
}: {
  data: AIPredictionData | null;
  framingSentence: string | null;
}) {
  const tournament = data?.tournament;
  const venueName = tournament?.venueName ?? 'Venue TBC';
  const tournamentName = tournament?.name ?? 'Next Tournament';
  const locationLine = tournament ? formatLocation(tournament) : '';
  const bullets = tournament ? getVenueBullets(tournament) : [];

  const contenders = data?.topContenders ?? [];
  const topContender = contenders[0] ?? null;
  const topPickFirstName = topContender ? getFirstName(topContender.playerName) : '';
  const numPicks = Math.min(3, contenders.length);

  const supporting = contenders.slice(1, 3);

  return (
    <div>
      <FramingSentence text={framingSentence} />
      {topPickFirstName ? (
        <EditorialHeadline>
          <span style={{ color: AMBER_DEEP }}>{topPickFirstName}</span> is our pick to win.
        </EditorialHeadline>
      ) : (
        <EditorialHeadline>Our picks are locked in.</EditorialHeadline>
      )}
      <ContextLine>
        {`${numPicks || '—'} PICK${numPicks !== 1 ? 'S' : ''}${tournamentName !== 'Next Tournament' ? ` · ${tournamentName.toUpperCase()}` : ''}`}
      </ContextLine>

      {/* Venue card — light treatment */}
      {tournament && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: '#fff',
            border: `1px solid ${SLATE_150}`,
          }}
        >
          <div
            style={{
              ...monoLabel,
              fontSize: 9,
              letterSpacing: '0.16em',
              color: AMBER_DEEP,
            }}
          >
            {tournamentName}
          </div>
          <div
            style={{
              marginTop: 4,
              marginBottom: 4,
              fontFamily: headlineFont,
              fontSize: 16,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
            }}
          >
            {venueName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {locationLine && (
                <div style={{ fontSize: 11, color: SLATE_500 }}>{locationLine}</div>
              )}
              {bullets.length > 0 && (
                <ul
                  style={{
                    margin: '8px 0 0',
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {bullets.map((b, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 11,
                        color: SLATE_600,
                        lineHeight: 1.4,
                        display: 'flex',
                        gap: 6,
                      }}
                    >
                      <span style={{ color: AMBER_DEEP, flexShrink: 0 }}>·</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {tournament?.startDate && (
              <VenueTileCountdown startDate={tournament.startDate} />
            )}
          </div>
        </div>
      )}

      {topContender && (
        <HeroPick
          initials={getInitials(topContender.playerName)}
          name={topContender.playerName}
          subtitle={topContender.courseFitScore ? `Course Fit ${Math.round(topContender.courseFitScore)}` : null}
          pulledQuote={topContender.pulledQuote ?? topContender.reasons[0] ?? null}
          reasons={topContender.reasons}
          defaultExpanded={false}
          position="—"
          positionLabel="TO PLAY"
          positionAccent="amber"
        />
      )}

      {supporting.length > 0 && (
        <>
          <SupportingLabel />
          <div style={{ borderTop: `1px solid ${SLATE_150}` }}>
            {supporting.map((p, i) => (
              <CompactPick
                key={p.playerId}
                initials={getInitials(p.playerName)}
                name={p.playerName}
                tier={i === 0 ? 'STRONG' : 'CONTENTION'}
                reason={p.reasons[0]}
                reasons={p.reasons}
                position="—"
                positionLabel="TO PLAY"
              />
            ))}
          </div>
        </>
      )}

    </div>
  );
}

function SupportingLabel() {
  return (
    <div
      style={{
        ...monoLabel,
        fontSize: 9,
        color: SLATE_500,
        letterSpacing: '0.16em',
        marginBottom: 6,
      }}
    >
      Also in our picks
    </div>
  );
}

// ─── Venue tile countdown ────────────────────────────────────────────────────

const PAD2 = (n: number) => String(n).padStart(2, '0');

const VenueTileCountdown = memo(function VenueTileCountdown({
  startDate,
}: {
  startDate: string;
}) {
  const countdown = useCountdown(startDate);
  if (!countdown) return null;
  const showSeconds = countdown.totalMs < 24 * 60 * 60 * 1000;

  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div
        style={{
          ...monoLabel,
          fontSize: 8,
          color: AMBER_DEEP,
          letterSpacing: '0.14em',
          marginBottom: 4,
        }}
      >
        Tees Off In
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        {showSeconds ? (
          <>
            <CountdownUnit value={countdown.hours} label="H" />
            <CountdownUnit value={countdown.minutes} label="M" />
            <CountdownUnit value={countdown.seconds} label="S" highlight />
          </>
        ) : (
          <>
            <CountdownUnit value={countdown.days} label="D" />
            <CountdownUnit value={countdown.hours} label="H" />
            <CountdownUnit value={countdown.minutes} label="M" highlight />
          </>
        )}
      </div>
    </div>
  );
});

function CountdownUnit({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  const color = highlight ? AMBER_DEEP : INK;
  const labelColor = highlight ? AMBER_DEEP : SLATE_500;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span
        style={{
          fontFamily: headlineFont,
          fontSize: 18,
          fontWeight: 800,
          color,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {PAD2(value)}
      </span>
      <span
        style={{
          ...monoLabel,
          fontSize: 9,
          color: labelColor,
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── State message (loading) ─────────────────────────────────────────────────

function StateMessage({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '14px 0',
        fontSize: 13,
        fontWeight: 600,
        color: SLATE_500,
      }}
    >
      {label}
    </div>
  );
}

// Re-export type to suppress unused-import warnings.
export type { AITopContender };
