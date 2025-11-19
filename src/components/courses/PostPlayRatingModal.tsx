
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
  asPage?: boolean;
}

const PostPlayRatingModal = ({ 
  course, 
  isOpen, 
  onClose, 
  isEditMode = false, 
  onRemoveFromPlayed,
  asPage = false
}: PostPlayRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [hasMarkedAsPlayed, setHasMarkedAsPlayed] = useState(false);
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

  // Set initial values when existing rating is loaded
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
      setHasMarkedAsPlayed(true);
      queryClient.invalidateQueries({ queryKey: ['user-course', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['trackerStats'] });
      queryClient.invalidateQueries({ queryKey: ['user-top100-course', course?.id] });
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
          
          const uploadResult = await uploadToCloudflareR2(file, 'course-review-media', fileName);
          
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-rating-stats', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', course?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', course?.id] });
      
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
    setButtonText('Adding...');
    
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

  if (asPage) {
    return (
      <div className="fixed inset-0 bg-surface-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold">Rate {course.name}</h1>
        </div>
        <div className="p-4 space-y-6">
          {!showConfirmation ? (
            <div className="space-y-6">
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

                {/* Rating Slider Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between mb-1">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Your overall rating
                        </p>
                        <p className="text-2xl font-semibold">
                          {formatScore(selectedRating)}{' '}
                          <span className="text-sm text-muted-foreground">/ 10</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="range"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={selectedRating || 5}
                        onChange={(e) => setSelectedRating(parseFloat(e.target.value))}
                        className="w-full accent-slate-800 focus:outline-none"
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
                      <span className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs">
                        {selectedRating !== null ? `Selected: ${formatScore(selectedRating)} / 10` : 'No rating selected yet'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Section */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <p className="text-sm font-medium">Share what stood out to you - from the greens and fairways to the design and facilities...</p>
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
                      maxLength={500}
                    />
                    <span className="absolute right-3 bottom-2 text-[11px] text-muted-foreground">
                      {review.length}/500
                    </span>
                  </div>
                </div>

                {/* Breakdown Section */}
                <div className="mt-5 border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Breakdown (optional)
                  </p>

                  {[
                    { key: 'design', label: 'Course Design', score: designScore, setScore: setDesignScore },
                    { key: 'condition', label: 'Course Condition', score: conditionScore, setScore: setConditionScore },
                    { key: 'clubhouse', label: 'Clubhouse', score: clubhouseScore, setScore: setClubhouseScore },
                    { key: 'facilities', label: 'Facilities', score: facilitiesScore, setScore: setFacilitiesScore },
                  ].map(({ key, label, score, setScore }) => {
                    const displayValue = score ?? 5;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <p className="text-sm font-medium">{label}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatScore(score)} / 10
                          </span>
                        </div>

                        <input
                          type="range"
                          min={0.5}
                          max={10}
                          step={0.5}
                          value={displayValue}
                          onChange={(e) => setScore(parseFloat(e.target.value))}
                          className="w-full accent-slate-800"
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
                </div>

                {/* Media Upload Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Media Upload (optional)</label>
                  <ReviewMediaUpload
                    onMediaSelected={handleMediaSelected}
                    selectedMedia={selectedMedia}
                    onRemoveMedia={handleRemoveMedia}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    onClick={isEditMode ? handleSubmit : handleSubmit}
                    disabled={isSubmitting || !selectedRating}
                    className="w-full bg-[#EAEAEA] text-[#333333] hover:bg-[#D4D4D4] shadow-sm rounded-lg font-medium"
                    style={{
                      backgroundColor: isSubmitting ? '#D4D4D4' : '#EAEAEA',
                      color: '#333333'
                    }}
                  >
                    {isEditMode ? (
                      isSubmitting ? "Updating..." : "Update Rating"
                    ) : (
                      buttonText
                    )}
                  </Button>
                  
                  {isEditMode && (
                    <Button
                      variant="destructive"
                      onClick={() => setShowRemoveDialog(true)}
                      disabled={isSubmitting}
                      className="w-full mt-3 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove from Played
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Confirmation Screen */
            <div className="text-center space-y-4 py-4 p-4">
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
  );

  return (
    <>
      {asPage ? (
        content
      ) : (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className={contentClassName}>
            {content}
          </DialogContent>
        </Dialog>
      )}

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
