/**
 * BRIEF_REVIEWS_TAB_REBUILD — the Reviews tab, flat.
 *
 * Same treatment as Course, You and Champions: NO Panel, sections separated by
 * space and hairlines, content to the 20px gutter, and controls that only
 * render when they can change what you see.
 *
 * WHAT THE NUMBERS DECIDED (measured across course_ratings):
 *   174 ratings, 151 with prose (87%) — so the prose is the content.
 *   9 ratings on the busiest course, average under 2 — so sort gates at 8,
 *   and search and the rating-filter chips are retired outright: they operated
 *   on a list the member can already see whole.
 *   99 helpful votes, ALL of them 'helpful', not one unhelpful ever — so the
 *   thumbs-down goes and Helpful is a single affirmative.
 *
 * RETIRED FROM THIS TAB (files untouched, other importers unaffected):
 *   RatingTierDistribution — one or two populated bars and four empty ones.
 *   RatingFilterChips      — nothing left to filter from.
 *   the inline search field, and the control row's "Edit yours" button (the
 *   edit action now lives inside Your review, beside the thing being edited).
 *   the "Your tees" chip — it lived in that same control row, which is gone.
 *
 * Panel, tokens.tsx and DiscoverSectionHeading are NOT modified.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/lib/toast';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { getProfilePathById } from '@/lib/profileRoutes';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SLATE_50 } from '@/features/courses/_shared/tokens';

import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useCourseReviews, type ReviewsSortBy, type CourseReview } from '@/hooks/useCourseReviews';
import { useReviewResponses, useSubmitReviewResponse } from '@/hooks/useReviewResponses';
import { useBusinessClaimForCourse } from '@/hooks/useBusinessClaimForCourse';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
import { SHOW_MOCK_REVIEWS } from '@/features/courses/config';

import { AboutSection, AboutHairline, GUTTER } from './about/AboutSection';
import { TheScore } from './reviews/TheScore';
import { WhatTheyScored } from './reviews/WhatTheyScored';
import { FlatReviewRow, FlatAction } from './reviews/reviewFlatBits';
import { ResponseDisplay, ReplyForm, VerifyToRespondPrompt } from '../review/ReviewResponseBlock';
import { ReportSheet } from '@/components/moderation/ReportSheet';
import { PullToRefreshContainer } from '@/components/ui/pull-to-refresh';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { FeedPost, MediaItem as MediaItemType } from '@/components/media-system/types/media';

export type SortOption = ReviewsSortBy;

interface CourseReviewsTabProps {
  courseId: string;
  courseName: string;
  highlightReviewId?: string | null;
}

/** §5 — sort renders only at 8 or more reviews. */
const SORT_GATE = 8;

const SORT_LABELS: Record<ReviewsSortBy, string> = {
  recent: 'Most recent',
  highest: 'Highest first',
  lowest: 'Lowest first',
  helpful: 'Most helpful',
};

