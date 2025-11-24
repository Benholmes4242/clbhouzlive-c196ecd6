
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
  existingRating?: any;
  onRemoveFromPlayed?: () => void;
}

const PostPlayRatingModal = ({ 
  course, 
  isOpen, 
  onClose, 
  isEditMode = false,
  existingRating: existingRatingProp,
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
  
  // Track whether breakdown sliders have been touched
  const [designTouched, setDesignTouched] = useState(false);
  const [conditionTouched, setConditionTouched] = useState(false);
  const [clubhouseTouched, setClubhouseTouched] = useState(false);
  const [facilitiesTouched, setFacilitiesTouched] = useState(false);

  // Use passed existingRating or fetch internally as fallback
  const { data: existingRatingFetched } = useQuery({
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
    enabled: isEditMode && !!course?.id && !existingRatingProp,
  });

  const existingRating = existingRatingProp || existingRatingFetched;

  // Populate form with existing rating data in edit mode
  useEffect(() => {
    if (existingRating && isEditMode) {
      setSelectedRating(existingRating.rating);
      setReview(existingRating.review || '');
      setDesignScore(existingRating.design_score);
      setConditionScore(existingRating.condition_score);
      setClubhouseScore(existingRating.clubhouse_score);
      setFacilitiesScore(existingRating.facilities_score);
      
      // Mark as touched if they exist
      setDesignTouched(existingRating.design_score != null);
      setConditionTouched(existingRating.condition_score != null);
      setClubhouseTouched(existingRating.clubhouse_score != null);
      setFacilitiesTouched(existingRating.facilities_score != null);
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
    onError: (error: any) => {
      console.error('[Rating] Error marking course as played:', error);
      console.error('[Rating] Played marking error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details
      });
      // Don't show user error - they already got success toast for rating
      // This is a secondary operation that shouldn't block the primary success
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
      // Don't let achievements failures block the rating success
      if (!isEditMode) {
        try {
          await markAsPlayedMutation.mutateAsync();
        } catch (achievementError) {
          console.error('[Rating] Achievements failed but rating succeeded:', achievementError);
          // Continue - rating is still successful even if achievements fail
        }
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
    onError: (error: any) => {
      console.error('[Rating Submission] Error:', error);
      console.error('[Rating Submission] Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      });
      
      let errorMessage = "Failed to submit rating. Please try again.";
      
      if (error?.code === '23514') {
        errorMessage = "Rating validation failed. Please ensure all scores are between 0.5 and 10.0 with one decimal place.";
      }
      
      toast({
        title: "Error Submitting Rating",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
      setButtonText('Add to Played');
    },
  });

  const removeFromPlayedMutation = useMutation({
    mutationFn: async () => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !course) throw new Error('Not authenticated or no course');

      console.log('[Delete Rating] Payload:', { 
        ratingId: existingRating?.id, 
        courseId: course.id, 
        userId: userResponse.user.id 
      });

      // Delete rating if it exists
      if (existingRating) {
        const { error: ratingError } = await supabase
          .from('course_ratings')
          .delete()
          .eq('id', existingRating.id);
        
        if (ratingError) {
          console.error('[Delete Rating] Rating deletion error:', ratingError);
          throw ratingError;
        }
        console.log('[Delete Rating] Rating deleted successfully');
      }

      // Remove from user_courses (regular courses)
      const { error: courseError } = await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      if (courseError && courseError.code !== 'PGRST116') {
        console.error('[Delete Rating] User courses deletion error:', courseError);
      }
      
      // Also try to remove from user_top100_courses (might be in both tables)
      const { error: top100Error } = await supabase
        .from('user_top100_courses')
        .update({ played: false, played_date: null })
        .eq('user_id', userResponse.user.id)
        .eq('course_id', course.id);
      
      // Don't throw error if not found in top100 courses
      if (top100Error && top100Error.code !== 'PGRST116') {
        console.warn('[Delete Rating] Top100 courses update error:', top100Error);
      }

      console.log('[Delete Rating] Result:', { status: 'success' });
    },
    onSuccess: async () => {
      console.log('[Delete Rating] onSuccess - starting invalidations');
      
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['userTop100Courses'] });
      queryClient.invalidateQueries({ queryKey: ['userTop100CoursesInRegion'] });
      queryClient.invalidateQueries({ queryKey: ['top100-courses'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail', course?.id] });
      
      // Trigger badge checking for the user (non-blocking)
      try {
        const { data: userResponse } = await supabase.auth.getUser();
        if (userResponse.user) {
          console.log('[Delete Rating] Checking badges for user:', userResponse.user.id);
          await supabase.rpc('check_and_award_badges', { user_id_param: userResponse.user.id });
        }
      } catch (error) {
        console.error('[Delete Rating] Badges check failed but delete succeeded:', error);
        // Don't block delete success
      }
      
      console.log('[Delete Rating] onSuccess - showing toast and closing modal');
      
      toast({
        title: "Course Removed",
        description: `${course?.name} has been removed from your played list`,
      });
      
      if (onRemoveFromPlayed) {
        onRemoveFromPlayed();
      }
      
      setShowRemoveDialog(false);
      onClose();
      resetForm();
      
      console.log('[Delete Rating] Success - complete');
    },
    onError: (error: any) => {
      console.error('[Delete Rating] Error:', error);
      console.error('[Delete Rating] Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details
      });
      toast({
        title: "Error",
        description: "Failed to remove course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromPlayed = () => {
    console.log('[Delete Rating] handleRemoveFromPlayed called', { 
      courseId: course?.id, 
      courseName: course?.name,
      hasExistingRating: !!existingRating,
      ratingId: existingRating?.id 
    });
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
      setClubhouseScore(null);
      setFacilitiesScore(null);
      setDesignTouched(false);
      setConditionTouched(false);
      setClubhouseTouched(false);
      setFacilitiesTouched(false);
    }
    setShowConfirmation(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Normalize value to 1 decimal place
  const normalize = (value: number | null | undefined): number | null => {
    if (value == null) return null;
    return parseFloat(value.toFixed(1));
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
    
    // Build payload and log for debugging
    const payload = {
      rating: normalize(selectedRating) || 5,
      reviewText: review.trim(),
      mediaFiles: selectedMedia,
      design: designTouched ? normalize(designScore) : null,
      condition: conditionTouched ? normalize(conditionScore) : null,
      clubhouse: clubhouseTouched ? normalize(clubhouseScore) : null,
      facilities: facilitiesTouched ? normalize(facilitiesScore) : null
    };
    
    console.log('[Rating Submission] Payload:', payload);
    console.log('[Rating Submission] Types:', {
      rating: typeof payload.rating,
      design: typeof payload.design,
      condition: typeof payload.condition,
      clubhouse: typeof payload.clubhouse,
      facilities: typeof payload.facilities
    });
    
    submitRatingMutation.mutate(payload);
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
              <p className="text-xs font-medium tracking-wide text-slate-500 mb-2">
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
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-2">
                Breakdown (optional)
              </p>

              {[
                { 
                  key: 'design', 
                  label: 'Course Design', 
                  score: designScore, 
                  setScore: setDesignScore,
                  setTouched: setDesignTouched
                },
                { 
                  key: 'condition', 
                  label: 'Course Condition', 
                  score: conditionScore, 
                  setScore: setConditionScore,
                  setTouched: setConditionTouched
                },
                { 
                  key: 'clubhouse', 
                  label: 'Clubhouse', 
                  score: clubhouseScore, 
                  setScore: setClubhouseScore,
                  setTouched: setClubhouseTouched
                },
                { 
                  key: 'facilities', 
                  label: 'Facilities', 
                  score: facilitiesScore, 
                  setScore: setFacilitiesScore,
                  setTouched: setFacilitiesTouched
                },
              ].map(({ key, label, score, setScore, setTouched }) => (
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
                      onValueChange={(values) => {
                        setTouched(true);
                        setScore(values[0]);
                      }}
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
            <section className="px-4 mt-6">
              <h3 className="text-sm font-medium text-slate-900 mb-1">
                Media Upload <span className="text-slate-400 text-xs">(optional)</span>
              </h3>

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
            <footer className="px-4 mt-6 pb-3">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedRating}
                className="w-full h-11 rounded-full border border-slate-200 bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : ctaLabel}
              </button>

              {isEditMode && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    console.log('[Delete Rating] Remove button clicked', { 
                      courseId: course?.id, 
                      courseName: course?.name 
                    });
                    setShowRemoveDialog(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-3 flex items-center gap-2 justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from Played
                </Button>
              )}
            </footer>
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
