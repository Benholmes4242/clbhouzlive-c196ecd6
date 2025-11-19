
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
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface EditRatingModalProps {
  courseId: string;
  courseName: string;
  currentRating: number;
  currentReview: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ExtendedEditRatingModalProps extends EditRatingModalProps {
  currentDesignScore?: number | null;
  currentConditionScore?: number | null;
  currentFacilitiesScore?: number | null;
}

const EditRatingModal = ({ 
  courseId, 
  courseName, 
  currentRating,
  currentReview,
  currentDesignScore,
  currentConditionScore,
  currentFacilitiesScore,
  isOpen,
  onClose
}: ExtendedEditRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number>(currentRating);
  const [review, setReview] = useState(currentReview || '');
  const [designScore, setDesignScore] = useState<number | null>(currentDesignScore || null);
  const [conditionScore, setConditionScore] = useState<number | null>(currentConditionScore || null);
  const [facilitiesScore, setFacilitiesScore] = useState<number | null>(currentFacilitiesScore || null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hoveredBreakdown, setHoveredBreakdown] = useState<{ type: string; value: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRatingMutation = useMutation({
    mutationFn: async ({ 
      rating, 
      reviewText, 
      design, 
      condition, 
      facilities 
    }: { 
      rating: number; 
      reviewText: string;
      design: number | null;
      condition: number | null;
      facilities: number | null;
    }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_ratings')
        .update({ 
          rating, 
          review: reviewText || null,
          design_score: design,
          condition_score: condition,
          facilities_score: facilities,
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
      queryClient.invalidateQueries({ queryKey: ['course-reviews-detailed', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
      
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
      reviewText: review,
      design: designScore,
      condition: conditionScore,
      facilities: facilitiesScore
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
      <DialogContent className="max-w-lg w-full rounded-2xl border border-border/60 bg-card shadow-xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold">Edit your rating</DialogTitle>
          <p className="text-xs text-muted-foreground">Rate from 0.5 to 10 and optionally leave a review.</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Rating Section */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Select a score</p>
            <div className="flex flex-wrap gap-2">
              {ratingOptions.map((rating) => {
                const isSelected = rating === selectedRating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSelectedRating(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    disabled={isSubmitting}
                    className={`min-w-[44px] px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      (hoveredRating !== null && rating <= hoveredRating) ||
                      (hoveredRating === null && isSelected)
                        ? 'bg-surface-slate text-card-foreground border-transparent'
                        : 'bg-surface-alt text-foreground border-border/60 hover:bg-card'
                    }`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface-slate text-card-foreground text-xs font-medium">
              Selected: {selectedRating}/10
            </div>
          </div>

          {/* Review Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Share your thoughts (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell other golfers what stood out – routing, conditioning, greens, hospitality..."
              className="mt-3 bg-card border-border/60 text-sm placeholder:text-muted-foreground/70 min-h-[80px] resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <p className="mt-1 text-[11px] text-muted-foreground text-right">
              {review.length}/500
            </p>
          </div>

          {/* Breakdown Scores */}
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Breakdown (Optional)</p>
            
            {/* Course Design */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Course Design</span>
                {designScore && <span className="text-muted-foreground">{designScore}/10</span>}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDesignScore(value)}
                    onMouseEnter={() => setHoveredBreakdown({ type: 'design', value })}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                    disabled={isSubmitting}
                    className={`flex-1 h-8 rounded-md text-xs font-medium border transition-colors ${
                      (hoveredBreakdown?.type === 'design' && value <= hoveredBreakdown.value) || 
                      (designScore && value <= designScore)
                        ? 'bg-surface-slate text-card-foreground border-transparent'
                        : 'bg-surface-alt text-foreground border-border/60 hover:bg-card'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Course Condition */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Course Condition</span>
                {conditionScore && <span className="text-muted-foreground">{conditionScore}/10</span>}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setConditionScore(value)}
                    onMouseEnter={() => setHoveredBreakdown({ type: 'condition', value })}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                    disabled={isSubmitting}
                    className={`flex-1 h-8 rounded-md text-xs font-medium border transition-colors ${
                      (hoveredBreakdown?.type === 'condition' && value <= hoveredBreakdown.value) || 
                      (conditionScore && value <= conditionScore)
                        ? 'bg-surface-slate text-card-foreground border-transparent'
                        : 'bg-surface-alt text-foreground border-border/60 hover:bg-card'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Facilities</span>
                {facilitiesScore && <span className="text-muted-foreground">{facilitiesScore}/10</span>}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFacilitiesScore(value)}
                    onMouseEnter={() => setHoveredBreakdown({ type: 'facilities', value })}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                    disabled={isSubmitting}
                    className={`flex-1 h-8 rounded-md text-xs font-medium border transition-colors ${
                      (hoveredBreakdown?.type === 'facilities' && value <= hoveredBreakdown.value) || 
                      (facilitiesScore && value <= facilitiesScore)
                        ? 'bg-surface-slate text-card-foreground border-transparent'
                        : 'bg-surface-alt text-foreground border-border/60 hover:bg-card'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <Button
              type="button"
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Remove rating
            </Button>

            <div className="flex-1 flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
                onClick={handleUpdate}
              >
                {isSubmitting ? "Updating..." : "Update rating"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRatingModal;
