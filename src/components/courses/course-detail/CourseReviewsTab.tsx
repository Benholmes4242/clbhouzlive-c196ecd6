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
import { Search, X, Pencil, Filter, ChevronDown } from 'lucide-react';
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

const Divider = () => (
  <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)' }} />
);

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
  
  const hookRatingFilter = ratingFilter === 'exceptional' ? '10-9'
    : ratingFilter === 'excellent' ? '8.9-7.5'
    : ratingFilter === 'good' ? '7.4-5'
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
        review: {
          reviewId: review.id,
          courseId: review.course_id,
          courseName: review.course?.name ?? courseName ?? '',
          courseImageUrl: review.course?.thumbnail_image ?? null,
          rating: review.rating ?? 0,
          courseCountry: review.course?.country ?? null,
          courseRegion: review.course?.region ?? null,
          courseSubCountry: review.course?.sub_country ?? null,
          reviewText: review.review ?? null,
        },
        isReview: true,
        courseId: review.course_id,
        courseName: review.course?.name ?? courseName,
        isLikedByMe: false,
        isFollowedByMe: false,
        tags: [],
      };
    });
    useCourseMediaViewerStore.getState().open(posts, startIndex);
  }, [courseName]);

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
      <div style={{ background: '#F8FAFC', minHeight: '100%', paddingBottom: 40 }}>
        {/* Community score skeleton — stacked */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Divider />
        {/* Search skeleton */}
        <div style={{ padding: '10px 16px 0' }}>
          <Skeleton className="h-10 w-full rounded-[10px]" />
        </div>
        {/* Compressed control bar skeleton — single row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 12px' }}>
          <Skeleton className="h-7 w-28 rounded-full" />
          <div style={{ width: 1, height: 20, background: 'rgba(15,23,42,0.1)' }} />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <Divider />
        {/* Review row skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: '14px 16px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <Skeleton className="w-10 h-10 rounded-[10px]" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-[46px] w-[46px] rounded-full" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
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
      <div style={{ paddingBottom: 40 }}>
        {/* Hero */}
        <div style={{ padding: '40px 24px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(247,147,30,0.07)', border: '1.5px solid rgba(247,147,30,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            ⭐
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>No reviews yet</div>
          <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 22px' }}>
            Be the first to share your experience at {courseName}.
          </p>
          <button
            type="button"
            onClick={handleRateClick}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: 'linear-gradient(90deg, #F59E0B, #F7931E)', color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(247,147,30,0.28)' }}
          >
            Write the first review
          </button>
        </div>
        <div style={{ margin: '0 16px' }}><Divider /></div>
        {/* What to include guide */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>What to include</span>
          </div>
          {[
            { icon: '⛳', label: 'Course condition', sub: 'Greens, fairways, bunkers, rough' },
            { icon: '🏔️', label: 'Layout & design', sub: 'Challenge, variety, scenery, routing' },
            { icon: '🏠', label: 'Facilities', sub: 'Clubhouse, practice areas, service' },
            { icon: '💰', label: 'Value', sub: 'Was it worth the green fee?' },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(15,23,42,0.02)', border: '0.5px solid rgba(15,23,42,0.06)' }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <ScrollToTopGlass />
      </div>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
    <div style={{ paddingBottom: 40, background: '#F8FAFC', minHeight: '100%' }}>
      {/* Community score header — stacked & centered */}
      <div style={{ padding: '18px 16px 14px', textAlign: 'center' }}>
        
        <div style={{ fontSize: 56, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {communityScore.toFixed(1)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#c97a10', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginTop: 6 }}>
          {getScoreTier(communityScore).label}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
          {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
          {myReview && (
            <>
              {' · '}
              <button onClick={handleRateClick} style={{ background: 'none', border: 'none', color: '#F7931E', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Pencil className="w-3.5 h-3.5" /> Edit yours
              </button>
            </>
          )}
        </div>
      </div>

      <Divider />

      {/* Search */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search className="h-4 w-4 text-muted-foreground" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search reviews…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: 40, paddingLeft: 36, paddingRight: searchQuery ? 36 : 16, borderRadius: 10, border: '1px solid rgba(15,23,42,0.1)', background: 'rgba(15,23,42,0.02)', fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box' as const }}
          />
          {searchQuery && (
            <button type="button" onClick={handleClearSearch} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Compressed control bar: sort pill (cycle-on-tap) + divider + tier filter chips */}
      <div
        className="scrollbar-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {(() => {
          const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort';
          const cycleSort = () => {
            const idx = sortOptions.findIndex((o) => o.value === sortBy);
            const next = sortOptions[(idx + 1) % sortOptions.length];
            setSortBy(next.value as ReviewsSortBy);
          };
          return (
            <button
              type="button"
              onClick={cycleSort}
              aria-label={`Sort: ${currentSortLabel}. Tap to change.`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: '#0F172A',
                color: '#fff',
                fontSize: 11.5,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap' as const,
              }}
            >
              <Filter className="w-3 h-3" />
              {currentSortLabel}
              <ChevronDown className="w-3 h-3" />
            </button>
          );
        })()}

        <div style={{ width: 1, height: 20, background: 'rgba(15,23,42,0.1)', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <RatingFilterChips value={ratingFilter} onChange={setRatingFilter} />
        </div>
      </div>

      <Divider />

      {/* Your review — pinned first */}
      {filteredMyReview && (
        <div style={{ padding: '6px 16px 0', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}>
          <ReviewBlockFlat
            review={transformReview(filteredMyReview, isJustSubmittedOrUpdated)}
            isMine
            isHighlighted={isJustSubmittedOrUpdated}
            onToggleHelpful={handleToggleHelpful}
            onEditClick={handleRateClick}
            onMediaClick={(index) => {
              if (filteredMyReview.media) handleReviewMediaClick(filteredMyReview.media, index, filteredMyReview);
            }}
            onUserClick={() => navigate(getProfilePathById(filteredMyReview.user_id))}
          />
          {(() => {
            const response = reviewResponses?.find(r => r.review_id === filteredMyReview.id);
            if (response) return <div style={{ paddingBottom: 14 }}><ResponseDisplay response={response} /></div>;
            return null;
          })()}
        </div>
      )}

      {/* Write prompt if no review */}
      {!myReview && (
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}>
          <button
            type="button"
            onClick={handleRateClick}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: 'rgba(247,147,30,0.06)', border: '1.5px solid rgba(247,147,30,0.2)', fontSize: 13, fontWeight: 700, color: '#F7931E', cursor: 'pointer' }}
          >
            ⭐ Write your review
          </button>
        </div>
      )}

      {/* Other reviews */}
      <div>
        {otherReviews.map((review) => {
          const isDeepLinked = review.id === highlightedReviewId;
          const response = reviewResponses?.find(r => r.review_id === review.id);
          const canReply = businessClaim?.isVerified && !response;
          return (
            <div key={review.id} style={{ borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}>
              <div style={{ padding: '2px 16px 0' }}>
                <ReviewBlockFlat
                  review={transformReview(review, isDeepLinked)}
                  isHighlighted={isDeepLinked}
                  onToggleHelpful={handleToggleHelpful}
                  onMediaClick={(index) => {
                    if (review.media) handleReviewMediaClick(review.media, index, review);
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
              </div>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {(searchQuery || ratingFilter) && filteredReviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 10 }}>No reviews match your criteria.</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setRatingFilter(null); }}
            style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* End message */}
      {filteredReviews.length > 0 && !searchQuery && !ratingFilter && (
        <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#CBD5E1', marginBottom: 8 }}>
            You've seen all {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}.
          </p>
          {!myReview && (
            <button
              type="button"
              onClick={handleRateClick}
              style={{ fontSize: 12, fontWeight: 700, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Share your experience
            </button>
          )}
        </div>
      )}

      <ScrollToTopGlass />
    </div>
    </PullToRefreshContainer>
  );
};

export default CourseReviewsTab;
