import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useFollowUserState } from '@/hooks/useFollowUserState';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, UserPlus, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type FilterType = 'suggested' | 'popular' | 'low';

const SuggestedGolfersPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { users, loading } = useSuggestedUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('suggested');

  // Filter and sort users based on active filter
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.displayName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.bio && u.bio.toLowerCase().includes(query))
      );
    }

    // Apply filter sorting
    switch (activeFilter) {
      case 'popular':
        filtered.sort((a, b) => b.followersCount - a.followersCount);
        break;
      case 'low':
        // Filter out users without handicap and sort by handicap ascending
        filtered = filtered.filter(u => u.bio && /HCP/i.test(u.bio));
        break;
      case 'suggested':
      default:
        // Default: mix of followers and activity
        filtered.sort((a, b) => b.followersCount - a.followersCount);
        break;
    }

    return filtered;
  }, [users, searchQuery, activeFilter]);

  const filterChips = [
    { value: 'suggested' as FilterType, label: 'Suggested' },
    { value: 'popular' as FilterType, label: 'Popular' },
    { value: 'low' as FilterType, label: 'Low handicap' },
  ];

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-foreground mb-2">
            Find golfers to follow
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Discover new golfers, see where they play, and build your friends' courses feed.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search golfers by name or club"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setActiveFilter(chip.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeFilter === chip.value
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Golfers List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <GolferCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-semibold mb-2">No golfers found</p>
            <p className="text-sm text-muted-foreground">
              Try a different search or clear your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((golfer) => (
              <GolferCard key={golfer.id} golfer={golfer} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

interface GolferCardProps {
  golfer: {
    id: string;
    displayName: string;
    username: string;
    profileImage: string;
    bio?: string;
    followersCount: number;
    isVerified?: boolean;
  };
}

const GolferCard: React.FC<GolferCardProps> = ({ golfer }) => {
  const { toggleFollow, isFollowing, isLoading: followLoading } = useFollowUserState(golfer.id);
  const navigate = useNavigate();

  // Extract handicap from bio if present
  const handicap = golfer.bio?.match(/HCP\s*([\d.]+)/i)?.[1];

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => {
        // Only navigate if not clicking the button
        if (!(e.target as HTMLElement).closest('button')) {
          navigate(`/profile/${golfer.username.replace('@', '')}`);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={golfer.profileImage} alt={golfer.displayName} />
            <AvatarFallback>
              {golfer.displayName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground truncate">
                {golfer.displayName}
              </p>
              {golfer.isVerified && (
                <span className="text-blue-500 text-xs flex-shrink-0">✓</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {golfer.bio && handicap ? `HCP ${handicap}` : golfer.username}
              {golfer.followersCount > 0 && ` · ${golfer.followersCount} followers`}
            </p>
          </div>
        </div>

        {/* Follow Button */}
        <Button
          size="sm"
          variant={isFollowing ? 'outline' : 'default'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow();
          }}
          disabled={followLoading}
          className="flex-shrink-0 inline-flex items-center"
        >
          {isFollowing ? (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3 mr-1" />
              Follow
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

const GolferCardSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-24 flex-shrink-0" />
      </div>
    </Card>
  );
};

export default SuggestedGolfersPage;
