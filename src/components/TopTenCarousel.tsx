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
  
  // Debug logging
  console.log("TopTenCarousel topTen state:", topTen);
  console.log("TopTenCarousel filled courses:", topTen.filter(Boolean));

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-heading-lg font-semibold leading-snug">Top 10 Rated by You</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your top 10...</div>
        </div>
      </div>
    );
  }

  // Count filled slots
  const filledCount = topTen.filter(Boolean).length;
  const hasAnyCourses = filledCount > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-heading-lg font-semibold leading-snug">
          Top 10 Rated by You
          {hasAnyCourses && (
            <span className="text-body-md text-muted-foreground ml-2">
              ({filledCount}/10)
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {hasAnyCourses && isOwnProfile && onOpenModal && (
            <Button variant="outline" size="sm" onClick={onOpenModal}>
              Edit Top 10
            </Button>
          )}
        </div>
      </div>

      {/* Empty state CTA */}
      {!hasAnyCourses && isOwnProfile && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-body-md text-muted-foreground text-center">
            Open See All to choose your Top 10
            {onOpenModal && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={onOpenModal}
                className="ml-1 p-0 h-auto text-body-md underline"
              >
                Start building your list
              </Button>
            )}
          </p>
        </div>
      )}
      
      {/* Always render 10 slots - mix of courses and placeholders */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ width: "2800px" }}>
          {topTen.map((course, index) => {
            const rank = index + 1;
            
            if (course) {
              // Render filled course card
              return (
                <div key={`course-${course.id}-${index}`} className="flex-shrink-0 w-64">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-meta font-bold z-10">
                      {rank}
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
              );
            } else {
              // Render placeholder card (matches modal style)
              return (
                <div key={`placeholder-${index}`} className="flex-shrink-0 w-64">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-meta font-medium z-10 border border-muted-foreground/30">
                      {rank}
                    </div>
                    <div 
                      className="h-64 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex flex-col items-center justify-center text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={onOpenModal}
                      role="button"
                      tabIndex={0}
                      aria-label={`Empty slot ${rank} — add from See All`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenModal?.();
                        }
                      }}
                    >
                      <div className="text-2xl font-bold mb-2 group-hover:scale-110 transition-transform">
                        {rank}
                      </div>
                      {isOwnProfile && (
                        <div className="text-meta text-center px-4">
                          <div className="mb-1">Click to add</div>
                          <div className="opacity-70">Open See All</div>
                        </div>
                      )}
                      {!isOwnProfile && (
                        <div className="text-meta text-center px-4">
                          No course selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Additional empty state message for non-owners */}
      {!hasAnyCourses && !isOwnProfile && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            This user hasn't created their Top 10 list yet
          </p>
        </div>
      )}
    </div>
  );
};