import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Grid3X3, List, ChevronDown, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import CourseCard from '@/components/courses/CourseCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useModalState } from '@/hooks/useModalDetector';
import SlideInModal from '@/components/ui/SlideInModal';

interface EnhancedRegionalCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  courses: any[];
  isOwnProfile?: boolean;
  userId?: string;
}

type SortOption = 'recently-played' | 'highest-rated' | 'lowest-rated';
type ViewOption = 'grid' | 'list';

const sortCourses = (courses: any[], sortBy: SortOption) => {
  const coursesCopy = [...courses];
  
  switch (sortBy) {
    case 'recently-played':
      return coursesCopy.sort((a, b) => {
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
    
    case 'highest-rated':
      return coursesCopy.sort((a, b) => {
        // Sort by user rating first, then global rating, then regional rank
        const aUserRating = a.rating || a.userRating;
        const bUserRating = b.rating || b.userRating;
        const aGlobalRating = a.golf_courses?.average_rating || 0;
        const bGlobalRating = b.golf_courses?.average_rating || 0;
        
        // If both have user ratings, sort by user rating descending
        if (aUserRating && bUserRating) {
          return bUserRating - aUserRating;
        }
        
        // If only one has user rating, prioritize it
        if (aUserRating && !bUserRating) return -1;
        if (!aUserRating && bUserRating) return 1;
        
        // If neither have user ratings, sort by global rating descending
        if (aGlobalRating !== bGlobalRating) {
          return bGlobalRating - aGlobalRating;
        }
        
        // Final fallback: regional rank ascending (lower rank = better)
        const aRank = a.golf_courses?.regional_rank || a.golf_courses?.global_rank || 9999;
        const bRank = b.golf_courses?.regional_rank || b.golf_courses?.global_rank || 9999;
        return aRank - bRank;
      });
    
    case 'lowest-rated':
      return coursesCopy.sort((a, b) => {
        // Sort by user rating first, then global rating, then regional rank
        const aUserRating = a.rating || a.userRating;
        const bUserRating = b.rating || b.userRating;
        const aGlobalRating = a.golf_courses?.average_rating || 0;
        const bGlobalRating = b.golf_courses?.average_rating || 0;
        
        // If both have user ratings, sort by user rating ascending
        if (aUserRating && bUserRating) {
          return aUserRating - bUserRating;
        }
        
        // If only one has user rating, prioritize it
        if (aUserRating && !bUserRating) return -1;
        if (!aUserRating && bUserRating) return 1;
        
        // If neither have user ratings, sort by global rating ascending
        if (aGlobalRating !== bGlobalRating) {
          return aGlobalRating - bGlobalRating;
        }
        
        // Final fallback: regional rank descending (higher rank = worse)
        const aRank = a.golf_courses?.regional_rank || a.golf_courses?.global_rank || 0;
        const bRank = b.golf_courses?.regional_rank || b.golf_courses?.global_rank || 0;
        return bRank - aRank;
      });
    
    default:
      return coursesCopy;
  }
};

const EnhancedRegionalCoursesModal: React.FC<EnhancedRegionalCoursesModalProps> = ({
  isOpen,
  onClose,
  regionName,
  courses,
  isOwnProfile = false,
  userId
}) => {
  const [view, setView] = useState<ViewOption>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recently-played');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();
  
  // Register this modal with the modal detector
  useModalState(isOpen);

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Check if user has any played courses to determine default sort
  useEffect(() => {
    if (isOpen && courses.length > 0) {
      const hasPlayedCourses = courses.some(course => 
        course.played_date || course.created_at || course.rating || course.userRating
      );
      setSortBy(hasPlayedCourses ? 'recently-played' : 'highest-rated');
    }
  }, [isOpen, courses]);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = courses.filter(course => 
        course.golf_courses?.name?.toLowerCase().includes(query) ||
        course.golf_courses?.location?.toLowerCase().includes(query) ||
        course.golf_courses?.country?.toLowerCase().includes(query)
      );
    }

    return sortCourses(filtered, sortBy);
  }, [courses, searchQuery, sortBy]);

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'recently-played':
        return 'Recently Played';
      case 'highest-rated':
        return 'Highest Rated';
      case 'lowest-rated':
        return 'Lowest Rated';
      default:
        return 'Recently Played';
    }
  };

  // Responsive grid classes
  const getGridClasses = () => {
    if (view === 'list') return 'space-y-3';
    return isMobile ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-4 gap-4';
  };

  return (
    <SlideInModal
      open={isOpen}
      onClose={onClose}
      title={`${regionName} (${filteredAndSortedCourses.length})`}
    >
      {/* Controls Row */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="h-8 px-3"
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-8 px-3"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">List</span>
            </Button>
          </div>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <span className="text-xs text-muted-foreground mr-2">Sort</span>
                {getSortLabel(sortBy)}
                <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-background border border-border shadow-lg z-[1100]"
              sideOffset={4}
            >
              <DropdownMenuItem 
                onClick={() => setSortBy('recently-played')}
                className={sortBy === 'recently-played' ? 'bg-muted' : ''}
              >
                Recently Played
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('highest-rated')}
                className={sortBy === 'highest-rated' ? 'bg-muted' : ''}
              >
                Highest Rated
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setSortBy('lowest-rated')}
                className={sortBy === 'lowest-rated' ? 'bg-muted' : ''}
              >
                Lowest Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by name, location, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="p-4 sm:p-6">
        {filteredAndSortedCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">
              {searchQuery.trim() 
                ? `No courses found matching "${searchQuery}".`
                : isOwnProfile 
                  ? `You haven't played any ${regionName} courses yet.` 
                  : `No ${regionName} courses found.`
              }
            </p>
          </div>
        ) : (
          <div className={getGridClasses()}>
            {filteredAndSortedCourses.map((course, index) => {
              if (view === 'list') {
                // List view - show as compact rows
                return (
                  <div key={course.id || `${course.course_id}-${index}`} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                     <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                       {course.golf_courses?.thumbnail_image ? (
                         <img 
                           src={course.golf_courses.thumbnail_image} 
                           alt={course.golf_courses?.name}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                           <div className="w-8 h-8 bg-green-600 rounded-full"></div>
                         </div>
                       )}
                     </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{course.golf_courses?.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{course.golf_courses?.location || course.golf_courses?.country}</span>
                        {(course.rating || course.userRating) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              ⭐ {course.rating || course.userRating}
                            </span>
                          </>
                        )}
                        {course.played_date && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              ✓ Played
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // Grid view - show full cards
              return (
                <div key={course.id || `${course.course_id}-${index}`} className="aspect-[4/5]">
                  <CourseCard
                    course={course.golf_courses}
                    userRating={course.rating || course.userRating}
                    viewContext="regional"
                    viewingUserId={userId}
                    isReadOnly={!isOwnProfile}
                    customHeight="h-full"
                    showUserRating={true}
                    showAverageRating={true}
                    badgesOnTop={true}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlideInModal>
  );
};

export default EnhancedRegionalCoursesModal;