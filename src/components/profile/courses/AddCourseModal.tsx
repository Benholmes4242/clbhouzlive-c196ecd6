import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGolfCoursesSearch } from '@/hooks/useGolfCoursesSearch';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  userId,
  onClose,
  existingCourseIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const { data: searchResults = [] } = useGolfCoursesSearch({
    searchQuery,
    countryFilter: undefined,
    regionSlug: undefined,
  });

  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, topTen } = useUserTopTenCourses(userId);

  // Filter to only show played courses that aren't already in Top 10
  const playedCourseIds = new Set(userActivity.map(a => a.course_id));
  const availableCourses = searchResults.filter(
    course => playedCourseIds.has(course.id) && !existingCourseIds.includes(course.id)
  );

  const handleAddCourse = (courseId: string) => {
    if (topTen.length >= 10) {
      toast({
        title: 'Top 10 is full',
        description: 'Remove a course to add another',
        variant: 'destructive',
      });
      return;
    }

    addCourse(courseId);
    toast({
      title: 'Course added',
      description: 'Successfully added to your Top 10',
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Course to Top 10</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses you've played..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {availableCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No matching courses found that you\'ve played'
                : 'Start typing to search courses you\'ve played'}
            </div>
          ) : (
            availableCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleAddCourse(course.id)}
                className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-border/50 hover:bg-card/70 cursor-pointer transition-colors"
              >
                {course.thumbnail_image && (
                  <img
                    src={course.thumbnail_image}
                    alt={course.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{course.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {course.sub_country || course.country}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
