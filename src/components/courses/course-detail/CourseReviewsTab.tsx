import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { ReviewBlockFlat } from '../review/ReviewBlockFlat';
import { CourseReviewsSummary } from '../review/CourseReviewsSummary';
import { FilterPillsRow, FilterOption } from '@/components/ui/FilterPillsRow';
import { Search } from 'lucide-react';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';
import { ReviewMediaItem } from '../review/ReviewMediaStrip';
import { getScoreTier } from '@/utils/getScoreTier';

export type SortOption = 'recent' | 'highest' | 'helpful';

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
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  user_profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  media?: ReviewMediaItem[];
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

  // Sorting, filtering, and search state
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pill options for Reviews tab
  const sortOptions: FilterOption[] = [
    { id: 'recent', label: 'Most recent' },
    { id: 'highest', label: 'Highest rated' },
    { id: 'helpful', label: 'Most helpful' },
  ];

  // Fetch rating aggregates (same query as About tab)
  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);

  // Check if we should highlight the user's review (from confirmation flow)
  // Support both location state and sessionStorage flag
  const [isJustSubmittedOrUpdated, setIsJustSubmittedOrUpdated] = useState(() => {
    const fromLocationState = Boolean(location.state?.highlightMyReview);
    const fromSessionStorage = sessionStorage.getItem(`highlight-review-${courseId}`) === 'true';
    
    // Clear the sessionStorage flag if it was set
    if (fromSessionStorage) {
      sessionStorage.removeItem(`highlight-review-${courseId}`);
    }
    
    return fromLocationState || fromSessionStorage;
  });

  useEffect(() => {
    if (!isJustSubmittedOrUpdated) return;

    const timeout = setTimeout(() => {
      setIsJustSubmittedOrUpdated(false);
    }, 2500); // ~2.5s subtle pulse

    return () => clearTimeout(timeout);
  }, [isJustSubmittedOrUpdated]);

  // Fetch all reviews with user profiles and media
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['course-reviews-full', courseId, SHOW_MOCK_REVIEWS, sortBy, searchQuery],
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
          updated_at,
          user_id,
          helpful_count,
          unhelpful_count,
          is_mock,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          user_profiles:user_id (
            id,
            display_name,
            username,
            profile_photo_url
          ),
          course_review_media (
            id,
            media_type,
            media_url,
            poster_url
          )
        `
        )
        .eq('course_id', courseId);

      // When mock reviews are disabled, only show real reviews
      if (!SHOW_MOCK_REVIEWS) {
        query = query.eq('is_mock', false);
      }

      // Search filter
      if (searchQuery.trim()) {
        query = query.ilike('review', `%${searchQuery.trim()}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'highest':
          query = query.order('rating', { ascending: false }).order('review_date', {
            ascending: false,
          });
          break;
        case 'helpful':
          query = query
            .order('helpful_count', { ascending: false, nullsFirst: false })
            .order('review_date', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('review_date', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const reviews = (data as any as ReviewData[]) || [];
      
      // Transform media arrays
      return reviews.map(review => ({
        ...review,
        media: (review as any).course_review_media as ReviewMediaItem[] || [],
      }));
    },
    enabled: !!courseId,
    staleTime: 0, // Always refetch when explicitly requested
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

  const communityScore = ratingAggregates?.avg_overall_score || 0;
  const ratingCount = ratingAggregates?.review_count ?? 0;
  const hasRatings = ratingCount > 0;

  // Calculate distribution using System-2 unified rating bands
  const calculateDistribution = () => {
    const dist = { outstanding: 0, excellent: 0, veryGood: 0, good: 0, fair: 0 };
    reviews.forEach(r => {
      const tierData = getScoreTier(r.rating);
      dist[tierData.tier]++;
    });
    return dist;
  };

  // Calculate category averages
  const calculateCategoryAverages = () => {
    const categories = { design: 0, condition: 0, clubhouse: 0, facilities: 0 };
    const counts = { design: 0, condition: 0, clubhouse: 0, facilities: 0 };

    reviews.forEach(r => {
      if (r.design_score) { categories.design += r.design_score; counts.design++; }
      if (r.condition_score) { categories.condition += r.condition_score; counts.condition++; }
      if (r.clubhouse_score) { categories.clubhouse += r.clubhouse_score; counts.clubhouse++; }
      if (r.facilities_score) { categories.facilities += r.facilities_score; counts.facilities++; }
    });

    return {
      design: counts.design > 0 ? categories.design / counts.design : null,
      condition: counts.condition > 0 ? categories.condition / counts.condition : null,
      clubhouse: counts.clubhouse > 0 ? categories.clubhouse / counts.clubhouse : null,
      facilities: counts.facilities > 0 ? categories.facilities / counts.facilities : null,
    };
  };

  // Transform reviews into ReviewBlockFlat format
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
      isMock: review.is_mock,
      design_score: review.design_score,
      condition_score: review.condition_score,
      clubhouse_score: review.clubhouse_score,
      facilities_score: review.facilities_score,
      media: review.media || [],
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
            <button
              type="button"
              className="mt-3 w-full h-11 rounded-lg inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-white text-slate-900 border border-slate-600 shadow-sm transition"
              onClick={handleRateClick}
            >
              Rate this course
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Section 1 – Summary header */}
      <section className="px-4 pt-4 pb-4 bg-slate-50">
        <CourseReviewsSummary
          averageRating={communityScore}
          reviewCount={ratingCount}
          distribution={calculateDistribution()}
          categoryAverages={calculateCategoryAverages()}
          userScore={myReview?.rating}
          userHasRating={!!myReview}
          onRateCourse={handleRateClick}
        />
      </section>

      {/* Section 2 – Search bar */}
      <section className="px-4 pt-3 pb-2 bg-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/70 focus:ring-offset-1 focus:border-slate-600 transition"
          />
        </div>
      </section>

      {/* Section 3 – Sort pills */}
      <FilterPillsRow
        options={sortOptions}
        activeId={sortBy}
        onChange={(id) => setSortBy(id as SortOption)}
      />

      {/* Section 4 – Your review + other reviews (flat blocks) */}
      <section className="px-4 pt-3 pb-4 bg-slate-50">
        {myReview && (
          <div className="mb-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
              Your review
            </p>
            <ReviewBlockFlat
              review={transformReview(myReview, isJustSubmittedOrUpdated)}
              isMine
              isHighlighted={isJustSubmittedOrUpdated}
              onToggleHelpful={handleToggleHelpful}
              onMediaClick={(index) => {
                // TODO: Open media lightbox
                console.log('Open media', index);
              }}
            />
          </div>
        )}

        {otherReviews.length > 0 && (
          <div>
            {otherReviews.map((review) => (
              <ReviewBlockFlat
                key={review.id}
                review={transformReview(review)}
                onToggleHelpful={handleToggleHelpful}
                onMediaClick={(index) => {
                  // TODO: Open media lightbox
                  console.log('Open media', index);
                }}
              />
            ))}
          </div>
        )}

        {/* No results message for search */}
        {searchQuery && reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No reviews match your search.</p>
          </div>
        )}
      </section>

      {/* Section 5 – End message (only show if there are reviews) */}
      {reviews.length > 0 && !searchQuery && (
        <section className="px-4 pt-4 pb-4 bg-slate-100">
          <p className="text-center text-xs text-slate-500">
            You've reached the end of the reviews.
          </p>
        </section>
      )}
    </div>
  );
};

export default CourseReviewsTab;
