import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Star, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTop100Overview } from '@/hooks/useTop100Overview';
import { getTop100Club } from '@/lib/top100Club';

interface ProfileTop100TabV2Props {
  userId: string;
  isOwnProfile: boolean;
  displayName?: string;
}

type Region = 'worldwide' | 'gbi' | 'europe' | 'usa';

interface Top100Course {
  id: string;
  name: string;
  rank: number;
  imageUrl?: string;
  rating?: number;
  datePlayed?: string;
  memory?: string;
  isPlayed: boolean;
}

/**
 * ProfileTop100TabV2 - Profile 2.0 Top 100 Tab
 * Features: Horizontal region selector, progress section, course cards with memories
 */
const ProfileTop100TabV2: React.FC<ProfileTop100TabV2Props> = ({
  userId,
  isOwnProfile,
  displayName,
}) => {
  const navigate = useNavigate();
  const { data: top100Overview, isLoading } = useTop100Overview(userId);
  const [selectedRegion, setSelectedRegion] = useState<Region>('worldwide');

  const totalPlayed = top100Overview?.total_rated ?? top100Overview?.total_played ?? 0;
  const club = getTop100Club(totalPlayed);

  // Region options
  const regions: { id: Region; label: string; count: number }[] = useMemo(() => [
    { id: 'worldwide', label: 'Worldwide', count: 100 },
    { id: 'gbi', label: 'GB & Ireland', count: 100 },
    { id: 'europe', label: 'Europe', count: 100 },
    { id: 'usa', label: 'USA', count: 100 },
  ], []);

  // Mock courses - will be replaced with real data
  const mockCourses: Top100Course[] = useMemo(() => [
    { id: '1', name: 'St Andrews Old Course', rank: 1, isPlayed: true, rating: 9.8, datePlayed: '2024-01-15', memory: 'Incredible experience on the home of golf' },
    { id: '2', name: 'Augusta National', rank: 2, isPlayed: false },
    { id: '3', name: 'Cypress Point', rank: 3, isPlayed: true, rating: 10.0, datePlayed: '2023-11-20' },
    { id: '4', name: 'Royal County Down', rank: 4, isPlayed: true, rating: 9.5, datePlayed: '2023-10-28', memory: 'Best links course ever' },
    { id: '5', name: 'Pine Valley', rank: 5, isPlayed: false },
    { id: '6', name: 'Pebble Beach', rank: 6, isPlayed: true, rating: 9.6, datePlayed: '2023-09-15' },
  ], []);

  // Next milestone
  const nextMilestone = useMemo(() => {
    const milestones = [5, 10, 20, 50, 100, 200, 300, 400];
    return milestones.find(m => m > totalPlayed) || 400;
  }, [totalPlayed]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 px-4">
        {/* Skeleton for region selector */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-sq-pill bg-muted/30 animate-pulse flex-shrink-0" />
          ))}
        </div>
        {/* Skeleton for progress card */}
        <div className="h-32 rounded-sq-lg bg-muted/30 animate-pulse" />
        {/* Skeleton for courses */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-sq-md bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - no Top 100 progress
  if (totalPlayed === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Top 100 courses yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
          {isOwnProfile 
            ? 'Start your journey by playing and rating Top 100 courses around the world'
            : `${displayName || 'This user'} hasn't played any Top 100 courses yet`
          }
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/courses?tab=top100')}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Explore Top 100
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Region Selector - Horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex items-center gap-2" style={{ minWidth: 'max-content' }}>
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={cn(
                'px-4 py-2 rounded-sq-pill text-sm font-medium transition-all',
                selectedRegion === region.id
                  ? 'bg-white/[0.15] text-foreground'
                  : 'bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
              )}
            >
              {region.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-sq-lg p-5">
          {/* Progress header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalPlayed}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {club.tierName || 'Top 100 Explorer'}
              </p>
            </div>
            <Trophy className="w-10 h-10 text-foreground/30" />
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(totalPlayed, 100)}%`,
                background: club.ringColor || '#2F604A'
              }}
            />
          </div>

          {/* Next milestone */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">
              {nextMilestone - totalPlayed} more to {nextMilestone} Club
            </span>
            <button
              onClick={() => navigate('/top100?tab=my-progress')}
              className="flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              View Achievements
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="px-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Courses
        </h3>
        
        {mockCourses.map((course) => (
          <button
            key={course.id}
            onClick={() => navigate(`/courses/${course.id}`)}
            className={cn(
              'w-full rounded-sq-md overflow-hidden',
              'bg-white/[0.04] border border-white/[0.08]',
              'text-left transition-all hover:bg-white/[0.08] active:scale-[0.99]'
            )}
          >
            <div className="flex">
              {/* Course Image */}
              <div className="w-24 h-24 bg-muted/30 flex-shrink-0 relative">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                {/* Rank badge */}
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full">
                  <span className="text-xs font-bold text-white">#{course.rank}</span>
                </div>
              </div>

              {/* Course Info */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{course.name}</h4>
                  {course.memory && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.memory}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  {course.isPlayed ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500">Played</span>
                      </div>
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium text-foreground">{course.rating}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not played yet</span>
                  )}
                  
                  {course.datePlayed && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(course.datePlayed).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTop100TabV2;
