import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trophy, Globe, Filter, Grid3X3, List, Star } from 'lucide-react';
import { useUserCourseSummary } from '@/hooks/useUserCourseSummary';
import { cn } from '@/lib/utils';
import { AppSelect } from '@/components/ui/AppSelect';

interface ProfileCoursesTabV2Props {
  userId: string;
  isOwnProfile: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'rating' | 'name';
type FilterRegion = 'all' | 'uk' | 'europe' | 'usa' | 'asia';

interface CourseItem {
  id: string;
  name: string;
  imageUrl?: string;
  rating?: number;
  datePlayed?: string;
  country?: string;
  region?: string;
}

/**
 * ProfileCoursesTabV2 - Profile 2.0 Courses Tab
 * Features: List/Grid view toggle, filtering by region/rating/recency
 * Each tile: Image, Name, Rating, Date played, Review button
 */
const ProfileCoursesTabV2: React.FC<ProfileCoursesTabV2Props> = ({
  userId,
  isOwnProfile,
}) => {
  const navigate = useNavigate();
  const { totalCoursesPlayed, countriesPlayed, top100Progress, isLoading } =
    useUserCourseSummary(userId);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterRegion, setFilterRegion] = useState<FilterRegion>('all');

  // Mock courses data - will be replaced with real data
  const mockCourses: CourseItem[] = useMemo(() => [
    { id: '1', name: 'St Andrews Old Course', rating: 9.5, datePlayed: '2024-01-15', country: 'Scotland', region: 'uk' },
    { id: '2', name: 'Royal Birkdale', rating: 9.2, datePlayed: '2024-01-08', country: 'England', region: 'uk' },
    { id: '3', name: 'Pebble Beach', rating: 9.8, datePlayed: '2023-12-20', country: 'USA', region: 'usa' },
    { id: '4', name: 'Augusta National', rating: 10.0, datePlayed: '2023-11-15', country: 'USA', region: 'usa' },
    { id: '5', name: 'Royal County Down', rating: 9.4, datePlayed: '2023-10-28', country: 'Northern Ireland', region: 'uk' },
    { id: '6', name: 'Valderrama', rating: 8.8, datePlayed: '2023-09-15', country: 'Spain', region: 'europe' },
  ], []);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let courses = [...mockCourses];
    
    // Filter by region
    if (filterRegion !== 'all') {
      courses = courses.filter(c => c.region === filterRegion);
    }
    
    // Sort
    switch (sortBy) {
      case 'rating':
        courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        courses.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        courses.sort((a, b) => new Date(b.datePlayed || 0).getTime() - new Date(a.datePlayed || 0).getTime());
        break;
    }
    
    return courses;
  }, [mockCourses, filterRegion, sortBy]);

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name', label: 'A-Z' },
  ];

  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    { value: 'uk', label: 'GB & Ireland' },
    { value: 'europe', label: 'Europe' },
    { value: 'usa', label: 'USA' },
    { value: 'asia', label: 'Asia' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 px-4">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-sq-md p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{totalCoursesPlayed}</div>
          <div className="text-xs text-muted-foreground mt-1">Courses</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-sq-md p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{countriesPlayed}</div>
          <div className="text-xs text-muted-foreground mt-1">Countries</div>
        </div>
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-sq-md p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{typeof top100Progress === 'number' ? top100Progress : 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Top 100</div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-3">
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-sq-sm p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-sq-xs transition-all',
              viewMode === 'grid' ? 'bg-white/[0.12] text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-sq-xs transition-all',
              viewMode === 'list' ? 'bg-white/[0.12] text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <AppSelect
            value={filterRegion}
            onChange={(val) => setFilterRegion(val as FilterRegion)}
            options={regionOptions}
          />
          <AppSelect
            value={sortBy}
            onChange={(val) => setSortBy(val as SortBy)}
            options={sortOptions}
          />
        </div>
      </div>

      {/* Course Grid/List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className={cn(
                'relative overflow-hidden rounded-sq-md',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-left transition-all hover:bg-white/[0.08] active:scale-[0.98]'
              )}
            >
              {/* Course Image */}
              <div className="aspect-[4/3] bg-muted/30">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              {/* Course Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm text-foreground truncate">{course.name}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">{course.country}</span>
                  {course.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-foreground">{course.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-sq-md',
                'bg-white/[0.04] border border-white/[0.08]',
                'text-left transition-all hover:bg-white/[0.08] active:scale-[0.99]'
              )}
            >
              {/* Thumbnail */}
              <div className="w-16 h-12 rounded-sq-sm bg-muted/30 overflow-hidden flex-shrink-0">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">{course.name}</h3>
                <p className="text-xs text-muted-foreground">{course.country}</p>
              </div>
              
              {/* Rating */}
              {course.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-foreground">{course.rating}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileCoursesTabV2;
