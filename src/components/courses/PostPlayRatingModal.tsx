
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Slider } from '@/components/ui/slider';
import { Star, Check, Trophy, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReviewMediaUpload from './ReviewMediaUpload';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [buttonText, setButtonText] = useState('Add to Played');
  const [designScore, setDesignScore] = useState<number | null>(null);
  const [conditionScore, setConditionScore] = useState<number | null>(null);
  const [clubhouseScore, setClubhouseScore] = useState<number | null>(null);
  const [facilitiesScore, setFacilitiesScore] = useState<number | null>(null);

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

  // Populate form with existing rating data in edit mode
  useEffect(() => {
    if (existingRating && isEditMode) {
      setSelectedRating(existingRating.rating);
      setReview(existingRating.review || '');
      setDesignScore(existingRating.design_score);
      setConditionScore(existingRating.condition_score);
      setClubhouseScore(existingRating.clubhouse_score);
      setFacilitiesScore(existingRating.facilities_score);
    }
  }, [existingRating, isEditMode]);

  const markAsPlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      // Get course ranking data to check if it's a top 100 course
      const { data: courseData, error: courseError } = await supabase
        .from('golf_courses')
        .select('global_rank, regional_rank, usa_rank')
        .eq('id', course.id)
        .single();

      if (courseError) throw courseError;

      const isTop100Course = courseData?.global_rank || courseData?.regional_rank || courseData?.usa_rank;

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

      // If it's a top 100 course, also add to user_top100_courses
      if (isTop100Course) {
        const { error: top100Error } = await supabase
          .from('user_top100_courses')
          .upsert({
            course_id: course.id,
            user_id: userResponse.user.id,
            played: true,
            played_date: new Date().toISOString().split('T')[0],
          });
        if (top100Error) throw top100Error;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['top100-courses'] });
      queryClient.invalidateQueries({ queryKey: ['user-played-course', course?.id] });
      
      // Trigger badge checking for the user
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse.user) {
          await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
        }
      } catch (error) {
        console.error('Error checking badges:', error);
      }
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
    mutationFn: async ({ 
      rating, 
      reviewText, 
      mediaFiles,
      design,
      condition,
      clubhouse,
      facilities
    }: { 
      rating: number; 
      reviewText: string; 
      mediaFiles: File[];
      design: number | null;
      condition: number | null;
      clubhouse: number | null;
      facilities: number | null;
    }) => {
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
            design_score: design,
            condition_score: condition,
            clubhouse_score: clubhouse,
            facilities_score: facilities,
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
            review: reviewText || null,
            design_score: design,
            condition_score: condition,
            clubhouse_score: clubhouse,
            facilities_score: facilities
          })
          .select()
          .single();
        
        if (error) throw error;
        ratingId = newRating.id;
      }

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const { uploadToCloudflareR2 } = await import('@/utils/cloudflareUpload');
        const uploadPromises = mediaFiles.map(async (file) => {
          const fileName = `${userResponse.user.id}-${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
          
          const uploadResult = await uploadToCloudflareR2(file, 'clbhouz-review-images', fileName);
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error || `Failed to upload ${file.name}`);
          }

          // Save media record to database
          const { error: mediaError } = await supabase
            .from('course_review_media')
            .insert({
              review_id: ratingId,
              media_url: uploadResult.publicUrl,
              media_type: file.type.startsWith('video/') ? 'video' : 'image',
              file_name: file.name,
              file_size: file.size
            });

          if (mediaError) throw mediaError;
        });

        await Promise.all(uploadPromises);
      }
    },
    onSuccess: async () => {
      // Mark as played after successful rating (only if not in edit mode)
      if (!isEditMode) {
        await markAsPlayedMutation.mutateAsync();
      }
      
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-played-course', course?.id] });
      
      // Show "Added!" text for 1.5 seconds
      setButtonText('Added!');
      setTimeout(() => {
        setShowConfirmation(true);
        setIsSubmitting(false);
        setButtonText('Add to Played');
      }, 1500);
      
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
      
      // Also try to remove from user_top100_courses (might be in both tables)
      const { error: top100Error } = await supabase
        .from('user_top100_courses')
        .update({ played: false, played_date: null })
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      // Don't throw error if not found in top100 courses
      if (top100Error && top100Error.code !== 'PGRST116') {
        console.warn('Error updating top100 courses:', top100Error);
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['userTop100Courses'] });
      queryClient.invalidateQueries({ queryKey: ['userTop100CoursesInRegion'] });
      queryClient.invalidateQueries({ queryKey: ['top100-courses'] });
      
      // Trigger badge checking for the user
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse.user) {
          await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
        }
      } catch (error) {
        console.error('Error checking badges:', error);
      }
      
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
      setDesignScore(null);
      setConditionScore(null);
      setFacilitiesScore(null);
    }
    setShowConfirmation(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async () => {
    if (!selectedRating) {
      toast({
        title: "Rating Required",
        description: "Please leave at least an overall rating to mark this course as played.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setButtonText('Adding...');
    
    // Submit rating
    submitRatingMutation.mutate({ 
      rating: selectedRating, 
      reviewText: review.trim(),
      mediaFiles: selectedMedia,
      design: designScore,
      condition: conditionScore,
      clubhouse: clubhouseScore,
      facilities: facilitiesScore
    });
  };

  const handleMediaSelected = (files: File[]) => {
    setSelectedMedia(prev => [...prev, ...files]);
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Format score for display
  const formatScore = (value: number | null | undefined) =>
    value == null ? '--' : value.toFixed(1);

  if (!course) return null;

  const pageTitle = isEditMode ? 'Edit your rating' : 'Rate this course';
  const ctaLabel = isEditMode ? 'Update Rating' : 'Submit Rating';

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-slate-50 overflow-y-auto">
        {!showConfirmation ? (
          <div className="pb-12">
            {/* Header with Close Button */}
            <header className="flex items-center justify-between px-4 pt-4 pb-3 bg-slate-50">
              <h1 className="text-base font-semibold text-slate-900">
                {pageTitle}
              </h1>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/4 hover:bg-slate-900/8 transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-slate-500">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            {/* Course Card */}
            <section className="px-4 mb-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-32 w-full relative">
                  {course.thumbnail_image ? (
                    <img
                      src={course.thumbnail_image}
                      alt={course.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
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
                
                <div className="px-4 py-3">
                  <p className="font-medium text-slate-900">
                    {course.name}
                  </p>
                </div>
              </div>
            </section>

            {/* Overall Rating Slider */}
            <section className="px-4 mt-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Your overall rating
              </p>

              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-slate-900">
                    {selectedRating != null ? selectedRating.toFixed(1) : '--'}
                    <span className="text-sm text-slate-500">/10</span>
                  </span>
                </div>

                <div className="py-3">
                  <Slider
                    value={[selectedRating || 5]}
                    onValueChange={(values) => setSelectedRating(values[0])}
                    min={0.5}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {selectedRating == null && (
                  <div className="mt-2 inline-flex rounded-full bg-slate-900 text-xs text-white px-3 py-1">
                    No rating selected yet
                  </div>
                )}
              </div>
            </section>

            {/* Share Your Thoughts */}
            <section className="px-4 mt-6">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-900">Share your thoughts</p>
                <span className="text-xs text-slate-500">(optional)</span>
              </div>

              <div className="mt-2">
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  placeholder="Share your review with the community - Tell other golfers what impressed you about the design, the conditions, the clubhouse, or the overall vibe."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 text-sm placeholder:text-slate-400 resize-none"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-slate-400 text-right">
                  {review.length}/500
                </p>
              </div>
            </section>

            {/* Breakdown Sliders */}
            <section className="px-4 mt-8">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Breakdown (optional)
              </p>

              {[
                { key: 'design', label: 'Course Design', score: designScore, setScore: setDesignScore },
                { key: 'condition', label: 'Course Condition', score: conditionScore, setScore: setConditionScore },
                { key: 'clubhouse', label: 'Clubhouse', score: clubhouseScore, setScore: setClubhouseScore },
                { key: 'facilities', label: 'Facilities', score: facilitiesScore, setScore: setFacilitiesScore },
              ].map(({ key, label, score, setScore }) => (
                <div key={key} className="mt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-900">{label}</span>
                    <span className="text-xs text-slate-500">
                      {score != null ? `${score.toFixed(1)} / 10` : '-- / 10'}
                    </span>
                  </div>

                  <div className="py-3">
                    <Slider
                      value={[score ?? 5]}
                      onValueChange={(values) => setScore(values[0])}
                      min={0.5}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Media Upload Section */}
            <section className="px-4 mt-8">
              <p className="text-sm font-medium text-slate-900">Media Upload</p>
              <p className="mt-1 text-xs text-slate-500">(optional)</p>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white/60 px-4 py-5">
                {selectedMedia.length === 0 ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Add photos or videos from your round.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG, MP4, MOV · Max 5 items
                    </p>

                    <div className="mt-4">
                      <ReviewMediaUpload
                        onMediaSelected={handleMediaSelected}
                        selectedMedia={selectedMedia}
                        onRemoveMedia={handleRemoveMedia}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedMedia.map((file, index) => {
                        const isVideo = file.type.startsWith('video/');
                        const preview = URL.createObjectURL(file);
                        return (
                          <div key={index} className="relative aspect-square">
                            {isVideo ? (
                              <video
                                src={preview}
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            ) : (
                              <img
                                src={preview}
                                alt=""
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <ReviewMediaUpload
                      onMediaSelected={handleMediaSelected}
                      selectedMedia={selectedMedia}
                      onRemoveMedia={handleRemoveMedia}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Primary CTA Button */}
            <section className="px-4 mt-8 pb-3">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedRating}
                className="w-full rounded-xl border border-slate-200 bg-slate-900 text-white text-sm font-semibold py-3 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : ctaLabel}
              </Button>

              {isEditMode && (
                <Button
                  variant="destructive"
                  onClick={() => setShowRemoveDialog(true)}
                  disabled={isSubmitting}
                  className="w-full mt-3 flex items-center gap-2 justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from Played
                </Button>
              )}
            </section>
          </div>
          ) : (
            /* Confirmation Screen */
            <div className="text-center space-y-4 py-4 px-4">
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
                  <ClubhouseLogo size="md" showTooltip />
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
        </div>

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
