
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
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EditRatingModalProps {
  courseId: string;
  courseName: string;
  currentRating: number;
  currentReview: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditRatingModal = ({ 
  courseId, 
  courseName, 
  currentRating,
  currentReview,
  isOpen,
  onClose
}: EditRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number>(currentRating);
  const [review, setReview] = useState(currentReview || '');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRatingMutation = useMutation({
    mutationFn: async ({ rating, reviewText }: { rating: number; reviewText: string }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      
      toast({
        title: "Rating Updated!",
        description: `You updated your rating for ${courseName} to ${selectedRating}/10`,
      });
      
      setIsSubmitting(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error updating rating:', error);
      toast({
        title: "Error",
        description: "Failed to update rating. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      
      toast({
        title: "Rating Removed",
        description: `You removed your rating for ${courseName}`,
      });
      
      setIsSubmitting(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error deleting rating:', error);
      toast({
        title: "Error",
        description: "Failed to remove rating. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleUpdate = () => {
    setIsSubmitting(true);
    updateRatingMutation.mutate({ 
      rating: selectedRating, 
      reviewText: review.trim() 
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove your rating and review?')) {
      setIsSubmitting(true);
      deleteRatingMutation.mutate();
    }
  };

  // Generate rating options from 0.5 to 10 in 0.5 increments
  const ratingOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Rating</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Rating Section */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Update your rating</p>
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
                    (hoveredRating === null && rating <= selectedRating)
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

            <div className="text-center">
              <Badge variant="secondary" className="text-sm">
                Selected: {selectedRating}/10
              </Badge>
            </div>
          </div>

          {/* Review Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Update your review (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this course..."
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
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Removing..." : "Remove Rating"}
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Updating..." : "Update Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRatingModal;
