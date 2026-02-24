import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import { useLowestHandicapLeaderboard } from '@/hooks/leaderboards';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { formatHcp } from '@/lib/formatHcp';
import { HandicapPodium } from './HandicapPodium';
import { HandicapInsightBanner } from './HandicapInsightBanner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LeaderboardRow,
  LeaderboardEmpty,
  LeaderboardLoading,
} from '../shared';
import type { LeaderboardScope } from '@/types/leaderboards';
import { cn } from '@/lib/utils';

// --- Constants ---
const ROW_HEIGHT = 72; // 64px row (py-3 + h-10 avatar) + 8px gap (space-y-2)
const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN = 8;
const STORAGE_KEY_SCROLL = 'handicap-leaderboard-scroll';

// Metallic palette matching MedalBadge
const RANK_COLORS: Record<number, string> = {
  1: '#C1A84C',
  2: '#B8C6C9',
  3: '#8B7355',
};

// --- Helper components (module-level) ---
function HandicapLeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
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
    <div className="py-4 px-4">
      <button
        onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-alt text-sm text-muted-foreground hover:bg-muted/30 active:scale-[0.98] transition-all"
      >
        Couldn't load more entries · Tap to retry
      </button>
    </div>
  );
}

function InitialErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <p className="text-muted-foreground text-sm">Something went wrong loading the leaderboard.</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.97] transition-all"
      >
        Try again
      </button>
    </div>
  );
}

interface LowestHandicapLeaderboardProps {
  scope: LeaderboardScope;
  clubId?: string | null;
  clubName?: string | null;
  country?: string | null;
  scopeSelector?: React.ReactNode;
}

export function LowestHandicapLeaderboard({ scope, clubId, clubName, country, scopeSelector }: LowestHandicapLeaderboardProps) {
  const { user } = useSupabaseSession();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  // Refs
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

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const rootEl = document.getElementById('root');
      const currentScroll = (rootEl && rootEl.scrollTop > 0) ? rootEl.scrollTop : window.scrollY;
      setShowScrollTop(currentScroll > 400);
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

  // Render entry helper
  const renderEntry = (entry: any) => (
    <div key={entry.user_id} onClick={handleEntryClick}>
      <LeaderboardRow
        rank={entry.rank}
        userId={entry.user_id}
        displayName={entry.display_name || 'Unknown'}
        profilePhotoUrl={entry.avatar_url}
        isCurrentUser={entry.user_id === user?.id}
      >
        <div className="text-right">
          <div
            className="text-3xl font-bold"
            style={{ color: RANK_COLORS[entry.rank] || 'hsl(var(--muted-foreground))' }}
          >
            {formatHcp(entry.handicap_index)}
          </div>
        </div>
      </LeaderboardRow>
    </div>
  );

  // Initial error
  if (isError && allEntries.length === 0 && !isLoading) {
    return (
      <div className="px-4 space-y-4">
        {scopeSelector}
        <InitialErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4">
        <LeaderboardLoading />
      </div>
    );
  }

  if (!isError && allEntries.length === 0) {
    return (
      <div className="px-4 space-y-4">
        {scopeSelector}
        <LeaderboardEmpty
          title={scope === 'club' ? "No handicaps from this club yet" : "No handicaps recorded"}
          description={
            scope === 'club' && clubName
              ? `Invite your club mates from ${clubName} to join!`
              : "Add your handicap to your profile to appear here!"
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Podium for Top 3 */}
      {allEntries.length >= 3 && (
        <HandicapPodium
          entries={allEntries.slice(0, 3)}
          currentUserId={user?.id}
          mode="lowest"
        />
      )}

      {/* Scope Selector */}
      {scopeSelector && (
        <div className="py-4">
          {scopeSelector}
        </div>
      )}

      {/* Insight Banner */}
      <HandicapInsightBanner userRank={userRank} mode="lowest" />

      {/* Rankings List */}
      {allEntries.length > 0 && (
        <div ref={listContainerRef} className="space-y-2">
          {virtualizedContent ? (
            <div style={{ height: virtualizedContent.totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${virtualizedContent.offsetY}px)`, position: 'absolute', width: '100%' }}>
                {allEntries.slice(virtualizedContent.startIndex, virtualizedContent.endIndex).map(entry =>
                  renderEntry(entry)
                )}
              </div>
            </div>
          ) : (
            allEntries.map(entry => renderEntry(entry))
          )}
        </div>
      )}

      {/* Sentinel + loading skeleton */}
      {hasNextPage && !isError && (
        <div ref={sentinelRef}>
          {isFetchingNextPage && <HandicapLeaderboardSkeleton />}
        </div>
      )}

      {/* Inline retry on pagination error */}
      {isError && !isFetchingNextPage && allEntries.length > 0 && (
        <InlineRetryCard onRetry={() => fetchNextPage()} />
      )}

      {/* Loading indicator during retry */}
      {isError && isFetchingNextPage && allEntries.length > 0 && (
        <HandicapLeaderboardSkeleton />
      )}

      {/* Scroll-to-top FAB */}
      <button
        onClick={() => {
          const rootEl = document.getElementById('root');
          if (rootEl) rootEl.scrollTop = 0;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={cn(
          "fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full",
          "bg-foreground/80 text-background shadow-lg backdrop-blur-sm",
          "flex items-center justify-center",
          "transition-all duration-300 ease-out active:scale-[0.95]",
          showScrollTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
}
