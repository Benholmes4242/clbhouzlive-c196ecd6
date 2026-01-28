import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, User, Loader2, Users, Search, UserPlus, Radar, RotateCcw, FastForward, Trash2, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import GolferDiscoverTab from './GolferDiscoverTab';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { GolferVerificationCard, GolferVerificationBottomSheet } from './mobile';
import { AdminEmptyState } from '@/components/admin/mobile';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { BulkActionBar, SelectModeHeader } from '@/components/admin/BulkActionBar';
import { SelectModeButton } from '@/components/admin/SelectModeButton';
import { verifyBulk } from '@/lib/adminBulkApi';
import { useVerificationKeyboardShortcuts } from '@/hooks/useVerificationKeyboardShortcuts';
import { VerificationDetailDrawer, KeyboardShortcutsHint } from './index';

// Show bypass button in non-production environments
const ENABLE_BYPASS = import.meta.env.MODE !== 'production';

interface GolferVerificationRequest {
  id: string;
  user_id: string;
  status: string;
  invited_by: string;
  requested_at: string | null;
  reviewed_at: string | null;
  note: string | null;
  admin_note: string | null;
  evidence_url: string | null;
  approval_count: number;
  required_approvals: number;
  created_at: string;
  user_profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    is_verified_golfer: boolean;
  } | null;
}

interface SearchResult {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  is_verified_golfer: boolean;
}

// Benjamin Holmes test user ID - allowed for infinite testing
const BENJAMIN_HOLMES_USER_ID = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';

