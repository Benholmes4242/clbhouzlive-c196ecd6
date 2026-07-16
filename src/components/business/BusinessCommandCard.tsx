import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, ShieldCheck, Clock, CheckCircle, Users, ChevronRight, ChevronDown, MapPin, Star,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteBusinessDialog } from './DeleteBusinessDialog';
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

interface BusinessCommandCardProps {
  membership: BusinessMembership;
  userId: string;
  index?: number;
  isActive?: boolean;
  /** Whether this card's dashboard is expanded. */
  expanded?: boolean;
  /** Toggle handler — called when the user taps the summary row / chevron. */
  onToggle?: () => void;
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
}: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // CRITICAL: Close modals on unmount to prevent stuck overlay
  useEffect(() => {
    return () => {
      setShowDeleteDialog(false);
    };
  }, []);

  const { business, role } = membership;

  // Null-guard: if the joined business row is missing (deleted or soft-deleted between
  // fetch and render), bail out cleanly rather than crashing on business.id / business.name.
  if (!business) return null;

  // Fetch 7-day stats for visits/impressions — only when expanded, to keep collapsed rows cheap.
  const { data: stats, isLoading: statsLoading } = useBusinessStats7d(business.id);

  // Fetch TOTAL followers count (source of truth)
  const { data: totalFollowers, isLoading: followersLoading } = useBusinessFollowersCount(business.id);

  const { data: verificationRequest } = useBusinessVerificationRequest(business.id);

  // Fetch pending access requests count for indicator
  const { data: pendingRequestsCount } = useBusinessPendingRequestsCount(business.id);

  // Reviews summary — used for the Reviews action badge / rating.
  const { data: reviewsData } = useBusinessReviews(business.id, { filter: 'all', sort: 'recent', limit: 1 });
  const awaitingReplies = reviewsData?.summary?.awaiting_reply ?? 0;
  const avgReviewRating = reviewsData?.summary?.avg ?? null;

  // Subscribe to realtime updates for access requests
  useBusinessAccessRequestsRealtime(business.id);

  const canDelete = role === 'owner';
  const canManage = role === 'owner' || role === 'admin';
  // Reviews only exist for course-linked businesses (course_ratings live on their courses).
  // Brands / coaches / retailers without a claimed club never see the Reviews UI.
  const hasCourse = !!business.club_id;

  // Derive verification state
  const verificationState = deriveVerificationState(business.is_verified, verificationRequest);
  const isVerified = verificationState === 'verified';

  // Domain-verification requirement (admin-initiated).
  const needsDomainVerification =
    verificationRequest?.requires_domain_check && !verificationRequest?.domain_confirmed;

  // Format stat display — "-" for zero/empty (never fabricate).
  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === 0) return '-';
    return formatNumber(value);
  };

  const locationDisplay = getCityCountry({
    city: business.city,
    region: business.region,
    country: business.country,
    location: business.location,
  });

  const hasPendingRequests = (pendingRequestsCount ?? 0) > 0;

  // Verify-banner label per state.
  const verifyLabel = (() => {
    if (verificationState === 'none') return 'Get verified';
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
              <span className="text-[18px] font-bold" style={{ color: BIZ.inkMute }}>
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
                style={{ color: BIZ.ink, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em' }}
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
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-border">
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
                      onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
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
                {/* Verify banner */}
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => goto('/verification')}
                    className="w-full flex items-center gap-3 p-3 active:opacity-90 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, ${BIZ.amberTint} 0%, rgba(247,147,30,0.04) 100%)`,
                      border: `1px solid ${BIZ.amberHair}`,
                      borderRadius: BIZ.rInner,
                    }}
                  >
                    <span
                      className="shrink-0 flex items-center justify-center"
                      style={{
                        width: 32, height: 32,
                        background: '#fff',
                        border: `1px solid ${BIZ.amberHair}`,
                        borderRadius: 10,
                      }}
                    >
                      <ShieldCheck className="h-4 w-4" style={{ color: BIZ.amber }} />
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <div className="truncate" style={{ color: BIZ.ink, fontSize: 13.5, fontWeight: 700 }}>
                        {verifyLabel}
                      </div>
                      {verificationState === 'none' && (
                        <div style={{ color: 'rgba(15,23,42,0.60)', fontSize: 12, fontWeight: 500, marginTop: 2 }}>
                          Earn the badge and win golfers&apos; trust.
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 self-center" style={{ color: BIZ.amber }} />
                  </button>
                )}

                {/* Metrics — 3 tiles */}
                <div className="grid grid-cols-3 gap-2">
                  <MetricTile
                    label="Visits (7d)"
                    value={statsLoading ? '-' : formatStat(stats?.visits)}
                    onClick={() => goto('/insights')}
                  />
                  <MetricTile
                    label="Followers"
                    value={followersLoading ? '-' : formatStat(totalFollowers)}
                    onClick={() => goto('/followers')}
                  />
                  <MetricTile
                    label="Impressions (7d)"
                    value={statsLoading ? '-' : formatStat(stats?.impressions)}
                    onClick={() => goto('/insights')}
                  />
                </div>

                {/* Action rows */}
                <div
                  style={{
                    background: BIZ.card,
                    border: `1px solid ${BIZ.hair}`,
                    borderRadius: BIZ.rInner,
                    overflow: 'hidden',
                  }}
                >
                  <ActionRow icon={Pencil} label="Edit profile" onClick={() => goto('/edit')} />
                  <ActionRow icon={BarChart3} label="Insights" onClick={() => goto('/insights')} />
                  {hasCourse && (
                    <ActionRow
                      icon={Star}
                      label="Reviews"
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
                      label="Manage team"
                      onClick={() => goto('/team')}
                      badge={hasPendingRequests}
                    />
                  )}
                  <ActionRow icon={Eye} label="View live profile" onClick={() => goto('')} last />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DeleteBusinessDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        businessId={business.id}
        businessName={business.name}
        userId={userId}
      />
    </>
  );
}

/* ─────────────────────── sub-components ─────────────────────── */

function MetricTile({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const isEmpty = value === '-';
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left active:opacity-70 transition-opacity"
      style={{
        background: BIZ.card,
        border: `1px solid ${BIZ.hair}`,
        borderRadius: 12,
        padding: '12px 12px 11px',
      }}
    >
      <div
        className="tabular-nums"
        style={{
          color: isEmpty ? BIZ.inkMute : BIZ.ink,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="mt-1"
        style={{
          color: BIZ.inkMute,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  badge = false,
  hint,
  last = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
  badge?: boolean;
  hint?: string;
  last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 active:bg-black/[0.03] transition-colors"
      style={{
        borderBottom: last ? 'none' : `0.5px solid ${BIZ.hair}`,
        background: 'transparent',
        minHeight: 52,
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 32, height: 32,
          background: BIZ.fill,
          border: `1px solid ${BIZ.hair}`,
          borderRadius: 10,
        }}
      >
        <Icon className="h-4 w-4" style={{ color: BIZ.ink }} />
      </span>
      <span
        className="flex-1 text-left"
        style={{ color: BIZ.ink, fontSize: 14, fontWeight: 600 }}
      >
        {label}
      </span>
      {hint && (
        <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: BIZ.inkMute }}>
          {hint}
        </span>
      )}
      {badge && (
        <span className="h-2 w-2 rounded-full" style={{ background: BIZ.amber }} />
      )}
      <ChevronRight className="h-4 w-4" style={{ color: BIZ.inkMute }} />
    </button>
  );
}

