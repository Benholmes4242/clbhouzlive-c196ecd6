import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useTop100Lists } from '@/hooks/useTop100Lists';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import GolfClubView from '@/components/golf-club/GolfClubView';
import { useCourseTop100Memberships } from '@/hooks/useCourseTop100Memberships';
import { FriendsTop100Panel } from '@/components/top100/FriendsTop100Panel';
import { Top100AchievementsBlock } from '@/components/top100/Top100AchievementsBlock';

type SortMode = 'rank' | 'alphabetical' | 'country';
type FilterMode = 'all' | 'played' | 'unplayed';

const Top100List = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { data: lists } = useTop100Lists();
  const { data: progressData } = useTop100ProgressForUser(session?.user?.id);
  const { data: userActivity } = useUserCourseActivity(session?.user?.id);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showFriends, setShowFriends] = useState(false);

  // Find the current list
  const currentList = lists?.find((l) => l.slug === slug);

  // Fetch courses for this list
  const { data: courses, isLoading } = useQuery({
    queryKey: ['top100-list-courses', currentList?.id],
    enabled: !!currentList?.id,
    queryFn: async () => {
      if (!currentList?.id) return [];

      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select(`
          rank,
          course_id,
          golf_courses!inner (
            id,
            name,
            country,
            sub_country,
            region,
            thumbnail_image,
            continent
          )
        `)
        .eq('list_id', currentList.id)
        .order('rank', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.golf_courses,
        rank: item.rank,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get user's played courses
  const playedCourseIds = useMemo(() => {
    return new Set((userActivity || []).map((a) => a.course_id));
  }, [userActivity]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    if (!courses) return [];

    let filtered = [...courses];

    // Apply filter
    if (filterMode === 'played') {
      filtered = filtered.filter((c) => playedCourseIds.has(c.id));
    } else if (filterMode === 'unplayed') {
      filtered = filtered.filter((c) => !playedCourseIds.has(c.id));
    }

    // Apply friends filter (placeholder for now)
    if (showFriends) {
      // TODO: filter by friends who have played these courses
      // For now, just return all courses
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'rank':
          return a.rank - b.rank;
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'country':
          return a.country.localeCompare(b.country);
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, sortMode, filterMode, playedCourseIds, showFriends]);

  const listProgress = progressData?.lists?.find((p) => p.listId === currentList?.id);
  const playedCount = listProgress?.played || 0;
  const totalCount = listProgress?.total || 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClubhouseHeaderNew />
        <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-lg w-1/3" />
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />

      <main className="px-4 md:container md:mx-auto md:px-0 py-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/top100')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Top 100 Hub
          </Button>

          {/* Hero Header */}
          <section className="mb-6 rounded-3xl border border-slate-800/70 bg-slate-950/80 px-4 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.55)] sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: title + description */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-2.5 py-1">
                  <span className="text-xs">🏆</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-300">
                    Top 100 · {currentList?.short_label ?? currentList?.name}
                  </span>
                </div>

                <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
                  {currentList?.name}
                </h1>

                {currentList?.description && (
                  <p className="text-xs text-slate-400">
                    {currentList.description}
                  </p>
                )}
              </div>

              {/* Right: progress pill for this list */}
              {session && (
                <div className="w-full max-w-[260px] rounded-2xl bg-slate-900/80 px-3 py-2.5 text-xs text-slate-100 sm:w-auto">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Your journey in this list</span>
                    <span className="text-[11px] text-slate-300">
                      {playedCount} / {totalCount} played
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary-accent"
                      style={{
                        width: `${Math.min(
                          100,
                          (playedCount / Math.max(totalCount, 1)) * 100,
                        ).toFixed(1)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Friends on this list */}
          {currentList && session && (
            <FriendsTop100Panel listId={currentList.id} listName={currentList.name} />
          )}

          {/* Achievements tied to this list */}
          {currentList && session && (
            <Top100AchievementsBlock listId={currentList.id} />
          )}

          {/* Controls */}
          <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                <SelectTrigger className="w-[140px] h-9 bg-card border-border/50 text-sm">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="played">Played</SelectItem>
                  <SelectItem value="unplayed">Unplayed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border/50">
                <Switch
                  id="show-friends"
                  checked={showFriends}
                  onCheckedChange={setShowFriends}
                />
                <Label htmlFor="show-friends" className="text-xs font-medium cursor-pointer">
                  Friends only
                </Label>
              </div>
            </div>

            {/* Right: Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-[140px] h-9 bg-card border-border/50 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="alphabetical">A → Z</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Course List */}
          <div className="space-y-2">
            {filteredAndSortedCourses.map((course) => (
              <CourseListItem
                key={course.id}
                course={course}
                isPlayed={playedCourseIds.has(course.id)}
                onClick={() => setSelectedCourseId(course.id)}
              />
            ))}

            {filteredAndSortedCourses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No courses match your current filter
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Course Detail Modal */}
      {selectedCourseId && (
        <GolfClubView
          courseId={selectedCourseId}
          onClose={() => setSelectedCourseId(null)}
        />
      )}
    </div>
  );
};

// Course List Item Component
interface CourseListItemProps {
  course: any;
  isPlayed: boolean;
  onClick: () => void;
}

const CourseListItem: React.FC<CourseListItemProps> = React.memo(({ course, isPlayed, onClick }) => {
  const { data: memberships } = useCourseTop100Memberships(course.id);

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 px-3 py-2.5 text-xs text-slate-100 transition-colors hover:border-slate-200/40 hover:bg-slate-900 cursor-pointer"
    >
      {/* Rank */}
      <div className="flex w-10 flex-col items-center justify-center">
        <span className="text-sm font-semibold text-slate-50">
          #{course.rank}
        </span>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-50">
            {course.name}
          </span>
          {course.country && (
            <span className="truncate text-[11px] text-slate-400">
              · {course.country}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Top 100 badges */}
          {memberships && memberships.length > 0 && (
            <div className="flex items-center gap-1">
              {memberships.map((m) => (
                <span
                  key={m.list_id}
                  className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                >
                  {m.short_label} #{m.rank}
                </span>
              ))}
            </div>
          )}
          
          {/* Status badges */}
          {isPlayed && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
              Played by you
            </span>
          )}
        </div>
      </div>

      {/* Right: chevron */}
      <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
        <span className="text-[11px] text-slate-400 group-hover:text-slate-200">
          View →
        </span>
      </div>
    </div>
  );
});

export default Top100List;
