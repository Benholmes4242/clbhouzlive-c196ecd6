
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PostPlayRatingModal from './PostPlayRatingModal';

interface UserCourse {
  id: string;
  played: boolean;
  rating?: number;
}

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

interface CoursePlayedButtonProps {
  courseId: string;
  courseName: string;
  userCourse: UserCourse | null;
  canModifyCourseStatus: boolean;
  currentUserId?: string;
  viewingUserId?: string;
  course?: Course;
  showButton?: boolean;
  variant?: 'overlay' | 'standalone'; // New prop to control display style
  positioning?: 'top-right' | 'bottom-right'; // New prop for positioning
}

const CoursePlayedButton = ({ 
  courseId, 
  courseName, 
  userCourse, 
  canModifyCourseStatus, 
  currentUserId,
  viewingUserId,
  course,
  showButton = true,
  variant = 'overlay', // Default to overlay for backward compatibility
  positioning = 'top-right' // Default to top-right for backward compatibility
}: CoursePlayedButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Don't render anything if showButton is false
  if (!showButton) {
    return null;
  }

  const togglePlayedMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not authenticated');
      if (!canModifyCourseStatus) throw new Error('Cannot modify other users courses');

      // First, get the course data to check if it's a top 100 course
      const { data: courseData, error: courseError } = await supabase
        .from('golf_courses')
        .select('global_rank, regional_rank, usa_rank')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const isTop100Course = courseData?.global_rank || courseData?.regional_rank || courseData?.usa_rank;

      if (userCourse) {
        // Update existing user_courses record
        const { error } = await supabase
          .from('user_courses')
          .update({ played: !userCourse.played })
          .eq('id', userCourse.id);
        if (error) throw error;

        // If it's a top 100 course, also manage user_top100_courses table
        if (isTop100Course) {
          if (!userCourse.played) {
            // Adding to played, so insert/update in user_top100_courses
            const { error: top100Error } = await supabase
              .from('user_top100_courses')
              .upsert({
                course_id: courseId,
                user_id: currentUserId,
                played: true,
                played_date: new Date().toISOString().split('T')[0],
              });
            if (top100Error) throw top100Error;
          } else {
            // Removing from played, so update user_top100_courses
            const { error: top100Error } = await supabase
              .from('user_top100_courses')
              .update({ played: false, played_date: null })
              .eq('course_id', courseId)
              .eq('user_id', currentUserId);
            if (top100Error) throw top100Error;
          }
        }
      } else {
        // Insert new user_courses record
        const { error } = await supabase
          .from('user_courses')
          .insert({
            course_id: courseId,
            user_id: currentUserId,
            played: true,
          });
        if (error) throw error;

        // If it's a top 100 course, also add to user_top100_courses
        if (isTop100Course) {
          const { error: top100Error } = await supabase
            .from('user_top100_courses')
            .upsert({
              course_id: courseId,
              user_id: currentUserId,
              played: true,
              played_date: new Date().toISOString().split('T')[0],
            });
          if (top100Error) throw top100Error;
        }
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['top100-courses'] });
      
      // Trigger badge checking for the user
      if (currentUserId) {
        try {
          await supabase.rpc('check_and_award_badges', { user_id_param: currentUserId });
        } catch (error) {
          console.error('Error checking badges:', error);
        }
      }
      
      // If marking as played (not unplaying), show rating modal
      if (!userCourse?.played) {
        toast({
          title: "Added to played courses",
          description: `${courseName} marked as played`,
        });
        
        // Trigger rating modal for newly played courses
        setTimeout(() => {
          setShowRatingModal(true);
        }, 500); // Small delay for smooth UX
      } else {
        toast({
          title: "Removed from played courses",
          description: `${courseName} removed from your played courses`,
        });
      }
    },
    onError: (error) => {
      console.error('Error updating course status:', error);
      toast({
        title: "Error",
        description: "Failed to update course status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTogglePlayed = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (!canModifyCourseStatus) return;
    togglePlayedMutation.mutate();
  };

  if (!canModifyCourseStatus && !userCourse?.played) {
    return null;
  }

  const courseForModal = course || {
    id: courseId,
    name: courseName,
    thumbnail_image: undefined
  };

  // Standalone variant for use in modals
  if (variant === 'standalone') {
    if (!canModifyCourseStatus && !userCourse?.played) {
      return null;
    }

    return (
      <>
        {canModifyCourseStatus ? (
          <Button
            size="lg"
            variant={userCourse?.played ? "outline" : "default"}
            onClick={handleTogglePlayed}
            disabled={togglePlayedMutation.isPending}
            className="min-w-[200px]"
          >
            {userCourse?.played ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Mark as Not Played
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                I've Played This Course
              </>
            )}
          </Button>
        ) : userCourse?.played ? (
          <Badge variant="default" className="text-sm px-4 py-2">
            <Check className="h-3 w-3 mr-1" />
            You've Played This Course
          </Badge>
        ) : null}

        {/* Rating Modal */}
        <PostPlayRatingModal
          course={courseForModal}
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
        />
      </>
    );
  }

  // Get positioning classes based on prop
  const getPositioningClasses = () => {
    switch (positioning) {
      case 'bottom-right':
        return 'absolute bottom-4 right-4 z-10';
      case 'top-right':
      default:
        return 'absolute top-3 right-3 z-10';
    }
  };

  // Original overlay variant for use in cards
  return (
    <>
      <div className={getPositioningClasses()}>
        {canModifyCourseStatus ? (
          <Button
            size="sm"
            variant={userCourse?.played ? "default" : "secondary"}
            onClick={handleTogglePlayed}
            disabled={togglePlayedMutation.isPending}
            className="shadow-lg"
          >
            {userCourse?.played ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Played
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </>
            )}
          </Button>
        ) : userCourse?.played ? (
          <Badge variant="default" className="shadow-lg">
            <Check className="h-3 w-3 mr-1" />
            Played
          </Badge>
        ) : null}
      </div>

      {/* Rating Modal */}
      <PostPlayRatingModal
        course={courseForModal}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
      />
    </>
  );
};

export default CoursePlayedButton;
