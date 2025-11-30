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
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import CountryFlag from '@/components/ui/country-flag';
import GolfClubView from '@/components/golf-club/GolfClubView';
import Top100Pills from '@/components/courses/Top100Pills';
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

  const getRegionBackground = (slug: string) => {
    switch (slug) {
      case 'global-top-100':
        return '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png';
      case 'gb-i-top-100':
        return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&h=400&fit=crop';
      case 'usa-top-100':
        return 'https://images.unsplash.com/photo-1629048821995-e30a7ba7f063?w=1200&h=400&fit=crop';
      case 'europe-top-100':
        return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=400&fit=crop';
      default:
        return '';
    }
  };

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
          {/* Hero Header */}
          <div
            className="relative h-64 rounded-2xl overflow-hidden"
            style={{
              backgroundImage: `url(${getRegionBackground(slug || '')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
            
            <div className="relative h-full flex flex-col justify-between p-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/top100')}
                className="self-start text-foreground hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Button>

              <div className="space-y-3">
                <h1 className="font-display text-4xl font-bold text-foreground">
                  {currentList?.name}
                </h1>
                {currentList?.description && (
                  <p className="text-foreground/90 text-lg">{currentList.description}</p>
                )}
                {session && (
                  <>
                    <p className="text-foreground/90 text-sm font-medium">
                      You've played {playedCount} of {totalCount} courses in this list.
                    </p>
                    <div className="h-2 w-full max-w-md rounded-full bg-white/20 backdrop-blur-sm overflow-hidden">
                      <div
                        className="h-full bg-primary-accent transition-all duration-300"
                        style={{ width: `${(playedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Friends on this list */}
          {currentList && session && (
            <FriendsTop100Panel listId={currentList.id} listName={currentList.name} />
          )}

          {/* Achievements tied to this list */}
          {currentList && session && (
            <Top100AchievementsBlock listId={currentList.id} />
          )}

          {/* Controls */}
          <div className="space-y-4">
            {/* Sort & Filter */}
            <div className="flex flex-wrap gap-3">
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger className="w-[180px] bg-card border-border/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="alphabetical">A → Z</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                <SelectTrigger className="w-[180px] bg-card border-border/50">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="played">Played</SelectItem>
                  <SelectItem value="unplayed">Unplayed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Friends Only Toggle */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
              <Switch
                id="show-friends"
                checked={showFriends}
                onCheckedChange={setShowFriends}
              />
              <Label htmlFor="show-friends" className="text-sm font-medium cursor-pointer">
                Show Friends Only
              </Label>
            </div>
          </div>

          {/* Course List */}
          <div className="space-y-3">
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
      className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-12 text-center">
        <span className="text-2xl font-bold text-primary">#{course.rank}</span>
      </div>

      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden">
        <img
          src={course.thumbnail_image || '/placeholder.svg'}
          alt={course.name}
          className="w-full h-full object-cover"
        />
        {memberships && memberships.length > 0 && (
          <div className="absolute top-1 left-1">
            <Top100Pills memberships={memberships} variant="overlay" size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {course.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <CountryFlag country={course.country} size="sm" />
          <span className="text-sm text-muted-foreground truncate">
            {course.country}
            {course.sub_country && `, ${course.sub_country}`}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isPlayed ? (
          <div className="flex items-center gap-1 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Played</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Circle className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
});

export default Top100List;
