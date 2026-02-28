import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import MediaFileHandler from '@/components/posts/MediaFileHandler';
import MediaPreview from '@/components/posts/MediaPreview';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { useOptimisticRatingUpdate } from '@/hooks/useOptimisticRatingUpdate';

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
  
  const queryClient = useQueryClient();
  const { optimisticNewRating, rollback, scheduleBackgroundSync } = useOptimisticRatingUpdate();
  const [selectedRating, setSelectedRating] = useState<number | null>(currentRating);
  const [review, setReview] = useState(currentReview || '');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, reviewText, files }: { rating: number; reviewText: string; files: File[] }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) throw new Error('Not authenticated');

      // Insert the rating first
      const { data: ratingData, error: ratingError } = await supabase
        .from('course_ratings')
        .insert({
          course_id: courseId,
          user_id: userResponse.user.id,
          rating,
          review: reviewText || null
        })
        .select()
        .single();

      if (ratingError) throw ratingError;

      // Upload media files if any
      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          
          // Upload to Cloudflare R2 instead of Supabase storage
          const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-course-images', fileName);

          if (!uploadResult.success || !uploadResult.publicUrl) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          console.log(`Successfully uploaded ${file.name}`);
        });

        await Promise.all(uploadPromises);
      }
    },
    onMutate: async ({ rating }) => {
      // Optimistic update: instant UI feedback for new rating
      return await optimisticNewRating(courseId, rating);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
      
      // Invalidate Top 10 carousel ratings so updated scores show immediately
      queryClient.invalidateQueries({ queryKey: ['user-course-ratings-breakdown'], exact: false });
      
      // Invalidate Course History queries so rating changes reflect immediately
      queryClient.invalidateQueries({ queryKey: ['user-course-activity'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-played-courses-full'], exact: false });
      
      // Force refetch community aggregates
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
      
      toast.success("Rating submitted");
      
      setIsSubmitting(false);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      rollback(context);
      console.error('Error submitting rating:', error);
      toast.error("Error", { description: "Failed to submit rating. Please try again." });
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Schedule a background sync to ensure eventual consistency
      scheduleBackgroundSync(courseId, 10000);
    },
  });

  const handleSubmit = () => {
    if (!selectedRating) {
      toast.error("Rating Required", { description: "Please select a rating before submitting." });
      return;
    }

    setIsSubmitting(true);
    submitRatingMutation.mutate({ 
      rating: selectedRating, 
      reviewText: review.trim(),
      files: mediaFiles
    });
  };

  const handleFilesSelected = (files: File[]) => {
    setMediaFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Generate rating options from 0.5 to 10 in 0.5 increments
  const ratingOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  return (
    <div className="space-y-4">
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Select a score</p>
        <div className="flex flex-wrap gap-2">
          {ratingOptions.map((value) => {
            const isSelected = value === selectedRating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(null)}
                disabled={isSubmitting}
                className={`h-10 w-12 rounded-xl text-sm font-medium border transition-colors ${
                  (hoveredRating !== null && value <= hoveredRating) ||
                  (hoveredRating === null && isSelected)
                    ? 'bg-slate-900 text-white border-transparent shadow-sm'
                    : 'bg-muted border-border/60 hover:bg-card'
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-slate-900 text-xs font-medium text-background">
          Selected: {selectedRating ?? '—'}
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-2">
        <label className="text-body-sm font-medium text-foreground">
          Share your thoughts <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Tell other golfers what stood out – routing, conditioning, greens, hospitality..."
          className="bg-card border border-border/60 rounded-xl text-sm placeholder:text-muted-foreground min-h-[80px] resize-none"
          disabled={isSubmitting}
          maxLength={4000}
        />
        <p className="text-meta text-muted-foreground text-right">
          {review.length}/4000
        </p>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-2">
        <label className="text-body-sm font-medium text-foreground">
          Upload photos or videos <span className="text-muted-foreground">(optional)</span>
        </label>
        <MediaFileHandler onFilesSelected={handleFilesSelected} />
        <MediaPreview 
          mediaFiles={mediaFiles} 
          onRemoveFile={handleRemoveFile} 
        />
      </div>

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedRating}
        variant="default"
        className="w-full justify-center"
      >
        {isSubmitting ? "Submitting..." : "Submit rating"}
      </Button>
    </div>
  );
};

export default CourseRatingSystem;