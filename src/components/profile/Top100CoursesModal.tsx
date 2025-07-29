
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';
import { useViewPreference } from '@/hooks/useViewPreference';
import Top100CoursesContent from './Top100CoursesContent';
import ViewToggle from './ViewToggle';

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
  const { viewType, setViewType } = useViewPreference();
  
  const {
    courses,
    playedCourses,
    getUserRating,
    isLoading,
    toggleCourse
  } = useTop100CoursesList(region, userId, isOwnProfile);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>{regionName} - Top 100 Courses</DialogTitle>
            <ViewToggle currentView={viewType} onViewChange={setViewType} />
          </div>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by name, country, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/25 backdrop-blur-md shadow-xl rounded-full py-2 border-none text-white placeholder:text-white/70"
          />
        </div>
        
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default Top100CoursesModal;
