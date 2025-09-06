import React from "react";
import { useTopTen } from "@/context/TopTenContext";
import CourseCard from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;        // default: "Top 10 Courses Rated by You"
  onOpenModal?: () => void; // optional CTA to edit
  isOwnProfile?: boolean;
  userId?: string;
};

export default function TopTenCoursesRatedByYou({
  title = "Top 10 Courses Rated by You",
  onOpenModal,
  isOwnProfile,
  userId,
}: Props) {
  const { topTen, loading } = useTopTen();
  
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

        <div className="relative">
          {/* Match exact row width/gap from Top 10 Rated by You section */}
          <div className="
            flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4
            [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5]
            [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem]
          ">
            {topTen.map((course, index) => {
              const rank = index + 1;

              if (!course) {
                // Grey placeholder card matching modal style
                return (
                  <div key={`ph-${index}`} className="
                    flex-shrink-0 
                    w-[calc((100vw-2rem)/var(--cards)-var(--g))] 
                    md:w-[calc((100vw-4rem)/var(--cards)-var(--g))] 
                    lg:w-[calc((1200px-4rem)/var(--cards)-var(--g))]
                    min-w-0
                  ">
                    <div className="relative">
                      {/* Rank badge with 1-3 medal styling, 4-10 liquid glass */}
                      <div className={`
                        absolute -top-2 -left-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border border-muted-foreground/30
                        ${rank <= 3 
                          ? rank === 1 
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border-yellow-500/50' 
                            : rank === 2 
                            ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 border-gray-400/50'
                            : 'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100 border-amber-500/50'
                          : 'bg-muted/60 backdrop-blur-sm text-muted-foreground border-muted-foreground/30'
                        }
                      `}>
                        {rank}
                      </div>
                      <div 
                        className="
                          h-[var(--card-h-portrait)] rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 
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
                <div key={`course-${course.id}-${index}`} className="
                  flex-shrink-0 
                  w-[calc((100vw-2rem)/var(--cards)-var(--g))] 
                  md:w-[calc((100vw-4rem)/var(--cards)-var(--g))] 
                  lg:w-[calc((1200px-4rem)/var(--cards)-var(--g))]
                  min-w-0
                ">
                  <div className="relative">
                    {/* Rank badge with 1-3 medal styling, 4-10 liquid glass */}
                    <div className={`
                      absolute -top-2 -left-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10
                      ${rank <= 3 
                        ? rank === 1 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 border border-yellow-500/50' 
                          : rank === 2 
                          ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900 border border-gray-400/50'
                          : 'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100 border border-amber-500/50'
                        : 'bg-primary/10 backdrop-blur-sm text-primary border border-primary/20'
                      }
                    `}>
                      {rank}
                    </div>
                    
                    {/* Top 3 get accent lines */}
                    {rank <= 3 && (
                      <div className={`
                        absolute top-0 left-0 right-0 h-1 rounded-t-xl z-20
                        ${rank === 1 
                          ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' 
                          : rank === 2 
                          ? 'bg-gradient-to-r from-transparent via-gray-400 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-amber-700 to-transparent'
                        }
                      `} />
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
                      isReadOnly
                      customHeight="h-[var(--card-h-portrait)]"
                      showUserRating={false}
                      showAverageRating={true}
                      badgesOnTop={true}
                    />
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