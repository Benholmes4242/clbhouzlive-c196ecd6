import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, MapPin, ShieldCheck, Clock, CheckCircle, Mail, Users, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteBusinessDialog } from './DeleteBusinessDialog';
import { useBusinessStats7d } from '@/hooks/useBusinessStats7d';
import { useBusinessFollowersCount } from '@/hooks/useBusinessFollow';
import { useBusinessPendingRequestsCount } from '@/hooks/useBusinessPendingRequestsCount';
import { useBusinessAccessRequestsRealtime } from '@/hooks/useBusinessAccessRequestsRealtime';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useBusinessVerificationRequest, deriveVerificationState } from '@/hooks/useBusinessVerificationRequest';
import { useBusinessVerificationRequest, deriveVerificationState } from '@/hooks/useBusinessVerificationRequest';
import { getCityCountry } from '@/lib/locationDisplay';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

interface BusinessCommandCardProps {
  membership: BusinessMembership;
  userId: string;
  index?: number;
  isActive?: boolean;
}

// Access level labels for UI (not DB roles)
const ACCESS_LABELS: Record<string, string> = {
  owner: 'Primary manager',
  admin: 'Manager',
  editor: 'Editor',
  analyst: 'Analyst',
};

// Map category to cleaner display text
function getCategoryDisplay(category: string | null | undefined): string {
  if (!category) return '';
  if (category.toLowerCase().includes('brand')) return 'Brand';
  return category;
}

