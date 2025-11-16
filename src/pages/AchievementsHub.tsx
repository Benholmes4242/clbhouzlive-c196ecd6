import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useRecentAchievements } from '@/hooks/useRecentAchievements';
import { useUserXPOverview } from '@/hooks/useUserXPOverview';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { useSeasonLeaderboard } from '@/hooks/useSeasonLeaderboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Globe, Trophy, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAchievementSharing } from '@/hooks/useAchievementSharing';
import { formatDistanceToNow } from 'date-fns';
import ClbhouzPageSpinner from '@/components/ui/ClbhouzPageSpinner';
import { getSeasonLevel } from '@/utils/seasonLevels';
import { SeasonTrophyCabinet } from '@/components/achievements/SeasonTrophyCabinet';

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
  home_club: string | null;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  skill: '🎯',
  exploration: '🌍',
  social: '👥',
};

const AchievementsHub = () => {
  const { username } = useParams<{ username?: string }>();
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { prepareAchievementShare } = useAchievementSharing();

  // Fetch user profile by username or use current user
  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile | null>({
    queryKey: ['profile-by-username', username, user?.id],
    queryFn: async () => {
      if (!username && !user?.id) return null;

      if (username) {
        const { data, error } = await supabase
          .from('user_profiles' as any)
          .select('id, username, display_name, profile_photo_url, home_club')
          .eq('username', username)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        return data as unknown as UserProfile;
      } else {
        const { data, error } = await supabase
          .from('user_profiles' as any)
          .select('id, username, display_name, profile_photo_url, home_club')
          .eq('id', user!.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }
        return data as unknown as UserProfile;
      }
    },
    enabled: !!username || !!user?.id,
  });

  const userId = profile?.id;
  const isOwnProfile = user?.id === userId;

  // Fetch all data
  const { data: achievements } = useUserAchievements(userId);
  const { data: recentAchievements } = useRecentAchievements(userId, 10);
  const xpOverview = useUserXPOverview(userId);
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(userId, currentSeason?.id);
  const { data: leaderboard = [] } = useSeasonLeaderboard(currentSeason?.id, 20);
  const { totalCoursesPlayed, countriesPlayed, top100Progress, isLoading: isLoadingSummary } =
    useUserCourseSummary(userId || '');

  // Calculate stats
  const totalTop100Played = useMemo(() => {
    if (!top100Progress) return 0;
    return top100Progress.reduce((sum, list) => sum + list.played, 0);
  }, [top100Progress]);

  const unlockedAchievements = useMemo(() => {
    return achievements?.filter((a) => a.isUnlocked) || [];
  }, [achievements]);

  // Filter state
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredAchievements = useMemo(() => {
    if (!achievements) return [];
    let filtered = [...achievements];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }

    if (statusFilter === 'unlocked') {
      filtered = filtered.filter((a) => a.isUnlocked);
    } else if (statusFilter === 'locked') {
      filtered = filtered.filter((a) => !a.isUnlocked);
    }

    return filtered;
  }, [achievements, categoryFilter, statusFilter]);

  if (isLoadingProfile || isLoadingSummary) {
    return <ClbhouzPageSpinner />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Golfer not found</h2>
          <p className="text-muted-foreground">This golfer doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(110,146,119,0.1),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Left: Avatar & Identity */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
                    🏌️
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold">{profile.display_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.home_club && (
                  <p className="text-sm text-muted-foreground mt-1">{profile.home_club}</p>
                )}
              </div>
            </div>

            {/* Right: XP & Level */}
            {xpOverview && (
              <div className="flex-1 space-y-4">
                {/* Global XP & Level */}
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Global Level</div>
                      <div className="text-2xl font-bold" style={{ color: xpOverview.currentLevelColor }}>
                        {xpOverview.currentLevel} Ring
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Total XP</div>
                      <div className="text-2xl font-bold">{xpOverview.totalXP.toLocaleString()}</div>
                    </div>
                  </div>

                  {xpOverview.nextLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress to {xpOverview.nextLevel.name}</span>
                        <span className="font-medium">{xpOverview.nextLevel.remainingXP.toLocaleString()} XP to go</span>
                      </div>
                      <Progress value={xpOverview.nextLevel.progressPercent} className="h-3" />
                    </div>
                  )}

                  {!xpOverview.nextLevel && (
                    <div className="text-center text-sm text-muted-foreground">
                      🏆 Maximum level reached!
                    </div>
                  )}
                </div>

                {/* Season XP & Level */}
                {currentSeason && (
                  <div className="bg-gradient-to-br from-primary/10 via-card/50 to-card/50 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs text-primary uppercase font-semibold mb-1">Current Season</div>
                        <div className="text-lg font-bold">{currentSeason.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {getSeasonLevel(seasonXP?.total_xp || 0)}
                        </div>
                      </div>
                      {seasonXP?.season_rank && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">#{seasonXP.season_rank}</div>
                          <div className="text-xs text-muted-foreground">Season Rank</div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Season XP</span>
                        <span className="font-medium">{(seasonXP?.total_xp || 0).toLocaleString()} XP</span>
                      </div>
                      <Progress value={Math.min(100, ((seasonXP?.total_xp || 0) / 2000) * 100)} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        Keep earning XP to climb the seasonal leaderboard!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-center md:text-left text-muted-foreground mt-6 max-w-2xl">
            {isOwnProfile
              ? "Your Golf Journey across courses, Top 100 lists, and achievements in one place."
              : `${profile.display_name || profile.username}'s golf journey and achievements.`}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Global Journey Snapshot */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Golf Journey Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Courses Played */}
            <div
              onClick={() => navigate(`/profile/${profile.username}?tab=courses`)}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold">{totalCoursesPlayed}</div>
              </div>
              <div className="text-sm text-muted-foreground">Courses Played</div>
            </div>

            {/* Countries */}
            <div
              onClick={() => navigate(`/profile/${profile.username}?tab=courses`)}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold">{countriesPlayed}</div>
              </div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>

            {/* Top 100 Total */}
            <div
              onClick={() => navigate('/top100')}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold">{totalTop100Played}</div>
              </div>
              <div className="text-sm text-muted-foreground">Top 100 Courses Played</div>
            </div>
          </div>
        </section>

        {/* Top 100 Progress Overview */}
        {top100Progress && top100Progress.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Top 100 Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {top100Progress.map((list) => (
                <div
                  key={list.listSlug}
                  onClick={() => navigate(`/top100/${list.listSlug}`)}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 cursor-pointer hover:bg-card/70 transition-all hover:shadow-lg"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-2">Top 100 List</div>
                  <h3 className="font-semibold mb-4 text-lg">{list.listName}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {list.played}/{list.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round((list.played / list.total) * 100)}%
                    </div>
                  </div>
                  <Progress value={(list.played / list.total) * 100} className="mt-3 h-2" />
                </div>
              ))}
            </div>
            {isOwnProfile && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Many exploration achievements are tied to your Top 100 progress.
              </p>
            )}
          </section>
        )}

        {/* Season Trophy Cabinet */}
        {userId && (
          <section>
            <SeasonTrophyCabinet userId={userId} isOwnProfile={isOwnProfile} />
          </section>
        )}

        {/* Season Leaderboard */}
        {currentSeason && leaderboard.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">This Season's Leaderboard</h2>
              <div className="text-sm text-muted-foreground">
                {currentSeason.name}
              </div>
            </div>
            
            <div className="space-y-2">
              {leaderboard.map((row) => (
                <button
                  key={row.user_id}
                  className="w-full flex items-center justify-between rounded-xl bg-card/50 border border-border/50 px-4 py-3 hover:bg-card/70 transition-all text-left group"
                  onClick={() => navigate(`/profile/${row.profile?.username || row.user_id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`text-sm font-bold w-8 text-center ${
                      row.season_rank === 1 ? 'text-yellow-500' :
                      row.season_rank === 2 ? 'text-gray-400' :
                      row.season_rank === 3 ? 'text-orange-600' :
                      'text-muted-foreground'
                    }`}>
                      #{row.season_rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {row.profile?.profile_photo_url ? (
                        <img
                          src={row.profile.profile_photo_url}
                          alt={row.profile.display_name || row.profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {(row.profile?.display_name?.[0] || row.profile?.username?.[0] || 'G').toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name & Club */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {row.profile?.display_name || row.profile?.username || 'Golfer'}
                      </p>
                      {row.profile?.home_club && (
                        <p className="text-xs text-muted-foreground truncate">
                          {row.profile.home_club}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">
                      {row.total_xp.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Season XP
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recent Achievements Activity */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          {recentAchievements && recentAchievements.length > 0 ? (
            <div className="space-y-3">
              {recentAchievements.map((achievement) => {
                const emoji = CATEGORY_EMOJIS[achievement.category] || '🏆';
                return (
                  <div
                    key={achievement.achievementId}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:bg-card/70 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>
                            Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
                          </span>
                          {achievement.points > 0 && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              +{achievement.points} XP
                            </span>
                          )}
                        </div>
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => prepareAchievementShare(achievement)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">No achievements... yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Play more rounds, leave course reviews, and explore Top 100 lists to start unlocking milestones.
              </p>
            </div>
          )}
        </section>

        {/* Achievement Catalogue */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold">All Achievements</h2>
            <div className="flex flex-wrap gap-2">
              {/* Category Filter */}
              <div className="flex gap-1 bg-card/50 rounded-lg p-1 border border-border/50">
                {['all', 'skill', 'exploration', 'social'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex gap-1 bg-card/50 rounded-lg p-1 border border-border/50">
                {['all', 'unlocked', 'locked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const emoji = CATEGORY_EMOJIS[achievement.category] || '🏆';
              return (
                <div
                  key={achievement.achievementId}
                  className={`bg-card/50 backdrop-blur-sm border rounded-xl p-5 transition-all ${
                    achievement.isUnlocked
                      ? 'border-primary/30 shadow-lg shadow-primary/5 hover:shadow-primary/10'
                      : 'border-border/50 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base">{achievement.name}</h3>
                      {achievement.points > 0 && (
                        <div className="inline-block px-2 py-0.5 mt-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          +{achievement.points} XP
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        achievement.isUnlocked
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {achievement.isUnlocked
                        ? achievement.unlockedAt
                          ? `Unlocked ${formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}`
                          : 'Unlocked'
                        : 'Locked'}
                    </span>
                    {isOwnProfile && achievement.isUnlocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => prepareAchievementShare(achievement)}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No achievements match your filters.
            </div>
          )}
        </section>

        {/* Stats Summary */}
        <section className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {unlockedAchievements.length} of {achievements?.length || 0} achievements unlocked
              </h3>
              <p className="text-sm text-muted-foreground">
                Keep exploring courses and engaging with the community to unlock more milestones!
              </p>
            </div>
            {isOwnProfile && (
              <Button onClick={() => navigate('/courses')} variant="default">
                Explore Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AchievementsHub;
