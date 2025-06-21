
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoursePlayedButtonProps {
  courseId: string;
  userId: string;
}

const CoursePlayedButton = ({ courseId, userId }: CoursePlayedButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's current session to check if they can modify this course
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const currentUserId = session?.user?.id;
  const canModifyCourseStatus = currentUserId === userId;

  // Query to get user's course relationship
  const { data: userCourse } = useQuery({
    queryKey: ['user-course', courseId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['user-course', courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      toast({
        title: userCourse?.played ? "Removed from played courses" : "Added to played courses",
        description: userCourse?.played 
          ? "Course removed from your played courses"
          : "Course marked as played",
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
    e.stopPropagation();
    if (!canModifyCourseStatus) return;
    togglePlayedMutation.mutate();
  };

  if (!canModifyCourseStatus && !userCourse?.played) {
    return null;
  }

  return (
    <div>
      {canModifyCourseStatus ? (
        <Button
          size="sm"
          variant={userCourse?.played ? "default" : "secondary"}
          onClick={handleTogglePlayed}
          disabled={togglePlayedMutation.isPending}
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
        <Badge variant="default">
          <Check className="h-3 w-3 mr-1" />
          Played
        </Badge>
      ) : null}
    </div>
  );
};

export default CoursePlayedButton;
