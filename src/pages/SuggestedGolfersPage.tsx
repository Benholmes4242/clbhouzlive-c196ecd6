import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useFollowUserState } from '@/hooks/useFollowUserState';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterType = 'suggested' | 'popular' | 'low_handicap';

type Golfer = {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  bio?: string;
  followersCount: number;
  isVerified?: boolean;
};

const SuggestedGolfersPage = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { users, loading: usersLoading } = useSuggestedUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('suggested');

  const isLoading = sessionLoading || usersLoading;

  // Let layout/auth wrapper handle redirect; don't navigate here
  if (!user && !sessionLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-6 sm:px-6 lg:px-0">
        {/* Page title */}
        <header className="mb-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Find golfers to follow
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover golfers by club, handicap and popularity, and grow your clubhouse.
          </p>
        </header>

        {/* Search + filters */}
        <section className="mb-6 space-y-3">
          {/* Search input */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search golfers by name or club"
              className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:border-border-strong focus:outline-none focus:ring-0"
            />
          </div>

          {/* Filter pills */}
          <div className="inline-flex gap-2 rounded-full bg-muted/40 p-1">
            {[
              { key: 'suggested' as FilterType, label: 'Suggested' },
              { key: 'popular' as FilterType, label: 'Popular' },
              { key: 'low_handicap' as FilterType, label: 'Low handicap' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition',
                  activeFilter === item.key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {/* Content / skeleton */}
        {isLoading ? (
          <GolfersSkeleton />
        ) : (
          <GolfersResultsGrid users={users} searchQuery={searchQuery} activeFilter={activeFilter} />
        )}
      </div>
    </div>
  );
};

const GolfersResultsGrid: React.FC<{
  users: Golfer[];
  searchQuery: string;
  activeFilter: FilterType;
}> = ({ users, searchQuery, activeFilter }) => {
  // filter by search
  const filtered = users
    .filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const name = (u.displayName || u.username || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      return name.includes(q) || bio.includes(q);
    })
    .sort((a, b) => {
      if (activeFilter === 'popular') {
        return (b.followersCount || 0) - (a.followersCount || 0);
      }
      if (activeFilter === 'low_handicap') {
        // Extract handicap from bio for sorting
        const getHandicap = (golfer: Golfer) => {
          const match = golfer.bio?.match(/HCP\s*([\d.]+)/i);
          return match ? parseFloat(match[1]) : 99;
        };
        return getHandicap(a) - getHandicap(b);
      }
      // suggested – leave as backend order
      return 0;
    });

  if (filtered.length === 0) {
    return (
      <div className="mt-8 text-center text-sm text-muted-foreground">
        No golfers found. Try another name or club.
      </div>
    );
  }

  return (
    <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((golfer) => (
        <GolferCard key={golfer.id} golfer={golfer} />
      ))}
    </div>
  );
};

const GolferCard: React.FC<{ golfer: Golfer }> = ({ golfer }) => {
  const { toggleFollow, isFollowing, isLoading: followLoading } = useFollowUserState(golfer.id);
  const navigate = useNavigate();
  const name = golfer.displayName || golfer.username;

  // Extract handicap from bio
  const handicapMatch = golfer.bio?.match(/HCP\s*([\d.]+)/i);
  const handicap = handicapMatch ? parseFloat(handicapMatch[1]) : null;

  // Extract club from bio (simple heuristic)
  const clubMatch = golfer.bio?.match(/(?:Member at|Club:|@)\s*([^•|]+)/i);
  const club = clubMatch ? clubMatch[1].trim() : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking the button
    if (!(e.target as HTMLElement).closest('button')) {
      navigate(`/profile/${golfer.username.replace('@', '')}`);
    }
  };

  return (
    <article 
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs cursor-pointer hover:shadow-sm transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex gap-3 p-3">
        {/* Squircle avatar */}
        <div className="flex-shrink-0">
          <img
            src={golfer.profileImage ?? '/placeholder-avatar.png'}
            alt={name}
            className="h-20 w-16 rounded-[24%] object-cover bg-muted"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder-avatar.png';
            }}
          />
        </div>

        {/* Text block */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {name}
          </h3>
          {club && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {club}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {handicap != null && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                Hcp {handicap.toFixed(1)}
              </span>
            )}
            {typeof golfer.followersCount === 'number' && golfer.followersCount > 0 && (
              <span className="text-[11px]">
                {golfer.followersCount} follower{golfer.followersCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Follow button footer */}
      <div className="border-t border-border bg-muted/40 px-3 py-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow();
          }}
          disabled={followLoading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition disabled:opacity-50"
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </article>
  );
};

const GolfersSkeleton = () => (
  <div className="mt-4 space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex gap-3 p-3">
            <div className="h-20 w-16 rounded-[24%] bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
              <div className="mt-2 flex gap-2">
                <div className="h-4 w-14 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-10 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-8 bg-muted/40" />
        </div>
      ))}
    </div>
  </div>
);

export default SuggestedGolfersPage;
