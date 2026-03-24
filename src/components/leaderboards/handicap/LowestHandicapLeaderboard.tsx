import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp, getHandicapStatusLabel, getHandicapStatusColor, getHandicapBadgeStyle } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import { HandicapMoverStrip } from './HandicapMoverStrip';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
import type { LeaderboardScope } from '@/types/leaderboards';

// --- Constants ---
const ROW_HEIGHT = 72;
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;
const STORAGE_KEY_SCROLL = 'handicap-leaderboard-scroll';

// --- Helper components ---
function HandicapLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-6 rounded" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton for initial Handicap tab load */
function HandicapPageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Scope pills row */}
      <div className="flex gap-2 justify-center">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-2 py-4">
        <Skeleton className="h-[90px] w-[30%] rounded-xl" />
        <Skeleton className="h-[110px] w-[38%] rounded-xl" />
        <Skeleton className="h-[90px] w-[30%] rounded-xl" />
      </div>
      {/* Leaderboard rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-6 rounded" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="w-[72px] h-8 rounded" />
        </div>
      ))}
    </div>
  );
}

function InlineRetryCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-4 px-3">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-muted text-sm text-muted-foreground active:scale-[0.98] active:opacity-70 transition-all"
      >
        Couldn't load more entries · Tap to retry
      </button>
    </div>
  );
}

function InitialErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-3 text-center space-y-4">
      <p className="text-muted-foreground text-sm">Something went wrong loading the leaderboard.</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97] active:opacity-90 transition-all"
      >
        Try again
      </button>
    </div>
  );
}

// --- Empty State ---
function EmptyState({ scope, clubName, country }: { scope: string; clubName?: string | null; country?: string | null }) {
  const message = (() => {
    if (scope === 'club' && clubName) return `No handicaps from ${clubName} yet — invite your club mates`;
    if (scope === 'country' && country) return `No ${country} players yet`;
    if (scope === 'friends') return 'None of your friends have a handicap yet';
    return 'No handicaps recorded yet. Add your handicap to appear here!';
  })();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-3 text-center space-y-4">
      <p className="text-base text-muted-foreground">{message}</p>
      <Link
        to="/profile/edit"
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
        style={{ backgroundColor: '#F5A623' }}
      >
        Add Handicap
      </Link>
    </div>
  );
}

// --- Handicap Row (Section 8 spec) ---
function HandicapRow({
  entry,
  userId,
}: {
  entry: any;
  userId?: string;
}) {
  const isMe = entry.user_id === userId;
  const rank = entry.rank;
  const handicap = entry.handicap_index;
  const statusLabel = getHandicapStatusLabel(handicap);
  const handicapColor = getHandicapStatusColor(handicap);
  const categoryBadge = getHandicapBadgeStyle(handicap);

  const initials = (entry.display_name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/profile/${entry.user_id}`}
      className="flex items-center gap-3 active:scale-[0.98] transition-transform"
      style={{
        background: isMe ? '#FFFBF0' : 'white',
        border: isMe ? '1px solid rgba(245,166,35,0.27)' : '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 6,
        minHeight: 44,
      }}
    >
      {/* Rank */}
      <span
        style={{
          width: 20,
          fontSize: 13,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
          flexShrink: 0,
          color: rank <= 3 ? '#F5A623' : '#64748B',
        }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <SquircleAvatar
        size={52}
        src={entry.avatar_url}
        alt={entry.display_name || ''}
        fallback={initials}
        thinRing
        className="flex-shrink-0"
      />

      {/* Name + Location + Club */}
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" style={{ fontSize: 14, color: '#0F172A' }}>
          {entry.display_name || 'Unknown'}
        </p>
        {(entry.city || entry.country) && (
          <p className="truncate" style={{ fontSize: 11, color: '#94A3B8' }}>
            {[entry.city, entry.country].filter(Boolean).join(', ')}
          </p>
        )}
        {entry.club_name && (
          <p className="truncate" style={{ fontSize: 11, color: '#94A3B8' }}>
            {entry.club_name}
          </p>
        )}
      </div>

      {/* Handicap number + tier label stacked */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center" style={{ width: 72 }}>
        <span style={{ color: handicapColor, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
          {formatHcp(handicap)}
        </span>
        {statusLabel && (
          <span
            className="font-semibold uppercase tracking-wide mt-1 text-center leading-tight"
            style={{
              fontSize: 8,
              background: categoryBadge.bg,
              color: categoryBadge.text,
              borderRadius: 6,
              padding: '2px 6px',
              maxWidth: 68,
            }}
          >
            {statusLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

// --- Scope label helper ---
function getScopeLabel(scope: string, country?: string | null, clubName?: string | null): string {
  switch (scope) {
    case 'country': return country ? `in ${country}` : 'in your country';
    case 'club': return clubName ? `at ${clubName}` : 'at your club';
    case 'friends': return 'among friends';
    default: return 'globally';
  }
}

function getScopeContext(scope: string, country?: string | null, clubName?: string | null): string {
  switch (scope) {
    case 'country': return country ? `${country} · Country leaderboard` : 'Country leaderboard';
    case 'club': return clubName ? `${clubName} · Club leaderboard` : 'Club leaderboard';
    case 'friends': return 'Friends · People you follow';
    default: return 'Global · All clbhouz members';
  }
}

// --- Main component ---
interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
  country?: string | null;
  scopeSelector?: React.ReactNode;
  seasonColor?: string;
}

export function LowestHandicapLeaderboard({ scope, clubId, clubName, country, scopeSelector, seasonColor }: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();
  const [scrollTop, setScrollTop] = useState(0);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScroll = useRef(false);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useLowestHandicapLeaderboard({
    scope,
    clubId: scope === 'club' ? clubId : undefined,
    country: scope === 'country' ? country : undefined,
  });

  const allEntries = useMemo(
    () => data?.pages.flatMap(page => page.entries) ?? [],
    [data?.pages]
  );

  // Scroll tracking for virtualization
  useEffect(() => {
    const handleScroll = () => {
      const rootEl = document.getElementById('root');
      const currentScroll = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
      setScrollTop(currentScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    const rootEl = document.getElementById('root');
    rootEl?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      rootEl?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll restore
  useEffect(() => {
    if (hasRestoredScroll.current || allEntries.length === 0) return;
    const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
    if (savedScroll) {
      hasRestoredScroll.current = true;
      requestAnimationFrame(() => {
        const rootEl = document.getElementById('root');
        const scrollTarget = parseInt(savedScroll);
        if (rootEl) rootEl.scrollTop = scrollTarget;
        window.scrollTo({ top: scrollTarget, behavior: 'instant' as ScrollBehavior });
        sessionStorage.removeItem(STORAGE_KEY_SCROLL);
      });
    }
  }, [allEntries.length]);

  // Infinite scroll observer
  const isFetchingRef = useRef(isFetchingNextPage);
  isFetchingRef.current = isFetchingNextPage;

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { rootMargin: '600px', threshold: 0 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  // Save scroll on entry click
  const handleEntryClick = useCallback(() => {
    const rootEl = document.getElementById('root');
    const scrollY = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
    sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
  }, []);

  // Find current user's rank
  const currentUserEntry = allEntries.find(e => e.user_id === user?.id);
  const userRank = currentUserEntry?.rank;
  const topHandicap = allEntries.length > 0 ? (allEntries[0] as any).handicap_index : null;
  const userHandicap = currentUserEntry ? (currentUserEntry as any).handicap_index : null;

  // Scope label
  const scopeLabel = getScopeLabel(scope, country, clubName);
  const scopeContext = getScopeContext(scope, country, clubName);

  // Virtualization
  const virtualizedContent = useMemo(() => {
    if (allEntries.length <= VIRTUALIZATION_THRESHOLD) return null;
    const containerOffset = listContainerRef.current?.offsetTop ?? 0;
    const relativeScroll = Math.max(0, scrollTop - containerOffset);
    const viewportHeight = window.innerHeight;
    const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIndex = Math.min(allEntries.length, startIndex + visibleCount);
    const totalHeight = allEntries.length * ROW_HEIGHT;
    const offsetY = startIndex * ROW_HEIGHT;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [allEntries.length, scrollTop]);

  // Initial error
  if (isError && allEntries.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        {scopeSelector}
        <InitialErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return <HandicapLeaderboardSkeleton />;
  }

  if (!isError && allEntries.length === 0) {
    return (
      <div className="space-y-4">
        {scopeSelector}
        <EmptyState scope={scope} clubName={clubName} country={country} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Podium */}
      {allEntries.length >= 3 && (
        <HandicapPodium
          entries={allEntries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
        />
      )}

      {/* Scope Selector */}
      {scopeSelector}

      {/* Context label */}
      <p className="text-center" style={{ fontSize: 11, color: '#94A3B8' }}>
        {scopeContext}
      </p>

      {/* Insight Banner */}
      <HandicapInsightBanner
        userRank={userRank}
        topHandicap={topHandicap}
        userHandicap={userHandicap}
        userId={user?.id}
        scope={scope}
        scopeLabel={scopeLabel}
        mode="lowest"
      />

      {/* Recent Movers Strip — placeholder until RPC returns movement data */}
      <HandicapMoverStrip entries={allEntries} currentUserId={user?.id} />

      {/* Leaderboard eyebrow */}
      <p
        className="font-bold uppercase"
        style={{ fontSize: 10, letterSpacing: '0.12em', color: '#F5A623' }}
      >
        Rankings
      </p>

      {/* Rankings List */}
      {allEntries.length > 0 && (
        <div ref={listContainerRef} onClick={handleEntryClick}>
          {virtualizedContent ? (
            <div style={{ height: virtualizedContent.totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${virtualizedContent.offsetY}px)`, position: 'absolute', width: '100%' }}>
                {allEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map(entry => (
                  <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} />
                ))}
              </div>
            </div>
          ) : (
            allEntries.map(entry => (
              <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} />
            ))
          )}
        </div>
      )}

      {/* Sentinel + loading */}
      {hasNextPage && !isError && (
        <div ref={sentinelRef}>
          {isFetchingNextPage && <HandicapLeaderboardSkeleton />}
        </div>
      )}

      {/* Inline retry */}
      {isError && !isFetchingNextPage && allEntries.length > 0 && (
        <InlineRetryCard onRetry={() => fetchNextPage()} />
      )}

      {isError && isFetchingNextPage && allEntries.length > 0 && (
        <HandicapLeaderboardSkeleton />
      )}
    </div>
  );
}
