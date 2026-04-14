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
import { Search, X, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  SHOW_MOCK_REVIEWS, 
  ENABLE_MOCK_TOP100_REVIEWS, 
  CYPRESS_POINT_COURSE_ID, 
  MOCK_CYPRESS_POINT_REVIEWS 
} from '@/features/courses/config';
import { getScoreTier } from '@/utils/getScoreTier';
import type { FeedPost, MediaItem as MediaItemType } from '@/components/media-system/types/media';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { AlertCircle } from 'lucide-react';
import { getProfilePathById } from '@/lib/profileRoutes';

export type SortOption = ReviewsSortBy;

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
  highlightReviewId?: string | null;
}

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

  const { data: businessClaim } = useBusinessClaimForCourse(courseId);
  const { data: reviewResponses } = useReviewResponses(courseId);
  const submitResponseMutation = useSubmitReviewResponse(courseId);

  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>(null);
  
  const hookRatingFilter = ratingFilter === 'outstanding' ? '10-9' 
    : ratingFilter === 'excellent' ? '8-7'
    : ratingFilter === 'veryGood' ? '6-5'
    : ratingFilter === 'good' || ratingFilter === 'fair' ? '<5'
    : 'all';
  
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(externalHighlightReviewId || null);

  const sortOptions: SegmentedTabOption[] = [
    { value: 'recent', label: 'Most recent' },
    { value: 'highest', label: 'Highest rated' },
    { value: 'helpful', label: 'Most helpful' },
  ];

  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reviewIdFromUrl = searchParams.get('review') || searchParams.get('reviewId');
    const reviewIdToHighlight = reviewIdFromUrl || externalHighlightReviewId;
    
    if (reviewIdToHighlight) {
      setHighlightedReviewId(reviewIdToHighlight);
      
      if (reviewIdFromUrl) {
        searchParams.delete('review');
        searchParams.delete('reviewId');
        const newSearch = searchParams.toString();
        const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
        window.history.replaceState({}, '', newUrl);
      }
      
      const timeout = setTimeout(() => {
        setHighlightedReviewId(null);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [location.search, location.pathname]);

  const [isJustSubmittedOrUpdated, setIsJustSubmittedOrUpdated] = useState(() => {
    const fromLocationState = Boolean(location.state?.highlightMyReview);
    const fromSessionStorage = sessionStorage.getItem(`highlight-review-${courseId}`) === 'true';
    
    if (fromSessionStorage) {
      sessionStorage.removeItem(`highlight-review-${courseId}`);
    }
    
    return fromLocationState || fromSessionStorage;
  });

  useEffect(() => {
    if (!isJustSubmittedOrUpdated) return;
    const timeout = setTimeout(() => {
      setIsJustSubmittedOrUpdated(false);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [isJustSubmittedOrUpdated]);

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
        const { error } = await supabase
          .from('course_review_votes')
          .delete()
          .eq('rating_id', reviewId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_review_votes').upsert(
          { rating_id: reviewId, user_id: user.id, vote_type: action },
          { onConflict: 'rating_id,user_id' }
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
        width: item.width || 1080,
        height: item.height || 1080,
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
  
  const filteredReviews = useMemo(() => {
    if (!ratingFilter) return reviews;
    return reviews.filter((r) => {
      const tierData = getScoreTier(r.rating);
      return tierData.tier === ratingFilter;
    });
  }, [reviews, ratingFilter]);
  
  const filteredMyReview = filteredReviews.find((r) => r.user_id === user?.id);
  const otherReviews = filteredReviews.filter((r) => r.user_id !== user?.id);

  useEffect(() => {
    if (!highlightedReviewId || !reviewsData) return;
    const timeout = setTimeout(() => {
      const element = document.querySelector(`[data-review-id="${highlightedReviewId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [highlightedReviewId, reviewsData]);

  const isMockCypressPoint = ENABLE_MOCK_TOP100_REVIEWS && courseId === CYPRESS_POINT_COURSE_ID;

  const communityScore = isMockCypressPoint 
    ? MOCK_CYPRESS_POINT_REVIEWS.averageRating 
    : (ratingAggregates?.avg_overall_score || 0);
  const ratingCount = isMockCypressPoint 
    ? MOCK_CYPRESS_POINT_REVIEWS.totalReviews 
    : (ratingAggregates?.review_count ?? 0);
  const hasRatings = ratingCount > 0;

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

  const handlePullToRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <section className="px-4 py-4 flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-16 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </section>
        <section className="px-4 pb-4">
          <Skeleton className="h-11 w-full rounded-xl" />
        </section>
        <section className="px-4 pb-4 flex gap-2 justify-center">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </section>
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

  // Empty state
  if (!hasRatings) {
    return (
      <div className="flex flex-col px-4 pt-8 pb-8">
        <div style={{ padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 14 }}>⚡ Reviews</div>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(247,147,30,0.08)', border: '1.5px solid rgba(247,147,30,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <span style={{ fontSize: 26 }}>⭐</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 6px' }}>No reviews yet</p>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 18, lineHeight: 1.5, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
            Be the first to share your experience at {courseName}.
          </p>
          <button
            type="button"
            onClick={handleRateClick}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: '#F7931E', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(247,147,30,0.25)' }}
          >
            Write the first review
          </button>
        </div>
        {/* Supporting tips card */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', borderRadius: 12, padding: '14px 16px', marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.14em', textTransform: 'uppercase' as const }}>What to include</span>
          </div>
          {[
            { icon: '🏌️‍♂️', label: 'Course condition — greens, fairways, bunkers' },
            { icon: '🏌️', label: 'Layout and design — challenge, variety, scenery' },
            { icon: '🏠', label: 'Facilities — clubhouse, practice areas, service' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
    <div className="flex flex-col">
      {/* Compact score header — flat dispatch */}
      <section style={{ padding: '14px 16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 6 }}>⚡ Community Score</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' }}>
            {communityScore.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            {getScoreTier(communityScore).label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
          {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
          {myReview && (
            <>
              {' · '}
              <button onClick={handleRateClick} style={{ background: 'none', border: 'none', color: '#F7931E', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Pencil className="w-3.5 h-3.5" />
                Edit yours
              </button>
            </>
          )}
        </div>
      </section>

      {/* Search bar */}
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

      {/* Sort & Filter controls */}
      <div className="px-5 pt-1 pb-4">
        {/* Sort buttons — dispatch style */}
        <div className="w-full flex justify-center gap-2">
          {sortOptions.map((option) => {
            const isActive = sortBy === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as SortOption)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 800 : 600,
                  background: isActive ? '#0F172A' : 'transparent',
                  color: isActive ? '#ffffff' : '#94A3B8',
                  border: isActive ? 'none' : '1px solid rgba(15,23,42,0.12)',
                  cursor: 'pointer',
                  minHeight: 36,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        
        {/* Rating filter chips */}
        <div className="mt-3">
          <RatingFilterChips 
            value={ratingFilter}
            onChange={setRatingFilter}
          />
        </div>
      </div>

      {/* Reviews list */}
      <section className="px-4 pt-6 pb-4">
        {!myReview && (
          <div className="mb-4">
            <WriteReviewPrompt onRateClick={handleRateClick} />
          </div>
        )}

        {/* Your review section */}
        {filteredMyReview && (
          <div className="mb-4">
            <div style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Your Review
            </div>
            <ReviewBlockFlat
              review={transformReview(filteredMyReview, isJustSubmittedOrUpdated)}
              isMine
              isHighlighted={isJustSubmittedOrUpdated}
              onToggleHelpful={handleToggleHelpful}
              onMediaClick={(index) => {
                if (filteredMyReview.media) {
                  handleReviewMediaClick(filteredMyReview.media, index, filteredMyReview);
                }
              }}
              onUserClick={() => navigate(getProfilePathById(filteredMyReview.user_id))}
            />
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
                        handleReviewMediaClick(review.media, index, review);
                      }
                    }}
                    onUserClick={() => navigate(getProfilePathById(review.user_id))}
                  />
                  {response && <ResponseDisplay response={response} />}
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

      {/* End message */}
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
