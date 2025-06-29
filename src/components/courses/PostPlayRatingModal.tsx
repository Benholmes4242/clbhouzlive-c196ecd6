
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Check, Trophy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReviewMediaUpload from './ReviewMediaUpload';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

interface PostPlayRatingModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  onRemoveFromPlayed?: () => void;
}

const PostPlayRatingModal = ({ 
  course, 
  isOpen, 
  onClose, 
  isEditMode = false, 
  onRemoveFromPlayed 
}: PostPlayRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [hasMarkedAsPlayed, setHasMarkedAsPlayed] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);

  const { data: existingRating } = useQuery({
    queryKey: ['user-course-rating', course?.id],
    queryFn: async () => {
      if (!course?.id) return null;
      
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching existing rating:', error);
        return null;
      }
      
      return data;
    },
    enabled: isEditMode && !!course?.id,
  });

  // Set initial values when existing rating is loaded
  useEffect(() => {
    if (existingRating && isEditMode) {
      setSelectedRating(existingRating.rating);
      setReview(existingRating.review || '');
    }
  }, [existingRating, isEditMode]);

  // Mark course as played when modal opens (if not in edit mode)
  useEffect(() => {
    if (isOpen && !isEditMode && !hasMarkedAsPlayed && course) {
      markAsPlayedMutation.mutate();
    }
  }, [isOpen, isEditMode, hasMarkedAsPlayed, course]);

  const markAsPlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      // Check if already in user_courses
      const { data: existingCourse, error: checkError } = await supabase
        .from('user_courses')
        .select('id')
        .eq('course_id', course.id)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (!existingCourse) {
        const { error } = await supabase
          .from('user_courses')
          .insert({
            course_id: course.id,
            user_id: userResponse.user.id,
            played: true,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setHasMarkedAsPlayed(true);
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
    },
    onError: (error) => {
      console.error('Error marking course as played:', error);
      toast({
        title: "Error",
        description: "Failed to mark course as played. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, reviewText, mediaFiles }: { rating: number; reviewText: string; mediaFiles: File[] }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      let ratingId: string;

      if (isEditMode && existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update({
            rating,
            review: reviewText || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRating.id);
        
        if (error) throw error;
        ratingId = existingRating.id;
      } else {
        // Create new rating
        const { data: newRating, error } = await supabase
          .from('course_ratings')
          .insert({
            course_id: course.id,
            user_id: userResponse.user.id,
            rating,
            review: reviewText || null
          })
          .select()
          .single();
        
        if (error) throw error;
        ratingId = newRating.id;
      }

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userResponse.user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('course-review-media')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('course-review-media')
            .getPublicUrl(fileName);

          // Save media record to database
          const { error: mediaError } = await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingId,
              media_url: urlData.publicUrl,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
              file_name: file.name,
              file_size: file.size
            });

          if (mediaError) throw mediaError;
        });

        await Promise.all(uploadPromises);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      
      setShowConfirmation(true);
      setIsSubmitting(false);
      
      toast({
        title: isEditMode ? "Rating Updated! ✨" : "Rating Submitted! ✨",
        description: `You ${isEditMode ? 'updated' : 'rated'} ${course?.name} ${selectedRating}/10`,
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

  const removeFromPlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      // Delete rating if it exists
      if (existingRating) {
        const { error: ratingError } = await supabase
          .from('course_ratings')
          .delete()
          .eq('id', existingRating.id);
        
        if (ratingError) throw ratingError;
      }

      // Remove from user_courses (regular courses)
      const { error: courseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      if (courseError && courseError.code !== 'PGRST116') {
        // If not found in user_courses, try user_top100_courses
        const { error: top100Error } = await supabase
          .from('user_top100_courses')
          .delete()
          .eq('user_id', userResponse.user.id)
          .eq('course_id', course.id);
        
        if (top100Error) throw top100Error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['userTop100Courses'] });
      queryClient.invalidateQueries({ queryKey: ['userTop100CoursesInRegion'] });
      
      toast({
        title: "Course Removed",
        description: `${course?.name} has been removed from your played list`,
      });
      
      if (onRemoveFromPlayed) {
        onRemoveFromPlayed();
      }
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Error removing course:', error);
      toast({
        title: "Error",
        description: "Failed to remove course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromPlayed = () => {
    removeFromPlayedMutation.mutate();
  };

  const handleSkip = () => {
    // Course is already marked as played, just close the modal
    toast({
      title: "Course Added",
      description: `${course?.name} has been added to your played courses`,
    });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    if (!isEditMode) {
      setSelectedRating(null);
      setReview('');
    }
    setHoveredRating(null);
    setShowConfirmation(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
    setHasMarkedAsPlayed(false);
  };

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
      mediaFiles: selectedMedia
    });
  };

  const handleMediaSelected = (files: File[]) => {
    setSelectedMedia(prev => [...prev, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Generate rating options from 0.5 to 10 in 0.5 increments
  const ratingOptions = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

  if (!course) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto">
          {!showConfirmation ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  {isEditMode ? 'Edit Your Rating' : 'Congratulations!'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isEditMode 
                    ? `Update your rating and review for ${course.name}`
                    : `You've played ${course.name}! How would you rate your experience?`
                  }
                </p>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Course Card Preview */}
                <div className="relative rounded-lg border overflow-hidden bg-green-50 border-green-200">
                  <div className="relative h-24 overflow-hidden">
                    {course.thumbnail_image ? (
                      <img
                        src={course.thumbnail_image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <Star className="h-8 w-8 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Played indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {course.name}
                    </h3>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">
                      {isEditMode ? 'Update your rating' : 'Rate your experience'}
                    </p>
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
                    {isEditMode ? 'Update your thoughts (optional)' : 'Share your thoughts (optional)'}
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
                    Add photos or videos (optional)
                  </label>
                  <ReviewMediaUpload
                    onMediaSelected={handleMediaSelected}
                    selectedMedia={selectedMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {isEditMode ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRemoveDialog(true)}
                        disabled={isSubmitting}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove from Played
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedRating}
                        className="flex-1"
                      >
                        {isSubmitting ? "Updating..." : "Update Rating"}
                      </Button>
                    </>
                  ) : (
                    <>
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
                        {isSubmitting ? "Submitting..." : "Rate this Course"}
                      </Button>
                    </>
                  )}
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
                <h3 className="font-semibold text-lg mb-2">
                  {isEditMode ? 'Rating Updated! ✔' : 'Review Saved! ✔'}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {isEditMode 
                    ? `Your updated rating for ${course.name} has been saved`
                    : `Thank you for sharing your experience with ${course.name}`
                  }
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

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Course from Played List?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{course.name}" from your played list? 
              This will permanently delete your rating and review for this course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveFromPlayed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostPlayRatingModal;
