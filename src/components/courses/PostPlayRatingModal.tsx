
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

interface PostPlayRatingModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

const PostPlayRatingModal = ({ course, isOpen, onClose }: PostPlayRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, reviewText }: { rating: number; reviewText: string }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      const { error } = await supabase
        .from('course_ratings')
        .insert({
          course_id: course.id,
          user_id: userResponse.user.id,
          rating,
          review: reviewText || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      
      setShowConfirmation(true);
      setIsSubmitting(false);
      
      toast({
        title: "Rating Submitted! ✨",
        description: `You rated ${course?.name} ${selectedRating}/10`,
      });
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

  const handleSkip = () => {
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedRating(null);
    setReview('');
    setHoveredRating(null);
    setShowConfirmation(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Generate rating options from 0.5 to 10 in 0.5 increments
  const ratingOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                🟩 You've played {course.name}!
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Would you like to rate and review it now?
              </p>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Course Image */}
              {course.thumbnail_image && (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={course.thumbnail_image}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Rating Section */}
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">How would you rate your experience?</p>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Rate from 0.5 to 10</span>
                  </div>
                </div>

                {/* Rating Buttons */}
                <div className="flex flex-wrap gap-1 justify-center">
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

                {selectedRating && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-sm">
                      Selected: {selectedRating}/10
                    </Badge>
                  </div>
                )}
              </div>

              {/* Review Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Share your thoughts (optional)
                </label>
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="What made this course stand out (or not) for you?"
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {review.length}/500
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Skip for now
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedRating}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Rating"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Confirmation Screen */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Review Saved! ✔</h3>
              <p className="text-muted-foreground text-sm">
                Thank you for sharing your experience with {course.name}
              </p>
            </div>

            {/* Rating Preview */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
                <span className="font-bold text-lg">{selectedRating}/10</span>
              </div>
              {review && (
                <p className="text-sm text-muted-foreground italic">
                  "{review}"
                </p>
              )}
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostPlayRatingModal;
