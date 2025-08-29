import React, { useState } from 'react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import NetflixCourseRow from '@/components/courses/netflix/NetflixCourseRow';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Top100CoursesModal from './Top100CoursesModal';

interface RegionalCoursesCarouselProps {
  userId: string;
  userDisplayName?: string;
  isOwnProfile: boolean;
}

const RegionalCoursesCarousel: React.FC<RegionalCoursesCarouselProps> = ({
  userId,
  userDisplayName = 'User',
  isOwnProfile
}) => {
  const [selectedRegion, setSelectedRegion] = useState<{
    region: 'britain-ireland' | 'usa' | 'europe' | 'global';
    title: string;
  } | null>(null);

  // Define regions with their display titles
  const regions = [
    { key: 'global' as const, title: 'Worldwide', displayTitle: 'Worldwide' },
    { key: 'britain-ireland' as const, title: 'Great Britain & Ireland', displayTitle: 'Great Britain & Ireland' },
    { key: 'europe' as const, title: 'Continental Europe', displayTitle: 'Continental Europe' },
    { key: 'usa' as const, title: 'USA', displayTitle: 'USA' }
  ];

  // Get course data for each region
  const worldwideData = useTop100CoursesList('global', userId, isOwnProfile);
  const gbIrelandData = useTop100CoursesList('britain-ireland', userId, isOwnProfile);
  const europeData = useTop100CoursesList('europe', userId, isOwnProfile);
  const usaData = useTop100CoursesList('usa', userId, isOwnProfile);

  const regionData = {
    global: worldwideData,
    'britain-ireland': gbIrelandData,
    europe: europeData,
    usa: usaData
  };

  const handleViewAll = (region: 'britain-ireland' | 'usa' | 'europe' | 'global', title: string) => {
    setSelectedRegion({ region, title });
  };

  const handleCloseModal = () => {
    setSelectedRegion(null);
  };

  const handleCourseClick = (course: any) => {
    // Handle course click - you can implement navigation logic here
    console.log('Course clicked:', course);
  };

  // Filter and sort courses by region, highest rated first
  const getRegionalCourses = (region: 'britain-ireland' | 'usa' | 'europe' | 'global') => {
    const data = regionData[region];
    if (!data || data.isLoading) return [];

    // Filter to only show played courses and sort by rating (highest first)
    const playedCourses = data.courses.filter(course => 
      data.playedCourses.has(course.id)
    );

    // Sort by user rating (highest first), then by rank (lowest number = best rank)
    return playedCourses.sort((a, b) => {
      const ratingA = data.getUserRating(a.id) || 0;
      const ratingB = data.getUserRating(b.id) || 0;
      
      if (ratingA !== ratingB) {
        return ratingB - ratingA; // Higher ratings first
      }
      
      // If ratings are equal, sort by rank (global or regional)
      const rankA = a.global_rank || a.regional_rank || 999;
      const rankB = b.global_rank || b.regional_rank || 999;
      return rankA - rankB; // Lower rank numbers first
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 md:px-0 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Courses Played
        </h2>
      </div>

      {/* Regional Carousels */}
      <div className="space-y-6">
        {regions.map((region) => {
          const courses = getRegionalCourses(region.key);
          const data = regionData[region.key];
          
          if (data.isLoading) {
            return (
              <div key={region.key} className="px-4 md:px-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                    {region.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                    disabled
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-4 overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-60 aspect-[3/4] bg-muted rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            );
          }

          if (courses.length === 0) {
            return null; // Don't show empty regions
          }

          return (
            <div key={region.key} className="relative">
              {/* Title and View All button */}
              <div className="flex items-center justify-between mb-3 px-4 md:px-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  {region.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={() => handleViewAll(region.key, region.displayTitle)}
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Netflix-style carousel */}
              <NetflixCourseRow
                title=""
                courses={courses.map(course => ({
                  ...course,
                  golf_courses: course // Ensure the course data is in the expected format
                }))}
                onCourseClick={handleCourseClick}
                getUserRating={(courseId: string) => data.getUserRating(courseId)}
                size="large"
              />
            </div>
          );
        })}
      </div>

      {/* Modal for View All */}
      {selectedRegion && (
        <Top100CoursesModal
          region={selectedRegion.region}
          regionName={selectedRegion.title}
          userId={userId}
          isOwnProfile={isOwnProfile}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default RegionalCoursesCarousel;