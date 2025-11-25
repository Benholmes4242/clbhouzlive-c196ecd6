import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, Check, Trophy, Trash2, Upload, ArrowLeft } from 'lucide-react';
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
  
  // Custom remove confirmation dialog
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

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
        title: "Course removed",
        description: `${course?.name} has been removed from your played list. You can add a new rating at any time.`,
        className: "pointer-events-auto w-full max-w-md rounded-2xl bg-slate-900/80 text-slate-50 border border-white/15 shadow-[0_18px_35px_rgba(15,23,42,0.75)] backdrop-blur-xl",
      });
      
      if (onRemoveFromPlayed) {
        onRemoveFromPlayed();
      }
      
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
          <div>
            {/* Full Bleed Header with Glass Back Button */}
            <div className="relative -mx-0 mb-6 h-[280px] sm:h-64 overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/0" />
              
              {/* Glass back button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>

              {/* Overlay text */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-base font-medium uppercase tracking-[0.18em] text-slate-100/80">
                  {isEditMode ? 'Edit your rating' : 'Rate this course'}
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-white">
                  {course.name}
                </h2>
              </div>
            </div>

            {/* Overall Rating Slider */}
            <section className="px-4 mt-6">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-base font-medium text-slate-900">
                  Your overall rating
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {selectedRating != null ? selectedRating.toFixed(1) : '--'}<span className="ml-1">/10</span>
                </p>
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
                <div className="mt-2 inline-flex rounded-full bg-slate-900 text-sm text-white px-3 py-1">
                  No rating selected yet
                </div>
              )}
            </section>

            {/* Share Your Thoughts */}
            <section className="px-4 mt-6">
              <p className="text-sm font-medium tracking-wide text-slate-500 mb-2">
                Share your thoughts
              </p>

              <div className="mt-2">
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  placeholder="Share your review with other golfers – what stood out about the design, conditions, clubhouse or overall experience?"
                  className="w-full rounded-xl border border-slate-200/80 bg-slate-50 text-base text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-slate-300 focus:ring-0 focus:shadow-[0_0_0_3px_rgba(148,163,184,0.25)]"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-slate-400 text-right">
                  {review.length}/500
                </p>
              </div>
            </section>

            {/* Breakdown Sliders */}
            <section className="px-4 mt-6">
              <p className="text-sm font-medium tracking-wide text-slate-500 mb-2">
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
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-base font-medium text-slate-900">{label}</span>
                    <span className="text-base font-medium text-slate-900">
                      {score != null ? score.toFixed(1) : '--'}<span className="ml-1">/10</span>
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
              <p className="text-sm font-medium tracking-wide text-slate-500 mb-2">
                Media upload (optional)
              </p>

              <div className="mt-3">
                {selectedMedia.length === 0 ? (
                  <ReviewMediaUpload
                    onMediaSelected={handleMediaSelected}
                    selectedMedia={selectedMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                      {selectedMedia.map((file, index) => {
                        const isVideo = file.type.startsWith('video/');
                        const preview = URL.createObjectURL(file);
                        return (
                          <div key={index} className="relative aspect-square overflow-hidden rounded-xl">
                            {isVideo ? (
                              <>
                                <video
                                  src={preview}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 shadow-md">
                                  <div className="ml-[2px] h-0 w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-white" />
                                </div>
                              </>
                            ) : (
                              <img
                                src={preview}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 shadow-sm hover:bg-slate-900/95 active:scale-95 transition"
                            >
                              <span className="text-[11px] leading-none text-white">✕</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {selectedMedia.length < 5 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*,video/*';
                            input.multiple = true;
                            input.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              if (target.files) {
                                const files = Array.from(target.files);
                                const remainingSlots = 5 - selectedMedia.length;
                                const filesToAdd = files.slice(0, remainingSlots);
                                
                                if (files.length > remainingSlots) {
                                  toast({
                                    title: "Too many files",
                                    description: `You can only add ${remainingSlots} more file${remainingSlots === 1 ? '' : 's'} (max 5 total).`,
                                    variant: "destructive",
                                  });
                                }
                                
                                handleMediaSelected(filesToAdd);
                              }
                            };
                            input.click();
                          }}
                          className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                        >
                          Add more photos or videos
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Primary CTA Button */}
            <footer className="px-4 mt-6 pb-[24px]">
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedRating}
                className="w-full h-11 rounded-full text-base font-semibold bg-slate-900 text-white border border-white/10 shadow-[0_8px_20px_rgba(15,23,42,0.45)] hover:bg-slate-900/90 active:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {isSubmitting ? 'Saving…' : (isEditMode ? 'Update rating' : 'Submit rating')}
              </Button>

              {isEditMode && (
                <Button
                  type="button"
                  onClick={() => setShowRemoveDialog(true)}
                  disabled={isSubmitting}
                  className="w-full mt-3 rounded-full bg-red-500 text-white border border-red-500/80 shadow-sm hover:bg-red-600 active:bg-red-700 flex items-center gap-2 justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove from played
                </Button>
              )}
            </footer>
          </div>
          ) : (
            /* Confirmation Screen */
            <div className="flex min-h-screen flex-col items-center justify-start px-6 pt-20 pb-10 bg-slate-50">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-10 w-10 text-emerald-600" />
              </div>
              
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check className="h-7 w-7 text-emerald-600" />
              </div>

              <h1 className="mt-10 text-xl font-semibold text-slate-900">
                {isEditMode ? 'Rating updated ✔' : 'Rating saved 🏆'}
              </h1>
              
              <p className="mt-2 text-sm text-slate-500 text-center max-w-md px-4">
                {isEditMode
                  ? `Your updated rating for ${course.name} has been saved.`
                  : `Your rating for ${course.name} has been added.`}
              </p>

              <div className="mt-6 w-full max-w-md rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-slate-900">
                      {selectedRating?.toFixed(1)}/10
                    </span>
                    {review && (
                      <span className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        "{review}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="mt-8 w-full max-w-md rounded-full text-sm font-semibold bg-slate-900 text-white border border-white/10 shadow-[0_8px_20px_rgba(15,23,42,0.45)] hover:bg-slate-900/90"
                onClick={handleClose}
              >
                Back to course
              </Button>
            </div>
          )}
        </div>

        {/* Custom Remove Confirmation Dialog */}
        {showRemoveDialog && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 rounded-2xl bg-slate-900 text-slate-50 border border-white/10 p-5 shadow-xl">
              <h2 className="text-base font-semibold">Remove rating?</h2>
              <p className="mt-2 text-sm text-slate-300">
                This will permanently delete your rating and review for this course.
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border border-white/20 bg-transparent text-slate-50 hover:bg-white/5"
                  onClick={() => setShowRemoveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-red-500 text-white border border-red-500/80 shadow-sm hover:bg-red-600 active:bg-red-700"
                  onClick={() => {
                    setShowRemoveDialog(false);
                    handleRemoveFromPlayed();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default PostPlayRatingModal;
