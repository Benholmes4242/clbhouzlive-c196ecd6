/**
 * Business Insights (BRIEF_BUSINESS_INSIGHTS).
 *
 * The rules this file now encodes, because four of them were being broken:
 *   - 0 IS A FACT. A metric of zero renders "0". Only absent renders nothing,
 *     and only while the query is in flight (the Skeleton path).
 *   - The headline/funnel (CB82, InsightsFunnel) owns period changes:
 *     absolute below a base of 20, never red.
 *   - NOTHING IS INVENTED. No placeholder rows, no mock bars, no fabricated
 *     locations. A locked section says what it is waiting for and shows the
 *     member's REAL progress towards it.
 *
 * Type: the shared BUSINESS TYPE SCALE (BIZ_TITLE /
 * BIZ_BODY / bizFigure) from analytical/tokens. Nothing here renders at 800.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useBusinessMembership } from '@/hooks/useBusinessMembership';
import { useBusinessInsightsFunnel } from '@/hooks/useBusinessInsightsFunnel';
import { InsightsFunnel } from '@/components/business/insights/InsightsFunnel';
import { InsightsVisitsSection } from '@/components/business/insights/InsightsVisitsSection';
import { InsightsAudienceSection } from '@/components/business/insights/InsightsAudienceSection';
import { InsightsFollowersSection } from '@/components/business/insights/InsightsFollowersSection';
import { InsightsPostsSection } from '@/components/business/insights/InsightsPostsSection';
import { InsightsEngagementSection } from '@/components/business/insights/InsightsEngagementSection';
import { InsightsReviewsSection } from '@/components/business/insights/InsightsReviewsSection';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { RailChips } from '@/components/ui/RailChips';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { BIZ } from '@/components/business/businessTokens';
import { formatNumber } from '@/i18n/format';
import {
  A, BIZ_TITLE, BIZ_BODY, bizFigure, BIZ_TRACK_H,
} from '@/features/courses/components/holes/analytical/tokens';

type DateRange = '7d' | '30d' | '90d';
const RANGE_DAYS: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Bar fill on a dark track: ink at reduced alpha, lighter than A.TRACK, so
 *  the filled part reads as filled rather than as a hole in the track. */
const BAR_FILL = A.DIM;


const cardStyle: React.CSSProperties = { background: BIZ.card, border: `1px solid ${BIZ.hair}` };
const numFeat: React.CSSProperties = { fontFeatureSettings: '"kern" 1, "liga" 1' };

const formatNum = (n: number) => formatNumber(n ?? 0);

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
const BusinessInsightsPageV2 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useHideBottomNav();
  const { data: business, isLoading: businessLoading } = useBusinessProfile(id);
  const { data: membership, isLoading: membershipLoading, isFetched: membershipFetched } = useBusinessMembership(id);
  const { data: funnel, isError: funnelError } = useBusinessInsightsFunnel(business?.id, RANGE_DAYS[dateRange]);

  const isLoading = businessLoading || membershipLoading;

  useEffect(() => {
    // eslint-disable-next-line settled/no-not-loading-empty-check -- the branch already requires membershipFetched.
    if (membershipFetched && !membershipLoading && !membership?.canViewInsights && business) {
      navigate(`/business/${id}`, { replace: true });
    }
  }, [membershipFetched, membershipLoading, membership, business, id, navigate]);

  if (isLoading || !membershipFetched) {
    return (
      <ManagePageShell title="Insights">
        <div className="space-y-4 px-4 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  if (!business) {
    return (
      <ManagePageShell title="Insights">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p style={BIZ_BODY}>Business not found</p>
          <Button onClick={() => navigate('/')} className="mt-4 border-0" style={{ background: A.INK, color: A.CANVAS }}>Go home</Button>
        </div>
      </ManagePageShell>
    );
  }

  // TERMINAL, not a skeleton: the redirect effect above normally moves the
  // viewer on, but this state must never be able to hang.
  if (!membership?.canViewInsights) {
    return (
      <ManagePageShell title="Insights">
        <div className="max-w-xl mx-auto mt-10 text-center px-4">
          <p style={BIZ_BODY}>You don't have access to this business's insights.</p>
          <Button onClick={() => navigate(`/business/${id}`, { replace: true })} className="mt-4 border-0" style={{ background: A.INK, color: A.CANVAS }}>Back to profile</Button>
        </div>
      </ManagePageShell>
    );
  }

  const rangeLabels: Record<DateRange, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const canPost = !!membership.role && ['owner', 'admin', 'editor'].includes(membership.role);

  const rangePicker = (
    <div className="flex justify-center pb-3">
      <RailChips
        options={(['7d', '30d', '90d'] as DateRange[]).map(r => ({ id: r, label: rangeLabels[r] }))}
        value={dateRange}
        onChange={(next) => setDateRange(next as DateRange)}
        ariaLabel="Date range"
      />
    </div>
  );

  return (
    <ManagePageShell title="Insights" subtitle={business.name} belowTitle={rangePicker}>

      <div className="mx-auto px-4 md:px-6 py-6 space-y-5 md:space-y-6">
        {/* ── CB82: headline + "from seen to acted" (replaces OVERVIEW). Draws
            nothing until the first read settles or if it fails; period
            switches keep the previous figures. ── */}
        {funnel && !funnelError && (
          <div className="-mx-4 md:-mx-6 -mt-6">
            <InsightsFunnel
              funnel={funnel}
              businessName={business.name}
              days={RANGE_DAYS[dateRange]}
              canPost={canPost}
              onPost={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
            />
          </div>
        )}

        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsVisitsSection businessId={business.id} range={dateRange} />
        </div>

        {/* ── CB84: YOUR GOLFERS (replaces the permanently locked "Who's
            viewing you" card). Draws nothing until the audience read settles,
            nothing at all if it fails, and ignores the 7/30/90 picker. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsAudienceSection businessId={business.id} businessName={business.name} />
        </div>

        {/* ── CB86: FOLLOWERS (replaces AUDIENCE · Follower growth). Draws
            nothing until the first read settles or if it fails; period
            switches keep the previous card. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsFollowersSection businessId={business.id} businessName={business.name} days={RANGE_DAYS[dateRange]} />
        </div>

        {/* ── CB85: YOUR POSTS (replaces CONTENT · Top posts). Draws nothing
            until the first read settles or if it fails; period switches keep
            the previous card. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsPostsSection
            businessId={business.id}
            days={RANGE_DAYS[dateRange]}
            canPost={canPost}
            onPost={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
            onOpen={(postId) => navigate(`/post/${postId}`)}
          />
        </div>

        {/* ── CB88: ENGAGEMENT (replaces ENGAGEMENT · Engagement rate). Draws
            nothing until the first read settles, if it fails, or if the
            business has never posted; period switches keep the previous card. ── */}
        <div className="-mx-4 md:-mx-6 !mt-0">
          <InsightsEngagementSection businessId={business.id} days={RANGE_DAYS[dateRange]} />
        </div>

        {/* ── CB89: REVIEWS (replaces Reviews & reputation; club-linked only).
            Draws nothing until the first read settles, if it fails, or if the
            server says unlinked; period switches keep the previous card. ── */}
        {business.club_id && (
          <div className="-mx-4 md:-mx-6 !mt-0">
            <InsightsReviewsSection businessId={business.id} businessName={business.name} days={RANGE_DAYS[dateRange]} canManage={!!membership.canManage} onNavigate={navigate} />
          </div>
        )}
      </div>
    </ManagePageShell>
  );
};

export default BusinessInsightsPageV2;