const SORT_ORDER: ReviewsSortBy[] = ['recent', 'highest', 'helpful'];

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
  const { data: ratingAggregates } = useCourseRatingAggregates(courseId);
  const { subscoreMinRatings } = useTop100Config();

  const [sortBy, setSortBy] = useState<ReviewsSortBy>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [reportingReview, setReportingReview] = useState<CourseReview | null>(null);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(externalHighlightReviewId || null);
  const [pendingSheetReviewId, setPendingSheetReviewId] = useState<string | null>(null);

  const { data: reviewsData, isLoading, isError, refetch } = useCourseReviews(
    courseId,
    sortBy,
    'all',
    { showMock: SHOW_MOCK_REVIEWS },
    user?.id
  );

  const reviews = reviewsData || [];
  const myReview = reviews.find((r) => r.user_id === user?.id);
  const otherReviews = reviews.filter((r) => r.user_id !== user?.id);

  /* ── deep link (?review=<id>): highlight the row and open the sheet ─────── */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reviewIdFromUrl = searchParams.get('review') || searchParams.get('reviewId');
    const reviewIdToHighlight = reviewIdFromUrl || externalHighlightReviewId;
    if (!reviewIdToHighlight) return;

    setHighlightedReviewId(reviewIdToHighlight);
    if (reviewIdFromUrl) {
      setPendingSheetReviewId(reviewIdFromUrl);
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete('review');
        p.delete('reviewId');
        return p;
      }, { replace: true });
    }
    const timeout = setTimeout(() => setHighlightedReviewId(null), 3000);
    return () => clearTimeout(timeout);
  }, [location.search, location.pathname]);

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

  useEffect(() => {
    if (!highlightedReviewId || !reviewsData) return;
    const timeout = setTimeout(() => {
      document
        .querySelector(`[data-review-id="${highlightedReviewId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timeout);
  }, [highlightedReviewId, reviewsData]);

  const [isJustSubmittedOrUpdated, setIsJustSubmittedOrUpdated] = useState(() => {
    const fromLocationState = Boolean(location.state?.highlightMyReview);
    const fromSessionStorage = sessionStorage.getItem(`highlight-review-${courseId}`) === 'true';
    if (fromSessionStorage) sessionStorage.removeItem(`highlight-review-${courseId}`);
    return fromLocationState || fromSessionStorage;
  });
  useEffect(() => {
    if (!isJustSubmittedOrUpdated) return;
    const timeout = setTimeout(() => setIsJustSubmittedOrUpdated(false), 2500);
    return () => clearTimeout(timeout);
  }, [isJustSubmittedOrUpdated]);

  /* ── helpful vote: single affirmative, optimistic ───────────────────────── */
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
    mutationFn: async ({ reviewId, action }: { reviewId: string; action: 'helpful' | 'clear' }) => {
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
    // The count moves under the finger, then reconciles on settle.
    onMutate: async ({ reviewId, action }) => {
      const reviewsKey = { queryKey: ['course-reviews-full', courseId] } as const;
      const votesKey = ['review-votes', user?.id] as const;
      await queryClient.cancelQueries(reviewsKey);
      const prevReviews = queryClient.getQueriesData<CourseReview[]>(reviewsKey);
      const prevVotes = queryClient.getQueryData<{ rating_id: string; vote_type: string }[]>(votesKey);

      queryClient.setQueriesData<CourseReview[]>(reviewsKey, (old) =>
        old?.map((r) =>
          r.id === reviewId
            ? { ...r, helpful_count: Math.max(0, (r.helpful_count ?? 0) + (action === 'helpful' ? 1 : -1)) }
            : r
        )
      );
      queryClient.setQueryData(votesKey, (old: { rating_id: string; vote_type: string }[] | undefined) => {
        const rest = (old ?? []).filter((v) => v.rating_id !== reviewId);
        return action === 'helpful' ? [...rest, { rating_id: reviewId, vote_type: 'helpful' }] : rest;
      });

      return { prevReviews, prevVotes, votesKey };
    },
    onError: (e, _vars, ctx) => {
      ctx?.prevReviews?.forEach(([key, data]) => queryClient.setQueryData<CourseReview[]>(key as string[], data as CourseReview[]));
      if (ctx?.votesKey) queryClient.setQueryData(ctx.votesKey as unknown as string[], ctx.prevVotes);
      toast(t('review.toast.voteFailed', { defaultValue: "Couldn't save your vote" }), {
        description: e instanceof Error ? e.message : undefined,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
      queryClient.invalidateQueries({ queryKey: ['review-votes', user?.id] });
    },
  });

  const handleToggleHelpful = (reviewId: string, action: 'helpful' | 'clear') => {
    if (!user) {
      toast(t('review.toast.signInRequired'), { description: t('review.toast.voteBody') });
      navigate('/auth');
      return;
    }
    analyticsEvents.track('review_helpful_voted', {
      course_id: courseId,
      review_id: reviewId,
      direction: action === 'helpful' ? 'helpful' : 'cleared',
    });
    toggleHelpfulMutation.mutate({ reviewId, action });
  };

  const handleWriteReview = (source: 'write' | 'first' | 'edit') => {
    if (!user) {
      toast(t('review.toast.signInRequired'), { description: t('review.toast.rateBody') });
      navigate('/auth');
      return;
    }
    analyticsEvents.track(source === 'edit' ? 'review_edit_yours' : 'review_write_started', {
      course_id: courseId,
      source,
    });
    navigate(`/courses/${courseId}/rate`);
  };

  /* ── fullscreen viewer (unchanged contract) ─────────────────────────────── */
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
      // ⚠️ HARDCODED 0/false engagement fields — SAFE ONLY because this surface
      // opens the viewer with readOnly:true. See the original note: wire real
      // engagement before ever flipping readOnly off.
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
      isLikedByMe: false,
      isFollowedByMe: false,
      tags: [],
    };
  }, [courseName]);

  const handleReviewMediaClick = useCallback((
    review: CourseReview,
    mediaId: string,
    originEl: HTMLElement | null,
  ) => {
    const listed: CourseReview[] = [];
    if (myReview && (myReview.media?.length ?? 0) > 0) listed.push(myReview);
    for (const r of otherReviews) {
      if ((r.media?.length ?? 0) > 0) listed.push(r);
    }
    const posts = listed.map(buildReviewFeedPost);
    const parentIndex = Math.max(0, posts.findIndex((p) => p.id === review.id));
    const parent = posts[parentIndex];
    const posterUrl = parent?.mediaItems?.find((m) => m.id === mediaId)?.thumbnailUrl
      || parent?.mediaItems?.[0]?.thumbnailUrl
      || null;
    analyticsEvents.track('review_photo_opened', { course_id: courseId, review_id: review.id });
    openWithOrigin({
      posts,
      index: parentIndex,
      originEl,
      posterUrl,
      mediaId,
      openedFrom: 'course-reviews',
      options: { readOnly: true, hasNextPage: false },
    });
  }, [myReview, otherReviews, buildReviewFeedPost, courseId]);

  const mediaClickHandler = useCallback((review: CourseReview) => (index: number, el: HTMLElement | null) => {
    const m = review.media?.[index];
    if (m) handleReviewMediaClick(review, m.id, el);
  }, [handleReviewMediaClick]);

  const handleOverflow = (review: CourseReview) => {
    analyticsEvents.track('review_overflow_opened', { course_id: courseId, review_id: review.id });
    analyticsEvents.track('review_report_opened', { course_id: courseId, review_id: review.id });
    setReportingReview(review);
  };

  const handlePullToRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-reviews-full', courseId] });
  };

  const communityScore = ratingAggregates?.avg_overall_score || 0;
  const ratingCount = ratingAggregates?.review_count ?? 0;
  const hasRatings = ratingCount > 0;

  const showSort = reviews.length >= SORT_GATE;
  const categoryAggregates = useMemo(() => ({
    design: ratingAggregates?.avg_design_score,
    condition: ratingAggregates?.avg_condition_score,
    facilities: ratingAggregates?.avg_facilities_score,
    clubhouse: ratingAggregates?.avg_clubhouse_score,
  }), [ratingAggregates]);
  const showCategories = ratingCount >= subscoreMinRatings;

  const voteFor = (reviewId: string) =>
    userVotes?.find((v) => v.rating_id === reviewId)?.vote_type === 'helpful';

  const renderRow = (review: CourseReview, isMine: boolean) => {
    const profile = review.user_profiles;
    const displayName = profile?.display_name || profile?.username || 'Anonymous';
    return (
      <FlatReviewRow
        review={review}
        isMine={isMine}
        displayName={displayName}
        avatarUrl={profile?.profile_photo_url || null}
        isHelpful={voteFor(review.id)}
        votingDisabled={review.is_mock}
        onToggleHelpful={handleToggleHelpful}
        onMediaClick={mediaClickHandler(review)}
        onUserClick={() => navigate(getProfilePathById(review.user_id))}
        onOverflow={isMine ? undefined : () => handleOverflow(review)}
        onReadMore={(expanded) =>
          analyticsEvents.track('review_read_more', { course_id: courseId, review_id: review.id, expanded })
        }
        isHighlighted={isMine ? isJustSubmittedOrUpdated : review.id === highlightedReviewId}
      />
    );
  };

  if (isLoading) {
    return (
      <div style={{ background: SLATE_50, minHeight: '100%', padding: `0 ${GUTTER}px` }}>
        <Skeleton className="h-[40px] w-[140px]" />
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[16px] w-full" />)}
        </div>
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton className="h-[36px] w-[36px] rounded-[12px]" />
              <Skeleton className="h-[14px] w-full" />
              <Skeleton className="h-[14px] w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ background: SLATE_50, minHeight: '100%', padding: `32px ${GUTTER}px`, fontFamily: SANS }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <AlertCircle style={{ width: 20, height: 20, color: A.DIM, marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: A.INK, margin: 0 }}>{t('review.error.title')}</p>
          <p style={{ fontSize: 13, color: A.MUTE, margin: '6px 0 14px' }}>{t('review.error.body')}</p>
          <FlatAction label={t('review.error.retry')} onClick={() => refetch()} />
        </div>
      </div>
    );
  }

  return (
    <PullToRefreshContainer onRefresh={handlePullToRefresh}>
      <div style={{ background: SLATE_50, minHeight: '100%', paddingBottom: 8, fontFamily: SANS }}>
        {/* §6A — no reviews: no figure, no tier, no zero. One section. */}
        {!hasRatings ? (
          <AboutSection heading="Reviews" first space={0}>
            <div>
              <p style={{ fontSize: 13, color: A.MUTE, lineHeight: 1.6, margin: 0 }}>
                Nobody has reviewed this course yet.
              </p>
              <FlatAction label="Write the first" onClick={() => handleWriteReview('first')} />
            </div>
          </AboutSection>
        ) : (
          <>
            {/* §3.1 */}
            <TheScore score={communityScore} ratingCount={ratingCount} />

            {/* §3.2 */}
            {showCategories && <WhatTheyScored aggregates={categoryAggregates} />}

            {/* §3.3 — only when the member has reviewed */}
            {myReview && (
              <AboutSection heading="Your review">
                {renderRow(myReview, true)}
                {(() => {
                  const response = reviewResponses?.find((r) => r.review_id === myReview.id);
                  return response ? (
                    <ResponseDisplay response={response} courseId={courseId} viewerClaim={businessClaim} />
                  ) : null;
                })()}
                <FlatAction label="Edit your review" onClick={() => handleWriteReview('edit')} />
              </AboutSection>
            )}

            {/* §3.4 */}
            <AboutSection
              heading={myReview ? 'Everyone else' : 'Reviews'}
              meta={showSort ? `${SORT_LABELS[sortBy]} ⌄` : null}
              onMetaPress={showSort ? () => setSortOpen((o) => !o) : undefined}
            >
              {showSort && sortOpen && (
                <div style={{ marginBottom: 6 }}>
                  {SORT_ORDER.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSortBy(option);
                        setSortOpen(false);
                        analyticsEvents.track('review_sort_changed', { course_id: courseId, sort: option });
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        padding: '10px 0',
                        fontSize: 13,
                        fontWeight: option === sortBy ? 700 : 500,
                        color: option === sortBy ? A.INK : A.MUTE,
                        cursor: 'pointer',
                      }}
                    >
                      {SORT_LABELS[option]}
                    </button>
                  ))}
                  <AboutHairline />
                </div>
              )}

              {otherReviews.length === 0 ? (
                <p style={{ fontSize: 13, color: A.MUTE, lineHeight: 1.6, margin: 0 }}>
                  Nobody else has reviewed this course yet.
                </p>
              ) : (
                otherReviews.map((review, i) => {
                  const response = reviewResponses?.find((r) => r.review_id === review.id);
                  const isClaimAdmin = !!businessClaim && (businessClaim.role === 'owner' || businessClaim.role === 'admin');
                  const canReply = isClaimAdmin && businessClaim?.isVerified && !response;
                  const showVerifyPrompt = isClaimAdmin && !businessClaim?.isVerified && !response;
                  return (
                    <div key={review.id}>
                      {i > 0 && <AboutHairline />}
                      {renderRow(review, false)}
                      {response && (
                        <ResponseDisplay response={response} courseId={courseId} viewerClaim={businessClaim} />
                      )}
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
                  );
                })
              )}

              {!myReview && (
                <FlatAction label="Write a review" onClick={() => handleWriteReview('write')} />
              )}
            </AboutSection>
          </>
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