export function BusinessCommandCard({ membership, userId, index = 0, isActive = false }: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // CRITICAL: Close modals on unmount to prevent stuck overlay
  useEffect(() => {
    return () => {
      setShowDeleteDialog(false);
    };
  }, []);

  const { business, role } = membership;

  // Fetch 7-day stats for visits/impressions
  const { data: stats, isLoading: statsLoading } = useBusinessStats7d(business.id);

  // Fetch TOTAL followers count (source of truth)
  const { data: totalFollowers, isLoading: followersLoading } = useBusinessFollowersCount(business.id);

  const { data: verificationRequest } = useBusinessVerificationRequest(business.id);

  // Fetch pending access requests count for indicator
  const { data: pendingRequestsCount } = useBusinessPendingRequestsCount(business.id);

  // Subscribe to realtime updates for access requests
  useBusinessAccessRequestsRealtime(business.id);

  const canDelete = role === 'owner';
  const canManage = role === 'owner' || role === 'admin';

  // Derive verification state
  const verificationState = deriveVerificationState(business.is_verified, verificationRequest);

  // Check if domain verification is required
  const needsDomainVerification = verificationRequest?.requires_domain_check && !verificationRequest?.domain_confirmed;

  // Format stat display - show "-" for zero/empty
  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === 0) return '-';
    return value.toLocaleString();
  };

  // Format 7-day delta with +/- prefix
  const formatDelta = (value: number | undefined) => {
    if (value === undefined || value === 0) return '+0';
    return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
  };

  // Navigate to business profile (People tab) for team management
  const handleManageTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    requestAnimationFrame(() => {
      navigate(`/business/${business.id}/team`);
    });
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/business/${business.id}`);
  };

  // Stat tap handlers
  const handleStatTap = (target: 'followers' | 'insights') => {
    if (target === 'followers') {
      navigate(`/business/${business.id}/followers`);
    } else {
      navigate(`/business/${business.id}/insights`);
    }
  };

  const categoryDisplay = getCategoryDisplay(business.category);
  const locationDisplay = getCityCountry({
    city: business.city,
    region: business.region,
    country: business.country,
    location: business.location,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
        className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Business Identity Row */}
        <div
          onClick={handleRowClick}
          className="flex items-start gap-3 p-4 cursor-pointer"
        >
          {/* Logo — 48px squircle */}
          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-border">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[18px] font-bold text-muted-foreground">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name & Meta */}
          <div className="flex-1 min-w-0">
            {/* Business name row */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[16px] text-foreground truncate leading-tight">
                {business.name}
              </span>
              {business.is_verified && <VerifiedBadge size="sm" />}
            </div>

            {/* Role */}
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {ACCESS_LABELS[role] || role}
            </p>

            {/* "Posting as" badge */}
            {isActive && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Zap className="w-3 h-3" />
                Posting as this business
              </span>
            )}

            {/* Category badge */}
            {categoryDisplay && (
              <span className="inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[11px] bg-muted text-muted-foreground">
                {categoryDisplay}
              </span>
            )}

            {/* Location */}
            {locationDisplay && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-[12px] text-muted-foreground truncate">
                  {locationDisplay}
                </span>
              </div>
            )}

            {/* Pending verification subtext */}
            {verificationState === 'pending' && (
              <p className="text-[12px] text-primary/70 mt-1">
                {needsDomainVerification ? 'Action required: verify your domain' : 'Pending verification'}
              </p>
            )}
          </div>

          {/* Three-dot menu */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-1 active:opacity-60 rounded-xl transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 rounded-xl shadow-lg border-border"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}`);
                }}
                className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/edit`);
                }}
                className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
              >
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Insights
              </DropdownMenuItem>

              {canManage && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={handleManageTeam}
                    className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Manage team
                    {(pendingRequestsCount ?? 0) > 0 && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>

                  {/* Verification menu item - state-based */}
                  {verificationState === 'verified' ? (
                    <DropdownMenuItem disabled className="gap-2.5 min-h-[44px] text-primary opacity-50 cursor-default">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </DropdownMenuItem>
                  ) : verificationState === 'pending' ? (
                    <DropdownMenuItem disabled className="gap-2.5 min-h-[44px] text-primary/70 opacity-50 cursor-default">
                      <Clock className="h-4 w-4" />
                      Verification pending
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVerificationModal(true);
                      }}
                      className="gap-2.5 cursor-pointer min-h-[44px] active:bg-muted"
                    >
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
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
                      setShowDeleteDialog(true);
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
        </div>

        {/* Divider */}
        <div className="h-px bg-border/30" />

        {/* Stats Strip */}
        <div className="mx-4 my-3">
          <div className="bg-muted/50 rounded-xl p-3 grid grid-cols-3 divide-x divide-border/40">
            {/* Visits */}
            <button
              onClick={() => handleStatTap('insights')}
              className="flex flex-col items-center justify-center cursor-pointer active:opacity-70 transition-opacity"
            >
              <p className={cn(
                "text-[16px] font-bold tabular-nums min-w-[2ch]",
                statsLoading ? "opacity-0" : (stats?.visits ? "text-foreground" : "text-muted-foreground")
              )}>
                {statsLoading ? '-' : formatStat(stats?.visits)}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Visits (7d)</p>
            </button>

            {/* Followers */}
            <button
              onClick={() => handleStatTap('followers')}
              className="flex flex-col items-center justify-center cursor-pointer active:opacity-70 transition-opacity"
            >
              <p className={cn(
                "text-[16px] font-bold tabular-nums min-w-[2ch]",
                followersLoading ? "opacity-0" : (totalFollowers ? "text-foreground" : "text-muted-foreground")
              )}>
                {followersLoading ? '-' : formatStat(totalFollowers)}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">
                Followers
                {!statsLoading && stats?.followersGained !== undefined && stats.followersGained !== 0 && (
                  <span className="ml-1 text-muted-foreground/50">({formatDelta(stats.followersGained)})</span>
                )}
              </p>
            </button>

            {/* Impressions */}
            <button
              onClick={() => handleStatTap('insights')}
              className="flex flex-col items-center justify-center cursor-pointer active:opacity-70 transition-opacity"
            >
              <p className={cn(
                "text-[16px] font-bold tabular-nums min-w-[2ch]",
                statsLoading ? "opacity-0" : (stats?.impressions ? "text-foreground" : "text-muted-foreground")
              )}>
                {statsLoading ? '-' : formatStat(stats?.impressions)}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Impressions (7d)</p>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/30" />

        {/* Actions Row */}
        <div className="flex items-center gap-2 p-4 pt-3">
          {needsDomainVerification ? (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/business/${business.id}/verify-domain`);
              }}
              className="gap-1.5 min-h-[44px] flex-1 active:scale-[0.97] transition-all rounded-xl"
            >
              <Mail className="h-3.5 w-3.5" />
              Verify domain now
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/edit`);
                }}
                className="min-h-[44px] flex-1 text-[13px] font-medium border-border text-foreground active:scale-[0.97] transition-transform rounded-xl flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="min-h-[44px] flex-1 text-[13px] font-medium border-border text-foreground active:scale-[0.97] transition-transform rounded-xl flex items-center justify-center gap-1.5"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Insights
              </Button>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageTeam}
                  className="min-h-[44px] flex-1 text-[13px] font-medium border-border text-foreground active:scale-[0.97] transition-transform rounded-xl flex items-center justify-center gap-1.5 relative"
                >
                  <Users className="h-3.5 w-3.5" />
                  Manage team
                  {(pendingRequestsCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      <DeleteBusinessDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        businessId={business.id}
        businessName={business.name}
        userId={userId}
      />

      <BusinessVerificationModal
        open={showVerificationModal}
        onOpenChange={setShowVerificationModal}
        businessId={business.id}
        isReapply={verificationState === 'rejected'}
      />
    </>
  );
}
