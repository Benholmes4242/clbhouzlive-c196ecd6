/**
 * WorldRankingsSection — Broadcast-grade OWGR leaderboard
 * 
 * Page-level section (no card wrapper). Features:
 * - Authority header with OWGR branding
 * - Narrative strip (editorial intelligence)
 * - Momentum pill strip (horizontal scroll)
 * - Tiered competitive ladder with velocity arrows
 * - Broadcast-style pagination
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWorldRankingsOverview, type RankingEntry } from '../../hooks/useWorldRankingsOverview';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { cn } from '@/lib/utils';

const PLAYERS_PER_PAGE = 10;

function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getInitials(first: string, last: string): string {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
}

// ─── Momentum Pill ───
function MomentumPill({ entry }: { entry: RankingEntry }) {
  const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
  const isRocket = entry.movement >= 30;

  return (
    <Link
      to={`/tourhub/player/${entry.playerId}`}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/60 border border-border/50 flex-shrink-0 active:scale-[0.97] transition-transform"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {getInitials(entry.firstName, entry.lastName)}
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-foreground whitespace-nowrap">{entry.lastName}</span>
      <span className="text-xs text-muted-foreground font-mono">#{entry.rank}</span>
      <span className="text-xs font-semibold text-emerald-700 font-mono flex items-center gap-0.5">
        {isRocket && '🚀 '}↑ +{entry.movement}
      </span>
    </Link>
  );
}

// ─── Ranking Row ───
function RankingRow({ entry, no1AvgPoints }: { entry: RankingEntry; no1AvgPoints: number | null }) {
  const photoUrl = resolvePhotoUrl(entry.photoUrl, entry.pgaTourId);
  const isCrown = entry.tier === 'crown';
  const isElite = entry.tier === 'elite';
  const isContender = entry.tier === 'contender';

  return (
    <Link
      to={`/tourhub/player/${entry.playerId}`}
      className={cn(
        "flex items-center gap-3 py-3 px-1 -mx-1 rounded-lg transition-all active:scale-[0.98]",
        isCrown && "bg-amber-50/60",
        isElite && "bg-muted/30",
      )}
    >
      {/* Rank badge */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold",
        isCrown && "bg-red-100 text-red-700",
        isElite && "bg-red-50 text-red-600",
        isContender && "bg-red-50/60 text-red-500",
        !isCrown && !isElite && !isContender && "text-muted-foreground",
      )}>
        {isCrown ? <Crown className="w-4 h-4 text-red-600" /> : entry.rank}
      </div>

      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full overflow-hidden flex-shrink-0",
        isCrown ? "ring-2 ring-amber-400/50" : "bg-muted",
      )}>
        {photoUrl ? (
          <img src={photoUrl} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs font-bold text-muted-foreground">
              {getInitials(entry.firstName, entry.lastName)}
            </span>
          </div>
        )}
      </div>

      {/* Name & Country */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          isCrown ? "font-bold text-foreground" : isElite ? "font-semibold text-foreground" : "font-medium text-foreground",
        )}>
          {entry.firstName} {entry.lastName}
        </p>
        <p className="text-xs text-muted-foreground">{toTitleCase(entry.country)}</p>
      </div>

      {/* Velocity arrow */}
      <div className="flex-shrink-0 w-10 flex justify-center">
        {entry.movement > 0 ? (
          <span className="text-xs font-semibold text-emerald-700 font-mono flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />+{entry.movement}
          </span>
        ) : entry.movement < 0 ? (
          <span className="text-xs font-semibold text-red-500/70 font-mono flex items-center gap-0.5">
            <TrendingDown className="w-3 h-3" />{entry.movement}
          </span>
        ) : (
          <Minus className="w-3 h-3 text-muted-foreground/40" />
        )}
      </div>

      {/* Points (stacked) */}
      <div className="flex-shrink-0 text-right min-w-[52px]">
        {entry.avgPoints != null ? (
          <>
            <p className="text-sm font-bold text-foreground font-mono leading-tight">{entry.avgPoints.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Avg Pts</p>
          </>
        ) : entry.totalPoints != null ? (
          <>
            <p className="text-sm font-bold text-foreground font-mono leading-tight">{entry.totalPoints.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Total Pts</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
      </div>
    </Link>
  );
}

// ─── Main Section ───
export function WorldRankingsSection() {
  const { data, isLoading } = useWorldRankingsOverview(20);
  const [page, setPage] = useState(0);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.ceil(data.entries.length / PLAYERS_PER_PAGE);
  }, [data]);

  const visibleEntries = useMemo(() => {
    if (!data) return [];
    const start = page * PLAYERS_PER_PAGE;
    return data.entries.slice(start, start + PLAYERS_PER_PAGE);
  }, [data, page]);

  if (isLoading) {
    return (
      <section className="py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted/60 rounded" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => <div key={i} className="h-10 w-32 bg-muted rounded-full" />)}
          </div>
          <div className="space-y-2 mt-6">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-muted/40 rounded-lg" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.entries.length === 0) return null;

  return (
    <section className="py-2">
      {/* ─── Authority Header ─── */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-foreground">
          Official World Golf Ranking
        </h3>
        <Link
          to="/tourhub?tab=players"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors uppercase tracking-wide font-medium"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Updated weekly · Official OWGR data
      </p>
      <div className="h-px bg-border/40 mb-5" />

      {/* ─── Narrative Strip ─── */}
      {data.narrative && (
        <p className="text-sm text-muted-foreground italic mb-5 leading-relaxed">
          "{data.narrative}"
        </p>
      )}

      {/* ─── Momentum Strip ─── */}
      {data.movers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            This Week's Momentum
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {data.movers.map(mover => (
              <MomentumPill key={mover.playerId} entry={mover} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Competitive Ladder ─── */}
      <div className="min-h-[560px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12 }}
            className="divide-y divide-border/30"
          >
            {visibleEntries.map((entry) => (
              <RankingRow
                key={entry.playerId}
                entry={entry}
                no1AvgPoints={data.no1AvgPoints}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Broadcast Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground disabled:opacity-30 active:scale-[0.92] transition-all hover:bg-muted"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === page ? "bg-foreground scale-110" : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground disabled:opacity-30 active:scale-[0.92] transition-all hover:bg-muted"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-[11px] text-muted-foreground font-mono ml-1">
            {page * PLAYERS_PER_PAGE + 1}–{Math.min((page + 1) * PLAYERS_PER_PAGE, data.entries.length)} of {data.entries.length}
          </span>
        </div>
      )}
    </section>
  );
}
