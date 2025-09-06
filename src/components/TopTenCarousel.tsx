import React from 'react';
import { useTopTen } from '@/context/TopTenContext';
import CourseCard from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';

interface TopTenCarouselProps {
  userId?: string;
  isOwnProfile?: boolean;
  onOpenModal?: () => void;
}

export const TopTenCarousel: React.FC<TopTenCarouselProps> = ({ 
  userId, 
  isOwnProfile, 
  onOpenModal 
}) => {
  const { topTen, loading } = useTopTen();
  
  // Filter out empty slots and convert to course format
  const filledCourses = topTen
    .filter(Boolean)
    .map((course, index) => ({
      ...course!,
      rank: topTen.indexOf(course!) + 1, // Preserve original position
    }));

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Top 10 Rated by You</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your top 10...</div>
        </div>
      </div>
    );
  }

  if (filledCourses.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Top 10 Rated by You</h3>
          {isOwnProfile && onOpenModal && (
            <Button variant="outline" size="sm" onClick={onOpenModal}>
              Add Courses
            </Button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">
            {isOwnProfile ? "Build your Top 10" : "No courses rated yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile 
              ? "Drag courses from any region into your Top 10 list" 
              : "Check back later to see their top-rated courses"
            }
          </p>
          {isOwnProfile && onOpenModal && (
            <Button className="mt-4" onClick={onOpenModal}>
              Start Adding Courses
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          Top 10 Rated by You
          <span className="text-sm text-muted-foreground ml-2">
            ({filledCourses.length}/10)
          </span>
        </h3>
        {isOwnProfile && onOpenModal && (
          <Button variant="outline" size="sm" onClick={onOpenModal}>
            Edit Top 10
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ width: `${filledCourses.length * 280}px` }}>
          {filledCourses.map((course) => (
            <div key={course.id} className="flex-shrink-0 w-64">
              <div className="relative">
                <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                  {course.rank}
                </div>
                <CourseCard
                  course={{
                    id: course.id,
                    name: course.name,
                    country: course.country,
                    sub_country: course.sub_country,
                    region: course.region,
                    thumbnail_image: course.thumbnail_image,
                    global_rank: course.global_rank,
                    regional_rank: course.regional_rank,
                    usa_rank: course.usa_rank,
                  }}
                  viewContext="global"
                  viewingUserId={userId}
                  isReadOnly={!isOwnProfile}
                  customHeight="h-64"
                  showUserRating={false}
                  showAverageRating={true}
                  badgesOnTop={true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};