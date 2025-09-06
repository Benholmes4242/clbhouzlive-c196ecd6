import React from "react";
import { useTopTen } from "@/context/TopTenContext";
import CourseCard from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";

type Props = {
  onOpenModal?: () => void; // optional CTA to edit
  isOwnProfile?: boolean;
  userId?: string;
  userDisplayName?: string;
};

export default function TopTenCoursesRatedByYou({
  onOpenModal,
  isOwnProfile,
  userId,
  userDisplayName,
}: Props) {
  const { topTen, loading } = useTopTen();
  
  // Dynamic title based on profile ownership
  const getTitle = () => {
    if (isOwnProfile) {
      return "Top 10 Courses Rated by You";
    } else {
      const firstName = userDisplayName?.split(' ')[0] || 'User';
      return `Top 10 Courses Rated by ${firstName}`;
    }
  };
  
  const title = getTitle();
  
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your top 10...</div>
        </div>
      </div>
    );
  }

  const filled = topTen.filter(Boolean).length;
  const hasAnyCourses = filled > 0;

  return (
    <section className="w-full px-4 pt-0 pb-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            {title}
            {filled > 0 && (
              <span className="text-sm text-muted-foreground ml-2">({filled}/10)</span>
            )}
          </h3>
          <div className="flex gap-2">
            {isOwnProfile && onOpenModal && filled > 0 && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onOpenModal}
                className="text-sm underline hover:bg-transparent p-0 h-auto"
              >
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Empty state CTA */}
        {!hasAnyCourses && isOwnProfile && (
          <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground text-center">
              Open See All to choose your Top 10
              {onOpenModal && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={onOpenModal}
                  className="ml-1 p-0 h-auto text-sm underline"
                >
                  Start building your list
                </Button>
              )}
            </p>
          </div>
        )}

        <div className="relative mt-2">
          {/* Match exact row styling from Top 10 Rated by You section */}
          <div className="
            flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
            [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
            [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
          ">
            {topTen.map((course, index) => {
              const rank = index + 1;
              const isTopThree = index < 3;

              // Helper functions from Top 10 Rated by You section
              const getTopAccentGradient = (position: number) => {
                switch (position) {
                  case 0: return 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent'; // Gold
                  case 1: return 'bg-gradient-to-r from-transparent via-gray-400 to-transparent'; // Silver
                  case 2: return 'bg-gradient-to-r from-transparent via-amber-700 to-transparent'; // Bronze
                  default: return '';
                }
              };

              const getRankBadgeGradient = (position: number) => {
                switch (position) {
                  case 0: return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600'; // Gold metallic
                  case 1: return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500'; // Silver metallic
                  case 2: return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800'; // Bronze metallic
                  default: return 'bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30'; // Liquid glass for 4-10
                }
              };

              const getCardShadow = (position: number) => {
                return position < 3 ? 'shadow-xl shadow-black/20' : 'shadow-lg';
              };

              if (!course) {
                // Grey placeholder card matching modal style
                return (
                  <div key={`ph-${index}`} className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative">
                    <div className={`w-full aspect-[4/5] relative overflow-hidden rounded-lg ${getCardShadow(index)}`}>
                      {/* Top Edge Gradient Accent for Top 3 placeholders */}
                      {isTopThree && (
                        <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
                      )}
                      
                      {/* Rank badge */}
                      <div className="absolute top-3 left-3 z-20">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center
                          ${getRankBadgeGradient(index)}
                          ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
                          ${isTopThree ? 'ring-1 ring-white/20' : ''}
                        `}>
                          <span className={`
                            text-white font-medium text-sm leading-none
                            ${isTopThree ? 'drop-shadow-sm' : ''}
                          `}>
                            {rank}
                          </span>
                        </div>
                      </div>

                      {/* Placeholder content */}
                      <div 
                        className="
                          w-full h-full border-2 border-dashed border-muted-foreground/30 bg-muted/20 
                          flex flex-col items-center justify-center text-muted-foreground 
                          hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors cursor-pointer group
                        "
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
                          <div className="text-xs text-center px-4">
                            <div className="mb-1">Click to add</div>
                            <div className="opacity-70">Open See All</div>
                          </div>
                        )}
                        {!isOwnProfile && (
                          <div className="text-xs text-center px-4">
                            No course selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={`course-${course.id}-${index}`} className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] relative">
                  <div className={`w-full aspect-[4/5] relative overflow-hidden rounded-lg ${getCardShadow(index)}`}>
                    {/* Top Edge Gradient Accent for Top 3 */}
                    {isTopThree && (
                      <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${getTopAccentGradient(index)}`} />
                    )}
                    
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
                      showUserRating={false}
                      showAverageRating={false}
                      isFromUserCoursesPage={true}
                      customHeight="h-full"
                      showCountryWithFlag={true}
                      hideRankingBadges={true}
                      mobileTextScale="small"
                      mobileFlagSize="md"
                    />
                    
                    {/* Premium Rank Badge - Top Left (matching Top 10 Rated position) */}
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${getRankBadgeGradient(index)}
                        ${isTopThree ? 'shadow-lg shadow-black/25' : 'shadow-md'}
                        ${isTopThree ? 'ring-1 ring-white/20' : ''}
                      `}>
                        <span className={`
                          text-white font-medium text-sm leading-none
                          ${isTopThree ? 'drop-shadow-sm' : ''}
                        `}>
                          {rank}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
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
    </section>
  );
}