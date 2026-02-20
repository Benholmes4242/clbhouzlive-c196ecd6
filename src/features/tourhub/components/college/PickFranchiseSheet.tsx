/**
 * PickFranchiseSheet — Bottom sheet for discovering and following college franchises.
 * Uses Vaul (Drawer) for native-feeling sheet behaviour.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useFollowedColleges, useFollowCollegeMutations } from '../../hooks/useCollegeMovers';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCollegeMediaSearch } from '@/hooks/useCollegeMediaSearch';

interface PickFranchiseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FollowBtn({
  normalizedName,
  userId,
  isFollowed,
}: {
  normalizedName: string;
  userId: string | undefined;
  isFollowed: boolean;
}) {
  const { follow, unfollow } = useFollowCollegeMutations(userId);
  const isPending = follow.isPending || unfollow.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    if (isFollowed) {
      await unfollow.mutateAsync(normalizedName);
    } else {
      await follow.mutateAsync(normalizedName);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending || !userId}
      style={{
        fontSize: '13px',
        fontWeight: 600,
        borderRadius: '20px',
        padding: '6px 16px',
        border: isFollowed ? 'none' : '1px solid rgba(0,0,0,0.12)',
        background: isFollowed ? 'rgba(0,0,0,0.85)' : 'white',
        color: isFollowed ? 'white' : 'hsl(var(--foreground))',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      {isFollowed ? 'Following ✓' : 'Follow'}
    </button>
  );
}

export function PickFranchiseSheet({ open, onOpenChange }: PickFranchiseSheetProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: searchResults } = useCollegeMediaSearch(searchQuery);

  // Single query for follow state — shared across all rows
  const { data: followed } = useFollowedColleges(user?.id);
  const followedSet = useMemo(
    () => new Set(followed?.map(f => f.normalized_name) || []),
    [followed]
  );

  // Top 20 colleges by earnings for "Popular" list
  const popularColleges = useMemo(() => {
    if (!allStats?.length) return [];
    return [...allStats]
      .sort((a, b) => b.earnings_total - a.earnings_total)
      .slice(0, 20);
  }, [allStats]);

  const isSearching = searchQuery.length >= 2;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle
            style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}
            className="text-foreground text-center"
          >
            Pick Your Franchise
          </DrawerTitle>
          <p
            className="text-center m-0"
            style={{ fontSize: '13px', color: 'rgba(0,0,0,0.45)', marginTop: '2px' }}
          >
            Follow a college and join the rivalry
          </p>
        </DrawerHeader>

        {/* Search input */}
        <div className="px-4 pt-4 pb-2">
          <div
            className="flex items-center gap-2 bg-muted rounded-xl px-3"
            style={{ height: '44px' }}
          >
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontSize: '15px' }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(85dvh - 200px)' }}>
          {/* Section label */}
          {!isSearching && (
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase' as const,
                color: 'rgba(0,0,0,0.35)',
                marginBottom: '8px',
                marginTop: '4px',
              }}
            >
              Popular Franchises
            </p>
          )}

          {/* Search results */}
          {isSearching && searchResults ? (
            searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" style={{ fontSize: '14px' }}>
                No colleges found for "{searchQuery}"
              </p>
            ) : (
              searchResults.map((college) => {
                const stats = allStats?.find(s => s.normalized_name === college.normalized_name);
                return (
                  <CollegeRow
                    key={college.normalized_name}
                    normalizedName={college.normalized_name}
                    displayName={college.short_name || college.college_name}
                    logoUrl={college.logo_url}
                    playerCount={stats?.player_count ?? 0}
                    userId={user?.id}
                    isFollowed={followedSet.has(college.normalized_name)}
                  />
                );
              })
            )
          ) : (
            /* Popular list */
            popularColleges.map((stats) => {
              const media = collegeMap?.get(stats.normalized_name);
              const displayName = media?.short_name || media?.college_name || stats.normalized_name;
              return (
                <CollegeRow
                  key={stats.normalized_name}
                  normalizedName={stats.normalized_name}
                  displayName={displayName}
                  logoUrl={media?.logo_url ?? null}
                  playerCount={stats.player_count}
                  userId={user?.id}
                  isFollowed={followedSet.has(stats.normalized_name)}
                />
              );
            })
          )}

          {/* View All link */}
          <button
            onClick={() => {
              onOpenChange(false);
              navigate('/tourhub/college-golf');
            }}
            className="w-full text-center py-4 bg-transparent border-none cursor-pointer"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'hsl(var(--primary))',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              marginTop: '8px',
            }}
          >
            View All Franchises →
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CollegeRow({
  normalizedName,
  displayName,
  logoUrl,
  playerCount,
  userId,
  isFollowed,
}: {
  normalizedName: string;
  displayName: string;
  logoUrl: string | null;
  playerCount: number;
  userId: string | undefined;
  isFollowed: boolean;
}) {
  return (
    <div
      className="flex items-center"
      style={{
        padding: '12px 0',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
        gap: '12px',
      }}
    >
      {/* Logo */}
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={displayName}
          className="object-contain rounded-full flex-shrink-0"
          style={{ width: '32px', height: '32px' }}
        />
      ) : (
        <div
          className="flex-shrink-0 bg-muted rounded-full flex items-center justify-center"
          style={{ width: '32px', height: '32px' }}
        >
          <span className="text-xs font-semibold text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Name + player count */}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-foreground truncate" style={{ fontSize: '15px', fontWeight: 600 }}>
          {displayName}
        </p>
        <p className="m-0" style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)' }}>
          {playerCount} {playerCount === 1 ? 'pro' : 'pros'} on tour
        </p>
      </div>

      {/* Follow button */}
      <FollowBtn normalizedName={normalizedName} userId={userId} isFollowed={isFollowed} />
    </div>
  );
}
