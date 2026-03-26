import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCourseMediaViewerStore } from '@/components/course-media-tab/CourseMediaViewer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseReviews, type ReviewsSortBy, type CourseReview, type ReviewMediaItem } from '@/hooks/useCourseReviews';
import { useReviewResponses, useSubmitReviewResponse } from '@/hooks/useReviewResponses';
import { useBusinessClaimForCourse } from '@/hooks/useBusinessClaimForCourse';
import { ReviewBlockFlat } from '../review/ReviewBlockFlat';
import { ResponseDisplay, ReplyForm } from '../review/ReviewResponseBlock';
import { RatingFilterChips, RatingFilterValue } from '../review/RatingFilterChips';
import { WriteReviewPrompt } from '../review/WriteReviewPrompt';
import { SegmentedTabOption } from '@/components/ui/SegmentedTabs';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  SHOW_MOCK_REVIEWS, 
  ENABLE_MOCK_TOP100_REVIEWS, 
  CYPRESS_POINT_COURSE_ID, 
  MOCK_CYPRESS_POINT_REVIEWS 
} from '@/features/courses/config';
import { getScoreTier } from '@/utils/getScoreTier';
// REMOVED: useUnifiedFullscreen — Phase 5 fullscreen system deleted
import type { FeedPost, MediaItem as MediaItemType } from '@/components/media-system/types/media';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { AlertCircle } from 'lucide-react';
import { getProfilePathById } from '@/lib/profileRoutes';

export type SortOption = ReviewsSortBy;

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
  /** Optional review ID to scroll to and highlight (from deep link) */
  highlightReviewId?: string | null;
}

