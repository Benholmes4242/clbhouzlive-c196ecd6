/**
 * AddToPlayedModal - RATINGS-ONLY: "Rate Course" modal
 * No longer writes to user_top100_courses - rating IS the played status
 * Uses Radix Slider with rating-slider-primary class and slate/gold styling.
 */
import React, { useState } from 'react';
import { invalidateCourseRatingCaches } from '@/utils/invalidateCourseRatingCaches';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';
import { getScoreTier, isGoldTier } from '@/utils/getScoreTier';
import { getMediaType, isVideoFile } from '@/utils/getMediaType';
import { useOptimisticRatingUpdate } from '@/hooks/useOptimisticRatingUpdate';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

interface AddToPlayedModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddToPlayedModal = ({ course, isOpen, onClose, onSuccess }: AddToPlayedModalProps) => {
  
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { optimisticNewRating, rollback, scheduleBackgroundSync } = useOptimisticRatingUpdate();
  
  const [rating, setRating] = useState<number[]>([7]);
  const [review, setReview] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RATINGS-ONLY: Only write to course_ratings - no user_top100_courses
  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      // Add rating (this IS marking as played in ratings-only system)
      const { data: ratingData, error: ratingError } = await supabase
        .from('course_ratings')
        .upsert({
          course_id: course.id,
          user_id: user.id,
          rating: rating[0],
          review: review.trim() || null,
          review_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (ratingError) throw ratingError;

      // Upload media files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', file.name);
          
          if (!uploadResult.success || !uploadResult.publicUrl) {
            throw new Error(uploadResult.error || 'Upload failed');
          }

          await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingData.id,
              media_url: uploadResult.publicUrl,
              media_type: isVideoFile(file) ? 'video' : 'image',
              file_name: file.name,
              file_size: file.size,
            });
        }
      }

      // Trigger badge checking
      try {
        await supabase.rpc('check_and_award_badges', { user_id_param: user.id });
      } catch (error) {
        console.error('Error checking badges:', error);
      }

      // Remove from want_to_play shortlist (if present) now that course is played
      try {
        await supabase
          .from('course_shortlists')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .eq('list_key', 'want_to_play');
      } catch (error) {
        console.error('Error removing from want_to_play:', error);
        // Non-blocking - rating is still successful
      }
    },
    onMutate: async () => {
      // Optimistic update: instant UI feedback for new rating
      return await optimisticNewRating(course.id, rating[0]);
    },
    onSuccess: async () => {
      // Invalidate all course rating caches via shared helper
      invalidateCourseRatingCaches(queryClient);

      // Force refetch active feed queries for immediate card updates
      await queryClient.refetchQueries({ queryKey: ['golf-courses-infinite'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['top100CoursesByRegion'], exact: false, type: 'active' });
      await queryClient.refetchQueries({ queryKey: ['explore-courses'], exact: false, type: 'active' });
      
      toast.success("Rating saved");
      onSuccess();
      onClose();
      setRating([7]);
      setReview('');
      setUploadedFiles([]);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      rollback(context);
      console.error('Error adding rating:', error);
      toast.error("Couldn't submit rating", { description: "Please try again" });
    },
    onSettled: () => {
      // Schedule a background sync to ensure eventual consistency
      scheduleBackgroundSync(course.id, 10000);
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitRatingMutation.mutateAsync();
    setIsSubmitting(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const mediaType = getMediaType(file);
      return mediaType === 'image' || mediaType === 'video';
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {course.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Rating</Label>
            <div className="space-y-2">
              <Slider
                min={0.5}
                max={10}
                step={0.5}
                value={rating}
                onValueChange={setRating}
                className="w-full rating-slider-primary"
                data-tier={isGoldTier(getScoreTier(rating[0]).tier) ? 'outstanding' : undefined}
              />
              <div className={`text-center text-2xl font-bold ${
                isGoldTier(getScoreTier(rating[0]).tier)
                  ? 'text-[#C9A94A]' 
                  : 'text-slate-800'
              }`}>
                {rating[0]}
              </div>
            </div>
          </div>

          {/* Review */}
          <div className="space-y-3">
            <Label htmlFor="review" className="text-base font-medium">Review (optional)</Label>
            <Textarea
              id="review"
              placeholder="Write your review..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Media Upload */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Photos & Videos (Optional)</Label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-sq-sm p-4">
                <label htmlFor="media-upload" className="cursor-pointer block text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload photos or videos
                  </span>
                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-muted hover:bg-muted/80 active:bg-muted/60 text-muted-foreground hover:text-foreground transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Rating...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlayedModal;