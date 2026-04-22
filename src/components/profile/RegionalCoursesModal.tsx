import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, X } from 'lucide-react';
import CourseCard from '@/components/courses/CourseCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { compareOwnRatings } from '@/lib/sortCoursesByRating';

interface RegionalCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  courses: any[];
  isOwnProfile?: boolean;
}

type SortOption = 'recently-played' | 'highest-ranked' | 'lowest-ranked';

// Adapter from this modal's row shape to the canonical own-rating comparator input.
const toOwnRatingRow = (c: any) => ({
  course_id: c.course_id ?? c.golf_courses?.id ?? '',
  rating: c.rating,
  design_score: c.design_score,
  condition_score: c.condition_score,
  clubhouse_score: c.clubhouse_score,
  facilities_score: c.facilities_score,
  review_date: c.review_date ?? c.created_at ?? c.played_date,
});

const sortCourses = (courses: any[], sortBy: SortOption) => {
  const coursesCopy = [...courses];
  
  switch (sortBy) {
    case 'recently-played':
      return coursesCopy.sort((a, b) => {
        const aDate = new Date(a.played_date || a.created_at || 0);
        const bDate = new Date(b.played_date || b.created_at || 0);
        return bDate.getTime() - aDate.getTime();
      });
    
    case 'highest-ranked':
      return coursesCopy.sort((a, b) => {
        // Canonical own-rating cascade (DESC) when both sides are rated.
        if (a.rating && b.rating) return compareOwnRatings(toOwnRatingRow(a), toOwnRatingRow(b), 'desc');
        if (a.rating && !b.rating) return -1;
        if (!a.rating && b.rating) return 1;
        
        const aRank = a.golf_courses?.regional_rank || 9999;
        const bRank = b.golf_courses?.regional_rank || 9999;
        return aRank - bRank;
      });
    
    case 'lowest-ranked':
      return coursesCopy.sort((a, b) => {
        // Canonical own-rating cascade (ASC) when both sides are rated.
        if (a.rating && b.rating) return compareOwnRatings(toOwnRatingRow(a), toOwnRatingRow(b), 'asc');
        if (a.rating && !b.rating) return -1;
        if (!a.rating && b.rating) return 1;
        
        const aRank = a.golf_courses?.regional_rank || 0;
        const bRank = b.golf_courses?.regional_rank || 0;
        return bRank - aRank;
      });
    
    default:
      return coursesCopy;
  }
};

const RegionalCoursesModal: React.FC<RegionalCoursesModalProps> = ({
  isOpen,
  onClose,
  regionName,
  courses,
  isOwnProfile = false
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('recently-played');
  const isMobile = useIsMobile();
  
  const sortedCourses = sortCourses(courses, sortBy);
  
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-4';
  const gap = isMobile ? 'gap-3' : 'gap-4';

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'recently-played':
        return 'Recently Played';
      case 'highest-ranked':
        return 'User Highest Ranked';
      case 'lowest-ranked':
        return 'User Lowest Ranked';
      default:
        return 'Recently Played';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0 bg-background border border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{regionName} Courses</DialogTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem 
                    onClick={() => setSortBy('recently-played')}
                    className={sortBy === 'recently-played' ? 'bg-muted' : ''}
                  >
                    Recently Played
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('highest-ranked')}
                    className={sortBy === 'highest-ranked' ? 'bg-muted' : ''}
                  >
                    User Highest Ranked
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('lowest-ranked')}
                    className={sortBy === 'lowest-ranked' ? 'bg-muted' : ''}
                  >
                    User Lowest Ranked
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sorted by: {getSortLabel(sortBy)} • {sortedCourses.length} courses
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {sortedCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-muted-foreground">
                {isOwnProfile ? `You haven't played any ${regionName} courses yet.` : `No ${regionName} courses found.`}
              </p>
            </div>
          ) : (
            <div className={`grid ${gridCols} ${gap}`}>
              {sortedCourses.map((course, index) => (
                <CourseCard
                  key={course.id || `${course.course_id}-${index}`}
                  course={course.golf_courses}
                  userRating={course.rating}
                  viewContext="regional"
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionalCoursesModal;