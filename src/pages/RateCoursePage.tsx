import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { X, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
}

export default function RateCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [review, setReview] = useState('');
  const [designScore, setDesignScore] = useState<number | null>(null);
  const [conditionScore, setConditionScore] = useState<number | null>(null);
  const [clubhouseScore, setClubhouseScore] = useState<number | null>(null);
  const [facilitiesScore, setFacilitiesScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  // Fetch existing rating
  const { data: existingRating } = useQuery({
    queryKey: ['user-course-rating', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userResponse.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching existing rating:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!courseId,
  });

  // Load existing rating data
  useEffect(() => {
    if (existingRating) {
      setSelectedRating(existingRating.rating);
      setReview(existingRating.review || '');
      setDesignScore(existingRating.design_score);
      setConditionScore(existingRating.condition_score);
      setClubhouseScore(existingRating.clubhouse_score);
      setFacilitiesScore(existingRating.facilities_score);
    }
  }, [existingRating]);

  const submitRatingMutation = useMutation({
    mutationFn: async (data: {
      rating: number;
      reviewText: string;
      design: number | null;
      condition: number | null;
      clubhouse: number | null;
      facilities: number | null;
    }) => {
      const { data: userResponse } = await supabase.auth.getUser();
      if (!userResponse.user || !courseId) throw new Error('Not authenticated');

      const ratingData = {
        course_id: courseId,
        user_id: userResponse.user.id,
        rating: data.rating,
        review: data.reviewText || null,
        design_score: data.design,
        condition_score: data.condition,
        clubhouse_score: data.clubhouse,
        facilities_score: data.facilities,
      };

      const { data: result, error } = await supabase
        .from('course_ratings')
        .upsert(ratingData, {
          onConflict: 'course_id,user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-rating', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-rating-aggregates', courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
      
      toast({
        title: "Rating submitted",
        description: "Your course rating has been saved.",
      });
      
      navigate(`/courses/${courseId}`);
    },
    onError: (error) => {
      console.error('Error submitting rating:', error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
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
      design: designScore,
      condition: conditionScore,
      clubhouse: clubhouseScore,
      facilities: facilitiesScore,
    });
  };

  const handleClose = () => {
    navigate(`/courses/${courseId}`);
  };

  const formatScore = (value: number | null | undefined) =>
    value == null ? '--' : value.toFixed(1);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-surface-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="fixed inset-0 bg-surface-card flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface-card overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold line-clamp-1">
            Rate {course.name}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Choose a score from 0.5 to 10 and optionally leave a review.
        </p>

        {/* Overall Rating */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Your overall rating
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRating(5)}
              className="text-xs"
            >
              Clear rating
            </Button>
          </div>
          
          <div className="text-3xl font-bold">
            {selectedRating.toFixed(1)} / 10
          </div>

          <Slider
            value={[selectedRating]}
            onValueChange={(value) => setSelectedRating(value[0])}
            min={0.5}
            max={10}
            step={0.5}
            className="accent-slate-800"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5</span>
            <span>3</span>
            <span>5</span>
            <span>7</span>
            <span>9</span>
            <span>10</span>
          </div>

          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-white text-sm">
              <Star className="h-4 w-4 fill-current" />
              Selected: {selectedRating.toFixed(1)} / 10
            </div>
          </div>
        </div>

        {/* Review Textarea */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Share your thoughts</label>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </div>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell other golfers what stood out – routing, conditioning, greens, hospitality..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="text-right text-xs text-muted-foreground">
            {review.length}/500
          </div>
        </div>

        {/* Breakdown Scores */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Breakdown (Optional)
            </h3>
          </div>

          {/* Course Design */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Course Design</label>
              <span className="text-sm font-semibold">{formatScore(designScore)} / 10</span>
            </div>
            <Slider
              value={[designScore ?? 5]}
              onValueChange={(value) => setDesignScore(value[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="accent-slate-800"
            />
          </div>

          {/* Course Condition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Course Condition</label>
              <span className="text-sm font-semibold">{formatScore(conditionScore)} / 10</span>
            </div>
            <Slider
              value={[conditionScore ?? 5]}
              onValueChange={(value) => setConditionScore(value[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="accent-slate-800"
            />
          </div>

          {/* Clubhouse */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Clubhouse</label>
              <span className="text-sm font-semibold">{formatScore(clubhouseScore)} / 10</span>
            </div>
            <Slider
              value={[clubhouseScore ?? 5]}
              onValueChange={(value) => setClubhouseScore(value[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="accent-slate-800"
            />
          </div>

          {/* Facilities */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Facilities</label>
              <span className="text-sm font-semibold">{formatScore(facilitiesScore)} / 10</span>
            </div>
            <Slider
              value={[facilitiesScore ?? 5]}
              onValueChange={(value) => setFacilitiesScore(value[0])}
              min={0.5}
              max={10}
              step={0.5}
              className="accent-slate-800"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white h-12"
        >
          {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
        </Button>
      </div>
    </div>
  );
}
