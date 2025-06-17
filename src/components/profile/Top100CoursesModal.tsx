
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Check, Search } from 'lucide-react';
import { useTop100CoursesList } from '@/hooks/useTop100CoursesList';

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

  // Filter courses based on search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    
    const term = searchTerm.toLowerCase();
    return courses.filter(course => 
      course.name.toLowerCase().includes(term) ||
      course.country.toLowerCase().includes(term) ||
      course.region?.toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  // Determine which rank to display based on region
  const getRankToDisplay = (course: any) => {
    if (region === 'global') {
      return course.global_rank;
    }
    // For regional views, use the regional_rank assigned in the hook
    return course.regional_rank || course.global_rank;
  };

  const getRankPrefix = () => {
    if (region === 'britain-ireland') return 'GB&I';
    if (region === 'usa') return 'USA';
    if (region === 'europe') return 'EUR';
    return '#'; // For global
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
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
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Loading courses...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => {
                const isPlayed = playedCourses.has(course.id);
                const displayRank = getRankToDisplay(course);
                const rankPrefix = getRankPrefix();
                
                return (
                  <div
                    key={course.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isPlayed ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                    } ${isOwnProfile ? 'cursor-pointer' : ''}`}
                    onClick={() => isOwnProfile && toggleCourse(course.id)}
                  >
                    {isOwnProfile ? (
                      <Checkbox
                        checked={isPlayed}
                        onCheckedChange={() => toggleCourse(course.id)}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {isPlayed && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {displayRank && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {region === 'global' ? `#${displayRank}` : `${rankPrefix} ${displayRank}`}
                          </span>
                        )}
                        <h3 className="font-semibold truncate">{course.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.region}, {course.country}
                      </p>
                      {course.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredCourses.length === 0 && courses.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found matching "{searchTerm}".
                </div>
              )}
              
              {courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found for this region.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Top100CoursesModal;
