import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { ReviewBlockFlat } from '../review/ReviewBlockFlat';
import { CourseReviewsSummary } from '../review/CourseReviewsSummary';
import { RatingFilterChips, RatingFilterValue } from '../review/RatingFilterChips';
import { WriteReviewPrompt } from '../review/WriteReviewPrompt';
import { SegmentedTabOption } from '@/components/ui/SegmentedTabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { 
  SHOW_MOCK_REVIEWS, 
  ENABLE_MOCK_TOP100_REVIEWS, 
  CYPRESS_POINT_COURSE_ID, 
  MOCK_CYPRESS_POINT_REVIEWS 
} from '@/features/courses/config';
import { ReviewMediaItem } from '../review/ReviewMediaStrip';
import { getScoreTier } from '@/utils/getScoreTier';
import { useUnifiedFullscreen } from '@/hooks/useUnifiedFullscreen';
import type { ExploreContentItem } from '@/components/explore/types';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

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
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>(null);

  // Sort options for Reviews tab
  const sortOptions: SegmentedTabOption[] = [
    { value: 'recent', label: 'Most recent' },
    { value: 'highest', label: 'Highest rated' },
    { value: 'helpful', label: 'Most helpful' },
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

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Unified fullscreen for review media
  const { openFullscreen } = useUnifiedFullscreen('explore', {
    allowLandscape: true,
  });

  // Convert review media to ExploreContentItem format and open fullscreen
  const handleReviewMediaClick = useCallback((media: ReviewMediaItem[], startIndex: number) => {
    if (!media || media.length === 0) return;
    
    const exploreItems: ExploreContentItem[] = media.map((item) => ({
      id: item.id,
      type: item.media_type === 'video' ? 'video' : 'image',
      src: item.media_url,
      url: item.media_url,
      posterUrl: item.poster_url || undefined,
      thumbnailSrc: item.poster_url || item.media_url,
      title: '',
      likes: 0,
      aspectRatio: 1,
    }));
    
    openFullscreen(exploreItems, startIndex);
  }, [openFullscreen]);

  const reviews = reviewsData || [];
  const myReview = reviews.find((r) => r.user_id === user?.id);
  
  // Apply rating filter client-side (after search and sort from server)
  const filteredReviews = useMemo(() => {
    if (!ratingFilter) return reviews;
    return reviews.filter((r) => {
      const tierData = getScoreTier(r.rating);
      return tierData.tier === ratingFilter;
    });
  }, [reviews, ratingFilter]);
  
  const filteredMyReview = filteredReviews.find((r) => r.user_id === user?.id);
  const otherReviews = filteredReviews.filter((r) => r.user_id !== user?.id);

  // Check if we should use mock data for Cypress Point
  const isMockCypressPoint = ENABLE_MOCK_TOP100_REVIEWS && courseId === CYPRESS_POINT_COURSE_ID;

  // Use mock data for Cypress Point when enabled, otherwise use real aggregates
  const communityScore = isMockCypressPoint 
    ? MOCK_CYPRESS_POINT_REVIEWS.averageRating 
    : (ratingAggregates?.avg_overall_score || 0);
  const ratingCount = isMockCypressPoint 
    ? MOCK_CYPRESS_POINT_REVIEWS.totalReviews 
    : (ratingAggregates?.review_count ?? 0);
  const hasRatings = ratingCount > 0;

  // Calculate distribution using System-2 unified rating bands
  const calculateDistribution = () => {
    // Return mock distribution for Cypress Point when enabled
    if (isMockCypressPoint) {
      return MOCK_CYPRESS_POINT_REVIEWS.distribution;
    }

    const dist = { outstanding: 0, excellent: 0, veryGood: 0, good: 0, fair: 0 };
    reviews.forEach(r => {
      const tierData = getScoreTier(r.rating);
      dist[tierData.tier]++;
    });
    return dist;
  };

  // Calculate category averages
  const calculateCategoryAverages = () => {
    // Return mock category averages for Cypress Point when enabled
    if (isMockCypressPoint) {
      return MOCK_CYPRESS_POINT_REVIEWS.categoryAverages;
    }

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
          <div className="rounded-sq-md border border-slate-200 bg-white px-4 py-6 text-center">
            <p className="text-base font-semibold text-slate-900">No reviews yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Be the first to share your experience at {courseName}.
            </p>
            <button
              type="button"
              className="mt-4 w-full h-11 rounded-sq-pill inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium border border-slate-300/70 bg-slate-100 text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.15)] transition hover:bg-slate-50 active:scale-[0.98]"
              onClick={handleRateClick}
            >
              Write the first review
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Section 1 – Summary header (flattened on background) */}
      <section className="px-5 pt-4 pb-4 bg-slate-50 sm:pt-5">
        {/* Section label with Clubhouse logo */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <ClubhouseLogo size="xs" className="opacity-70" />
          <p className="text-sm font-semibold tracking-[0.14em] text-slate-500">
            Community Rating
          </p>
        </div>

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

      {/* Section 2 – Search bar (24px from summary) */}
      <section className="px-4 pt-6 pb-5 bg-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reviews (name or keywords)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 border border-slate-200 bg-white text-base placeholder:text-[15px] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300/70 focus:ring-offset-1 focus:border-slate-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition rounded-sq-sm"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </section>

      {/* Section 3 – Sort & Filter controls (16px from search) */}
      <div className="px-5 pt-1 pb-4 bg-slate-100">
        <p className="mb-4 text-xs font-semibold tracking-[0.08em] text-slate-500">
          Sort &amp; filter
        </p>
        {/* Sort tabs - underline style matching main tabs */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="w-full">
          <TabsList className="bg-transparent border-0 px-0 py-0 gap-0 w-full flex justify-center">
            {sortOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="relative text-sm px-3 py-2.5 font-medium bg-transparent border-0 shadow-none rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors duration-200 ease-out after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-[2px] after:rounded-[1px] after:bg-[hsl(var(--tab-orange))] after:transition-all after:duration-200 after:ease-out data-[state=active]:after:w-full data-[state=inactive]:after:w-0 data-[state=inactive]:after:opacity-0 data-[state=active]:after:opacity-[0.85]"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Rating filter chips (Upgrade B) - 12px below sort pills */}
        <div className="mt-3">
          <RatingFilterChips 
            value={ratingFilter}
            onChange={setRatingFilter}
          />
        </div>
      </div>

      {/* Section 4 – Reviews list (24px from filters) */}
      <section className="px-4 pt-6 pb-4 bg-slate-50">
        {/* Upgrade C: "Write a review" prompt - only for non-reviewers */}
        {!myReview && (
          <div className="mb-4">
            <WriteReviewPrompt onRateClick={handleRateClick} />
          </div>
        )}

        {/* Your review section */}
        {filteredMyReview && (
          <div className="mb-4">
            <p className="mb-3 text-xs font-medium tracking-wide text-slate-500">
              Your review
            </p>
            <ReviewBlockFlat
              review={transformReview(filteredMyReview, isJustSubmittedOrUpdated)}
              isMine
              isHighlighted={isJustSubmittedOrUpdated}
              onToggleHelpful={handleToggleHelpful}
              onMediaClick={(index) => {
                if (filteredMyReview.media) {
                  handleReviewMediaClick(filteredMyReview.media, index);
                }
              }}
            />
          </div>
        )}

        {/* Other reviews */}
        {otherReviews.length > 0 && (
          <div>
            {otherReviews.map((review) => (
              <ReviewBlockFlat
                key={review.id}
                review={transformReview(review)}
                onToggleHelpful={handleToggleHelpful}
                onMediaClick={(index) => {
                  if (review.media) {
                    handleReviewMediaClick(review.media, index);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* No results message for search/filter */}
        {(searchQuery || ratingFilter) && filteredReviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No reviews match your criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRatingFilter(null);
              }}
              className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Section 5 – End message (improved) */}
      {filteredReviews.length > 0 && !searchQuery && !ratingFilter && (
        <section className="px-4 pt-4 pb-6 bg-slate-100">
          <div className="text-center">
            <p className="text-sm text-slate-500">
              No more reviews yet.
            </p>
            {!myReview && (
              <button
                type="button"
                onClick={handleRateClick}
                className="mt-2 text-sm font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Be the first to add one
              </button>
            )}
          </div>
        </section>
      )}
      
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseReviewsTab;
