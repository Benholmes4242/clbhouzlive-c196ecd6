
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import { useViewPreference } from '@/hooks/useViewPreference';
import Top100CoursesContent from './Top100CoursesContent';
import SortViewModal from './SortViewModal';
import CoursePickerModal from './CoursePickerModal';
import ReviewPromptBanner from './ReviewPromptBanner';

interface Top100CoursesModalProps {
  region: string;
  regionName: string;
  userId: string;
  isOwnProfile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Top100CoursesModal: React.FC<Top100CoursesModalProps> = ({
  region,
  regionName,
  userId,
  isOwnProfile,
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSortViewModalOpen, setIsSortViewModalOpen] = useState(false);
  const [isCoursePickerOpen, setIsCoursePickerOpen] = useState(false);
  const { viewType, sortType, setViewType, setSortType, isHydrated } = useViewPreference();
  const queryClient = useQueryClient();
  
  const {
    courses,
    playedCourses,
    getUserRating,
    isLoading,
    toggleCourse
  } = useTop100CoursesList(region, userId, isOwnProfile);

  // Calculate unrated courses (played but no rating)
  const unratedCoursesCount = React.useMemo(() => {
    if (!isOwnProfile) return 0;
    
    return courses.filter(course => 
      playedCourses.has(course.id) && !getUserRating(course.id)
    ).length;
  }, [courses, playedCourses, getUserRating, isOwnProfile]);

  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'rank-asc': return 'Rank: Low to High';
      case 'rank-desc': return 'Rank: High to Low';
      case 'recent': return 'Recently Played';
      default: return 'Rank: Low to High';
    }
  };

  const getViewLabel = (view: string) => {
    switch (view) {
      case 'cards': return 'Cards';
      case 'list': return 'List';
      default: return 'Cards';
    }
  };

  const handleAddReviewClick = () => {
    // For now, just show a message. In the future, this could open a review selection modal
    // or filter the courses to show only unrated ones
    console.log('Add review clicked for', unratedCoursesCount, 'courses');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>{regionName} - Top 100 Courses</DialogTitle>
            </div>
          </DialogHeader>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search courses by name, country, or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort & View Button */}
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={() => setIsSortViewModalOpen(true)}
              className="px-6 py-2 rounded-lg bg-muted/50 hover:bg-muted"
            >
              Sort & View
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Current preferences display */}
          <div className="text-center text-sm text-muted-foreground mb-4">
            {getSortLabel(sortType)} • {getViewLabel(viewType)} view
          </div>

          {/* Review Prompt Banner */}
          <ReviewPromptBanner
            unratedCoursesCount={unratedCoursesCount}
            onAddReviewClick={handleAddReviewClick}
            isVisible={isOwnProfile}
          />
          
          <div className="flex-1 overflow-hidden">
            <Top100CoursesContent
              courses={courses}
              playedCourses={playedCourses}
              searchTerm={searchTerm}
              region={region}
              isOwnProfile={isOwnProfile}
              isLoading={isLoading}
              toggleCourse={toggleCourse}
              getUserRating={getUserRating}
              viewType={viewType}
              sortType={sortType}
            />
          </div>

          {/* Floating Add Courses Button - Only for own profile */}
          {isOwnProfile && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={() => setIsCoursePickerOpen(true)}
                className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Courses
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sort & View Modal */}
      <SortViewModal
        isOpen={isSortViewModalOpen}
        onClose={() => setIsSortViewModalOpen(false)}
        currentSort={sortType}
        currentView={viewType}
        onSortChange={setSortType}
        onViewChange={setViewType}
      />

      {/* Course Picker Modal */}
      <CoursePickerModal
        isOpen={isCoursePickerOpen}
        onClose={() => setIsCoursePickerOpen(false)}
        userId={userId}
        region={region}
        onCoursesAdded={() => {
          queryClient.invalidateQueries({ queryKey: ['userTop100Courses'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['top100-progress-user'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['top100-overview'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['top100-list-summaries'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: false });
        }}
      />
    </>
  );
};

export default Top100CoursesModal;
