import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MediaFileHandler from '@/components/posts/MediaFileHandler';
import MediaPreview from '@/components/posts/MediaPreview';

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
          const uploadResult = await uploadToCloudflareR2(file, 'course-media', fileName);

          if (!uploadResult.success || !uploadResult.publicUrl) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          console.log(`Successfully uploaded ${file.name}`);
        });

        await Promise.all(uploadPromises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] });
      
      toast({
        title: "Rating Submitted! ✨",
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
      <div className="text-center">
        <p className="text-sm font-medium mb-2">Rate your experience</p>
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

      {/* Review Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Share your thoughts (optional)
        </label>
        <Textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What made this course stand out for you?"
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
          maxLength={500}
        />
        <div className="text-xs text-muted-foreground text-right">
          {review.length}/500
        </div>
      </div>

      {/* Media Upload Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Upload photos or videos (optional)
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
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  );
};

export default CourseRatingSystem;
