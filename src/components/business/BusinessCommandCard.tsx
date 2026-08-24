import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Eye, Pencil, BarChart3, Flag, Trash2, ShieldCheck, Clock, CheckCircle, Users, ChevronRight, ChevronDown, MapPin, Star,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBusinessStats7d } from '@/hooks/useBusinessStats7d';
import { formatNumber } from '@/i18n/format';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useBusinessPendingRequestsCount } from '@/hooks/useBusinessPendingRequestsCount';
import { useBusinessAccessRequestsRealtime } from '@/hooks/useBusinessAccessRequestsRealtime';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useBusinessVerificationRequest, deriveVerificationState } from '@/hooks/useBusinessVerificationRequest';
import { useBusinessReviews } from '@/hooks/useBusinessReviews';
import { getCityCountry } from '@/lib/locationDisplay';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';
import { BIZ } from './businessTokens';
import { mayHaveClubAnalytics } from '@/features/business/clubAnalytics/useClubCourseLink';

interface BusinessCommandCardProps {
  membership: BusinessMembership;
  userId: string;
  index?: number;
  isActive?: boolean;
  /** Whether this card's dashboard is expanded. */
  expanded?: boolean;
  /** Toggle handler — called when the user taps the summary row / chevron. */
  onToggle?: () => void;
  /**
   * Ask the page to open the confirm-delete dialog for this business.
   * The dialog is hoisted to page level so invalidation-driven eviction of
   * this card can never race Radix's DismissableLayer cleanup — the classic
   * "delete-in-a-list-item" body pointer-events freeze.
   */
  onRequestDelete?: (input: { id: string; name: string }) => void;
}

// Access level labels for UI (not DB roles)
const ACCESS_LABELS: Record<string, string> = {
  owner: 'Primary manager',
  admin: 'Manager',
  editor: 'Editor',
  analyst: 'Analyst',
};

