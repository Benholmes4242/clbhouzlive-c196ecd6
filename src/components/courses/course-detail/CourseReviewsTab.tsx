import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { ReviewCard } from '../review/ReviewCard';
import { ReviewsHeaderCard } from '../review/ReviewsHeaderCard';
import { Button } from '@/components/ui/button';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
}

interface ReviewData {
  id: string;
  rating: number;
  review: string | null;
  review_date: string;
  user_id: string;
  helpful_count: number;
  unhelpful_count: number;
  is_mock: boolean;
  user_profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

const getInitials = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
  courseId,
  courseName,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch rating aggregates (same query as About tab)
  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);

  console.log('[Rating Stats Query] key:', ['course-rating-aggregates', courseId]);
  console.log('[Rating Stats Query] result:', ratingAggregates);

  // Check if we should highlight the user's review (from confirmation flow)
  const [isJustSubmittedOrUpdated, setIsJustSubmittedOrUpdated] = useState(
    Boolean(location.state?.highlightMyReview)
  );

  useEffect(() => {
    if (!isJustSubmittedOrUpdated) return;

    const timeout = setTimeout(() => {
      setIsJustSubmittedOrUpdated(false);
    }, 2500); // ~2.5s subtle pulse

    return () => clearTimeout(timeout);
  }, [isJustSubmittedOrUpdated]);

  // Fetch all reviews with user profiles
  console.log('[Reviews Query] key', ['course-reviews-full', courseId, SHOW_MOCK_REVIEWS]);
  
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['course-reviews-full', courseId, SHOW_MOCK_REVIEWS],
    queryFn: async () => {
      if (!courseId) return [];

      let query = supabase
        .from('course_ratings')
        .select(
          `
          id,
          rating,
          review,
          review_date,
          user_id,
          helpful_count,
          unhelpful_count,
          is_mock,
          user_profiles:user_id (
            id,
            display_name,
            username,
            profile_photo_url
          )
        `
        )
        .eq('course_id', courseId)
        .order('review_date', { ascending: false });

      // When mock reviews are disabled, only show real reviews
      if (!SHOW_MOCK_REVIEWS) {
        query = query.eq('is_mock', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      console.log('[Reviews Query] fetched rows', {
        courseId,
        count: data?.length ?? 0,
        sample: data?.slice(0, 3),
      });
      
      return (data as any as ReviewData[]) || [];
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user's votes on reviews
  const { data: userVotes } = useQuery({
    queryKey: ['review-votes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('course_review_votes')
        .select('rating_id, vote_type')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Toggle helpful mutation
  const toggleHelpfulMutation = useMutation({
    mutationFn: async ({
      reviewId,
      action,
    }: {
      reviewId: string;
      action: 'helpful' | 'unhelpful' | 'clear';
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      if (action === 'clear') {
        // Remove vote
        const { error } = await supabase
          .from('course_review_votes')
          .delete()
          .eq('rating_id', reviewId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Upsert vote
        const { error } = await supabase.from('course_review_votes').upsert(
          {
            rating_id: reviewId,
            user_id: user.id,
            vote_type: action,
          },
          {
            onConflict: 'rating_id,user_id',
          }
        );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
      queryClient.invalidateQueries({ queryKey: ['review-votes', user?.id] });
    },
  });

  const handleToggleHelpful = (reviewId: string, action: 'helpful' | 'unhelpful' | 'clear') => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on reviews',
      });
      navigate('/auth');
      return;
    }
    toggleHelpfulMutation.mutate({ reviewId, action });
  };

  const handleRateClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to rate courses',
      });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${courseId}/rate`);
  };

  const reviews = reviewsData || [];
  const myReview = reviews.find((r) => r.user_id === user?.id);
  const otherReviews = reviews.filter((r) => r.user_id !== user?.id);

  console.log('[Reviews Render]', {
    courseId,
    length: reviews.length,
    hasMyReview: !!myReview,
    myReviewRating: myReview?.rating,
    myReviewText: myReview?.review,
    otherCount: otherReviews.length,
    ratingAggregates,
  });

  const communityScore = ratingAggregates?.avg_overall_score || 0;
  const ratingCount = ratingAggregates?.review_count ?? 0;
  const hasRatings = ratingCount > 0;

  // Transform reviews into ReviewCard format
  const transformReview = (review: ReviewData, isHighlighted = false) => {
    const profile = review.user_profiles;
    const displayName = profile?.display_name || profile?.username || 'Anonymous';
    const userVote = userVotes?.find((v) => v.rating_id === review.id);

    return {
      id: review.id,
      user: {
        name: displayName,
        avatarUrl: profile?.profile_photo_url || null,
        initials: getInitials(displayName),
      },
      score: review.rating,
      text: review.review || '',
      createdAt: review.review_date,
      helpfulCount: review.helpful_count || 0,
      unhelpfulCount: review.unhelpful_count || 0,
      isHelpful: userVote?.vote_type === 'helpful',
      isUnhelpful: userVote?.vote_type === 'unhelpful',
      isHighlighted,
    };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* Skeleton header */}
        <section className="px-4 pt-4 pb-3 bg-slate-50">
          <div className="rounded-2xl bg-white shadow-sm px-4 py-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-1" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </section>

        {/* Skeleton reviews */}
        <section className="px-4 pt-3 pb-4 bg-slate-100 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white shadow-sm px-4 py-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Empty state - use aggregates as source of truth
  if (!hasRatings) {
    return (
      <div className="flex flex-col">
        <section className="px-4 pt-6 pb-5 bg-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center">
            <p className="text-sm font-semibold text-slate-900">No reviews yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Be the first to share your experience at {courseName}.
            </p>
            <Button
              type="button"
              className="mt-3 w-full h-11 rounded-lg"
              variant="outline"
              onClick={handleRateClick}
            >
              Rate this course
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Section 1 – Header card */}
      <section className="px-4 pt-4 pb-3 bg-slate-50">
        <ReviewsHeaderCard
          communityScore={communityScore}
          reviewCount={ratingCount}
          userScore={myReview?.rating}
          userHasRating={!!myReview}
          onRateCourse={handleRateClick}
        />
      </section>

      {/* Section 2 – Your review + other reviews */}
      <section className="px-4 pt-3 pb-4 bg-slate-100">
        {myReview && (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Your review
            </p>
            <ReviewCard
              review={transformReview(myReview, isJustSubmittedOrUpdated)}
              isMine
              isHighlighted={isJustSubmittedOrUpdated}
              onToggleHelpful={handleToggleHelpful}
            />
          </div>
        )}

        {otherReviews.length > 0 && (
          <div className="space-y-3">
            {otherReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={transformReview(review)}
                onToggleHelpful={handleToggleHelpful}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3 – End message (only show if there are reviews) */}
      {reviews.length > 0 && (
        <section className="px-4 pt-4 pb-4 bg-slate-50">
          <p className="text-center text-xs text-slate-500">
            You've reached the end of the reviews.
          </p>
        </section>
      )}
    </div>
  );
};

export default CourseReviewsTab;
