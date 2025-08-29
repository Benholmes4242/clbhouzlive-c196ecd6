import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import CourseCard from '@/components/courses/CourseCard';
import { X } from 'lucide-react';

interface RegionalCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  region: 'britain-ireland' | 'usa' | 'europe' | 'global';
  title: string;
  isOwnProfile: boolean;
}

const RegionalCoursesModal: React.FC<RegionalCoursesModalProps> = ({
  isOpen,
  onClose,
  userId,
  region,
  title,
  isOwnProfile
}) => {
  const { 
    courses, 
    playedCourses, 
    getUserRating, 
    isLoading
  } = useTop100CoursesList(region === 'global' ? 'global' : region, userId, isOwnProfile);

  // Filter to only show played courses
  const playedCoursesData = courses.filter(course => 
    playedCourses.has(course.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>
        
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-4 animate-pulse">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : playedCoursesData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No {title.toLowerCase()} courses played yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playedCoursesData.map((course) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  viewingUserId={userId}
                  viewContext="global"
                  userRating={getUserRating(course.id)}
                  isReadOnly={!isOwnProfile}
                  showUserRating={true}
                  isFromUserCoursesPage={true}
                  xp={120}
                  showXP={true}
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