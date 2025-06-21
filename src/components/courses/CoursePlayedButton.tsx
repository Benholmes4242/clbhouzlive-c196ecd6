
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserCourse {
  id: string;
  played: boolean;
  rating?: number;
}

interface CoursePlayedButtonProps {
  courseId: string;
  courseName: string;
  userCourse: UserCourse | null;
  canModifyCourseStatus: boolean;
  currentUserId?: string;
  viewingUserId?: string;
}

const CoursePlayedButton = ({ 
  courseId, 
  courseName, 
  userCourse, 
  canModifyCourseStatus, 
  currentUserId,
  viewingUserId 
}: CoursePlayedButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      toast({
        title: userCourse?.played ? "Removed from played courses" : "Added to played courses",
        description: userCourse?.played 
          ? `${courseName} removed from your played courses`
          : `${courseName} marked as played`,
      });
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

  return (
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
  );
};

export default CoursePlayedButton;
