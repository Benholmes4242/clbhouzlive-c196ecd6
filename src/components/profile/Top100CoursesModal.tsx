
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
import { Badge } from '@/components/ui/badge';
import { Check, Search, Globe, MapPin } from 'lucide-react';
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

  // Get regional label for badges
  const getRegionalLabel = (course: any) => {
    if (course.country === 'United Kingdom' || course.country === 'Ireland') {
      return 'GB&I';
    }
    return 'Regional';
  };

  const renderListView = () => (
    <div className="space-y-3">
      {filteredCourses.map((course) => {
        const isPlayed = playedCourses.has(course.id);
        const displayRank = getRankToDisplay(course);
        
        return (
          <div
            key={course.id}
            className={`flex items-center space-x-3 p-3 rounded-lg border ${
              isPlayed ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
            } ${isOwnProfile ? 'cursor-pointer' : ''}`}
            onClick={() => isOwnProfile && toggleCourse(course.id)}
          >
            <Checkbox
              checked={isPlayed}
              onCheckedChange={() => toggleCourse(course.id)}
              className="flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {displayRank && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {displayRank}
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
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredCourses.map((course) => {
        const isPlayed = playedCourses.has(course.id);
        const displayRank = getRankToDisplay(course);
        const regionalLabel = getRegionalLabel(course);
        
        return (
          <div
            key={course.id}
            className={`relative rounded-lg border overflow-hidden transition-all duration-300 ${
              isPlayed 
                ? 'bg-green-50 border-green-200 shadow-md' 
                : 'bg-card hover:shadow-lg'
            }`}
          >
            {/* Course Image */}
            <div className="relative h-32 overflow-hidden">
              <img
                src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
                alt={course.name}
                className="w-full h-full object-cover"
              />
              
              {/* Rank Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {displayRank && course.global_rank && (
                  <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500 text-xs">
                    <Globe className="h-2 w-2 mr-1" />
                    {displayRank}
                  </Badge>
                )}
                {course.regional_rank && region !== 'global' && (
                  <Badge variant="secondary" className="text-xs">
                    {regionalLabel} {course.regional_rank}
                  </Badge>
                )}
              </div>

              {/* Played Indicator */}
              {isPlayed && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">
                {course.name}
              </h3>
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <MapPin className="h-2 w-2 mr-1" />
                <span>{course.region ? `${course.region}, ` : ''}{course.country}</span>
              </div>
              {course.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

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
        
        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-muted-foreground">Loading courses...</span>
            </div>
          ) : (
            <>
              {/* Render different views based on profile ownership */}
              {isOwnProfile ? renderListView() : renderGridView()}
              
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
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default Top100CoursesModal;
