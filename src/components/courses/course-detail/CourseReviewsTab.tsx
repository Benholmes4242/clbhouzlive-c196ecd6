import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { A, EmptyState } from '@/features/courses/components/holes/analytical/tokens';
import { useTranslation } from 'react-i18next';

import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
// groupMultiMedia intentionally not imported: posts are constructed one-per-review already grouped.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseReviews, type ReviewsSortBy, type ReviewsRatingFilter, type CourseReview, type ReviewMediaItem } from '@/hooks/useCourseReviews';
import { useCourseTeeSets } from '@/features/courses/hooks/useCourseTeeSets';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useReviewResponses, useSubmitReviewResponse } from '@/hooks/useReviewResponses';
import { useBusinessClaimForCourse } from '@/hooks/useBusinessClaimForCourse';
import { ReviewBlockFlat } from '../review/ReviewBlockFlat';
import { ResponseDisplay, ReplyForm, VerifyToRespondPrompt } from '../review/ReviewResponseBlock';
import type { RatingFilterValue } from '../review/RatingFilterChips';
import { WriteReviewPrompt } from '../review/WriteReviewPrompt';
import { SegmentedTabOption } from '@/components/ui/SegmentedTabs';
import { Search, X, Pencil, ArrowUpDown, ListChecks } from 'lucide-react';

import { AppSelect } from '@/components/ui/AppSelect';
import { Button } from '@/components/ui/button';
import type { ScoreTier } from '@/utils/getScoreTier';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';


import { 
  SHOW_MOCK_REVIEWS, 
  ENABLE_MOCK_TOP100_REVIEWS, 
  CYPRESS_POINT_COURSE_ID, 
  MOCK_CYPRESS_POINT_REVIEWS 
} from '@/features/courses/config';
import { getScoreTier } from '@/utils/getScoreTier';
import { HERO_NUMBER_STYLE, TIER_LABEL_STYLE } from '@/lib/ratingTier';
import { bandColor } from '@/features/courses/_shared/scoreBands';
import type { FeedPost, MediaItem as MediaItemType } from '@/components/media-system/types/media';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import { AlertCircle } from 'lucide-react';
import { getProfilePathById } from '@/lib/profileRoutes';
import { ReportSheet } from "@/components/moderation/ReportSheet";
import { AMBER, HAIRLINE_INK_7, HAIRLINE_INK_10, INK, INK_FAINT, INK_LIGHT, INK_MUTE, INK_TINT_02, INK_TINT_06, SLATE_50, SURFACE } from '@/features/courses/_shared/tokens';

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
  <div style={{ height: '0.5px', background: HAIRLINE_INK_7 }} />
);

const TIER_ROWS: { key: ScoreTier; labelKey: string }[] = [
  { key: 'exceptional', labelKey: 'review.filter.optionExceptional' },
  { key: 'excellent',  labelKey: 'review.filter.optionExcellent' },
  { key: 'good',       labelKey: 'review.filter.optionGood' },
  { key: 'fair',       labelKey: 'review.filter.optionFair' },
  { key: 'poor',       labelKey: 'review.filter.optionPoor' },
];


// Representative score per tier — drives distribution bar fill via rampForRating.
const TIER_REP_SCORE: Record<ScoreTier, number> = {
  exceptional: 9.5,
  excellent: 8.0,
  good: 6.5,
  fair: 5.0,
  poor: 2.0,
};


