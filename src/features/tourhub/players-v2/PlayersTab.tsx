/**
 * players-v2/PlayersTab — "The Ranking" — podium + honest degrade + one shared
 * row. Overview grammar, no framer-motion, no shell-row dependency, no
 * ShellSlot identity chrome.
 *
 * Wiring:
 *   - Tour: TourSelectionContext (selectTour); ?tour= honored once on mount,
 *     ?sort= honored (Ranking | Playing now) for old inbound links.
 *   - Data: usePlayersRanking(tour) + useLivePlayerIds() + useLiveTournaments().
 *   - Editorial line: derived from the live/next tournament for the tour;
 *     self-hides when nothing to say.
 *
 * Not registered — PL2 flips TourHubMainPage to import from here.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourSelection } from '../context/TourSelectionContext';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { TOUR_PRIORITY } from '../_shared/tourOrder';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import {
  AMBER,
  AMBER_TINT_10,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';

import { usePlayersRanking, type RankedRow } from './data/usePlayersRanking';
import { useLivePlayerIds } from './data/useLivePlayerIds';
import { PodiumCards } from './PodiumCards';
import { RankedPlayerRow } from './RankedPlayerRow';

const CHIP_LABEL: Record<TourId, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DP WORLD',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV',
};

type SortKey = 'ranking' | 'live';

function useDebouncedValue<T>(v: T, ms: number): T {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setX(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return x;
}

function formatDayShort(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, { weekday: 'long' });
}

export function PlayersTab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Tour selection (app-wide brain) — honor ?tour= once on mount.
  const { selectedTourSlug, viewingTourSlug, selectTour } = useTourSelection();
  const inboundHonoredRef = useRef(false);
  useEffect(() => {
    if (inboundHonoredRef.current) return;
    inboundHonoredRef.current = true;
    const inbound = searchParams.get('tour');
    if (inbound && inbound in TOUR_CONFIG && inbound !== (selectedTourSlug ?? viewingTourSlug)) {
      selectTour(inbound);
    }
  }, [searchParams, selectTour, selectedTourSlug, viewingTourSlug]);

  const activeTour: TourId =
    ((viewingTourSlug ?? selectedTourSlug ?? 'pga') as string) in TOUR_CONFIG
      ? ((viewingTourSlug ?? selectedTourSlug ?? 'pga') as TourId)
      : 'pga';

  // ── Sort (honor inbound ?sort=)
  const inboundSort = searchParams.get('sort');
  const [sort, setSortState] = useState<SortKey>(
    inboundSort === 'live' || inboundSort === 'playing-now' ? 'live' : 'ranking',
  );
  const setSort = useCallback(
    (next: SortKey) => {
      setSortState(next);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('sort', next);
          p.set('tab', 'players');
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // ── Search
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  // ── Data
  const { data: ranking, isLoading: rankingLoading } = usePlayersRanking(activeTour);
  const { data: liveMap } = useLivePlayerIds();
  const { data: liveTournaments } = useLiveTournaments();

  // ── Year label
  const yearLabel = useMemo(() => {
    const now = new Date();
    return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
  }, []);

  // ── Editorial line (live leader → then upcoming day)
  const editorial = useMemo<string | null>(() => {
    const tours = (liveTournaments ?? []).filter((t) => t.tourSlug === activeTour);
    if (!tours.length) return null;
    const live = tours.find((t) => t.status === 'inprogress');
    if (live) {
      // Find leader among liveMap rows belonging to this tournament.
      const leaders = Object.values(liveMap ?? {})
        .filter((info) => info.tournamentId === live.id && info.position === 1)
        .slice(0, 1);
      const leader = leaders[0];
      const leaderRow = leader
        ? (ranking?.rows ?? []).find(
            (r) => (liveMap ?? {})[r.playerId]?.tournamentId === live.id && (liveMap ?? {})[r.playerId]?.position === 1,
          )
        : null;
      if (leaderRow && leader?.score != null) {
        const scoreStr = leader.score === 0 ? 'E' : leader.score > 0 ? `+${leader.score}` : `${leader.score}`;
        return `${live.name.toUpperCase()} — ${leaderRow.name.toUpperCase()} LEADS AT ${scoreStr}`;
      }
      return live.name.toUpperCase();
    }
    const soon = tours[0];
    const day = formatDayShort(soon.start_date);
    return day ? `${soon.name.toUpperCase()} STARTS ${day.toUpperCase()}` : null;
  }, [liveTournaments, activeTour, liveMap, ranking?.rows]);

  // ── Rows: filter by search
  const filteredRows = useMemo<RankedRow[]>(() => {
    const rows = ranking?.rows ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [ranking?.rows, debouncedSearch]);

  // ── Ordering when "Playing now" active
  const orderedRows = useMemo<RankedRow[]>(() => {
    if (sort !== 'live') return filteredRows;
    const live: RankedRow[] = [];
    const rest: RankedRow[] = [];
    filteredRows.forEach((r) => {
      if ((liveMap ?? {})[r.playerId]) live.push(r);
      else rest.push(r);
    });
    live.sort((a, b) => {
      const pa = (liveMap ?? {})[a.playerId]?.position ?? Infinity;
      const pb = (liveMap ?? {})[b.playerId]?.position ?? Infinity;
      return pa - pb;
    });
    return [...live, ...rest];
  }, [sort, filteredRows, liveMap]);

  const isSearching = debouncedSearch.trim().length > 0;
  const synced = !!ranking?.synced;
  const statLabel = ranking?.statLabel ?? null;
  const podiumRows = useMemo(() => (ranking?.rows ?? []).slice(0, 3), [ranking?.rows]);

  const goPlayer = useCallback((id: string) => id && navigate(`/tourhub/player/${id}`), [navigate]);

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh', fontFamily: FONT }}>
      {/* HEADER — THE PLAYERS · YEAR · search icon */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: AMBER,
                textTransform: 'uppercase',
              }}
            >
              THE PLAYERS
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: INK_MUTE,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {yearLabel}
            </span>
          </div>
          {!searchExpanded ? (
            <button
              type="button"
              aria-label="Search players"
              onClick={() => setSearchExpanded(true)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: '#FFFFFF',
                border: `0.5px solid ${HAIRLINE_INK_10}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Search size={14} color={INK} />
            </button>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFFFFF',
                border: `0.5px solid ${HAIRLINE_INK_10}`,
                borderRadius: 14,
                padding: '4px 10px',
                minWidth: 0,
              }}
            >
              <Search size={13} color={INK_MUTE} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: INK,
                  background: 'transparent',
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearch('');
                  setSearchExpanded(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={14} color={INK_MUTE} />
              </button>
            </div>
          )}
        </div>

        {/* Tour chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 12,
            scrollbarWidth: 'none',
          }}
          className="segmented-scroller"
        >
          {TOUR_PRIORITY.map((slug) => {
            const isActive = slug === activeTour;
            return (
              <button
                key={slug}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectTour(slug)}
                style={{
                  flex: '0 0 auto',
                  padding: '7px 12px',
                  borderRadius: 14,
                  border: isActive ? 'none' : `0.5px solid ${HAIRLINE_INK_10}`,
                  background: isActive ? INK : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : INK,
                  fontFamily: 'inherit',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                {CHIP_LABEL[slug]}
              </button>
            );
          })}
        </div>

        {editorial && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: INK_MUTE,
              letterSpacing: '0.02em',
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {editorial}
          </div>
        )}
      </div>

      {/* PODIUM — synced only, hidden while searching */}
      {synced && !isSearching && !rankingLoading && podiumRows.length >= 3 && (
        <PodiumCards rows={podiumRows} statLabel={statLabel} />
      )}

      {/* THE FIELD */}
      <div style={{ padding: '4px 16px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: AMBER,
            textTransform: 'uppercase',
          }}
        >
          THE FIELD
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ranking', 'live'] as SortKey[]).map((k) => {
            const active = k === sort;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(k)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 10,
                  border: active ? 'none' : `0.5px solid ${HAIRLINE_INK_10}`,
                  background: active ? AMBER_TINT_10 : '#FFFFFF',
                  color: active ? INK : INK_MUTE,
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {k === 'ranking' ? 'Ranking' : 'Playing now'}
              </button>
            );
          })}
        </div>
      </div>

      {rankingLoading ? (
        <div style={{ padding: '0 16px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-full mb-1" style={{ height: 58, borderRadius: 6 }} />
          ))}
        </div>
      ) : orderedRows.length === 0 ? (
        <TourHubEmptyState variant="players" />
      ) : (
        <div style={{ background: '#FFFFFF' }}>
          {orderedRows.map((r) => {
            const live = (liveMap ?? {})[r.playerId];
            const isLive = !!live;
            let sub: string | null = null;
            let subLive = false;
            if (isLive && live) {
              const posStr =
                live.position != null
                  ? `${live.positionTied ? 'T' : ''}${live.position}`
                  : '';
              sub = posStr ? `${posStr} \u00B7 ${live.tournamentName}` : live.tournamentName;
              subLive = true;
            } else if (synced && (r.wins || r.top10s)) {
              const parts: string[] = [];
              if (r.wins) parts.push(`${r.wins} WIN${r.wins === 1 ? '' : 'S'}`);
              if (r.top10s) parts.push(`${r.top10s} TOP-10`);
              sub = parts.join(' \u00B7 ');
            }
            const goldRank = synced && r.rank === 1 && !podiumRows.length;
            return (
              <RankedPlayerRow
                key={r.playerId || `rank-${r.rank}`}
                rank={r.rank}
                player={{
                  playerId: r.playerId,
                  name: r.name,
                  country: r.country,
                  countryCode: r.countryCode,
                  photoUrl: r.photoUrl,
                  tourCode: r.tourCode,
                }}
                stat={synced ? r.stat : undefined}
                statLabel={synced ? statLabel : undefined}
                live={isLive}
                sub={sub}
                subLive={subLive}
                goldRank={goldRank}
                onClick={() => goPlayer(r.playerId)}
              />
            );
          })}
        </div>
      )}

      {/* Footer caption */}
      <div
        style={{
          padding: '16px 16px 88px',
          fontSize: 10.5,
          fontWeight: 500,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}
      >
        {synced
          ? 'Season ranking \u00B7 live dot = on the course right now'
          : 'Ranked by world ranking \u2014 season statistics arrive with the sync'}
      </div>
    </div>
  );
}

export default PlayersTab;
