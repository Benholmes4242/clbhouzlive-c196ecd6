
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
import Top100CoursesContent from './Top100CoursesContent';

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
  
  const {
    courses,
    playedCourses,
    isLoading,
    toggleCourse
  } = useTop100CoursesList(region, userId, isOwnProfile);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{regionName} - Top 100 Courses</DialogTitle>
        </DialogHeader>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses by name, country, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
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
        />
      </DialogContent>
    </Dialog>
  );
};

export default Top100CoursesModal;
