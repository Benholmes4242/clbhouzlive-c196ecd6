import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Pencil, BarChart2, Building2, Trash2, ShieldCheck, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BusinessMembership } from '@/hooks/useBusinessMembership';
import { DeleteBusinessDialog } from './DeleteBusinessDialog';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import BusinessVerificationModal from './verification/BusinessVerificationModal';

interface BusinessOwnerMenuProps {
  businessId: string;
  businessName?: string;
  membership: BusinessMembership | null;
  className?: string;
  verificationStatus?: string | null;
  isBusinessVerified?: boolean | null;
}

export function BusinessOwnerMenu({ 
  businessId, 
  businessName = 'this business', 
  membership, 
  className,
  verificationStatus,
  isBusinessVerified 
}: BusinessOwnerMenuProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // CRITICAL: Close modals on unmount to prevent stuck overlay
  useEffect(() => {
    return () => {
      setDeleteDialogOpen(false);
      setVerificationModalOpen(false);
    };
  }, []);

  // Only show for owners/admins
  if (!membership?.canManage) {
    return null;
  }

  const isOwner = membership.role === 'owner';
  
  // Derive verification state
  const status = verificationStatus ?? 'unverified';
  const isVerified = isBusinessVerified === true;
  const isPending = status === 'pending_review' || status === 'pending';
  const isRejected = status === 'rejected';

  const handleRequestVerification = () => {
    setVerificationModalOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="glass"
            size="icon"
            className={className}
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => navigate(`/business/${businessId}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit business profile
          </DropdownMenuItem>
          
          {membership.canViewInsights && (
            <DropdownMenuItem onClick={() => navigate(`/business/${businessId}/insights`)}>
              <BarChart2 className="h-4 w-4 mr-2" />
              View insights
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Verification menu item - state-based */}
          {isVerified ? (
            <DropdownMenuItem disabled className="text-emerald-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Verified
            </DropdownMenuItem>
          ) : isPending ? (
            <DropdownMenuItem disabled className="text-amber-600">
              <Clock className="h-4 w-4 mr-2" />
              Verification pending
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRequestVerification}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isRejected ? 'Request verification (reapply)' : 'Request verification'}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/businesses/manage')}>
            <Building2 className="h-4 w-4 mr-2" />
            Manage business profiles
          </DropdownMenuItem>

          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete business profile
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <DeleteBusinessDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          businessId={businessId}
          businessName={businessName}
          userId={user.id}
        />
      )}

      <BusinessVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        businessId={businessId}
        isReapply={isRejected}
      />
    </>
  );
}
