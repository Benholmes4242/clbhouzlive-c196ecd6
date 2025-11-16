
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
                <ClubhouseLogo size="sm" showTooltip />
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
              Review (Optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell other golfers what stood out – routing, conditioning, greens, hospitality…"
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {review.length}/500
            </div>
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
                    className={`flex-1 h-8 rounded transition-all ${
                      (hoveredBreakdown?.type === 'design' && value <= hoveredBreakdown.value) || 
                      (designScore && value <= designScore)
                        ? 'bg-primary'
                        : 'bg-muted hover:bg-muted-foreground/20'
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
                    className={`flex-1 h-8 rounded transition-all ${
                      (hoveredBreakdown?.type === 'condition' && value <= hoveredBreakdown.value) || 
                      (conditionScore && value <= conditionScore)
                        ? 'bg-primary'
                        : 'bg-muted hover:bg-muted-foreground/20'
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
                    className={`flex-1 h-8 rounded transition-all ${
                      (hoveredBreakdown?.type === 'facilities' && value <= hoveredBreakdown.value) || 
                      (facilitiesScore && value <= facilitiesScore)
                        ? 'bg-primary'
                        : 'bg-muted hover:bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
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