export function BusinessCommandCard({
  membership,
  userId,
  index = 0,
  isActive: _isActive = false,
  expanded = false,
  onToggle,
  onRequestDelete,
}: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [dropdownOpen, setDropdownOpen] = useState(false);




  const { business, role } = membership;

  // Fetch 7-day stats for visits/impressions — only when expanded, to keep collapsed rows cheap.
  const { data: stats, isLoading: statsLoading } = useBusinessStats7d(business?.id);

  // Fetch TOTAL followers count (source of truth)
  const { data: totalFollowers, isLoading: followersLoading } = useBusinessFollowersCount(business?.id);

  const { data: verificationRequest } = useBusinessVerificationRequest(business?.id);

  // Fetch pending access requests count for indicator
  const { data: pendingRequestsCount } = useBusinessPendingRequestsCount(business?.id);

  // Reviews summary — used for the Reviews action badge / rating.
  const { data: reviewsData } = useBusinessReviews(business?.id, { filter: 'all', sort: 'recent', limit: 1 });
  const awaitingReplies = reviewsData?.summary?.awaiting_reply ?? 0;
  const avgReviewRating = reviewsData?.summary?.avg ?? null;

  // Subscribe to realtime updates for access requests
  useBusinessAccessRequestsRealtime(business?.id);

  // Null-guard: if the joined business row is missing (deleted or soft-deleted between
  // fetch and render), bail out cleanly. Placed after hooks so the render order stays stable.
  if (!business) return null;

  const canDelete = role === 'owner';
  const canManage = role === 'owner' || role === 'admin';
  // Reviews only exist for course-linked businesses (course_ratings live on their courses).
  // Brands / coaches / retailers without a claimed club never see the Reviews UI.
  const hasCourse = !!business.club_id;

  // Derive verification state
  const verificationState = deriveVerificationState(business.is_verified, verificationRequest);
  const isVerified = verificationState === 'verified';

  /**
   * BRIEF_CLUB_ANALYTICS_TAB §2 — the entry point appears for VERIFIED GOLF
   * CLUBS with a club link only. This is the cheap pre-check: it cannot know
   * whether the claim resolves to a specific COURSE, so the page carries the
   * full gate and reports honestly when the link is missing or ambiguous.
   */
  const showClubAnalytics = mayHaveClubAnalytics(business.category, isVerified, business.club_id);

  // Domain-verification requirement (admin-initiated).
  const needsDomainVerification =
    verificationRequest?.requires_domain_check && !verificationRequest?.domain_confirmed;

  // NOTE: figure rendering lives in `MetricCell`. Loading and absent render
  // NOTHING; a genuine 0 renders "0" — zero visits is a fact, not a gap.


  const locationDisplay = getCityCountry({
    city: business.city,
    region: business.region,
    country: business.country,
    location: business.location,
  });

  const hasPendingRequests = (pendingRequestsCount ?? 0) > 0;

  // Status-line label per state. Only the 'none' case changed with the new
  // anatomy ("Not verified" + " - earn the badge" tail + quiet action); every
  // other state keeps its existing copy.
  const verifyLabel = (() => {
    if (verificationState === 'none') return t('business.card.verify.notVerified');

    if (verificationState === 'pending') {
      return needsDomainVerification ? 'Action required: verify your domain' : 'Pending verification';
    }
    if (verificationState === 'needs_more_info') return 'Action needed: more info';
    if (verificationState === 'rejected') return 'Action needed: reapply';
    return '';
  })();

  const goto = (path: string) => navigate(`/business/${business.id}${path}`);

  const handleSummaryTap = (e: React.MouseEvent) => {
    // Ignore taps that originated inside interactive children (menu, chevron button).
    const target = e.target as HTMLElement;
    if (target.closest('[data-summary-ignore="true"]')) return;
    onToggle?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2, ease: BIZ.ease }}
        className="overflow-hidden"
        style={{
          background: BIZ.card,
          border: `1px solid ${expanded ? 'rgba(15,23,42,0.12)' : BIZ.hair}`,
          borderRadius: BIZ.rCard,
          boxShadow: expanded ? '0 6px 24px rgba(15,23,42,0.06)' : 'none',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
        }}
      >
        {/* ─── SUMMARY ROW ─── */}
        <button
          type="button"
          onClick={handleSummaryTap}
          aria-expanded={expanded}
          className="w-full flex items-center gap-3 p-4 text-left active:opacity-95 transition-opacity"
          style={{ background: 'transparent', border: 'none' }}
        >
          {/* Logo — 46px squircle with canonical traced hairline */}
          <div
            className="shrink-0 relative overflow-hidden flex items-center justify-center"
            style={{
              width: 46,
              height: 46,
              background: BIZ.fillStrong,
              borderRadius: 14,
            }}
          >
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[18px] font-semibold" style={{ color: BIZ.inkMute }}>
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
            {/* Canonical 1px traced hairline ring — ink @ 12% */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ border: '1px solid rgba(15,23,42,0.12)', borderRadius: 14 }}
            />
          </div>

          {/* Name + sub */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="truncate leading-tight"
                style={{ color: BIZ.ink, fontSize: 17, fontWeight: 700, letterSpacing: '-0.032em' }}
              >
                {business.name}
              </span>
              {isVerified && <VerifiedBadge size="sm" />}
            </div>
            <p style={{ color: BIZ.inkMute, fontSize: 12, fontWeight: 500, lineHeight: 1.35 }}>
              {ACCESS_LABELS[role] || role}
            </p>
            {locationDisplay && (
              <p
                className="flex items-center gap-1"
                style={{ color: 'rgba(15,23,42,0.45)', fontSize: 12, fontWeight: 500, lineHeight: 1.35 }}
              >
                <MapPin className="h-3 w-3 shrink-0" style={{ color: 'rgba(15,23,42,0.45)' }} />
                {locationDisplay}
              </p>
            )}
          </div>

          {/* Overflow menu — never toggles the card. */}
          <span data-summary-ignore="true" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center active:opacity-60 transition-opacity"
                  style={{ borderRadius: BIZ.rInner }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5" style={{ color: BIZ.inkMute }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border/10">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); navigate(`/business/${business.id}`); }}
                  className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                >
                  <Eye className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); goto('/edit'); }}
                  className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                >
                  <Pencil className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                  Edit profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); goto('/insights'); }}
                  className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                >
                  <BarChart3 className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                  Insights
                </DropdownMenuItem>
                {showClubAnalytics && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); goto('/course'); }}
                    className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                  >
                    <Flag className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                    Your course
                  </DropdownMenuItem>
                )}
                {hasCourse && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); goto('/reviews'); }}
                    className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                  >
                    <Star className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                    Reviews
                    {awaitingReplies > 0 && (
                      <span className="ml-auto h-2 w-2 rounded-full" style={{ background: BIZ.amber }} />
                    )}
                  </DropdownMenuItem>
                )}


                {canManage && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(false);
                        requestAnimationFrame(() => goto('/team'));
                      }}
                      className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                    >
                      <Users className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                      Manage team
                      {hasPendingRequests && (
                        <span className="ml-auto h-2 w-2 rounded-full" style={{ background: BIZ.amber }} />
                      )}
                    </DropdownMenuItem>

                    {isVerified ? (
                      <DropdownMenuItem disabled className="gap-2.5 min-h-[44px] opacity-50 cursor-default" style={{ color: BIZ.amber }}>
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </DropdownMenuItem>
                    ) : verificationState === 'pending' ? (
                      <DropdownMenuItem disabled className="gap-2.5 min-h-[44px] opacity-50 cursor-default" style={{ color: BIZ.amberSoft }}>
                        <Clock className="h-4 w-4" />
                        Verification pending
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); goto('/verification'); }}
                        className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                      >
                        <ShieldCheck className="h-4 w-4" style={{ color: BIZ.inkMute }} />
                        {verificationState === 'rejected' ? 'Request verification (reapply)' : 'Request verification'}
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        // Close the dropdown BEFORE asking the page to open
                        // the (hoisted) confirm dialog. Both are Radix modal
                        // layers — leaving the dropdown mid-close while a
                        // new layer opens on the same tick is the race that
                        // strands `pointer-events: none` on <body>.
                        setDropdownOpen(false);
                        requestAnimationFrame(() => {
                          onRequestDelete?.({ id: business.id, name: business.name });
                        });
                      }}
                      className="gap-2.5 cursor-pointer min-h-[44px] text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete business profile
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </span>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: BIZ.ease }}
            style={{ display: 'inline-flex' }}
          >
            <ChevronDown className="h-5 w-5" style={{ color: BIZ.inkMute }} />
          </motion.span>
        </button>

        {/* ─── EXPANDED BODY ─── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: BIZ.ease }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ height: '0.5px', background: BIZ.hair }} />

              <div className="p-4 pt-3 space-y-3">
                {/* Verify status line — treatment only; copy per state is unchanged.
                    No gradient, no tint, no bordered tile, no amber chevron. */}
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => goto('/verification')}
                    className="w-full flex items-center gap-2 active:opacity-70 transition-opacity"
                    style={{ background: 'transparent', border: 'none', minHeight: 44 }}
                  >
                    <ShieldCheck className="shrink-0" style={{ width: 14, height: 14, color: BIZ.inkMute }} />
                    <span className="flex-1 text-left min-w-0">
                      <span style={{ color: BIZ.ink, fontSize: 13, fontWeight: 700 }}>
                        {verifyLabel}
                      </span>
                      {verificationState === 'none' && (
                        <span style={{ color: BIZ.inkMute, fontSize: 12.5, fontWeight: 500 }}>
                          {t('business.card.verify.tail')}
                        </span>
                      )}
                    </span>
                    <span
                      className="shrink-0 inline-flex items-center gap-0.5"
                      style={{
                        color: BIZ.ink,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {t('business.card.verify.action')}
                      <ChevronRight style={{ width: 11, height: 11 }} />
                    </span>
                  </button>
                )}

                {/* Metrics — ONE inset, three cells. Label above figure, window beneath. */}
                <div
                  style={{
                    background: 'rgba(14,18,22,0.035)',
                    borderRadius: 14,
                    padding: '14px 12px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                  }}
                >
                  <MetricCell
                    label={t('business.card.metrics.visits')}
                    window={t('business.card.metrics.last7Days')}
                    value={stats?.visits}
                    loading={statsLoading}
                    onClick={() => goto('/insights')}
                  />
                  <MetricCell
                    label={t('business.card.metrics.followers')}
                    window={t('business.card.metrics.allTime')}
                    value={totalFollowers}
                    loading={followersLoading}
                    onClick={() => goto('/followers')}
                  />
                  <MetricCell
                    label={t('business.card.metrics.impressions')}
                    window={t('business.card.metrics.last7Days')}
                    value={stats?.impressions}
                    loading={statsLoading}
                    onClick={() => goto('/insights')}
                  />
                </div>

                {/* Actions — heading, then rows with no rules and no icon tiles. */}
                <div>
                  <div
                    style={{
                      color: BIZ.inkFaint,
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 2,
                    }}
                  >
                    {t('business.card.manage')}
                  </div>
                  <ActionRow icon={Pencil} label={t('business.card.actions.edit')} onClick={() => goto('/edit')} />
                  <ActionRow icon={BarChart3} label={t('business.card.actions.insights')} onClick={() => goto('/insights')} />
                  {showClubAnalytics && (
                    <ActionRow icon={Flag} label="Your course" onClick={() => goto('/course')} />
                  )}
                  {hasCourse && (
                    <ActionRow
                      icon={Star}
                      label={t('business.card.actions.reviews')}
                      onClick={() => goto('/reviews')}
                      hint={
                        avgReviewRating != null
                          ? `${(Math.round(avgReviewRating * 10) / 10).toFixed(1)}`
                          : undefined
                      }
                      badge={awaitingReplies > 0}
                    />
                  )}
                  {canManage && (
                    <ActionRow
                      icon={Users}
                      label={t('business.card.actions.team')}
                      onClick={() => goto('/team')}
                      badge={hasPendingRequests}
                    />
                  )}
                  <ActionRow icon={Eye} label={t('business.card.actions.viewProfile')} onClick={() => goto('')} />
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* NOTE: the confirm dialog is intentionally NOT rendered here. It is
          hoisted to `MyBusinessesPage` and opened via `onRequestDelete`. When
          the mutation invalidates and evicts this card, the dialog host is
          not in the evicted subtree, so Radix's `DismissableLayer` cleanup
          can complete normally. See `src/lib/radixLockSanitizer.ts` for the
          belt-and-braces safety net that pairs with this hoist. */}
    </>
  );
}


