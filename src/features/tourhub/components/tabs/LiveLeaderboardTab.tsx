import { useEffect, useMemo, useState } from 'react';
import { format, isSameMonth } from 'date-fns';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import SheetHeader from '@/components/ui/SheetHeader';
import { useLiveTournaments } from '../../hooks/useLiveTournaments';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { FullLeaderboard } from '../tournament-detail/FullLeaderboard';
import { EditorialEmpty } from '../tournament-detail/EditorialEmpty';
import { INK, INK_MUTE, INK_TINT_05, INK_TINT_07, SURFACE, STATUS_LIVE } from '../../_shared/tokens';
import { tourPriorityIndex, TOUR_LABEL, shortTournamentToken } from '../../_shared/tourOrder';
import { TOUR_CONFIG } from '../../hooks/useOverviewData';
import type { LiveTournamentLite } from '../../hooks/useLiveTournaments';

const COUNTRY_NAMES: Record<string, string> = {
  USA: 'USA', GBR: 'Great Britain', SCO: 'Scotland', ENG: 'England', WAL: 'Wales',
  NIR: 'Northern Ireland', IRL: 'Ireland', AUS: 'Australia', CAN: 'Canada',
  JPN: 'Japan', KOR: 'South Korea', RSA: 'South Africa', ESP: 'Spain',
  FRA: 'France', GER: 'Germany', ITA: 'Italy', SWE: 'Sweden', NOR: 'Norway',
  DEN: 'Denmark', NED: 'Netherlands', BEL: 'Belgium', AUT: 'Austria',
  MEX: 'Mexico', ARG: 'Argentina', CHI: 'Chile', COL: 'Colombia',
  CHN: 'China', THA: 'Thailand', IND: 'India', NZL: 'New Zealand',
  UAE: 'United Arab Emirates', KSA: 'Saudi Arabia',
};
function expandCountry(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}



/**
 * LiveLeaderboardTab — surfaces all in-progress (or starting-today) tournaments
 * with a quiet pill toggle and reuses the shared <FullLeaderboard /> renderer
 * from the tournament detail page.
 */
