import React, { useMemo } from 'react';
import { Squircle } from '@/components/ui/squircle';
import { formatDistanceToNow } from 'date-fns';
import type { FriendCourseHit } from '@/hooks/useFriendsCourses';

interface FriendStats {
  friend_id: string;
  display_name: string;
  profile_photo_url: string | null;
  totalRounds: number;
  lastPlayedAt: string;
  top100Rounds: number;
  uniqueRegions: number;
}

interface Badge {
  icon: string;
  label: string;
}

interface FriendsActivityLeaderboardProps {
  recent: FriendCourseHit[];
  timeRange: 'week' | '30' | '90' | 'year' | 'all';
}


export const FriendsActivityLeaderboard: React.FC<FriendsActivityLeaderboardProps> = ({ recent, timeRange }) => {
  const friendStats = useMemo(() => {
    const statsMap = new Map<string, FriendStats>();

    recent.forEach((hit) => {
      const existing = statsMap.get(hit.friend_id);
      const regionKey = `${hit.course_country}-${hit.course_sub_country || 'none'}`;

      if (!existing) {
        statsMap.set(hit.friend_id, {
          friend_id: hit.friend_id,
          display_name: hit.friend_profile.display_name || hit.friend_profile.username,
          profile_photo_url: hit.friend_profile.profile_photo_url,
          totalRounds: 1,
          lastPlayedAt: hit.played_at,
          top100Rounds: hit.is_top100 ? 1 : 0,
          uniqueRegions: 1,
        });
      } else {
        existing.totalRounds += 1;
        if (new Date(hit.played_at) > new Date(existing.lastPlayedAt)) {
          existing.lastPlayedAt = hit.played_at;
        }
        if (hit.is_top100) {
          existing.top100Rounds += 1;
        }
      }
    });

    // Calculate unique regions per friend
    const friendRegions = new Map<string, Set<string>>();
    recent.forEach((hit) => {
      const regionKey = `${hit.course_country}-${hit.course_sub_country || 'none'}`;
      if (!friendRegions.has(hit.friend_id)) {
        friendRegions.set(hit.friend_id, new Set());
      }
      friendRegions.get(hit.friend_id)!.add(regionKey);
    });

    friendRegions.forEach((regions, friendId) => {
      const stats = statsMap.get(friendId);
      if (stats) {
        stats.uniqueRegions = regions.size;
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.totalRounds - a.totalRounds)
      .slice(0, 3);
  }, [recent]);

  const getBadges = (stats: FriendStats, rank: number): Badge[] => {
    const badges: Badge[] = [];

    if (rank === 0) {
      badges.push({ icon: '🥇', label: 'Leader' });
    }

    if (stats.top100Rounds >= 2) {
      badges.push({ icon: '🏅', label: 'Top 100 hunter' });
    }

    if (stats.totalRounds >= 5) {
      badges.push({ icon: '🔥', label: 'Marathon golfer' });
    }

    if (stats.uniqueRegions >= 3) {
      badges.push({ icon: '🌍', label: 'Explorer' });
    }

    return badges.slice(0, 2); // Max 2 badges
  };

  if (friendStats.length === 0) return null;

  const getTimeLabel = () => {
    switch (timeRange) {
      case 'week': return 'this week';
      case '30': return 'this month';
      case '90': return 'lately';
      case 'year': return 'this year';
      case 'all': return 'recently';
      default: return 'recently';
    }
  };

  const timeLabel = getTimeLabel();

  return (
    <section className="mt-4 rounded-2xl bg-card border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Friends activity</h3>
          <p className="text-xs text-muted-foreground">
            Who's been playing the most {timeLabel}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {friendStats.map((stats, index) => {
          const badges = getBadges(stats, index);
          const lastPlayedText = formatDistanceToNow(new Date(stats.lastPlayedAt), { addSuffix: true });

          return (
            <div key={stats.friend_id} className="flex items-center gap-3">
              <Squircle width={40} height={40}>
                <img 
                  src={stats.profile_photo_url || '/placeholder.svg'} 
                  alt={stats.display_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </Squircle>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {stats.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalRounds} {stats.totalRounds === 1 ? 'round' : 'rounds'} · Last played {lastPlayedText}
                </p>
              </div>

              {badges.length > 0 && (
                <div className="flex gap-1.5">
                  {badges.map((badge, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      <span>{badge.icon}</span>
                      <span className="hidden sm:inline">{badge.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
