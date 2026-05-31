import { useEffect, useMemo, useState } from 'react';
import { useLiveTournaments } from '../../hooks/useLiveTournaments';
import { useTourLeaderboard } from '../../hooks/useTourHubData';
import { FullLeaderboard } from '../tournament-detail/FullLeaderboard';
import { EditorialEmpty } from '../tournament-detail/EditorialEmpty';
import { INK, INK_MUTE, INK_TINT_07, SURFACE, SHELL_BG, STATUS_LIVE, WHITE_ALPHA_06, WHITE_ALPHA_18, WHITE_ALPHA_55, WHITE_ALPHA_65 } from '../../_shared/tokens';
import { tourPriorityIndex } from '../../_shared/tourOrder';


/**
 * LiveLeaderboardTab — surfaces all in-progress (or starting-today) tournaments
 * with a quiet pill toggle and reuses the shared <FullLeaderboard /> renderer
 * from the tournament detail page.
 */
export function LiveLeaderboardTab() {
  const { data: liveTournaments = [], isLoading } = useLiveTournaments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default-select the first (highest-purse) tournament once data loads.
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
            background: SHELL_BG,
            borderBottom: `0.5px solid ${WHITE_ALPHA_06}`,
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
                  background: isActive ? WHITE_ALPHA_18 : 'transparent',
                  border: `1px solid ${isActive ? WHITE_ALPHA_55 : WHITE_ALPHA_18}`,
                  color: isActive ? SURFACE : WHITE_ALPHA_65,
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
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Header above the leaderboard */}
      <div
        style={{
          padding: '14px 20px 10px',
          background: '#FFFFFF',
          borderBottom: `0.5px solid ${INK_TINT_07}`,
        }}
      >
        <div
          style={{
            fontFamily: 'Geist, system-ui, sans-serif',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isLive ? STATUS_LIVE : '#F7931E',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isLive && (
            <span
              aria-hidden
              style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_LIVE }}
            />
          )}
          {isLive ? 'Live' : 'Tees Off Today'}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: 'Geist, system-ui, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
          }}
        >
          {selected.name}
        </div>
        {selected.tour_name && (
          <div
            style={{
              marginTop: 2,
              fontFamily: 'Geist, system-ui, sans-serif',
              fontSize: 11.5,
              fontWeight: 600,
              color: INK_MUTE,
            }}
          >
            {selected.tour_name}
          </div>
        )}
      </div>

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