export function LiveLeaderboardTab() {
  const { data: rawLiveTournaments = [], isLoading } = useLiveTournaments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Canonical tour-priority order, with purse as the within-tour tiebreaker.
  const liveTournaments = useMemo(() => {
    return [...rawLiveTournaments].sort((a, b) => {
      const ai = tourPriorityIndex(a.tourSlug);
      const bi = tourPriorityIndex(b.tourSlug);
      if (ai !== bi) return ai - bi;
      return (b.purse ?? 0) - (a.purse ?? 0);
    });
  }, [rawLiveTournaments]);

  // Default-select the first (canonical-order) tournament once data loads.
  useEffect(() => {
    if (!selectedId && liveTournaments.length > 0) {
      setSelectedId(liveTournaments[0].id);
    } else if (selectedId && liveTournaments.length > 0 && !liveTournaments.find(t => t.id === selectedId)) {
      // selected tournament dropped out of the live list
      setSelectedId(liveTournaments[0].id);
    }
  }, [liveTournaments, selectedId]);

  const selected = useMemo(
    () => liveTournaments.find(t => t.id === selectedId) ?? liveTournaments[0] ?? null,
    [liveTournaments, selectedId],
  );

  // Count live events per tour to know when to disambiguate same-tour pills.
  const tourCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of liveTournaments) m.set(t.tourSlug, (m.get(t.tourSlug) ?? 0) + 1);
    return m;
  }, [liveTournaments]);

  const pillLabel = (t: LiveTournamentLite): string => {
    const base = TOUR_LABEL[t.tourSlug] ?? (t.tour_name ?? 'Tour');
    if ((tourCounts.get(t.tourSlug) ?? 0) > 1) {
      return `${base} · ${shortTournamentToken(t.name)}`;
    }
    return base;
  };

  const { data: leaderboard, isLoading: isLoadingBoard } = useTourLeaderboard(selected?.id ?? '');


  if (isLoading && liveTournaments.length === 0) {
    return <LiveLeaderboardSkeleton />;
  }

  if (!selected) {
    return (
      <EditorialEmpty
        eyebrow="Leaderboard"
        title="No live tournaments"
        body="When an event tees off, its live leaderboard will appear here."
      />
    );
  }

  const isLive = selected.status === 'inprogress';

  return (
    <div style={{ background: SURFACE, minHeight: '60vh' }}>
      {liveTournaments.length > 1 && (
        <div
          role="tablist"
          aria-label="Live tournaments"
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            background: SLATE_50,
            borderBottom: `0.5px solid ${INK_TINT_07}`,
          }}
        >
          {liveTournaments.map((t) => {
            const isActive = t.id === selected.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedId(t.id)}
                style={{
                  flex: '0 0 auto',
                  height: 30,
                  padding: '0 11px',
                  borderRadius: 15,
                  background: isActive ? INK_TINT_06 : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(15,23,42,0.20)' : INK_TINT_07}`,
                  color: isActive ? INK : INK_MUTE,
                  fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 600,
                  letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {t.status === 'inprogress' && (
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: STATUS_LIVE,
                      boxShadow: isActive ? '0 0 0 2px rgba(16,185,129,0.30)' : 'none',
                    }}
                  />
                )}
                {pillLabel(t)}
              </button>
            );
          })}
        </div>
      )}

      {/* Header above the leaderboard — minimal */}
      {(() => {
        const tourFullName = TOUR_CONFIG[selected.tourSlug]?.name ?? selected.tour_name ?? '';
        const location = [selected.venue_city, expandCountry(selected.venue_country)]
          .filter(Boolean)
          .join(', ');
        const dates = selected.end_date
          ? formatDateRange(selected.start_date, selected.end_date)
          : null;
        const rightMeta = dates;

        return (
          <div style={{ padding: '16px 20px 16px', background: '#FFFFFF', borderBottom: `0.5px solid ${INK_TINT_07}` }}>
            {/* Row: tour (+ live dot · round) · dates right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontFamily: 'Geist, system-ui, sans-serif',
                fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: INK,
              }}>
                {isLive && (
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE, flexShrink: 0 }} />
                )}
                {tourFullName}
                {isLive && selected.currentRound != null && ` · Round ${selected.currentRound}`}
              </span>
              {rightMeta && (
                <span style={{
                  fontFamily: 'Geist, system-ui, sans-serif',
                  fontSize: 11, fontWeight: 600, color: INK,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>
                  {rightMeta}
                </span>
              )}
            </div>

            {/* Tournament name */}
            <div style={{
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: 20, fontWeight: 800, color: INK,
              letterSpacing: '-0.02em', lineHeight: 1.16,
            }}>
              {selected.name}
            </div>

            {/* Location only */}
            {location && (
              <div style={{
                marginTop: 8,
                fontFamily: 'Geist, system-ui, sans-serif',
                fontSize: 12.5, fontWeight: 500, color: INK,
              }}>
                {location}
              </div>
            )}
          </div>
        );
      })()}



      {isLoadingBoard && (!leaderboard || (leaderboard as any[]).length === 0) ? (
        <LiveLeaderboardSkeleton />
      ) : ((leaderboard as any[] | undefined)?.length ?? 0) === 0 ? (
        <EditorialEmpty
          eyebrow="Leaderboard"
          title="Scoring not yet posted"
          body="Scoring will populate as players post numbers."
        />
      ) : (
        <FullLeaderboard
          entries={(leaderboard ?? []) as any}
          tournamentStatus={selected.status}
          tournamentName={selected.name}
          venuePar={selected.venue_par}
        />
      )}
    </div>
  );
}

function LiveLeaderboardSkeleton() {
  return (
    <div style={{ background: SURFACE, padding: '16px 20px' }}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 44,
            background: '#FFFFFF',
            borderBottom: `0.5px solid ${INK_TINT_07}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
          }}
        >
          <div style={{ width: 24, height: 12, background: '#E2E8F0', borderRadius: 4 }} />
          <div style={{ width: 28, height: 28, borderRadius: '34%', background: '#E2E8F0' }} />
          <div style={{ flex: 1, height: 12, background: '#E2E8F0', borderRadius: 4 }} />
          <div style={{ width: 40, height: 12, background: '#E2E8F0', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}