const GolferVerificationTab = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GolferVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [removeNote, setRemoveNote] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [inviteReason, setInviteReason] = useState('');
  const [selectedGolfer, setSelectedGolfer] = useState<SearchResult | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch golfer verification requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-golfer-verification-requests'],
    queryFn: async () => {
      const { data: requestsData, error } = await supabase
        .from('golfer_verification_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = requestsData?.map(r => r.user_id) ?? [];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, is_verified_golfer')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      return requestsData?.map(r => ({
        ...r,
        user_profile: profileMap.get(r.user_id) || null,
      })) as GolferVerificationRequest[];
    },
    refetchOnWindowFocus: true,
    staleTime: 10_000, // Consider data stale after 10 seconds for quicker updates
  });

  // Fetch my reviews for golfer verifications
  const { data: myReviews } = useQuery({
    queryKey: ['admin-golfer-verification-my-reviews', currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golfer_verification_reviews')
        .select('request_id, decision')
        .eq('reviewer_id', currentUser!.id);

      if (error) throw error;
      return data as { request_id: string; decision: string }[];
    },
  });

  // Search for golfers to invite
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['admin-golfer-search', searchQuery],
    enabled: searchQuery.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, is_verified_golfer')
        .eq('profile_type', 'personal')
        .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      return data as SearchResult[];
    },
  });

  const myReviewsByRequest = React.useMemo(() => {
    const map = new Map<string, string>();
    myReviews?.forEach(r => map.set(r.request_id, r.decision));
    return map;
  }, [myReviews]);

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? [];
  const invitedRequests = requests?.filter(r => r.status === 'invited') ?? [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') ?? [];
  // Include both 'rejected' (admin rejection) and 'declined' (user declined invite) in rejected tab
  const rejectedRequests = requests?.filter(r => r.status === 'rejected' || r.status === 'declined') ?? [];
  const revokedRequests = requests?.filter(r => r.status === 'removed') ?? [];

  // Bulk selection for pending requests only
  const bulkSelect = useBulkSelect(
    pendingRequests,
    (r) => r.status === 'pending'
  );

  // Bulk action handlers
  const handleBulkApprove = async () => {
    try {
      const result = await bulkSelect.executeBulk(async (ids) => {
        return await verifyBulk('approve', 'golfer', ids);
      });
      toast.success(`Approved ${result.success.length} golfer verifications`, {
        description: result.failed.length > 0 ? `${result.failed.length} failed` : undefined,
        action: {
          label: 'View Audit Log',
          onClick: () => window.location.href = '/admin/audit',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['verification-queue-stats'] });
      bulkSelect.exitSelectMode();
    } catch (error: any) {
      toast.error('Bulk approval failed', { description: error.message });
    }
  };

  const handleBulkReject = async () => {
    try {
      const result = await bulkSelect.executeBulk(async (ids) => {
        return await verifyBulk('reject', 'golfer', ids);
      });
      toast.success(`Rejected ${result.success.length} golfer verifications`, {
        description: result.failed.length > 0 ? `${result.failed.length} failed` : undefined,
        action: {
          label: 'View Audit Log',
          onClick: () => window.location.href = '/admin/audit',
        },
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
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

  // Invite golfer mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ userId, note, inviteReason }: { userId: string; note?: string; inviteReason?: string }) => {
      const { data, error } = await supabase.rpc('invite_golfer_to_verification', {
        _user_id: userId,
        _note: note || null,
        _invite_reason: inviteReason || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Golfer invited to verification.');
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      setInviteModalOpen(false);
      setSelectedGolfer(null);
      setInviteNote('');
      setInviteReason('');
      setSearchQuery('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not invite golfer. Please try again.');
    },
  });

  // Re-invite golfer mutation (for declined/rejected)
  const reinviteMutation = useMutation({
    mutationFn: async ({ requestId, note }: { requestId: string; note?: string }) => {
      const { data, error } = await supabase.rpc('reinvite_golfer_verification_request', {
        p_request_id: requestId,
        p_admin_id: currentUser?.id,
        p_note: note || null,
      });
      if (error) throw error;
      return data as { status: string; message?: string; request_id?: string };
    },
    onSuccess: (data) => {
      if (data.status === 'already_active') {
        toast.info(data.message || 'Already has an active invite.');
      } else if (data.status === 'already_verified') {
        toast.info(data.message || 'Already verified.');
      } else {
        toast.success('Invite sent.');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not re-invite golfer. Please try again.');
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ requestId, decision, note }: { requestId: string; decision: string; note?: string }) => {
      const { error } = await supabase.rpc('submit_golfer_verification_review', {
        _request_id: requestId,
        _decision: decision,
        _note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review submitted.');
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-my-reviews'] });
      setApproveDialogOpen(false);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not submit review. Please try again.');
    },
  });

  // Bypass 2nd approval mutation - calls edge function with service role
  const bypassApprovalMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('bypass-golfer-approval', {
        body: { request_id: requestId },
      });

      if (response.error) {
        const errorMessage = response.error.message || 'Bypass failed';
        console.error('[bypass-golfer-approval] Error:', response.error, 'Data:', response.data);
        throw new Error(errorMessage);
      }

      if (!response.data?.ok) {
        const errorMessage = response.data?.error || 'Bypass failed';
        console.error('[bypass-golfer-approval] Not OK:', response.data);
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Verification forced (test)', {
        description: `Request now has ${data.approvals} approvals and is ${data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      console.error('[bypass-golfer-approval] Mutation error:', error);
      toast.error('Bypass failed', {
        description: error.message || 'Could not bypass approval. Please try again.',
      });
    },
  });

  // Remove golfer verification mutation
  const removeVerificationMutation = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note?: string }) => {
      const { error } = await supabase.rpc('remove_golfer_verification', {
        p_user_id: userId,
        p_note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification removed');
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['activity-notifications'] });
      setRemoveModalOpen(false);
      setSelectedRequest(null);
      setRemoveNote('');
    },
    onError: (error: any) => {
      toast.error('Could not remove verification', {
        description: error.message || 'Please try again.',
      });
    },
  });

  // Reset test user verification (Benjamin Holmes only)
  const resetTestUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('reset_golfer_verification_test_user', {
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Test user reset', {
        description: 'Benjamin Holmes can now be verified again.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-golfer-verifications-pending-count'] });
    },
    onError: (error: any) => {
      toast.error('Could not reset test user', {
        description: error.message || 'Please try again.',
      });
    },
  });

  const processing = submitReviewMutation.isPending || inviteMutation.isPending || reinviteMutation.isPending || bypassApprovalMutation.isPending || removeVerificationMutation.isPending || resetTestUserMutation.isPending;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Invited</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Verified</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case 'removed':
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Revoked</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="bg-slate-500/10 text-slate-600 border-slate-500/20">Declined</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderRequestCard = (request: GolferVerificationRequest, showActions: boolean) => {
    const profile = request.user_profile;
    const myReview = myReviewsByRequest.get(request.id);
    const hasAlreadyReviewed = !!myReview;
    const approvalCount = request.approval_count ?? 0;
    const requiredApprovals = request.required_approvals ?? 2;

    return (
      <Card key={request.id} className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Header with avatar and name */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                <AvatarImage src={profile?.profile_photo_url || undefined} />
                <AvatarFallback className="text-sm">{(profile?.display_name || profile?.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5 md:space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  <h3 className="font-semibold text-sm md:text-lg truncate">{profile?.display_name || profile?.username || 'Unknown User'}</h3>
                  {/* Show status badge OR verified badge - not both for approved status */}
                  {request.status === 'approved' ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    getStatusBadge(request.status)
                  )}
                </div>
                {profile?.username && <p className="text-xs md:text-sm text-muted-foreground truncate">@{profile.username}</p>}
              </div>
            </div>
            {profile?.username && (
              <Link to={`/${profile.username}`} target="_blank" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
                <span className="hidden sm:inline">View</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Approval progress */}
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

          {request.evidence_url && (
            <div className="bg-muted/30 rounded-sq-sm p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Evidence provided</p>
              <a href={request.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{request.evidence_url}</a>
            </div>
          )}

          {request.note && (
            <div className="bg-muted/30 rounded-sq-sm p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Note from golfer</p>
              <p className="text-foreground">{request.note}</p>
            </div>
          )}

          {request.admin_note && request.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-sq-sm p-3 text-sm border border-red-200 dark:border-red-900">
              <p className="text-xs font-medium text-red-600 mb-1">Rejection reason</p>
              <p className="text-red-700 dark:text-red-400">{request.admin_note}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Invited: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
            {request.requested_at && <span>Submitted: {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}</span>}
            {request.reviewed_at && <span>Reviewed: {format(new Date(request.reviewed_at), 'MMM d, yyyy h:mm a')}</span>}
          </div>

          {/* Actions - responsive */}
          {showActions && request.status === 'pending' && (
            <div className="flex flex-col gap-2 pt-3 md:pt-2 border-t">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => { setSelectedRequest(request); setApproveDialogOpen(true); }} 
                  disabled={processing || hasAlreadyReviewed} 
                  className="flex-1 md:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm"
                >
                  <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {hasAlreadyReviewed ? 'Reviewed' : 'Approve'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { setSelectedRequest(request); setRejectReason(''); setRejectModalOpen(true); }} 
                  disabled={processing || hasAlreadyReviewed} 
                  className="flex-1 md:flex-none gap-1.5 text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
                >
                  <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Reject
                </Button>
              </div>
              {/* Bypass button - only in non-production */}
              {ENABLE_BYPASS && approvalCount >= 1 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => bypassApprovalMutation.mutate({ requestId: request.id })}
                  disabled={processing}
                  className="w-full md:w-auto gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs md:text-sm"
                >
                  {bypassApprovalMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FastForward className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  )}
                  Bypass 2nd (Test)
                </Button>
              )}
            </div>
          )}

          {/* Re-invite action for declined/rejected */}
          {(request.status === 'declined' || request.status === 'rejected') && (
            <div className="flex gap-2 pt-3 md:pt-2 border-t">
              <Button 
                size="sm" 
                onClick={() => reinviteMutation.mutate({ requestId: request.id })} 
                disabled={processing} 
                className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm"
              >
                {reinviteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                Re-invite
              </Button>
              {profile?.username && (
                <Button 
                  size="sm" 
                  variant="outline"
                  asChild
                  className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm"
                >
                  <Link to={`/${profile.username}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    View profile
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Restore action for removed (revoked) golfers */}
          {request.status === 'removed' && (
            <div className="flex gap-2 pt-3 md:pt-2 border-t">
              <Button 
                size="sm" 
                onClick={() => reinviteMutation.mutate({ requestId: request.id })} 
                disabled={processing} 
                className="flex-1 md:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm"
              >
                {reinviteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
                Restore
              </Button>
              {profile?.username && (
                <Button 
                  size="sm" 
                  variant="outline"
                  asChild
                  className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm"
                >
                  <Link to={`/${profile.username}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    View profile
                  </Link>
                </Button>
              )}
            </div>
          )}

          {request.status === 'approved' && (
            <div className="flex flex-col gap-2 pt-3 md:pt-2 border-t">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => { setSelectedRequest(request); setRemoveNote(''); setRemoveModalOpen(true); }} 
                  disabled={processing} 
                  className="flex-1 md:flex-none gap-1.5 text-red-600 border-red-200 hover:bg-red-50 text-xs md:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Remove verification
                </Button>
                {profile?.username && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    asChild
                    className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm"
                  >
                    <Link to={`/${profile.username}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      View profile
                    </Link>
                  </Button>
                )}
              </div>
              {/* Reset test button - only for Benjamin Holmes */}
              {ENABLE_BYPASS && request.user_id === BENJAMIN_HOLMES_USER_ID && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => resetTestUserMutation.mutate(request.user_id)}
                  disabled={processing}
                  className="w-full md:w-auto gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs md:text-sm"
                >
                  {resetTestUserMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  )}
                  Reset (Test)
                </Button>
              )}
            </div>
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
      {/* Invite CTA - responsive */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs md:text-sm text-muted-foreground">
          Golfer verification is invite-only. Search for golfers to invite.
        </p>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-1.5 w-full md:w-auto" size="sm">
          <UserPlus className="h-3.5 w-3.5 md:h-4 md:w-4" />
          Invite Golfer
        </Button>
      </div>

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
        {/* Status tabs - two-row grid layout, no horizontal scroll */}
        <div className="space-y-2">
          {/* Top row: 4 tabs + Select button */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-4 gap-1.5 flex-1">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="discover" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                  <Radar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Discover</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="pending" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                  Pending
                  {pendingRequests.length > 0 && (
                    <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-600 px-1 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="invited" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                  Invited
                  <span className="text-[10px] md:text-xs opacity-60">({invitedRequests.length})</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="approved" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                  Verified
                  <span className="text-[10px] md:text-xs opacity-60">({approvedRequests.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Select button - only show on pending tab when there are items */}
            {activeTab === 'pending' && pendingRequests.length > 0 && !bulkSelect.selectMode && (
              <SelectModeButton onClick={bulkSelect.enterSelectMode} />
            )}
          </div>
          {/* Bottom row: 2 tabs */}
          <div className="grid grid-cols-2 gap-1.5">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger value="rejected" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                Declined
                <span className="text-[10px] md:text-xs opacity-60">({rejectedRequests.length})</span>
              </TabsTrigger>
            </TabsList>
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger value="revoked" className="w-full gap-1 text-xs md:text-sm px-2 md:px-3 py-2 data-[state=active]:bg-muted data-[state=active]:font-semibold">
                Revoked
                <span className="text-[10px] md:text-xs opacity-60">({revokedRequests.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="discover" className="mt-4">
          <GolferDiscoverTab />
        </TabsContent>

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
            <AdminEmptyState icon={User} title="No pending requests" description="All caught up!" />
          ) : isMobile ? (
            pendingRequests.map(request => (
              <GolferVerificationCard
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

        <TabsContent value="invited" className="mt-4 space-y-3">
          {!isMobile && <p className="text-sm text-muted-foreground">Golfers who have been invited but haven't submitted their request yet.</p>}
          {invitedRequests.length === 0 ? (
            <AdminEmptyState icon={UserPlus} title="No pending invites" description="Invited golfers will appear here." />
          ) : isMobile ? (
            invitedRequests.map(request => (
              <GolferVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { setSelectedRequest(request); setMobileSheetOpen(true); }}
              />
            ))
          ) : invitedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedRequests.length === 0 ? (
            <AdminEmptyState icon={CheckCircle} title="No verified golfers" description="Verified golfers will appear here." />
          ) : isMobile ? (
            approvedRequests.map(request => (
              <GolferVerificationCard
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
            <AdminEmptyState icon={XCircle} title="No declined golfers" description="Golfers who declined verification will appear here." />
          ) : isMobile ? (
            rejectedRequests.map(request => (
              <GolferVerificationCard
                key={request.id}
                request={request}
                myReview={myReviewsByRequest.get(request.id)}
                onClick={() => { setSelectedRequest(request); setMobileSheetOpen(true); }}
              />
            ))
          ) : rejectedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="revoked" className="mt-4 space-y-3">
          {!isMobile && <p className="text-sm text-muted-foreground">Golfers whose verification has been removed by an admin.</p>}
          {revokedRequests.length === 0 ? (
            <AdminEmptyState icon={Trash2} title="No revoked verifications" description="Golfers whose verification was removed will appear here." />
          ) : isMobile ? (
            revokedRequests.map(request => (
              <GolferVerificationCard
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
        <GolferVerificationBottomSheet
          request={selectedRequest}
          open={mobileSheetOpen}
          onClose={() => { setMobileSheetOpen(false); setSelectedRequest(null); }}
          myReview={selectedRequest ? myReviewsByRequest.get(selectedRequest.id) : undefined}
          onApprove={() => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'approved' })}
          onReject={(reason) => selectedRequest && submitReviewMutation.mutate({ requestId: selectedRequest.id, decision: 'rejected', note: reason })}
          onRemove={selectedRequest?.status === 'approved' ? (note) => selectedRequest && removeVerificationMutation.mutate({ userId: selectedRequest.user_id, note }) : undefined}
          onReinvite={selectedRequest?.status === 'declined' || selectedRequest?.status === 'rejected' ? () => selectedRequest && reinviteMutation.mutate({ requestId: selectedRequest.id }) : undefined}
          processing={processing}
        />
      )}

      {/* Invite Modal - improved layout with better scroll and sticky footer */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md flex flex-col max-h-[85vh] p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Invite golfer to verification</DialogTitle>
            <DialogDescription className="mt-1.5">Search for a golfer to invite them to request verification.</DialogDescription>
          </DialogHeader>
          
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            {/* Search input at top */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search by name or username..." 
                className="pl-9" 
              />
            </div>

            {/* Loading state */}
            {isSearching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}

            {/* Search results - longer scroll area, exclude selected */}
            {searchResults && searchResults.length > 0 && !selectedGolfer && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {searchResults
                  .filter(golfer => golfer.id !== selectedGolfer?.id)
                  .map(golfer => {
                    const existingRequest = requests?.find(r => r.user_id === golfer.id);
                    const existingStatus = existingRequest?.status;
                    const isAlreadyInvitedOrPending = existingStatus === 'invited' || existingStatus === 'pending';
                    
                    return (
                      <button
                        key={golfer.id}
                        onClick={() => !isAlreadyInvitedOrPending && !golfer.is_verified_golfer && setSelectedGolfer(golfer)}
                        disabled={isAlreadyInvitedOrPending || golfer.is_verified_golfer}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-sq-sm transition-colors ${
                          isAlreadyInvitedOrPending || golfer.is_verified_golfer ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={golfer.profile_photo_url || undefined} />
                          <AvatarFallback>{(golfer.display_name || golfer.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{golfer.display_name || golfer.username}</p>
                          {golfer.username && <p className="text-xs text-muted-foreground truncate">@{golfer.username}</p>}
                        </div>
                        {golfer.is_verified_golfer && (
                          <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0">Verified</Badge>
                        )}
                        {!golfer.is_verified_golfer && existingStatus === 'invited' && (
                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">Invited</Badge>
                        )}
                        {!golfer.is_verified_golfer && existingStatus === 'pending' && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20 shrink-0">Pending</Badge>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Selected golfer card */}
            {selectedGolfer && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sq-md">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={selectedGolfer.profile_photo_url || undefined} />
                    <AvatarFallback>{(selectedGolfer.display_name || selectedGolfer.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedGolfer.display_name || selectedGolfer.username}</p>
                    {selectedGolfer.username && <p className="text-xs text-muted-foreground truncate">@{selectedGolfer.username}</p>}
                    <p className="text-xs text-emerald-600 mt-0.5">Will receive a verification invite</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedGolfer(null)}
                    className="shrink-0 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Change selection"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inviteReason">Invite reason (shown to user)</Label>
                  <Textarea 
                    id="inviteReason" 
                    value={inviteReason} 
                    onChange={(e) => setInviteReason(e.target.value)} 
                    placeholder="e.g., Recognised tour profile, Active community member..." 
                    className="min-h-[60px]" 
                  />
                  <p className="text-xs text-muted-foreground">This reason will be visible to the user in their notification.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteNote">Internal note (admin only, optional)</Label>
                  <Textarea 
                    id="inviteNote" 
                    value={inviteNote} 
                    onChange={(e) => setInviteNote(e.target.value)} 
                    placeholder="e.g., Found via PGA tour database..." 
                    className="min-h-[60px]" 
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Sticky footer */}
          <div className="shrink-0 px-6 py-4 border-t bg-background/95 backdrop-blur-sm flex gap-2 justify-end" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <Button 
              variant="outline" 
              onClick={() => { setInviteModalOpen(false); setSelectedGolfer(null); setSearchQuery(''); setInviteNote(''); setInviteReason(''); }} 
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedGolfer && inviteMutation.mutate({ userId: selectedGolfer.id, note: inviteNote, inviteReason })} 
              disabled={processing || !selectedGolfer || selectedGolfer.is_verified_golfer}
            >
              {processing ? 'Inviting...' : 'Send Invite'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this golfer?</AlertDialogTitle>
            <AlertDialogDescription>
              Your approval will be recorded for <strong>{selectedRequest?.user_profile?.display_name || selectedRequest?.user_profile?.username}</strong>.
              {selectedRequest && (
                <span className="block mt-2 text-muted-foreground">
                  {(selectedRequest.approval_count ?? 0) === 0 ? 'This will be the first approval. One more is needed to verify.' : 'This will complete the verification and the golfer will receive a verified badge.'}
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
              Rejecting the verification request for <strong>{selectedRequest?.user_profile?.display_name || selectedRequest?.user_profile?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReasonGolfer">Reason for rejection (optional)</Label>
              <Textarea id="rejectReasonGolfer" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g., Could not verify identity..." className="min-h-[100px]" />
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

      {/* Remove Verification Modal */}
      <Dialog open={removeModalOpen} onOpenChange={setRemoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove verification?</DialogTitle>
            <DialogDescription>
              This will remove the verified badge from <strong>@{selectedRequest?.user_profile?.username || 'this user'}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="removeNote">Internal note (optional)</Label>
              <Textarea 
                id="removeNote" 
                value={removeNote} 
                onChange={(e) => setRemoveNote(e.target.value)} 
                placeholder="e.g., Verification removed due to..." 
                className="min-h-[80px]" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveModalOpen(false)} disabled={processing}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedRequest && removeVerificationMutation.mutate({ userId: selectedRequest.user_id, note: removeNote })} 
              disabled={processing}
            >
              {removeVerificationMutation.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <VerificationDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        type="golfer"
        requestId={detailRequestId}
        onApprove={() => {
          if (detailRequestId) {
            const request = requests?.find(r => r.id === detailRequestId);
            if (request) {
              setSelectedRequest(request);
              setApproveDialogOpen(true);
            }
          }
        }}
        onReject={() => {
          if (detailRequestId) {
            const request = requests?.find(r => r.id === detailRequestId);
            if (request) {
              setSelectedRequest(request);
              setRejectModalOpen(true);
            }
          }
        }}
        processing={processing}
      />
    </div>
  );
};

export default GolferVerificationTab;
