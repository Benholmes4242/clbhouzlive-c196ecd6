import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal, Eye, Pencil, BarChart3, Trash2, MapPin, ShieldCheck, Clock, CheckCircle, Mail, Users
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
import BusinessVerificationModal from './verification/BusinessVerificationModal';
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
  // "Brand / Manufacturer" → "Brand"
  if (category.toLowerCase().includes('brand')) return 'Brand';
  return category;
}

export function BusinessCommandCard({ membership, userId, index = 0, isActive = false }: BusinessCommandCardProps) {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // CRITICAL: Close modals on unmount to prevent stuck overlay
  useEffect(() => {
    return () => {
      setShowDeleteDialog(false);
      setShowVerificationModal(false);
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
  
  // Subscribe to realtime updates for access requests (Ticket A)
  useBusinessAccessRequestsRealtime(business.id);
  
  const canDelete = role === 'owner';
  const canManage = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';
  
  // Derive verification state
  const verificationState = deriveVerificationState(business.is_verified, verificationRequest);
  
  // Check if domain verification is required
  const needsDomainVerification = verificationRequest?.requires_domain_check && !verificationRequest?.domain_confirmed;

  // Format stat display - show "-" for zero/empty with fixed width
  const formatStat = (value: number | undefined) => {
    if (value === undefined || value === 0) return '-';
    return value.toLocaleString();
  };

  // Format 7-day delta with +/- prefix
  const formatDelta = (value: number | undefined) => {
    if (value === undefined || value === 0) return '+0';
    return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
  };

  // Navigate to manage team page - close dropdown first
  const handleManageTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(false);
    requestAnimationFrame(() => {
      navigate(`/business/${business.id}/manage-team`);
    });
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or dropdown
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/business/${business.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
        className="bg-white"
      >
        {/* Business Row */}
        <div 
          onClick={handleRowClick}
          className="flex items-start gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {/* Logo */}
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-11 w-11 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center text-base font-semibold flex-shrink-0">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name & Meta */}
          <div className="flex-1 min-w-0">
            {/* Business name row */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate text-[15px]">{business.name}</span>
              {business.is_verified && (
                <VerifiedBadge size="sm" />
              )}
            </div>
            
            {/* Access level + Category + Active pill */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground/80">{ACCESS_LABELS[role] || role}</span>
              {business.category && (
                <>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground/80">{getCategoryDisplay(business.category)}</span>
                </>
              )}
              {isActive && (
                <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                  Active
                </span>
              )}
            </div>

            {/* Location - City + Country only */}
            {(() => {
              const locationDisplay = getCityCountry({
                city: business.city,
                region: business.region,
                country: business.country,
                location: business.location
              });
              return locationDisplay ? (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/60">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{locationDisplay}</span>
                </div>
              ) : null;
            })()}
            
            {/* Pending verification subtext */}
            {verificationState === 'pending' && (
              <p className="text-[10px] text-amber-600/80 mt-1">
                {needsDomainVerification ? 'Action required: verify your domain' : 'Under review'}
              </p>
            )}
          </div>

          {/* Three-dot menu */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-1.5 -mr-1.5 hover:bg-muted/60 rounded-sq-xs transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 rounded-sq-sm shadow-lg shadow-black/10 border-border/50"
            >
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/edit`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="gap-2.5 cursor-pointer py-2"
              >
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Insights
              </DropdownMenuItem>
              
              {canManage && (
                <>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem 
                    onClick={handleManageTeam}
                    className="gap-2.5 cursor-pointer py-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Manage team
                    {(pendingRequestsCount ?? 0) > 0 && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                  
                  {/* Verification menu item - state-based */}
                  {verificationState === 'verified' ? (
                    <DropdownMenuItem disabled className="gap-2.5 py-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </DropdownMenuItem>
                  ) : verificationState === 'pending' ? (
                    <DropdownMenuItem disabled className="gap-2.5 py-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      Verification pending
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVerificationModal(true);
                      }}
                      className="gap-2.5 cursor-pointer py-2"
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
                    className="gap-2.5 cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete business profile
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hairline divider above metrics */}
        <div className="h-px bg-border/20" />

        {/* Metrics Strip - flat, inline */}
        <div className="px-4 py-3.5">
          <div className="grid grid-cols-3 text-center">
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {statsLoading ? <span className="opacity-0">-</span> : formatStat(stats?.visits)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Visits (7d)</p>
            </div>
            <div className="flex flex-col items-center justify-center">
              {/* TOTAL followers from source of truth */}
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {followersLoading ? <span className="opacity-0">-</span> : formatStat(totalFollowers)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Followers
                {/* Show 7-day delta as secondary info */}
                {!statsLoading && stats?.followersGained !== undefined && stats.followersGained !== 0 && (
                  <span className="ml-1 text-muted-foreground/50">({formatDelta(stats.followersGained)})</span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-lg font-semibold text-foreground tabular-nums min-w-[2ch]">
                {statsLoading ? <span className="opacity-0">-</span> : formatStat(stats?.impressions)}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">Impressions (7d)</p>
            </div>
          </div>
        </div>

        {/* Hairline divider below metrics */}
        <div className="h-px bg-border/20" />

        {/* Actions Row - flat buttons with refined styling */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {needsDomainVerification ? (
            // Show domain verification CTA when required
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/business/${business.id}/verify-domain`);
              }}
              className="gap-1.5 h-9 flex-1 active:scale-[0.98] transition-all"
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
                className="h-9 flex-1 text-xs whitespace-nowrap border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] active:scale-[0.98] transition-all rounded-lg"
              >
                Edit profile
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${business.id}/insights`);
                }}
                className="h-9 flex-1 text-xs whitespace-nowrap border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] active:scale-[0.98] transition-all rounded-lg"
              >
                Insights
              </Button>
              
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageTeam}
                  className="h-9 flex-1 text-xs whitespace-nowrap border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] active:scale-[0.98] transition-all rounded-lg relative"
                >
                  Manage team
                  {(pendingRequestsCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#F79E1B] ring-2 ring-white" />
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
