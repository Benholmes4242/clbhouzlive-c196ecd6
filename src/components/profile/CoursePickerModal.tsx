import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CountryFlag from '@/components/ui/country-flag';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country: string | null;
  region: string | null;
  global_rank: number | null;
  regional_rank: number | null;
}

interface CoursePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  region: string;
  onCoursesAdded: () => void;
}

const CoursePickerModal: React.FC<CoursePickerModalProps> = ({
  isOpen,
  onClose,
  userId,
  region,
  onCoursesAdded
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  

  // Get all courses for the region
  const { data: allCourses = [] } = useQuery({
    queryKey: ['coursePickerCourses', region],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, region, global_rank, regional_rank');

      if (region === 'britain-ireland') {
        query = query.eq('country', 'Britain & Ireland').not('regional_rank', 'is', null);
      } else if (region === 'usa') {
        query = query.eq('country', 'USA').not('regional_rank', 'is', null);
      } else if (region === 'europe') {
        query = query.eq('country', 'Continental Europe').not('regional_rank', 'is', null);
      } else {
        query = query.not('global_rank', 'is', null);
      }

      const { data, error } = await query.order(
        region === 'global' ? 'global_rank' : 'regional_rank'
      );
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Get user's played courses (ratings-only: single source of truth)
  const { data: playedCourses = [] } = useQuery({
    queryKey: ['userPlayedCourses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id')
        .eq('user_id', userId)
        .not('rating', 'is', null);

      if (error) throw error;
      return data?.map(pc => pc.course_id) || [];
    },
    enabled: isOpen && !!userId,
  });

  // Filter courses to only show unplayed ones
  const availableCourses = useMemo(() => {
    const playedSet = new Set(playedCourses);
    return allCourses.filter(course => !playedSet.has(course.id));
  }, [allCourses, playedCourses]);

  // Filter courses by search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return availableCourses;
    
    return availableCourses.filter(course => 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.sub_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCourses, searchTerm]);

  const handleCourseToggle = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedCourses.size === 0) return;

    setIsSubmitting(true);
    try {
      // RATINGS-ONLY: Insert to course_ratings instead of user_top100_courses
      // Each course gets a default rating that the user can edit later
      const ratingsToInsert = Array.from(selectedCourses).map(courseId => ({
        user_id: userId,
        course_id: courseId,
        rating: 7.0, // Default neutral rating - user can edit later
        review: null,
        is_mock: false
      }));

      const { error } = await supabase
        .from('course_ratings')
        .upsert(ratingsToInsert, { onConflict: 'user_id,course_id' });

      if (error) throw error;

      toast.success("Courses Added!", { description: `Added ${selectedCourses.size} course${selectedCourses.size > 1 ? 's' : ''} with default rating. Tap to edit your rating.` });

      onCoursesAdded();
      setSelectedCourses(new Set());
      onClose();
    } catch (error) {
      console.error('Error adding courses:', error);
      toast.error("Error", { description: "Failed to add courses. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle>Add Courses to Your List</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedCourses.size > 0 && (
          <div className="mb-4">
            <Badge variant="secondary">
              {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''} selected
            </Badge>
          </div>
        )}

        {/* Course list */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {filteredCourses.map((course) => {
              const isSelected = selectedCourses.has(course.id);
              const rank = region === 'global' ? course.global_rank : course.regional_rank;
              
              return (
                <div
                  key={course.id}
                  className={`flex items-center space-x-3 p-3 rounded-sq-sm border cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleCourseToggle(course.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleCourseToggle(course.id)}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <CountryFlag 
                      country={course.country} 
                      size="sm" 
                    />
                    <Badge variant="outline" className="text-xs">
                      #{rank}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.sub_country || course.country}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={selectedCourses.size === 0 || isSubmitting}
            className="min-w-32"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedCourses.size > 0 ? `${selectedCourses.size} ` : ''}Course{selectedCourses.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePickerModal;