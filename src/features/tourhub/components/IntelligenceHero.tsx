/**
 * IntelligenceHero — Tour Hub focal point
 *
 * Dark violet magazine-masthead card that establishes Clbhouz Intelligence
 * as the AI brand on the Tour Hub. Replaces the legacy <TournamentInsights />
 * consumer in OverviewPageV3 (the underlying TournamentInsights component is
 * preserved — sub-components are reused on tournament detail pages).
 *
 * Editorial copy reads from championship_editorial_daily (surface =
 * 'intelligence_quote') with INTELLIGENCE_QUOTE_FALLBACK as the V1 fallback.
 *
 * Per Tour Hub redesign brief Phase C.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Trophy, ChevronRight } from 'lucide-react';
import { useAIPredictions } from '../hooks/useAIPredictions';
import { usePickHistory } from '../hooks/usePickHistory';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { INTELLIGENCE_QUOTE_FALLBACK } from '../utils/editorialFallbacks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatScoreToPar(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  if (score === 0) return 'E';
  if (score < 0) return String(score);
  return `+${score}`;
}

function formatIssueDate(d: Date): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getTierLabel(rank: number): string {
  if (rank === 1) return 'Top Pick';
  if (rank === 2) return 'Strong Contender';
  return 'In Contention';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const IntelligenceHero = memo(function IntelligenceHero() {
  const navigate = useNavigate();

  const { data: predictions, activeTournamentId, tournamentPhase } = useAIPredictions();
  const { data: pickHistory = [] } = usePickHistory();
  const { data: editorial } = useDailyEditorial({
    surface: 'intelligence_quote',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // ─── Computed record ───────────────────────────────────────────────────────
  const { wins, topFives, accuracy, lastWin } = useMemo(() => {
    const w = pickHistory.filter(e => e.isWinner).length;
    const t5 = pickHistory.filter(
      e => e.actualPosition !== null && e.actualPosition <= 5,
    ).length;
    const total = pickHistory.length || 1;
    const acc = Math.round((t5 / total) * 100);
    const last = pickHistory.find(e => e.isWinner) ?? null;
    return { wins: w, topFives: t5, accuracy: acc, lastWin: last };
  }, [pickHistory]);

  const issueDate = useMemo(() => formatIssueDate(new Date()), []);

  // ─── Editorial copy with fallback ──────────────────────────────────────────
  const pullQuote =
    editorial?.standfirst ?? INTELLIGENCE_QUOTE_FALLBACK.pullQuote;
  const subHeadline =
    editorial?.headline ??
    'Clbhouz called four PGA TOUR winners this season — including Matt Fitzpatrick at the RBC Heritage.';

  // ─── This week picks ───────────────────────────────────────────────────────
  const thisWeekPicks = (predictions?.topContenders ?? []).slice(0, 3);
  const tournamentName = predictions?.tournament?.name ?? 'This Week';

  // ─── We Called It (lastWin or fallback) ────────────────────────────────────
  const calledItEvent = lastWin?.tournamentName ?? INTELLIGENCE_QUOTE_FALLBACK.eventName;
  const calledItPlayer = lastWin?.topPickName ?? INTELLIGENCE_QUOTE_FALLBACK.pickName;
  const calledItScore = lastWin
    ? formatScoreToPar(lastWin.scoreToPar)
    : INTELLIGENCE_QUOTE_FALLBACK.finalScore;
  const calledItResult = lastWin
    ? `Won outright · ${lastWin.year}`
    : INTELLIGENCE_QUOTE_FALLBACK.pickResult;

  const handleSeeAll = () => {
    if (activeTournamentId) {
      navigate(`/tourhub/tournament/${activeTournamentId}`);
    } else {
      navigate('/tourhub');
    }
  };

  return (
    <section
      aria-label="Clbhouz Intelligence"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '24px 18px 18px',
          background:
            'linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1e1138 100%)',
          boxShadow:
            '0 12px 40px -8px rgba(124, 58, 237, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* ── Decorative orbs ── */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -80,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(247, 147, 30, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Subtle grid pattern overlay ── */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── Magazine masthead row ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(167, 139, 250, 0.55)',
                  flexShrink: 0,
                }}
              >
                <Brain size={15} color="#ffffff" strokeWidth={2.4} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#A78BFA',
                  textShadow: '0 0 12px rgba(167, 139, 250, 0.5)',
                }}
              >
                Clbhouz Intelligence
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              {issueDate}
            </span>
          </div>

          {/* ── Divider ── */}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.1)',
              marginTop: 14,
              marginBottom: 16,
            }}
          />

          {/* ── Editorial headline ── */}
          <h2
            style={{
              fontSize: 26,
              lineHeight: 1.05,
              letterSpacing: '-0.8px',
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
            }}
          >
            <div>{wins} winner{wins === 1 ? '' : 's'}.</div>
            <div>{topFives} top-five{topFives === 1 ? '' : 's'}.</div>
            <div
              style={{
                background: 'linear-gradient(90deg, #F7931E 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              One season.
            </div>
          </h2>

          {/* ── Sub-headline ── */}
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,0.65)',
              margin: '12px 0 0',
              fontWeight: 500,
            }}
          >
            {subHeadline}
          </p>

          {/* ── Stats hero strip ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
              marginTop: 18,
            }}
          >
            <StatPill value={String(wins)} label="Wins" highlight />
            <StatPill value={String(topFives)} label="Top-5" />
            <StatPill value={`${accuracy}%`} label="Top-5 Rate" />
          </div>

          {/* ── We Called It feature card ── */}
          <div
            style={{
              marginTop: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(247, 147, 30, 0.35)',
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Trophy size={11} color="#F7931E" strokeWidth={2.4} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#F7931E',
                }}
              >
                We Called It · {calledItEvent}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {calledItPlayer}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 500,
                  }}
                >
                  {calledItResult}
                </div>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: '-0.8px',
                  color: '#F7931E',
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {calledItScore}
              </div>
            </div>

            {/* Hairline + pull-quote */}
            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.08)',
                margin: '12px 0 10px',
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 11,
                lineHeight: 1.45,
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
              }}
            >
              “{pullQuote}”
            </p>
          </div>

          {/* ── This week picks ── */}
          {thisWeekPicks.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 10,
                }}
              >
                This Week · {tournamentName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {thisWeekPicks.map((pick) => (
                  <PickRow
                    key={pick.playerId ?? `${pick.rank}-${pick.playerName}`}
                    rank={pick.rank}
                    name={pick.playerName}
                    tier={getTierLabel(pick.rank)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <button
            type="button"
            onClick={handleSeeAll}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '13px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background:
                'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '-0.1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.45)',
            }}
          >
            <span>See all Intelligence picks</span>
            <ChevronRight size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </section>
  );
});

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatPill({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
        background: highlight
          ? 'rgba(247, 147, 30, 0.12)'
          : 'rgba(255,255,255,0.04)',
        border: highlight
          ? '1px solid rgba(247, 147, 30, 0.35)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: highlight ? '#F7931E' : '#ffffff',
          letterSpacing: '-0.6px',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: highlight ? '#F7931E' : 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PickRow({
  rank,
  name,
  tier,
}: {
  rank: number;
  name: string;
  tier: string;
}) {
  const isTopPick = rank === 1;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        background: isTopPick
          ? 'rgba(247, 147, 30, 0.08)'
          : 'rgba(255,255,255,0.03)',
        border: isTopPick
          ? '1px solid rgba(247, 147, 30, 0.3)'
          : '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: isTopPick ? '#F7931E' : 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          color: isTopPick ? '#ffffff' : 'rgba(255,255,255,0.7)',
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isTopPick ? '#F7931E' : 'rgba(255,255,255,0.5)',
          flexShrink: 0,
        }}
      >
        {tier}
      </div>
    </div>
  );
}
