import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, Globe, Building2, Loader2, ShieldCheck, Mail, Users, Zap, ShieldOff, ChevronDown, History, FastForward } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAdminVerificationQueueRealtime } from '@/hooks/useBusinessVerificationRealtime';
import { useRequestDomainCheck } from '@/hooks/useDomainVerification';
import { Input } from '@/components/ui/input';
import { VerificationHistoryTimeline } from './VerificationHistoryTimeline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ENABLE_VERIFICATION_BYPASS } from '@/lib/featureFlags';
import { useIsMobile } from '@/hooks/use-mobile';
import { BusinessVerificationCard, BusinessVerificationBottomSheet } from './mobile';
import { AdminListSkeleton, AdminEmptyState } from '@/components/admin/mobile';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { BulkActionBar, SelectModeHeader } from '@/components/admin/BulkActionBar';
import { SelectModeButton } from '@/components/admin/SelectModeButton';
import { verifyBulk } from '@/lib/adminBulkApi';
import { useVerificationKeyboardShortcuts } from '@/hooks/useVerificationKeyboardShortcuts';
import { VerificationDetailDrawer, KeyboardShortcutsHint } from './index';

interface VerificationRequest {
  id: string;
  business_id: string;
  requested_by: string;
  status: string;
  website: string | null;
  note: string | null;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requires_domain_check: boolean;
  domain: string | null;
  domain_confirmed: boolean;
  domain_confirmed_at: string | null;
  approval_count: number;
  required_approvals: number;
  proof_method: string | null;
  proof_value: string | null;
  proof_metadata: Record<string, unknown> | null;
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    website: string | null;
    logo_url: string | null;
    is_verified: boolean;
    is_system_account: boolean;
  } | null;
}