const CourseReviewsTab: React.FC<CourseReviewsTabProps> = ({
  courseId,
  courseName,
  highlightReviewId: externalHighlightReviewId,
}) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();

  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  
  const queryClient = useQueryClient();

  const { data: businessClaim } = useBusinessClaimForCourse(courseId);
  const { data: reviewResponses } = useReviewResponses(courseId);
  const submitResponseMutation = useSubmitReviewResponse(courseId);

  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>(null);
  // L6 - "Your tees" filter (only renders when gate conditions hold; see below)
  const [teeFilterOn, setTeeFilterOn] = useState(false);
  
  const hookRatingFilter: ReviewsRatingFilter =
    ratingFilter === 'exceptional' ? '10-9'
    : ratingFilter === 'excellent' ? '8.9-7.5'
    : ratingFilter === 'good' ? '7.4-5'
    : 'all';
  const [reportingReview, setReportingReview] = useState<CourseReview | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);

  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(externalHighlightReviewId || null);


  const sortOptions: (SegmentedTabOption & { labelKey: string })[] = [
    { value: 'recent',  labelKey: 'review.sort.recent',  label: t('review.sort.recent') },
    { value: 'highest', labelKey: 'review.sort.highest', label: t('review.sort.highest') },
    { value: 'helpful', labelKey: 'review.sort.helpful', label: t('review.sort.helpful') },
  ];


  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);

  // A deep link (?review=<id>) both highlights the row AND opens the review
  // sheet on it. The param is stripped straight away (so back/forward does not
  // re-open), so the id is parked here until the reviews query resolves.
  const [pendingSheetReviewId, setPendingSheetReviewId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reviewIdFromUrl = searchParams.get('review') || searchParams.get('reviewId');
    const reviewIdToHighlight = reviewIdFromUrl || externalHighlightReviewId;
    
    if (reviewIdToHighlight) {
      setHighlightedReviewId(reviewIdToHighlight);
      if (reviewIdFromUrl) setPendingSheetReviewId(reviewIdFromUrl);
      
      if (reviewIdFromUrl) {
        setSearchParams(prev => {
          const p = new URLSearchParams(prev);
          p.delete('review');
          p.delete('reviewId');
          return p;
        }, { replace: true });
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
    hookRatingFilter,
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
    onError: (e) => {
      toast(t('review.toast.voteFailed', { defaultValue: "Couldn't save your vote" }), {
        description: e instanceof Error ? e.message : undefined,
      });
    },
  });

  const handleToggleHelpful = (reviewId: string, action: 'helpful' | 'unhelpful' | 'clear') => {
    if (!user) {
      toast(t('review.toast.signInRequired'), { description: t('review.toast.voteBody') });
      navigate('/auth');
      return;
    }
    toggleHelpfulMutation.mutate({ reviewId, action });
  };

  const handleRateClick = () => {
    if (!user) {
      toast(t('review.toast.signInRequired'), { description: t('review.toast.rateBody') });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${courseId}/rate`);
  };


  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // handler defined below (after filteredReviews) so it can browse the full list


  const reviews = reviewsData || [];
  const myReview = reviews.find((r) => r.user_id === user?.id);

  // Deep-linked review -> open the canonical ReviewBottomSheet on it, once the
  // list has resolved. Cleared either way so it never re-fires.
  const openReviewSheet = useReviewSheetStore((s) => s.open);
  useEffect(() => {
    if (!pendingSheetReviewId || isLoading) return;
    const target = reviews.find((r) => r.id === pendingSheetReviewId);
    setPendingSheetReviewId(null);
    if (!target) return;
    const profile = target.user_profiles;
    openReviewSheet({
      user: {
        id: target.user_id ?? '',
        name: profile?.display_name || profile?.username || 'Anonymous',
        username: profile?.username ?? undefined,
        avatar: profile?.profile_photo_url ?? null,
      },
      courseId,
      courseName: courseName ?? '',
      rating: target.rating ?? 0,
      reviewId: target.id,
      reviewText: target.review ?? null,
      breakdown: {
        design: target.design_score ?? null,
        conditions: target.condition_score ?? null,
        clubhouse: target.clubhouse_score ?? null,
        facilities: target.facilities_score ?? null,
      },
    });
  }, [pendingSheetReviewId, isLoading, reviews, courseId, courseName, openReviewSheet]);



  // L6 - "Your tees" filter gating
  //   1) viewer has a remembered tee in localStorage 'tee-card:{courseId}' AND
  //   2) that stored label matches a returned colour tee for this course AND
  //   3) at least 3 of the loaded reviews carry any tee_label.
  const { data: teeSetsData } = useCourseTeeSets(courseId);
  const rememberedTeeLabel = useMemo<string | null>(() => {
    try {
      const stored = typeof window !== 'undefined'
        ? window.localStorage.getItem(`tee-card:${courseId}`)
        : null;
      if (!stored) return null;
      const colours = (teeSetsData ?? []).filter((tee) => tee.label_kind === 'colour');
      return colours.some((tee) => tee.tee_label === stored) ? stored : null;
    } catch {
      return null;
    }
  }, [courseId, teeSetsData]);
  const reviewsWithTeeCount = useMemo(
    () => reviews.reduce((n, r) => n + (r.tee_label ? 1 : 0), 0),
    [reviews],
  );
  const teeFilterAvailable = !!rememberedTeeLabel && reviewsWithTeeCount >= 3;
  // Reset the toggle if the chip's gate becomes unavailable (data changes).
  useEffect(() => {
    if (!teeFilterAvailable && teeFilterOn) setTeeFilterOn(false);
  }, [teeFilterAvailable, teeFilterOn]);

  const filteredReviews = useMemo(() => {
    let out = reviews;
    if (ratingFilter) {
      out = out.filter((r) => getScoreTier(r.rating).tier === ratingFilter);
    }
    if (teeFilterAvailable && teeFilterOn && rememberedTeeLabel) {
      out = out.filter((r) => r.tee_label === rememberedTeeLabel);
    }
    return out;
  }, [reviews, ratingFilter, teeFilterAvailable, teeFilterOn, rememberedTeeLabel]);

  const filteredMyReview = filteredReviews.find((r) => r.user_id === user?.id);
  const otherReviews = filteredReviews.filter((r) => r.user_id !== user?.id);

  // Build one real FeedPost per review (id = review.id, mediaItems = ALL of that
  // review's media). Vertical swipe browses BETWEEN reviews; `mediaId` targets
  // the tapped media within the review. Posts are constructed already-grouped,
  // so groupMultiMedia is intentionally not called here.
  const buildReviewFeedPost = useCallback((review: CourseReview): FeedPost => {
    const userProfile = review.user_profiles;
    const mediaItems: MediaItemType[] = (review.media ?? []).map((item) => {
      const isVideo = item.media_type === 'video';
      return {
        id: item.id,
        type: isVideo ? 'video' : 'image',
        hlsUrl: isVideo ? item.media_url : undefined,
        imageUrl: !isVideo ? item.media_url : undefined,
        thumbnailUrl: item.poster_url || undefined,
        width: item.width || 1080,
        height: item.height || 1080,
      };
    });
    return {
      id: review.id,
      userId: review.user_id,
      actorType: 'personal' as const,
      actorId: review.user_id,
      username: userProfile?.username || '',
      displayName: userProfile?.display_name || 'Golfer',
      avatarUrl: userProfile?.profile_photo_url || '',
      isVerified: false,
      creatorRelation: 'none' as const,
      caption: review.review || '',
      mediaItems,
      createdAt: review.review_date || new Date().toISOString(),
      // ⚠️ HARDCODED 0/false engagement fields.
      // SAFE ONLY because CourseReviewsTab opens the fullscreen viewer with
      // readOnly:true — likes/comments UI is suppressed and no mutation
      // paths can fire against these stub values. If this surface is ever
      // switched to an interactive viewer, wire real engagement (fetch
      // like_count / comment_count / is_liked_by_me for the review's
      // underlying post) BEFORE flipping readOnly off, or every viewed
      // review will appear zeroed and any like will patch a stale delta.
      likeCount: 0, // RPC lacks field
      commentCount: 0, // RPC lacks field
      shareCount: 0, // RPC lacks field
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
        breakdown: {
          design: review.design_score != null ? Number(review.design_score) : null,
          conditions: review.condition_score != null ? Number(review.condition_score) : null,
          clubhouse: review.clubhouse_score != null ? Number(review.clubhouse_score) : null,
          facilities: review.facilities_score != null ? Number(review.facilities_score) : null,
        },
      },
      isReview: true,
      courseId: review.course_id,
      courseName: review.course?.name ?? courseName,
      isLikedByMe: false, // RPC lacks field
      isFollowedByMe: false, // RPC lacks field
      tags: [],
    };
  }, [courseName]);

  const handleReviewMediaClick = useCallback((
    review: CourseReview,
    mediaId: string,
    originEl: HTMLElement | null,
  ) => {
    // All currently-listed reviews with media, in display order.
    // Pinned "my review" first, then the rest — matches on-screen order.
    const listed: CourseReview[] = [];
    if (filteredMyReview && (filteredMyReview.media?.length ?? 0) > 0) {
      listed.push(filteredMyReview);
    }
    for (const r of otherReviews) {
      if ((r.media?.length ?? 0) > 0) listed.push(r);
    }
    const posts = listed.map(buildReviewFeedPost);
    const parentIndex = Math.max(0, posts.findIndex((p) => p.id === review.id));
    const parent = posts[parentIndex];
    const posterUrl = parent?.mediaItems?.find((m) => m.id === mediaId)?.thumbnailUrl
      || parent?.mediaItems?.[0]?.thumbnailUrl
      || null;
    openWithOrigin({
      posts,
      index: parentIndex,
      originEl,
      posterUrl,
      mediaId,
      openedFrom: 'course-reviews',
      options: { readOnly: true, hasNextPage: false },
    });
  }, [filteredMyReview, otherReviews, buildReviewFeedPost]);

  // Per-tier review counts for the filter sheet (computed client-side from fetched reviews)
  const reviewCountsByTier = useMemo(() => {
    const counts: Record<ScoreTier | 'all', number> = {
      all: reviews.length,
      exceptional: 0,
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };
    for (const r of reviews) {
      const tier = getScoreTier(r.rating).tier;
      counts[tier] += 1;
    }
    return counts;
  }, [reviews]);

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
      teeLabel: review.tee_label ?? null,
      isHighlighted,
    };
  };

  const handlePullToRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
  };

  if (isLoading) {
    return (
      <div style={{ background: SLATE_50, minHeight: '100%', paddingBottom: 8 }}>
        {/* Distribution card skeleton */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton className="h-[128px] w-full rounded-[16px]" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Skeleton className="h-[34px] w-[34px] rounded-full" />
            <Skeleton className="h-[34px] w-[110px] rounded-full" />
            <Skeleton className="h-[34px] w-[96px] rounded-full" style={{ marginLeft: 'auto' }} />
          </div>
        </div>
        <Divider />

        <Divider />
        {/* Review row skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: '12px 16px 16px', borderBottom: `0.5px solid ${INK_TINT_06}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
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
          <p className="text-sm font-semibold text-foreground mb-1">{t('review.error.title')}</p>
          <p className="text-sm text-muted-foreground mb-4">
            {t('review.error.body')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full text-sm font-semibold px-5 py-2 active:scale-[0.98] transition-all min-h-[44px]"
            style={{ background: AMBER, color: A.CANVAS }}
          >
            {t('review.error.retry')}
          </button>
        </div>
      </section>
    );
  }


  // Empty state
  if (!hasRatings) {
    return (
      <div style={{ paddingBottom: 8 }}>
        <div style={{ padding: '20px 16px' }}>
          <EmptyState
            title={t('review.empty.title')}
            body={t('review.empty.body', { courseName })}
            primary={{ label: t('review.empty.cta'), onClick: handleRateClick }}
            guidanceHeading={t('review.empty.kicker')}
            guidance={[
              { title: t('review.emptyGuide.condition.title'), body: t('review.emptyGuide.condition.sub') },
              { title: t('review.emptyGuide.layout.title'), body: t('review.emptyGuide.layout.sub') },
              { title: t('review.emptyGuide.facilities.title'), body: t('review.emptyGuide.facilities.sub') },
              { title: t('review.emptyGuide.value.title'), body: t('review.emptyGuide.value.sub') },
            ]}
          />
        </div>
        <ScrollToTopGlass />
      <ReportSheet
        open={!!reportingReview}
        onOpenChange={(open) => !open && setReportingReview(null)}
        reportType="review"
        reportedUserId={reportingReview?.user_id}
        reportedReviewId={reportingReview?.id}
      />
      </div>
    );
  }


  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
    <div style={{ paddingBottom: 8, background: SLATE_50, minHeight: '100%' }}>
      {(() => {
        const maxTierCount = Math.max(...TIER_ROWS.map(t => reviewCountsByTier[t.key] ?? 0), 1);
        return (
          <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Distribution card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${HAIRLINE_INK_10}`,
                borderRadius: 16,
                padding: '16px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Score block */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, minWidth: 88 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span
                    style={{ fontSize: 44, ...HERO_NUMBER_STYLE, color: bandColor(communityScore), lineHeight: 1 }}
                  >
                    {communityScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: A.DIM, letterSpacing: '-0.02em' }}>/10</span>
                </div>
                <div
                  style={{ fontSize: 11, ...TIER_LABEL_STYLE, color: bandColor(communityScore), textAlign: 'center' }}
                >
                  {getScoreTier(communityScore).label}
                </div>
                <div style={{ fontSize: 11, color: INK_FAINT, textAlign: 'center' }}>
                  {t('review.ratingCount', { count: ratingCount })}
                </div>


              </div>

              {/* Tappable tier distribution */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TIER_ROWS.map(({ key, labelKey }) => {
                  const count = reviewCountsByTier[key] ?? 0;
                  const selected = ratingFilter === key;
                  const pct = Math.round((count / maxTierCount) * 100);
                  const barColor = bandColor(TIER_REP_SCORE[key]);
                  const label = t(labelKey);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRatingFilter(selected ? null : key)}
                      aria-pressed={selected}
                      aria-label={t('review.filterA11y', { label, count })}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: '100%' }}
                    >
                      <span style={{ fontSize: 10.5, fontWeight: selected ? 700 : 600, color: selected ? INK : INK_MUTE, letterSpacing: '0.02em', textTransform: 'uppercase', width: 92, textAlign: 'left', flexShrink: 0 }}>
                        {label}

                      </span>
                      <span style={{ flex: 1, minWidth: 0, height: 6, borderRadius: 999, background: INK_TINT_06, overflow: 'hidden', boxShadow: selected ? `0 0 0 1.5px ${AMBER}` : 'none', transition: 'box-shadow 160ms ease' }}>
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            width: `${pct}%`,
                            background: count > 0 ? barColor : 'transparent',
                            borderRadius: 999,
                            transition: 'width 220ms ease',
                          }}
                        />
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: selected ? INK : INK_MUTE, fontVariantNumeric: 'tabular-nums lining-nums', width: 22, textAlign: 'right', flexShrink: 0 }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control row / expanding search */}
            {searchOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 12px', borderRadius: 17, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HAIRLINE_INK_10}` }}>
                <Search className="h-4 w-4 text-muted-foreground" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={t('review.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 13, color: INK, background: 'transparent' }}
                />
                {searchQuery && (
                  <button type="button" onClick={handleClearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { handleClearSearch(); setSearchOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: AMBER, padding: 0, flexShrink: 0 }}
                >
                  {t('review.search.cancel')}
                </button>

              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label={t('review.search.openA11y')}
                  style={{ width: 34, height: 34, borderRadius: 17, background: 'rgba(255,255,255,0.06)', border: `1px solid ${HAIRLINE_INK_10}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>

                <AppSelect
                  value={sortBy}
                  onChange={(v) => setSortBy(v as ReviewsSortBy)}
                  options={sortOptions.map((o) => ({ value: o.value as string, label: o.label }))}
                  ariaLabel={t('review.sortA11y')}
                  icon={<ArrowUpDown className="h-3 w-3 mr-1" />}
                  triggerClassName="!h-[34px] !py-0 !px-3 !text-xs !font-semibold !rounded-full !bg-[rgba(255,255,255,0.06)] !border !border-white/10 !text-foreground hover:!bg-[rgba(255,255,255,0.10)] gap-0 [&>span]:text-foreground"
                />

                {teeFilterAvailable && (
                  <button
                    type="button"
                    aria-pressed={teeFilterOn}
                    onClick={() => {
                      const next = !teeFilterOn;
                      setTeeFilterOn(next);
                      analyticsEvents.track('review_tee_filter_toggled', {
                        course_id: courseId,
                        on: next,
                      });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 34,
                      padding: '0 12px',
                      borderRadius: 17,
                      background: teeFilterOn ? A.INK : 'rgba(255,255,255,0.06)',
                      color: teeFilterOn ? A.CANVAS : A.INK,
                      border: `1px solid ${teeFilterOn ? A.INK : HAIRLINE_INK_10}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {t('review.filter.yourTees', { defaultValue: 'Your tees' })}
                  </button>
                )}


                {myReview && (
                  <button
                    type="button"
                    onClick={handleRateClick}
                    style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 17, background: A.INK, color: A.CANVAS, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> {t('review.editYours')}
                  </button>
                )}

              </div>
            )}
          </div>
        );
      })()}

      <Divider />


      <Divider />

      {/* Your review — pinned first */}
      {filteredMyReview && (
        <div style={{ padding: '8px 16px 16px', borderBottom: `0.5px solid ${INK_TINT_06}` }}>
          <ReviewBlockFlat
            onReportClick={() => setReportingReview(filteredMyReview)}
            review={transformReview(filteredMyReview, isJustSubmittedOrUpdated)}
            isMine
            isHighlighted={isJustSubmittedOrUpdated}
            onToggleHelpful={handleToggleHelpful}
            onEditClick={handleRateClick}
            onMediaClick={(index, el) => {
              const m = filteredMyReview.media?.[index];
              if (m) handleReviewMediaClick(filteredMyReview, m.id, el);
            }}

            onUserClick={() => navigate(getProfilePathById(filteredMyReview.user_id))}
          />
          {(() => {
            const response = reviewResponses?.find(r => r.review_id === filteredMyReview.id);
            if (response) return <ResponseDisplay response={response} courseId={courseId} viewerClaim={businessClaim} />;
            return null;
          })()}
        </div>
      )}

      {/* Write prompt if no review */}
      {!myReview && (
        <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${INK_TINT_06}` }}>
          <button
            type="button"
            onClick={handleRateClick}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, background: A.PANEL, border: `1px solid ${A.BORDER}`, fontSize: 13, fontWeight: 700, color: A.INK, cursor: 'pointer' }}
          >
            {t('review.writePromptInline')}
          </button>
        </div>
      )}

      {/* Other reviews */}
      <div>
        {otherReviews.map((review) => {
          const isDeepLinked = review.id === highlightedReviewId;
          const response = reviewResponses?.find(r => r.review_id === review.id);
          const isClaimAdmin = !!businessClaim && (businessClaim.role === 'owner' || businessClaim.role === 'admin');
          const canReply = isClaimAdmin && businessClaim?.isVerified && !response;
          const showVerifyPrompt = isClaimAdmin && !businessClaim?.isVerified && !response;
          return (
            <div key={review.id} style={{ borderBottom: `0.5px solid ${INK_TINT_06}` }}>
              <div style={{ padding: '2px 16px 16px' }}>
                <ReviewBlockFlat
                onReportClick={() => setReportingReview(review)}
                  review={transformReview(review, isDeepLinked)}
                  isHighlighted={isDeepLinked}
                  onToggleHelpful={handleToggleHelpful}
                  onMediaClick={(index, el) => {
                    const m = review.media?.[index];
                    if (m) handleReviewMediaClick(review, m.id, el);
                  }}

                  onUserClick={() => navigate(getProfilePathById(review.user_id))}
                />
                {response && <ResponseDisplay response={response} courseId={courseId} viewerClaim={businessClaim} />}
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
                {showVerifyPrompt && businessClaim && (
                  <VerifyToRespondPrompt businessClaim={businessClaim} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {(searchQuery || ratingFilter) && filteredReviews.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 13, color: INK_FAINT, marginBottom: 10 }}>{t('review.noMatches.body')}</p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setRatingFilter(null); }}
            style={{ fontSize: 12, fontWeight: 700, color: INK, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {t('review.noMatches.clear')}
          </button>
        </div>
      )}

      {/* End message */}
      {filteredReviews.length > 0 && !searchQuery && !ratingFilter && (
        <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: INK_LIGHT, marginBottom: 8 }}>
            {t('review.endMessage', { count: filteredReviews.length })}
          </p>
          {!myReview && (
            <button
              type="button"
              onClick={handleRateClick}
              style={{ fontSize: 12, fontWeight: 700, color: INK_MUTE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('review.shareExperience')}
            </button>
          )}
        </div>
      )}


      <ScrollToTopGlass />
      <ReportSheet
        open={!!reportingReview}
        onOpenChange={(open) => !open && setReportingReview(null)}
        reportType="review"
        reportedUserId={reportingReview?.user_id}
        reportedReviewId={reportingReview?.id}
      />
    </div>
    </PullToRefreshContainer>
  );
};

export default CourseReviewsTab;
