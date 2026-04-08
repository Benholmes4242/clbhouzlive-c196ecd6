import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getScoreTier } from '@/utils/getScoreTier';

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
  currentClubhouseScore?: number | null;
  currentFacilitiesScore?: number | null;
}

const EditRatingModal = ({ 
  courseId, 
  courseName, 
  currentRating,
  currentReview,
  currentDesignScore,
  currentConditionScore,
  currentClubhouseScore,
  currentFacilitiesScore,
  isOpen,
  onClose
}: ExtendedEditRatingModalProps) => {
  
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(currentRating);
  const [review, setReview] = useState(currentReview || '');
  const [designScore, setDesignScore] = useState<number | null>(currentDesignScore || null);
  const [conditionScore, setConditionScore] = useState<number | null>(currentConditionScore || null);
  const [clubhouseScore, setClubhouseScore] = useState<number | null>(currentClubhouseScore || null);
  const [facilitiesScore, setFacilitiesScore] = useState<number | null>(currentFacilitiesScore || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayRating = rating ?? 5; // default thumb position if unset

  const updateRatingMutation = useMutation({
    mutationFn: async ({ 
      rating: ratingValue, 
      reviewText, 
      design, 
      condition, 
      clubhouse,
      facilities 
    }: { 
      rating: number; 
      reviewText: string;
      design: number | null;
      condition: number | null;
      clubhouse: number | null;
      facilities: number | null;
    }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('course_ratings')
        .update({ 
          rating: ratingValue, 
          review: reviewText || null,
          design_score: design,
          condition_score: condition,
          clubhouse_score: clubhouse,
          facilities_score: facilities,
          updated_at: new Date().toISOString() 
        })
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-detailed', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
      
      // Invalidate Top 10 carousel ratings so updated scores show immediately
      queryClient.invalidateQueries({ queryKey: ['user-course-ratings-breakdown'], exact: false });
      
      // Force refetch community aggregates to update card ratings immediately
      await queryClient.refetchQueries({ 
        queryKey: ['course-rating-aggregates', courseId] 
      });
      
      // Invalidate AND refetch feed caches so cards update immediately
      queryClient.invalidateQueries({ queryKey: ['golf-courses-infinite'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['golf-courses-search'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['friends-courses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['explore-courses'], exact: false });
      
      // Force refetch the feed queries to show updated ratings
      await queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
      
      toast.success("Rating updated", { description: `You updated your rating for ${courseName} to ${rating}` });
      
      setIsSubmitting(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error updating rating:', error);
      toast.error("Couldn't update rating", { description: "Please try again" });
      setIsSubmitting(false);
    },
  });

  const deleteRatingMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      // Find the rating ID for cleanup of related records
      const { data: ratingRow } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();

      if (ratingRow?.id) {
        // Delete shared posts linked to this review
        await supabase
          .from('posts')
          .delete()
          .eq('source_review_id', ratingRow.id);

        // Delete associated notifications
        await supabase
          .from('notifications')
          .delete()
          .eq('entity_id', ratingRow.id)
          .eq('type', 'friend_course_review');
      }

      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id);
      
      if (error) throw error;
    },
    onSuccess: async () => {
      // Invalidate all course rating caches via shared helper
      invalidateCourseRatingCaches(queryClient);

      // Additional delete-specific invalidations
      queryClient.invalidateQueries({ queryKey: ['golf-courses-search'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-exploration-status'], exact: false });

      // Force refetch critical queries
      await queryClient.refetchQueries({ queryKey: ['course-rating-aggregates', courseId] });
      await queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['userProfile'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['userTop100Courses'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-played-courses-full'], type: 'active', exact: false });
      await queryClient.refetchQueries({ queryKey: ['user-top-ten-courses'], type: 'active', exact: false });

      toast.success("Rating removed");
      
      setIsSubmitting(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error deleting rating:', error);
      toast.error("Couldn't remove rating", { description: "Please try again" });
      setIsSubmitting(false);
    },
  });

  const handleUpdate = () => {
    if (rating === null) return;
    setIsSubmitting(true);
    updateRatingMutation.mutate({ 
      rating, 
      reviewText: review,
      design: designScore,
      condition: conditionScore,
      clubhouse: clubhouseScore,
      facilities: facilitiesScore
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove your rating and review?')) {
      setIsSubmitting(true);
      deleteRatingMutation.mutate();
    }
  };

  // Truncate course name
  const MAX_NAME = 28;
  const shortName =
    courseName.length > MAX_NAME
      ? courseName.slice(0, MAX_NAME).trimEnd() + '…'
      : courseName;

  const title = `Rate ${shortName}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full rounded-t-3xl sm:rounded-3xl bg-card border border-border shadow-lg px-4 pb-5 pt-4 sm:px-6 sm:pt-5 sm:pb-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <DialogHeader className="mb-3 text-center">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground text-center">
            Choose a score from 0.5 to 10 and optionally leave a review.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Your rating readout + slider */}
          <section className="mb-4">
            <div className="flex items-baseline justify-between mb-1">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Your overall rating
                </p>
                <p className="text-2xl font-semibold">
                  {rating !== null ? rating.toFixed(1) : '--'}{' '}
                  <span className="text-sm text-muted-foreground">/ 10</span>
                </p>
              </div>
              {rating !== null && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear rating
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Slider
                min={0.5}
                max={10}
                step={0.5}
                value={[displayRating]}
                onValueChange={(values) => setRating(values[0])}
                className="w-full rating-slider-primary"
                data-tier={rating !== null && getScoreTier(rating).tier === 'outstanding' ? 'outstanding' : undefined}
              />

              {/* tick labels */}
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0.5</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span>9</span>
                <span>10</span>
              </div>
            </div>

            {/* selected pill */}
            <div className="mt-2 flex justify-center">
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs",
                rating !== null && getScoreTier(rating).tier === 'outstanding'
                  ? "bg-[#C9A94A] text-white"
                  : "bg-slate-900 text-white"
              )}>
                {rating !== null ? `Selected: ${rating.toFixed(1)} / 10` : 'No rating selected yet'}
              </span>
            </div>
          </section>

          {/* Review textarea */}
          <section className="mt-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-sm font-medium">Share your thoughts</p>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>

            <div className="relative">
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-border bg-surface-alt px-3.5 py-3 text-sm
                          placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-primary/60 focus-visible:border-transparent transition-shadow resize-none"
                placeholder="Tell other golfers what stood out – routing, conditioning, greens, hospitality..."
                disabled={isSubmitting}
                maxLength={4000}
              />
              <span className="absolute right-3 bottom-2 text-[11px] text-muted-foreground">
                {review.length}/4000
              </span>
            </div>
          </section>

          {/* Breakdown section */}
          <section className="mt-5 border-t border-border pt-4 space-y-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Breakdown (optional)
            </p>

            {[
              { key: 'design', label: 'Course Design', score: designScore, setScore: setDesignScore },
              { key: 'condition', label: 'Course Condition', score: conditionScore, setScore: setConditionScore },
              { key: 'clubhouse', label: 'Clubhouse', score: clubhouseScore, setScore: setClubhouseScore },
              { key: 'facilities', label: 'Facilities', score: facilitiesScore, setScore: setFacilitiesScore },
            ].map(({ key, label, score, setScore }) => {
              const displayValue = score ?? 5; // centre if unset
              const formatScore = (value: number | null) =>
                value == null ? '--' : value.toFixed(1);
              
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">{label}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatScore(score)} / 10
                    </span>
                  </div>

                  <Slider
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={[displayValue]}
                    onValueChange={(values) => setScore(values[0])}
                    className="w-full rating-slider-breakdown"
                    data-tier={score != null && getScoreTier(score).tier === 'outstanding' ? 'outstanding' : undefined}
                  />

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>0.5</span>
                    <span>3</span>
                    <span>5</span>
                    <span>7</span>
                    <span>9</span>
                    <span>10</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Buttons */}
          <section className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleDelete}
              className="w-full rounded-2xl bg-destructive text-destructive-foreground py-3 text-sm font-medium
                        hover:bg-destructive/90 transition-colors"
              disabled={isSubmitting}
            >
              Remove rating
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-border bg-surface-alt py-3 text-sm font-medium
                          hover:bg-surface-muted transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={rating === null || isSubmitting}
                onClick={handleUpdate}
                className="flex-1 rounded-2xl bg-slate-800 text-white py-3 text-sm font-semibold
                          disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update rating'}
              </button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRatingModal;