const BusinessVerificationTab = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [domainCheckModalOpen, setDomainCheckModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeConfirmed, setRevokeConfirmed] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  useAdminVerificationQueueRealtime();
  const requestDomainCheck = useRequestDomainCheck();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-business-verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select(`
          id,
          business_id,
          requested_by,
          status,
          website,
          note,
          admin_note,
          reviewed_by,
          reviewed_at,
          created_at,
          requires_domain_check,
          domain,
          domain_confirmed,
          domain_confirmed_at,
          approval_count,
          required_approvals,
          proof_method,
          proof_value,
          proof_metadata,
          business:business_accounts!business_id (
            id,
            name,
            slug,
            category,
            location,
            website,
            logo_url,
            is_verified,
            is_system_account
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VerificationRequest[];
    },
  });

  const { data: myReviews } = useQuery({
    queryKey: ['admin-business-verification-my-reviews', currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_reviews')
        .select('request_id, decision')
        .eq('reviewer_id', currentUser!.id);

      if (error) throw error;
      return data as { request_id: string; decision: string }[];
    },
  });

  // Fetch ALL reviews to get accurate approval counts per request
  const { data: allReviews } = useQuery({
    queryKey: ['admin-business-verification-all-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_reviews')
        .select('request_id, decision');

      if (error) throw error;
      return data as { request_id: string; decision: string }[];
    },
  });

  // Compute approval counts from actual reviews (source of truth)
  const approvalCountsByRequest = React.useMemo(() => {
    const map = new Map<string, number>();
    allReviews?.forEach(r => {
      if (r.decision === 'approved') {
        map.set(r.request_id, (map.get(r.request_id) || 0) + 1);
      }
    });
    return map;
  }, [allReviews]);

  const myReviewsByRequest = React.useMemo(() => {
    const map = new Map<string, string>();
    myReviews?.forEach(r => map.set(r.request_id, r.decision));
    return map;
  }, [myReviews]);

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') ?? [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') ?? [];
  const revokedRequests = requests?.filter(r => r.status === 'revoked') ?? [];

  // Bulk selection for pending requests only
  const bulkSelect = useBulkSelect(
    pendingRequests,
    (r) => r.status === 'pending' // Only pending are selectable
  );

  // Bulk action handlers
  const handleBulkApprove = async () => {
    try {
      const result = await bulkSelect.executeBulk(async (ids) => {
        return await verifyBulk('approve', 'business', ids);
      });
      toast.success(`Approved ${result.success.length} verifications`, {
        description: result.failed.length > 0 ? `${result.failed.length} failed` : undefined,
        action: {
          label: 'View Audit Log',
          onClick: () => window.location.href = '/admin/audit',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['verification-queue-stats'] });
      bulkSelect.exitSelectMode();
    } catch (error: any) {
      toast.error('Bulk approval failed', { description: error.message });
    }
  };

  const handleBulkReject = async () => {
    try {
      const result = await bulkSelect.executeBulk(async (ids) => {
        return await verifyBulk('reject', 'business', ids);
      });
      toast.success(`Rejected ${result.success.length} verifications`, {
        description: result.failed.length > 0 ? `${result.failed.length} failed` : undefined,
        action: {
          label: 'View Audit Log',
          onClick: () => window.location.href = '/admin/audit',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['verification-queue-stats'] });
      bulkSelect.exitSelectMode();
    } catch (error: any) {
      toast.error('Bulk rejection failed', { description: error.message });
    }
  };

  // Keyboard shortcuts for verification actions
  useVerificationKeyboardShortcuts({
    enabled: activeTab === 'pending',
    hasSelection: bulkSelect.selectedCount > 0,
    selectMode: bulkSelect.selectMode,
    onApprove: handleBulkApprove,
    onReject: handleBulkReject,
    onSelectAll: bulkSelect.selectAll,
    onClearSelection: bulkSelect.exitSelectMode,
    onEnterSelectMode: bulkSelect.enterSelectMode,
  });

  // Open detail drawer
  const openDetailDrawer = (requestId: string) => {
    setDetailRequestId(requestId);
    setDetailDrawerOpen(true);
  };

  const submitReviewMutation = useMutation({
    mutationFn: async ({ requestId, decision, note, bypassCooldown = false }: { requestId: string; decision: string; note?: string; bypassCooldown?: boolean }) => {
      const { data, error } = await supabase.rpc('submit_business_verification_review', {
        p_request_id: requestId,
        p_reviewer_id: currentUser?.id,
        p_decision: decision,
        p_note: note || null,
        p_bypass_cooldown: bypassCooldown,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; status?: string; approvals?: number; required?: number };
      if (!result.success) throw new Error(result.error || 'Failed to submit review');
      return result;
    },
    onSuccess: async (result) => {
      const business = selectedRequest?.business;
      if (result.status === 'approved') {
        toast.success('Business verified');
        // Notify business owners
        if (business) {
          try {
            const { data: members } = await supabase
              .from('business_members')
              .select('user_profile_id')
              .eq('business_id', business.id)
              .in('role', ['owner', 'admin']);
            if (members?.length) {
              await supabase.from('notifications').insert(
                members.map(m => ({
                  user_id: m.user_profile_id,
                  recipient_actor_id: m.user_profile_id,
                  recipient_actor_type: 'personal' as const,
                  type: 'business_verification_approved',
                  entity_type: 'business',
                  entity_id: business.id,
                  title: 'Business verified',
                  message: `Your business "${business.name}" has been verified`,
                  data: { business_id: business.id, business_name: business.name } as any,
                }))
              );
            }
          } catch (e) { console.error('[Verification notification error]', e); }
        }
      } else if (result.status === 'rejected') {
        toast.success('Verification request rejected.');
        if (business) {
          try {
            const { data: members } = await supabase
              .from('business_members')
              .select('user_profile_id')
              .eq('business_id', business.id)
              .in('role', ['owner', 'admin']);
            if (members?.length) {
              await supabase.from('notifications').insert(
                members.map(m => ({
                  user_id: m.user_profile_id,
                  recipient_actor_id: m.user_profile_id,
                  recipient_actor_type: 'personal' as const,
                  type: 'business_verification_rejected',
                  entity_type: 'business',
                  entity_id: business.id,
                  title: 'Verification not approved',
                  message: `Your verification request for "${business.name}" was not approved`,
                  data: { business_id: business.id, business_name: business.name, reason: rejectReason || null } as any,
                }))
              );
            }
          } catch (e) { console.error('[Verification notification error]', e); }
        }
      } else {
        toast.success(`Approval recorded (${result.approvals} of ${result.required})`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['verification-history'] });
      setApproveDialogOpen(false);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not submit review. Please try again.');
    },
  });

  // Force approve mutation for demo/testing purposes
  const forceApproveMutation = useMutation({
    mutationFn: async ({ requestId, businessId }: { requestId: string; businessId: string }) => {
      // Update the verification request to approved + clear domain pending states
      const { error: requestError } = await supabase
        .from('business_verification_requests')
        .update({
          status: 'approved',
          approval_count: 2, // Set to required threshold
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser?.id,
          admin_note: 'Force approved for demo/testing purposes',
          // Clear domain pending states
          domain_confirmed: true,
          domain_confirmed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Set the business as verified
      const { error: businessError } = await supabase
        .from('business_accounts')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: currentUser?.id,
        })
        .eq('id', businessId);

      if (businessError) throw businessError;

      return { success: true };
    },
    onSuccess: async (_, variables) => {
      toast.success('Business force approved for demo purposes.');
      // Notify business owners
      try {
        const business = selectedRequest?.business;
        const businessName = business?.name || 'your business';
        const { data: members } = await supabase
          .from('business_members')
          .select('user_profile_id')
          .eq('business_id', variables.businessId)
          .in('role', ['owner', 'admin']);
        if (members?.length) {
          await supabase.from('notifications').insert(
            members.map(m => ({
              user_id: m.user_profile_id,
              recipient_actor_id: m.user_profile_id,
              recipient_actor_type: 'personal' as const,
              type: 'business_verification_approved',
              entity_type: 'business',
              entity_id: variables.businessId,
              title: 'Business verified',
              message: `Your business "${businessName}" has been verified`,
              data: { business_id: variables.businessId, business_name: businessName } as any,
            }))
          );
        }
      } catch (e) { console.error('[Force approve notification error]', e); }
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-all-reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not force approve. Please try again.');
    },
  });

  // Revoke verification mutation
  const revokeVerificationMutation = useMutation({
    mutationFn: async ({ businessId, reason, bypassCooldown = false }: { businessId: string; reason?: string; bypassCooldown?: boolean }) => {
      const { error } = await supabase.rpc('revoke_business_verification', {
        p_business_id: businessId,
        p_admin_id: currentUser?.id,
        p_reason: reason || null,
        p_bypass_cooldown: bypassCooldown,
      });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: async (_, { businessId, reason }) => {
      toast.success('Verification removed', {
        description: 'The business will need to request verification again.',
      });
      // Notify business owners
      try {
        const business = selectedRequest?.business;
        const businessName = business?.name || 'your business';
        const { data: members } = await supabase
          .from('business_members')
          .select('user_profile_id')
          .eq('business_id', businessId)
          .in('role', ['owner', 'admin']);
        if (members?.length) {
          await supabase.from('notifications').insert(
            members.map(m => ({
              user_id: m.user_profile_id,
              recipient_actor_id: m.user_profile_id,
              recipient_actor_type: 'personal' as const,
              type: 'business_verification_removed',
              entity_type: 'business',
              entity_id: businessId,
              title: 'Verification revoked',
              message: `Verification for "${businessName}" has been revoked`,
              data: { business_id: businessId, business_name: businessName, reason: reason || null } as any,
            }))
          );
        }
      } catch (e) { console.error('[Revoke notification error]', e); }
      // Invalidate admin queries
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['verification-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-all-reviews'] });
      // Invalidate user-facing queries so Business Profiles page updates immediately
      queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business-verification-request', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      setRevokeModalOpen(false);
      setSelectedRequest(null);
      setRevokeReason('');
      setRevokeConfirmed(false);
    },
    onError: (error: any) => {
      console.error('[Revoke Verification Error]', error);
      toast.error('Unable to remove verification', {
        description: error?.message || 'Please try again or contact support.',
      });
      // Keep modal open on error - don't close it
    },
  });

  // Bypass 2nd approval mutation - calls edge function with service role
  const bypassSecondApprovalMutation = useMutation({
    mutationFn: async ({ requestId, businessId }: { requestId: string; businessId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('bypass-second-approval', {
        body: { request_id: requestId },
      });

      // Handle FunctionsHttpError - extract body message
      if (response.error) {
        // Try to get error details from the response
        const errorMessage = response.error.message || 'Bypass failed';
        console.error('[bypass-second-approval] Error:', response.error, 'Data:', response.data);
        throw new Error(errorMessage);
      }
      
      if (!response.data?.ok) {
        const errorMessage = response.data?.error || 'Bypass failed';
        console.error('[bypass-second-approval] Not OK:', response.data);
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Approved via bypass (test mode).', {
        description: `Business has been verified (${data.approvals} approvals).`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['verification-history'] });
    },
    onError: (error: any) => {
      console.error('[bypass-second-approval] Mutation error:', error);
      toast.error('Bypass failed', {
        description: error.message || 'Could not bypass approval. Please try again.',
      });
    },
  });

  const processing = submitReviewMutation.isPending || requestDomainCheck.isPending || forceApproveMutation.isPending || revokeVerificationMutation.isPending || bypassSecondApprovalMutation.isPending;

  const openRejectModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const openApproveDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const openDomainCheckModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    const website = request.website || request.business?.website || '';
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      setDomainInput(url.hostname.replace('www.', ''));
    } catch {
      setDomainInput('');
    }
    setDomainCheckModalOpen(true);
  };

  // State for inline revoke error
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const openRevokeModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRevokeReason('');
    setRevokeConfirmed(false);
    setRevokeError(null);
    setRevokeModalOpen(true);
  };

  const handleRevokeSubmit = async () => {
    if (!selectedRequest?.business) return;
    setRevokeError(null);
    try {
      await revokeVerificationMutation.mutateAsync({
        businessId: selectedRequest.business.id,
        reason: revokeReason,
      });
      // Success is handled by onSuccess callback
    } catch (err: any) {
      // Error is handled inline - don't close modal
      setRevokeError(err?.message || 'Failed to remove verification. Please try again.');
    }
  };

  const handleRequestDomainCheck = async () => {
    if (!selectedRequest || !domainInput.trim()) return;
    await requestDomainCheck.mutateAsync({ requestId: selectedRequest.id, domain: domainInput.trim() });
    setDomainCheckModalOpen(false);
    setSelectedRequest(null);
    setDomainInput('');
  };

  const handleWebsiteClick = (url: string | null) => {
    if (!url) return;
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(fullUrl);
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('This website link appears to be invalid.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case 'revoked':
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderRequestCard = (request: VerificationRequest, showActions: boolean) => {
    const business = request.business;
    const myReview = myReviewsByRequest.get(request.id);
    const hasAlreadyReviewed = !!myReview;
    // Use computed approval count from actual reviews (source of truth)
    const approvalCount = approvalCountsByRequest.get(request.id) ?? 0;
    const requiredApprovals = request.required_approvals ?? 2;
    
    return (
      <Card key={request.id} className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <h3 className="font-semibold text-base md:text-lg truncate">{business?.name || 'Unknown Business'}</h3>
                {getStatusBadge(request.status)}
                {business?.is_verified && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Verified</span>
                  </Badge>
                )}
                {/* Previously verified badge for revoked/pending requests */}
                {request.status === 'revoked' && (
                  <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-xs">
                    <History className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Previously verified</span>
                  </Badge>
                )}
              </div>
              {business?.category && <p className="text-xs md:text-sm text-muted-foreground">{business.category}</p>}
            </div>
            {business?.slug && (
              <Link to={`/business/${business.slug}`} target="_blank" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
                <span className="hidden sm:inline">View Profile</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Approval Progress */}
          {request.status === 'pending' && (
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {approvalCount} of {requiredApprovals} approvals
              </span>
              {hasAlreadyReviewed && (
                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0 h-5">
                  You {myReview === 'approved' ? 'approved' : 'reviewed'}
                </Badge>
              )}
            </div>
          )}

          {/* Meta: Location & Website - stacked on mobile */}
          <div className="flex flex-col gap-1.5 md:grid md:grid-cols-2 md:gap-3 text-xs md:text-sm">
            {business?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">{business.location}</span>
              </div>
            )}
            {(request.website || business?.website) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <button onClick={() => handleWebsiteClick(request.website || business?.website)} className="hover:text-primary hover:underline truncate text-left">
                  {request.website || business?.website}
                </button>
              </div>
            )}
          </div>

          {/* Proof provided section */}
          {request.proof_method && request.proof_value && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-sq-sm p-3 text-sm border border-blue-200 dark:border-blue-900">
              <p className="text-xs font-medium text-blue-600 mb-2">Proof provided</p>
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                {request.proof_method === 'official_website' && (
                  <>
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Website:</span>
                    <button 
                      onClick={() => handleWebsiteClick(request.proof_value)} 
                      className="hover:underline truncate text-left"
                    >
                      {request.proof_value}
                    </button>
                  </>
                )}
                {request.proof_method === 'business_email' && (
                  <>
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Email:</span>
                    <span>{request.proof_value}</span>
                  </>
                )}
                {request.proof_method === 'registered_business' && (
                  <>
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Registry:</span>
                    <span>
                      {(request.proof_metadata as Record<string, string>)?.registry?.replace('_', ' ') || 'Business register'} — {request.proof_value}
                    </span>
                    {(request.proof_metadata as Record<string, string>)?.registry_url && (
                      <button 
                        onClick={() => handleWebsiteClick((request.proof_metadata as Record<string, string>)?.registry_url)} 
                        className="hover:underline"
                      >
                        (view)
                      </button>
                    )}
                  </>
                )}
                {request.proof_method === 'creator_business' && (
                  <>
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="font-medium">
                      {(request.proof_metadata as Record<string, string>)?.contact_type === 'phone' ? 'Phone:' : 'Email:'}
                    </span>
                    <span>{request.proof_value}</span>
                  </>
                )}
                {request.proof_method === 'golf_course' && (
                  <>
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Course:</span>
                    <button 
                      onClick={() => handleWebsiteClick(request.proof_value)} 
                      className="hover:underline truncate text-left"
                    >
                      {request.proof_value}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {request.note && (
            <div className="bg-muted/30 rounded-sq-sm p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Note from requester</p>
              <p className="text-foreground">{request.note}</p>
            </div>
          )}

          {request.admin_note && request.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-sq-sm p-3 text-sm border border-red-200 dark:border-red-900">
              <p className="text-xs font-medium text-red-600 mb-1">Rejection reason</p>
              <p className="text-red-700 dark:text-red-400">{request.admin_note}</p>
            </div>
          )}

          {/* Domain verification status - hide pending state if business is already verified */}
          {request.requires_domain_check && !(business?.is_verified && request.status === 'approved') && (
            <div className={`rounded-sq-sm p-3 text-sm border ${request.domain_confirmed ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'}`}>
              <div className="flex items-center gap-2">
                {request.domain_confirmed ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Domain verified: @{request.domain}</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400 font-medium">Awaiting domain verification: @{request.domain}</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Requested: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
            {request.reviewed_at && <span>Reviewed: {format(new Date(request.reviewed_at), 'MMM d, yyyy h:mm a')}</span>}
          </div>

          {/* Actions - responsive layout */}
          {showActions && request.status === 'pending' && (
            <div className="flex flex-col gap-2 pt-3 border-t md:flex-row md:flex-wrap md:items-center md:pt-2">
              {/* Primary actions - full width on mobile, inline on desktop */}
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  size="sm" 
                  onClick={() => openApproveDialog(request)} 
                  disabled={processing || hasAlreadyReviewed || (request.requires_domain_check && !request.domain_confirmed)} 
                  className="flex-1 md:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {hasAlreadyReviewed ? 'Reviewed' : 'Approve'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => openRejectModal(request)} 
                  disabled={processing || hasAlreadyReviewed} 
                  className="flex-1 md:flex-none gap-1.5 text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
                >
                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Reject
                </Button>
              </div>
              
              {/* Secondary actions */}
              {!request.requires_domain_check && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => openDomainCheckModal(request)} 
                  disabled={processing} 
                  className="w-full md:w-auto gap-1.5 text-xs md:text-sm"
                >
                  <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="md:hidden">Domain Check</span>
                  <span className="hidden md:inline">Request Domain Check</span>
                </Button>
              )}
              
              {/* Force approve button - Feature flag gated */}
              {ENABLE_VERIFICATION_BYPASS && business && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => forceApproveMutation.mutate({ requestId: request.id, businessId: business.id })}
                  disabled={processing}
                  className="w-full md:w-auto gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs md:text-sm"
                >
                  <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Force approve
                </Button>
              )}
              {/* Bypass 2nd approval - Feature flag gated, for testing */}
              {ENABLE_VERIFICATION_BYPASS && business && hasAlreadyReviewed && myReview === 'approved' && approvalCount < requiredApprovals && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bypassSecondApprovalMutation.mutate({ requestId: request.id, businessId: business.id })}
                  disabled={processing}
                  className="w-full md:w-auto gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs md:text-sm"
                  title="Test mode: bypasses 2nd approval requirement"
                >
                  <FastForward className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Bypass 2nd (Test)
                </Button>
              )}
            </div>
          )}

          {/* Remove verification button for approved businesses */}
          {request.status === 'approved' && business?.is_verified && (
            <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openRevokeModal(request)}
                disabled={processing}
                className="w-full md:w-auto gap-1.5 text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
              >
                <ShieldOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Remove verification
              </Button>
            </div>
          )}

          {/* Verification History (admin-only, collapsible) */}
          {business && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground w-full justify-start">
                  <History className="h-4 w-4" />
                  View verification history
                  <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 border-t mt-3">
                <VerificationHistoryTimeline businessId={business.id} />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk action bar (mobile: sticky bottom, desktop: inline) */}
      {bulkSelect.selectMode && activeTab === 'pending' && (
        <BulkActionBar
          selectedCount={bulkSelect.selectedCount}
          onCancel={bulkSelect.exitSelectMode}
          processing={!!bulkSelect.progress && bulkSelect.progress.processed < bulkSelect.progress.total}
          progress={bulkSelect.progress}
          actions={[
            {
              label: 'Approve',
              onClick: handleBulkApprove,
              icon: <CheckCircle className="h-4 w-4" />,
            },
            {
              label: 'Reject',
              onClick: handleBulkReject,
              variant: 'destructive',
              icon: <XCircle className="h-4 w-4" />,
            },
          ]}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); bulkSelect.exitSelectMode(); }}>
        {/* Status tabs - single row with horizontal scroll */}
        <div className="flex items-center justify-between gap-2">
          <div className="overflow-x-auto flex-1 -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-full md:w-auto h-9 md:h-10 gap-1">
              <TabsTrigger value="pending" className="flex-1 md:flex-none gap-1 text-xs md:text-sm px-3 md:px-4">
                Pending
                {pendingRequests.length > 0 && <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 md:flex-none gap-1 text-xs md:text-sm px-3 md:px-4">
                Approved
                <span className="text-[10px] md:text-xs opacity-60">({approvedRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 md:flex-none gap-1 text-xs md:text-sm px-3 md:px-4">
                Rejected
                <span className="text-[10px] md:text-xs opacity-60">({rejectedRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="revoked" className="flex-1 md:flex-none gap-1 text-xs md:text-sm px-3 md:px-4">
                Revoked
                <span className="text-[10px] md:text-xs opacity-60">({revokedRequests.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Select button - only show on pending tab when there are items */}
          {activeTab === 'pending' && pendingRequests.length > 0 && !bulkSelect.selectMode && (
            <SelectModeButton onClick={bulkSelect.enterSelectMode} />
          )}
        </div>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {/* Select mode header */}
          {bulkSelect.selectMode && (
            <SelectModeHeader
              selectedCount={bulkSelect.selectedCount}
              totalCount={bulkSelect.selectableCount}
              allSelected={bulkSelect.allSelected}
              onToggleAll={bulkSelect.toggleSelectAll}
              onCancel={bulkSelect.exitSelectMode}
            />
          )}
          {!isMobile && !bulkSelect.selectMode && <p className="text-sm text-muted-foreground">Each request requires two independent approvals. Any single rejection immediately rejects the request.</p>}
          {pendingRequests.length === 0 ? (
            <AdminEmptyState icon={Building2} title="No pending requests" description="All caught up!" />
          ) : isMobile ? (
            pendingRequests.map(request => (
              <BusinessVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { if (!bulkSelect.selectMode) { setSelectedRequest(request); setMobileSheetOpen(true); } }}
                selectMode={bulkSelect.selectMode}
                selected={bulkSelect.isSelected(request.id)}
                onSelect={() => bulkSelect.toggleSelect(request.id)}
                selectable={true}
              />
            ))
          ) : pendingRequests.map(request => renderRequestCard(request, true))}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedRequests.length === 0 ? (
            <AdminEmptyState icon={CheckCircle} title="No approved requests" description="Approved verifications will appear here." />
          ) : isMobile ? (
            approvedRequests.map(request => (
              <BusinessVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { setSelectedRequest(request); setMobileSheetOpen(true); }}
              />
            ))
          ) : approvedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-3">
          {rejectedRequests.length === 0 ? (
            <AdminEmptyState icon={XCircle} title="No rejected requests" description="Rejected verifications will appear here." />
          ) : isMobile ? (
            rejectedRequests.map(request => (
              <BusinessVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { setSelectedRequest(request); setMobileSheetOpen(true); }}
              />
            ))
          ) : rejectedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="revoked" className="mt-4 space-y-3">
          {revokedRequests.length === 0 ? (
            <AdminEmptyState icon={ShieldOff} title="No revoked verifications" description="Businesses that had verification removed will appear here." />
          ) : isMobile ? (
            revokedRequests.map(request => (
              <BusinessVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { setSelectedRequest(request); setMobileSheetOpen(true); }}
              />
            ))
          ) : revokedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>
      </Tabs>

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <BusinessVerificationBottomSheet
          request={selectedRequest}
          open={mobileSheetOpen}
          onClose={() => { setMobileSheetOpen(false); setSelectedRequest(null); }}
          myReview={selectedRequest ? myReviewsByRequest.get(selectedRequest.id) : undefined}
          onApprove={() => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'approved' })}
          onReject={(reason) => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'rejected', note: reason })}
          onRequestDomainCheck={(domain) => selectedRequest && requestDomainCheck.mutateAsync({ requestId: selectedRequest.id, domain })}
          onRevoke={selectedRequest?.status === 'approved' ? (reason) => selectedRequest?.business && revokeVerificationMutation.mutate({ businessId: selectedRequest.business.id, reason }) : undefined}
          processing={processing}
        />
      )}

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this business?</AlertDialogTitle>
            <AlertDialogDescription>
              Your approval will be recorded for <strong>{selectedRequest?.business?.name}</strong>.
              {selectedRequest && (
                <span className="block mt-2 text-muted-foreground">
                  {(approvalCountsByRequest.get(selectedRequest.id) ?? 0) === 0 
                    ? 'This will be the first approval. One more is needed to verify.' 
                    : 'This will complete the verification and the business will receive a verified badge.'}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'approved' })} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
              {processing ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription>
              Rejecting the verification request for <strong>{selectedRequest?.business?.name}</strong>. Provide a short reason to help the business improve their verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for rejection</Label>
              <Textarea id="rejectReason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Website not accessible, business details incomplete..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'rejected', note: rejectReason })} disabled={processing}>
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Check Modal */}
      <Dialog open={domainCheckModalOpen} onOpenChange={setDomainCheckModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Domain Verification</DialogTitle>
            <DialogDescription>The business owner will need to verify access to an email at this domain before approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domainInput">Domain to verify</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input id="domainInput" value={domainInput} onChange={(e) => setDomainInput(e.target.value.replace('@', ''))} placeholder="company.com" className="flex-1" />
              </div>
              <p className="text-xs text-muted-foreground">The business owner will receive a code at an email ending in @{domainInput || 'domain.com'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainCheckModalOpen(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleRequestDomainCheck} disabled={processing || !domainInput.trim()}>{processing ? 'Requesting...' : 'Request Domain Check'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Verification Modal */}
      <Dialog open={revokeModalOpen} onOpenChange={(open) => {
        if (!open) setRevokeError(null);
        setRevokeModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove business verification</DialogTitle>
            <DialogDescription className="space-y-3">
              <span className="block">
                Removing verification will unverify this business and remove its verified badge across Clbhouz.
              </span>
              <span className="block">
                The business will need to go through the verification process again to regain verified status.
              </span>
              <span className="block text-xs text-muted-foreground/80">
                Use this if the business no longer meets verification requirements, ownership has changed, or verification was granted in error.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {/* Inline error banner */}
          {revokeError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-sq-sm p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Unable to remove verification</p>
                <p className="text-xs text-destructive/80">{revokeError}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="revokeReason">Reason for removal (required)</Label>
              <Textarea
                id="revokeReason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Briefly explain why verification is being removed…"
                className="min-h-[100px]"
                disabled={revokeVerificationMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                This note is stored for audit purposes and is only visible to admins.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmRevoke"
                className="mt-1 h-4 w-4 rounded border-border"
                checked={revokeConfirmed}
                onChange={(e) => setRevokeConfirmed(e.target.checked)}
                disabled={revokeVerificationMutation.isPending}
              />
              <Label htmlFor="confirmRevoke" className="text-sm font-normal cursor-pointer">
                I understand this action will immediately remove verification.
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRevokeModalOpen(false)} 
              disabled={revokeVerificationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeSubmit}
              disabled={revokeVerificationMutation.isPending || !revokeReason.trim() || !revokeConfirmed}
            >
              {revokeVerificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : 'Remove verification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <VerificationDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        type="business"
        requestId={detailRequestId}
        onApprove={() => {
          if (detailRequestId) {
            const request = requests?.find(r => r.id === detailRequestId);
            if (request) openApproveDialog(request);
          }
        }}
        onReject={() => {
          if (detailRequestId) {
            const request = requests?.find(r => r.id === detailRequestId);
            if (request) openRejectModal(request);
          }
        }}
        processing={processing}
      />
    </div>
  );
};

export default BusinessVerificationTab;
