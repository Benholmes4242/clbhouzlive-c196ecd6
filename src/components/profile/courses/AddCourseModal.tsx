/**
 * AddCourseModal - Bottom sheet for adding courses to Top 10
 * 
 * Features:
 * - Proper bottom sheet with rounded corners, drag handle, slide-up animation
 * - Fixed search: searches user's played courses directly (not all courses)
 * - Two-path flow:
 *   A) Rated courses → Add immediately
 *   B) Unrated courses → Prompt to rate first
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserCourseActivity } from '@/hooks/useUserCourseActivity';
import { useUserTopTenCourses } from '@/hooks/useUserTopTenCourses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Star, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/hooks/use-toast';

interface AddCourseModalProps {
  userId: string;
  onClose: () => void;
  existingCourseIds: string[];
}

interface CourseWithRating {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  thumbnail_image?: string;
  rating_value: number | null;
  has_rating: boolean;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  userId,
  onClose,
  existingCourseIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: userActivity = [] } = useUserCourseActivity(userId);
  const { addCourse, topTen } = useUserTopTenCourses(userId);

  // Get all played course IDs (not already in Top 10)
  const playedCourseIds = useMemo(() => {
    return userActivity
      .filter(a => !existingCourseIds.includes(a.course_id))
      .map(a => a.course_id);
  }, [userActivity, existingCourseIds]);

  // Fetch course details for ALL played courses
  const { data: playedCourses = [], isLoading } = useQuery({
    queryKey: ['user-played-courses-for-top10', userId, playedCourseIds],
    enabled: playedCourseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image')
        .in('id', playedCourseIds);

      if (error) throw error;

      // Merge with activity data to get ratings
      return (data || []).map(course => {
        const activity = userActivity.find(a => a.course_id === course.id);
        return {
          ...course,
          rating_value: activity?.rating_value ?? null,
          has_rating: activity?.has_rating ?? false,
        } as CourseWithRating;
      });
    },
    staleTime: 60_000,
  });

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return playedCourses;
    
    const query = searchQuery.toLowerCase().trim();
    return playedCourses.filter(course => 
      course.name.toLowerCase().includes(query) ||
      course.country?.toLowerCase().includes(query) ||
      course.sub_country?.toLowerCase().includes(query)
    );
  }, [playedCourses, searchQuery]);

  // Separate rated and unrated courses
  const ratedCourses = useMemo(() => 
    filteredCourses.filter(c => c.has_rating).sort((a, b) => 
      (b.rating_value || 0) - (a.rating_value || 0)
    ), [filteredCourses]);
  
  const unratedCourses = useMemo(() => 
    filteredCourses.filter(c => !c.has_rating), [filteredCourses]);

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

  const handleRateFirst = (courseId: string) => {
    onClose();
    navigate(`/courses/${courseId}?action=rate`);
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      zIndexBase={1400}
      ariaLabelledBy="add-course-title"
      className="max-h-[85vh]"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header with close button */}
      <div className="flex items-center justify-between px-5 pb-3">
        <h2 id="add-course-title" className="text-lg font-semibold text-foreground">
          Add Course to Top 10
        </h2>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-5 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your played courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(85vh - 160px)' }}>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading your courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'No matching courses found in your played courses'
              : playedCourses.length === 0
                ? "You haven't played any courses yet. Play and rate courses to add them to your Top 10."
                : 'Start typing to search your played courses'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rated courses section */}
            {ratedCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Your rated courses
                </h3>
                <div className="space-y-2">
                  {ratedCourses.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onAction={() => handleAddCourse(course.id)}
                      actionLabel="Add to Top 10"
                      actionIcon={<Plus className="w-4 h-4" />}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Unrated courses section */}
            {unratedCourses.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Rate to add
                </h3>
                <div className="space-y-2">
                  {unratedCourses.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onAction={() => handleRateFirst(course.id)}
                      actionLabel="Rate first"
                      actionIcon={<Star className="w-4 h-4" />}
                      isSecondary
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

// Course row component
interface CourseRowProps {
  course: CourseWithRating;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isSecondary?: boolean;
}

const CourseRow: React.FC<CourseRowProps> = ({
  course,
  onAction,
  actionLabel,
  actionIcon,
  isSecondary = false,
}) => (
  <div className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border/50">
    {course.thumbnail_image && (
      <img
        src={course.thumbnail_image}
        alt={course.name}
        className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate text-sm">{course.name}</div>
      <div className="text-xs text-muted-foreground truncate">
        {course.sub_country || course.country}
      </div>
      {course.has_rating && course.rating_value && (
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {course.rating_value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
    <Button
      size="sm"
      variant={isSecondary ? "outline" : "default"}
      onClick={onAction}
      className="flex-shrink-0 gap-1.5"
    >
      {actionIcon}
      <span className="hidden sm:inline">{actionLabel}</span>
    </Button>
  </div>
);
