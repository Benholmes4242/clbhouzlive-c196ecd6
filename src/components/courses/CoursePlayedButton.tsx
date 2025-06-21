
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
  showButton?: boolean; // New prop to control button visibility
}

const CoursePlayedButton = ({ 
  courseId, 
  courseName, 
  userCourse, 
  canModifyCourseStatus, 
  currentUserId,
  viewingUserId,
  course,
  showButton = true // Default to true for backward compatibility
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

      if (userCourse) {
        const { error } = await supabase
          .from('user_courses')
          .update({ played: !userCourse.played })
          .eq('id', userCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_courses')
          .insert({
            course_id: courseId,
            user_id: currentUserId,
            played: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      
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

  return (
    <>
      <div className="absolute top-3 right-3">
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
