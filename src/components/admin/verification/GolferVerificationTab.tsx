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
import { CheckCircle, XCircle, ExternalLink, User, Loader2, Users, Search, UserPlus, Radar } from 'lucide-react';
import { Link } from 'react-router-dom';
import GolferDiscoverTab from './GolferDiscoverTab';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const GolferVerificationTab = () => {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<GolferVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [selectedGolfer, setSelectedGolfer] = useState<SearchResult | null>(null);

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
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') ?? [];

  // Invite golfer mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note?: string }) => {
      const { data, error } = await supabase.rpc('invite_golfer_to_verification', {
        _user_id: userId,
        _note: note || null,
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
      setSearchQuery('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not invite golfer. Please try again.');
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

  const processing = submitReviewMutation.isPending || inviteMutation.isPending;

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
                  {getStatusBadge(request.status)}
                  {profile?.is_verified_golfer && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                      <CheckCircle className="h-3 w-3" />
                    </Badge>
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
            <div className="flex gap-2 pt-3 md:pt-2 border-t">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Status tabs - 2x2 grid on mobile for first 4 tabs, inline on desktop */}
        <div className="grid grid-cols-2 gap-2 md:block">
          <TabsList className="col-span-2 grid grid-cols-2 gap-1.5 h-auto p-1 md:inline-flex md:h-10 md:gap-0 md:p-1">
            <TabsTrigger value="discover" className="gap-1 text-xs md:text-sm justify-center py-2 md:py-1.5 md:px-4">
              <Radar className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1 text-xs md:text-sm justify-center py-2 md:py-1.5 md:px-4">
              Pending
              {pendingRequests.length > 0 && (
                <span className="text-[10px] md:text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invited" className="gap-1 text-xs md:text-sm justify-center py-2 md:py-1.5 md:px-4">
              Invited
              <span className="text-[10px] md:text-xs opacity-60">({invitedRequests.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1 text-xs md:text-sm justify-center py-2 md:py-1.5 md:px-4">
              Verified
              <span className="text-[10px] md:text-xs opacity-60">({approvedRequests.length})</span>
            </TabsTrigger>
          </TabsList>
          {/* Rejected tab as full-width on mobile */}
          <TabsList className="col-span-2 h-auto p-1 md:hidden">
            <TabsTrigger value="rejected" className="gap-1 text-xs justify-center py-2 w-full">
              Rejected
              <span className="text-[10px] opacity-60">({rejectedRequests.length})</span>
            </TabsTrigger>
          </TabsList>
          {/* Desktop rejected tab inline */}
          <TabsTrigger value="rejected" className="hidden md:inline-flex gap-1 text-sm justify-center py-1.5 px-4">
            Rejected
            <span className="text-xs opacity-60">({rejectedRequests.length})</span>
          </TabsTrigger>
        </div>

        <TabsContent value="discover" className="mt-4">
          <GolferDiscoverTab />
        </TabsContent>

        <TabsContent value="pending" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">Each request requires two independent approvals. Any single rejection immediately rejects the request.</p>
          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No pending requests</h3>
              <p className="text-muted-foreground text-sm mt-1">All caught up! Pending requests will appear here.</p>
            </Card>
          ) : pendingRequests.map(request => renderRequestCard(request, true))}
        </TabsContent>

        <TabsContent value="invited" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">Golfers who have been invited but haven't submitted their request yet.</p>
          {invitedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No pending invites</h3>
              <p className="text-muted-foreground text-sm mt-1">Invited golfers will appear here.</p>
            </Card>
          ) : invitedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-4">
          {approvedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No verified golfers</h3>
              <p className="text-muted-foreground text-sm mt-1">Verified golfers will appear here.</p>
            </Card>
          ) : approvedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-4">
          {rejectedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No rejected requests</h3>
              <p className="text-muted-foreground text-sm mt-1">Rejected requests will appear here.</p>
            </Card>
          ) : rejectedRequests.map(request => renderRequestCard(request, false))}
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite golfer to verification</DialogTitle>
            <DialogDescription>Search for a golfer to invite them to request verification. They'll receive a notification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search golfers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or username..." className="pl-9" />
              </div>
            </div>

            {isSearching && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map(golfer => (
                  <button
                    key={golfer.id}
                    onClick={() => setSelectedGolfer(golfer)}
                    className={`w-full flex items-center gap-3 p-2 rounded-sq-sm hover:bg-muted/50 transition-colors ${selectedGolfer?.id === golfer.id ? 'bg-muted' : ''}`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={golfer.profile_photo_url || undefined} />
                      <AvatarFallback>{(golfer.display_name || golfer.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1">
                      <p className="font-medium text-sm">{golfer.display_name || golfer.username}</p>
                      {golfer.username && <p className="text-xs text-muted-foreground">@{golfer.username}</p>}
                    </div>
                    {golfer.is_verified_golfer && <Badge variant="secondary" className="text-xs">Already verified</Badge>}
                  </button>
                ))}
              </div>
            )}

            {selectedGolfer && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-sq-sm">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedGolfer.profile_photo_url || undefined} />
                    <AvatarFallback>{(selectedGolfer.display_name || selectedGolfer.username || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedGolfer.display_name || selectedGolfer.username}</p>
                    <p className="text-xs text-muted-foreground">Will receive a verification invite</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteNote">Internal note (optional)</Label>
                  <Textarea id="inviteNote" value={inviteNote} onChange={(e) => setInviteNote(e.target.value)} placeholder="e.g., Pro golfer, verified via tour profile..." className="min-h-[60px]" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInviteModalOpen(false); setSelectedGolfer(null); setSearchQuery(''); setInviteNote(''); }} disabled={processing}>Cancel</Button>
            <Button onClick={() => selectedGolfer && inviteMutation.mutate({ userId: selectedGolfer.id, note: inviteNote })} disabled={processing || !selectedGolfer || selectedGolfer.is_verified_golfer}>
              {processing ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
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
    </div>
  );
};

export default GolferVerificationTab;
