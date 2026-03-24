import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Target } from 'lucide-react';

import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp, getHandicapStatusLabel, getHandicapStatusColor, getHandicapBadgeStyle } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
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
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
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
    <div className="flex flex-col items-center justify-center py-12 px-5 text-center space-y-4">
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
function EmptyState({ scope, clubName }: { scope: string; clubName?: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center space-y-4">
      <div className="flex items-center justify-center" style={{ opacity: 0.2 }}>
        <Target size={48} className="text-muted-foreground" />
      </div>
      <p className="text-base text-muted-foreground">
        {scope === 'club' && clubName
          ? `No handicaps from ${clubName} yet. Invite your club mates!`
          : "No handicaps recorded. Add your handicap to appear here!"}
      </p>
      <Link
        to="/profile/edit"
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
        style={{ backgroundColor: 'hsl(var(--accent-amber))' }}
      >
        Add Handicap
      </Link>
    </div>
  );
}

// --- Handicap Row ---
function HandicapRow({
  entry,
  userId,
  seasonColor,
}: {
  entry: any;
  userId?: string;
  seasonColor?: string;
}) {
  const isCurrentUser = entry.user_id === userId;
  const rank = entry.rank;
  const handicap = entry.handicap_index;
  const statusLabel = getHandicapStatusLabel(handicap);
  const handicapColor = getHandicapStatusColor(handicap, seasonColor);
  const categoryBadge = getHandicapBadgeStyle(handicap, seasonColor);

  const initials = (entry.display_name || '?')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/profile/${entry.user_id}`}
      className={cn(
        'w-full py-4 flex items-center gap-3 transition-colors active:scale-[0.98]',
        isCurrentUser ? 'px-4' : 'px-5',
      )}
      style={{
        borderBottom: isCurrentUser ? undefined : '1px solid hsl(var(--border) / 0.25)',
        ...(isCurrentUser ? {
          background: 'hsl(var(--accent-amber) / 0.08)',
          border: '2px solid hsl(var(--accent-amber) / 0.2)',
          borderRadius: 12,
        } : {}),
      }}
    >
      {/* Rank */}
      <span
        style={{
          width: 24,
          fontSize: 12,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
          flexShrink: 0,
          color: rank === 1
            ? 'hsl(var(--accent-amber))'
            : 'hsl(var(--muted-foreground))',
        }}
      >
        {rank}
      </span>

      {/* Avatar */}
      <SquircleAvatar
        size={48}
        src={entry.avatar_url}
        alt={entry.display_name || 'Golfer'}
        fallback={initials}
        hideRing
      />

      {/* Name & category */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate"
          style={{ fontSize: 16 }}
        >
          {entry.display_name || 'Unknown'}
        </p>
        {statusLabel && (
          <span
            className="inline-block font-semibold uppercase tracking-wide mt-0.5 rounded-md"
            style={{
              fontSize: 11,
              background: categoryBadge.bg,
              color: categoryBadge.text,
              border: `1px solid ${categoryBadge.border}`,
              padding: '2px 6px',
            }}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {/* Handicap number */}
      <div className="flex-shrink-0">
        <span
          style={{ color: handicapColor, fontSize: 22, fontWeight: 800 }}
        >
          {formatHcp(handicap)}
        </span>
      </div>
    </Link>
  );
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
      <div className="px-3 space-y-4">
        {scopeSelector}
        <InitialErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-3">
        <HandicapLeaderboardSkeleton />
      </div>
    );
  }

  if (!isError && allEntries.length === 0) {
    return (
      <div className="px-3 space-y-4">
        {scopeSelector}
        <EmptyState scope={scope} clubName={clubName} />
      </div>
    );
  }

  return (
    <div>
      {/* Podium */}
      {allEntries.length >= 3 && (
        <HandicapPodium
          entries={allEntries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
          seasonColor={seasonColor}
        />
      )}

      {/* Scope Selector */}
      {scopeSelector && (
        <div className="mt-5">
          {scopeSelector}
        </div>
      )}

      {/* Insight Banner */}
      <div className="mt-5">
        <HandicapInsightBanner userRank={userRank} mode="lowest" />
      </div>

      {/* Rankings List */}
      {allEntries.length > 0 && (
        <div ref={listContainerRef} className="mt-4" onClick={handleEntryClick}>
          {virtualizedContent ? (
            <div style={{ height: virtualizedContent.totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${virtualizedContent.offsetY}px)`, position: 'absolute', width: '100%' }}>
                {allEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map(entry => (
                  <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} seasonColor={seasonColor} />
                ))}
              </div>
            </div>
          ) : (
            allEntries.map(entry => (
              <HandicapRow key={entry.user_id} entry={entry} userId={user?.id} seasonColor={seasonColor} />
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
