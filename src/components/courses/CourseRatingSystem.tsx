
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CourseRatingSystemProps {
  courseId: string;
  courseName: string;
  currentRating: number | null;
  currentReview: string | null;
  hasRated: boolean;
}

const CourseRatingSystem = ({ 
  courseId, 
  courseName, 
  currentRating, 
  currentReview,
  hasRated 
}: CourseRatingSystemProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number | null>(currentRating);
  const [review, setReview] = useState(currentReview || '');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, reviewText }: { rating: number; reviewText: string }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      if (hasRated) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({ 
            rating, 
            review: reviewText || null,
            updated_at: new Date().toISOString() 
          })
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
            rating,
            review: reviewText || null
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      toast({
        title: hasRated ? "Rating Updated!" : "Rating Submitted!",
        description: `You rated ${courseName} ${selectedRating}/10`,
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

  const handleSubmit = () => {
    if (!selectedRating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitRatingMutation.mutate({ 
      rating: selectedRating, 
      reviewText: review.trim() 
    });
  };

  // Generate rating options from 0.5 to 10 in 0.5 increments
  const ratingOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {hasRated ? 'Update your rating:' : 'Rate this course:'}
        {currentRating && (
          <span className="ml-2 font-medium">
            Current: {currentRating}/10
          </span>
        )}
      </div>

      {/* Rating Selector */}
      <div className="flex flex-wrap gap-1">
        {ratingOptions.map((rating) => (
          <Button
            key={rating}
            variant={
              (hoveredRating !== null && rating <= hoveredRating) ||
              (hoveredRating === null && selectedRating !== null && rating <= selectedRating)
                ? "default"
                : "outline"
            }
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setSelectedRating(rating)}
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={isSubmitting}
          >
            {rating}
          </Button>
        ))}
      </div>

      {/* Review Text Area */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Review (Optional)
        </label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your thoughts about this course..."
          className="min-h-[80px]"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedRating}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : hasRated ? "Update Rating" : "Submit Rating"}
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Star className="h-3 w-3" />
        <span>Rate from 0.5 to 10 in 0.5 increments</span>
      </div>
    </div>
  );
};

export default CourseRatingSystem;