// Alias for local usage - CourseReview from the hook is our canonical type
type ReviewData = CourseReview;

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
  highlightReviewId: externalHighlightReviewId,
}) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryClient = useQueryClient();

  // Business claim context + review responses
  const { data: businessClaim } = useBusinessClaimForCourse(courseId);
  const { data: reviewResponses } = useReviewResponses(courseId);
  const submitResponseMutation = useSubmitReviewResponse(courseId);

  // Sorting, filtering, and search state
  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>(null);
  
  // Convert RatingFilterValue to the hook's format
  const hookRatingFilter = ratingFilter === 'outstanding' ? '10-9' 
    : ratingFilter === 'excellent' ? '8-7'
    : ratingFilter === 'veryGood' ? '6-5'
    : ratingFilter === 'good' || ratingFilter === 'fair' ? '<5'
    : 'all';
  
  // Track which review to highlight (from deep link or prop)
  // External prop takes priority over URL param
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(externalHighlightReviewId || null);

  // Sort options for Reviews tab
  const sortOptions: SegmentedTabOption[] = [
    { value: 'recent', label: 'Most recent' },
    { value: 'highest', label: 'Highest rated' },
    { value: 'helpful', label: 'Most helpful' },
  ];

  // Fetch rating aggregates (same query as About tab)
  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);

  // Check for reviewId query param OR external prop for deep linking
  useEffect(() => {
    // Check URL param first
    const searchParams = new URLSearchParams(location.search);
    const reviewIdFromUrl = searchParams.get('review') || searchParams.get('reviewId');
    const reviewIdToHighlight = reviewIdFromUrl || externalHighlightReviewId;
    
    if (reviewIdToHighlight) {
      setHighlightedReviewId(reviewIdToHighlight);
      
      // Clear the query param from URL without navigating
      if (reviewIdFromUrl) {
        searchParams.delete('review');
        searchParams.delete('reviewId');
        const newSearch = searchParams.toString();
        const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
      
      // Clear highlight after animation
      const timeout = setTimeout(() => {
        setHighlightedReviewId(null);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [location.search, location.pathname]);

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

  // FIX #1: Use centralized useCourseReviews hook instead of inline query
  // This ensures consistent query keys across the app for proper cache invalidation
  const { data: reviewsData, isLoading, isError, refetch } = useCourseReviews(
    courseId,
    sortBy,
    hookRatingFilter as any,
    { 
      searchQuery: searchQuery.trim() || undefined,
      showMock: SHOW_MOCK_REVIEWS,
    },
    user?.id
  );

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
      toast('Sign in required', { description: 'Please sign in to vote on reviews' });
      navigate('/auth');
      return;
    }
    toggleHelpfulMutation.mutate({ reviewId, action });
  };

  const handleRateClick = () => {
    if (!user) {
      toast('Sign in required', { description: 'Please sign in to rate courses' });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${courseId}/rate`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Convert review media to FeedPost format and open CourseMediaViewer
  const handleReviewMediaClick = useCallback((media: ReviewMediaItem[], startIndex: number, review: CourseReview) => {
    if (!media || media.length === 0) return;
    
    const userProfile = review.user_profiles;

    const posts: FeedPost[] = media.map((item) => {
      const isVideo = item.media_type === 'video';
      const mediaItem: MediaItemType = {
        id: item.id,
        type: isVideo ? 'video' : 'image',
        hlsUrl: isVideo ? item.media_url : undefined,
        imageUrl: !isVideo ? item.media_url : undefined,
        thumbnailUrl: item.poster_url || undefined,
        width: 1080,
        height: 1920,
      };
      return {
        id: item.id,
        userId: review.user_id,
        actorType: 'personal' as const,
        actorId: review.user_id,
        username: userProfile?.username || '',
        displayName: userProfile?.display_name || 'Golfer',
        avatarUrl: userProfile?.profile_photo_url || '',
        isVerified: false,
        creatorRelation: 'none' as const,
        caption: review.review || '',
        mediaItems: [mediaItem],
        createdAt: review.review_date || new Date().toISOString(),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: false,
        isFollowedByMe: false,
        tags: [],
      };
    });

    useCourseMediaViewerStore.getState().open(posts, startIndex);
  }, []);

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

  // Scroll to highlighted review when data is loaded
  useEffect(() => {
    if (!highlightedReviewId || !reviewsData) return;
    
    // Small delay to ensure DOM is rendered
    const timeout = setTimeout(() => {
      const element = document.querySelector(`[data-review-id="${highlightedReviewId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [highlightedReviewId, reviewsData]);

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

  // Pull-to-refresh handler (declared before early returns)
  const handlePullToRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* Score header skeleton */}
        <section className="px-4 py-4 flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </section>
        {/* Search skeleton */}
        <section className="px-4 pb-4">
          <Skeleton className="h-11 w-full rounded-xl" />
        </section>
        {/* Sort chips skeleton */}
        <section className="px-4 pb-4 flex gap-2 justify-center">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </section>
        {/* Review card skeletons */}
        <section className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-12 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // Fix 2: Error state
  if (isError) {
    return (
      <section className="px-4 py-8">
        <div className="flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Couldn't load reviews</p>
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-[#f59e0b] text-white text-sm font-semibold px-5 py-2 active:scale-[0.98] transition-all min-h-[44px] hover:bg-[#e8920f]"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // Empty state - use aggregates as source of truth
  if (!hasRatings) {
    return (
      <div className="flex flex-col">
        <section className="px-4 pt-4 pb-5">
          <div className="px-4 py-6 text-center">
            <p className="text-base font-semibold text-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to share your experience at {courseName}.
            </p>
            <button
              type="button"
              className="mt-4 h-11 rounded-xl inline-flex items-center justify-center px-6 text-sm font-semibold bg-card text-foreground border border-border/60 transition active:scale-[0.97]"
              onClick={handleRateClick}
            >
              Write the first review
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Reviews help other golfers discover great courses
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
    <div className="flex flex-col">
      {/* Compact rating context */}
      <section className="px-4 py-4">
        <div className="flex flex-col items-center gap-1">
          {/* Score ring */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="8" />
              <circle 
                cx="48" cy="48" r="42" fill="none" 
                stroke="url(#reviewsScoreGradient)" 
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(communityScore / 10) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="reviewsScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-foreground tabular-nums leading-none">
                {communityScore.toFixed(1)}
              </span>
            </div>
          </div>
          <span
            className="text-sm font-bold uppercase tracking-[0.05em]"
            style={{ color: '#d97706' }}
          >
            {getScoreTier(communityScore).label}
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <span>{ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</span>
            {myReview && (
              <>
                <span>·</span>
                <button
                  onClick={handleRateClick}
                  className="flex items-center gap-1.5 text-muted-foreground active:scale-[0.98] transition-transform"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit yours
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section 2 – Search bar */}
      <section className="px-4 pt-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reviews (name or keywords)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 border border-border bg-card text-base placeholder:text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border focus:ring-offset-1 focus:border-foreground transition rounded-sq-sm"
          />
          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </section>

      {/* Section 3 – Sort & Filter controls (16px from search) */}
      <div className="px-5 pt-1 pb-4">
        {/* Sort tabs */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="w-full">
          <TabsList className="bg-transparent border-0 px-0 py-0 gap-2 w-full flex justify-center">
            {sortOptions.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="min-h-[36px] px-4 text-sm font-semibold transition-all active:scale-[0.97] border-0 shadow-none after:hidden
                  data-[state=active]:text-background data-[state=active]:bg-foreground data-[state=active]:shadow-none
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
                style={{
                  borderRadius: 8,
                  border: option.value !== sortBy ? '1.5px solid hsl(var(--border))' : 'none',
                }}
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Rating filter chips */}
        <div className="mt-3">
          <RatingFilterChips 
            value={ratingFilter}
            onChange={setRatingFilter}
          />
        </div>
      </div>

      {/* Section 4 – Reviews list */}
      <section className="px-4 pt-6 pb-4">
        {/* Write a review prompt - only for non-reviewers */}
        {!myReview && (
          <div className="mb-4">
            <WriteReviewPrompt onRateClick={handleRateClick} />
          </div>
        )}

        {/* Your review section */}
        {filteredMyReview && (
          <div className="mb-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
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
              onUserClick={() => navigate(getProfilePathById(filteredMyReview.user_id))}
            />
            {/* Response for my review */}
            {(() => {
              const response = reviewResponses?.find(r => r.review_id === filteredMyReview.id);
              if (response) return <ResponseDisplay response={response} />;
              return null;
            })()}
          </div>
        )}

        {/* Other reviews */}
        {otherReviews.length > 0 && (
          <div>
            {otherReviews.map((review) => {
              const isDeepLinked = review.id === highlightedReviewId;
              const response = reviewResponses?.find(r => r.review_id === review.id);
              const canReply = businessClaim?.isVerified && !response;
              return (
                <div key={review.id}>
                  <ReviewBlockFlat
                    review={transformReview(review, isDeepLinked)}
                    isHighlighted={isDeepLinked}
                    onToggleHelpful={handleToggleHelpful}
                    onMediaClick={(index) => {
                      if (review.media) {
                        handleReviewMediaClick(review.media, index);
                      }
                    }}
                    onUserClick={() => navigate(getProfilePathById(review.user_id))}
                  />
                  {/* Existing response */}
                  {response && <ResponseDisplay response={response} />}
                  {/* Reply form for verified business owners */}
                  {canReply && (
                    <ReplyForm
                      businessClaim={businessClaim}
                      reviewId={review.id}
                      onSubmit={(reviewId, businessId, text) =>
                        submitResponseMutation.mutate({ reviewId, businessId, responseText: text })
                      }
                      isSubmitting={submitResponseMutation.isPending}
                    />
                  )}
                  <div className="mb-3" />
                </div>
              );
            })}
          </div>
        )}

        {/* No results message for search/filter */}
        {(searchQuery || ratingFilter) && filteredReviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No reviews match your criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRatingFilter(null);
              }}
              className="mt-2 text-sm font-medium text-foreground hover:text-foreground/80 underline active:scale-[0.98] transition-transform"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Section 5 – End message */}
      {filteredReviews.length > 0 && !searchQuery && !ratingFilter && (
        <section className="px-4 pt-4 pb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You've seen all {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}.
            </p>
            {!myReview && (
              <button
                type="button"
                onClick={handleRateClick}
                className="mt-2 text-sm font-medium text-foreground hover:text-foreground/80 underline active:scale-[0.98] transition-transform min-h-[44px] inline-flex items-center"
              >
                Share your experience
              </button>
            )}
          </div>
        </section>
      )}
      
      <ScrollToTopGlass />
    </div>
    </PullToRefreshContainer>
  );
};

export default CourseReviewsTab;
