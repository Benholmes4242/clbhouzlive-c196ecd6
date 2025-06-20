
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseRatingSystemProps {
  courseId: string;
  courseName: string;
  currentRating: number | null;
  hasRated: boolean;
}

const CourseRatingSystem = ({ 
  courseId, 
  courseName, 
  currentRating, 
  hasRated 
}: CourseRatingSystemProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      if (hasRated) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('course_id', courseId)
          .eq('user_id', userResponse.user.id);
        
        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('course_ratings')
          .insert({
            course_id: courseId,
            user_id: userResponse.user.id,
            rating
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, rating) => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      toast({
        title: hasRated ? "Rating Updated!" : "Rating Submitted!",
        description: `You rated ${courseName} ${rating}/10`,
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleRatingClick = (rating: number) => {
    setIsSubmitting(true);
    submitRatingMutation.mutate(rating);
  };

  const ratings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {hasRated ? 'Update your rating:' : 'Rate this course:'}
        {currentRating && (
          <span className="ml-2 font-medium">
            Current: {currentRating}/10
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {ratings.map((rating) => (
          <Button
            key={rating}
            variant={
              (hoveredRating !== null && rating <= hoveredRating) ||
              (hoveredRating === null && currentRating !== null && rating <= currentRating)
                ? "default"
                : "outline"
            }
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleRatingClick(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={isSubmitting}
          >
            {rating}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Star className="h-3 w-3" />
        <span>Rate from 0.5 to 10 in 0.5 increments</span>
      </div>
    </div>
  );
};

export default CourseRatingSystem;