/* ─────────────────────── sub-components ───────────────────────
   Both are LOCAL to this file — no other importers. */

/** 6px marks on white fail contrast at BIZ.amber, so the dot deepens. */
const AMBER_DEEP = '#C2620A';

/**
 * One metric cell inside the shared inset. Three states, three renderings:
 * loading -> nothing, null/undefined -> nothing, 0 -> "0", else formatted.
 * The figure sits in a fixed 26px box so the panel cannot jump on arrival.
 */
function MetricCell({
  label,
  window: windowLabel,
  value,
  loading,
  onClick,
}: {
  label: string;
  window: string;
  value: number | null | undefined;
  loading: boolean;
  onClick?: () => void;
}) {
  const figure =
    loading || value === null || value === undefined ? '' : formatNumber(value);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-start active:opacity-70 transition-opacity"
      style={{ background: 'transparent', border: 'none', minHeight: 44 }}
    >
      <span
        style={{
          color: BIZ.inkFaint,
          fontSize: 8,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        className="tabular-nums lining-nums flex items-center"
        style={{
          height: 26,
          color: BIZ.ink,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontFeatureSettings: '"kern" 1, "liga" 1',
        }}
      >
        {figure}
      </span>
      <span
        style={{
          color: BIZ.inkFaint,
          fontSize: 7.5,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          lineHeight: 1,
        }}
      >
        {windowLabel}
      </span>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  badge = false,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
  badge?: boolean;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 active:opacity-60 transition-opacity"
      style={{ background: 'transparent', border: 'none', minHeight: 46 }}
    >
      {/* Inline glyph as a category marker — no ornamental tile. */}
      <Icon className="shrink-0" style={{ width: 15, height: 15, color: BIZ.inkMute }} />
      <span
        className="flex-1 text-left"
        style={{ color: BIZ.ink, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}
      >
        {label}
      </span>
      {hint && (
        <span className="text-[11.5px] font-semibold tabular-nums lining-nums" style={{ color: BIZ.inkMute }}>
          {hint}
        </span>
      )}
      {badge && (
        <span
          className="rounded-full shrink-0"
          style={{ width: 6, height: 6, background: AMBER_DEEP }}
        />
      )}
      <ChevronRight className="shrink-0" style={{ width: 14, height: 14, color: BIZ.inkFaint }} />
    </button>
  );
}


