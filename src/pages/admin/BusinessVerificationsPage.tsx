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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, Globe, Building2, Loader2, ShieldCheck, Mail, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAdminVerificationQueueRealtime } from '@/hooks/useBusinessVerificationRealtime';
import { useRequestDomainCheck } from '@/hooks/useDomainVerification';
import { Input } from '@/components/ui/input';

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
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    website: string | null;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
}

interface VerificationReview {
  id: string;
  request_id: string;
  reviewer_id: string;
  decision: string;
  note: string | null;
  created_at: string;
}

const BusinessVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [domainCheckModalOpen, setDomainCheckModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Enable realtime updates for instant queue refresh
  useAdminVerificationQueueRealtime();
  const requestDomainCheck = useRequestDomainCheck();

  // Get current user ID for checking if already reviewed
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch verification requests from new table
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
          business:business_accounts!business_id (
            id,
            name,
            slug,
            category,
            location,
            website,
            logo_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VerificationRequest[];
    },
  });

  // Fetch all reviews for pending requests to check if current user already reviewed
  const { data: myReviews } = useQuery({
    queryKey: ['admin-verification-my-reviews', currentUser?.id],
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

  const myReviewsByRequest = React.useMemo(() => {
    const map = new Map<string, string>();
    myReviews?.forEach(r => map.set(r.request_id, r.decision));
    return map;
  }, [myReviews]);

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') ?? [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') ?? [];

  // Submit review mutation using new RPC
  const submitReviewMutation = useMutation({
    mutationFn: async ({ requestId, decision, note }: { requestId: string; decision: string; note?: string }) => {
      const { data, error } = await supabase.rpc('submit_business_verification_review', {
        _request_id: requestId,
        _decision: decision,
        _note: note || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; status?: string; approvals?: number; required?: number };
      if (!result.success) throw new Error(result.error || 'Failed to submit review');
      return result;
    },
    onSuccess: (result) => {
      if (result.status === 'approved') {
        toast.success('Business verified');
      } else if (result.status === 'rejected') {
        toast.success('Verification rejected');
      } else {
        toast.success(`Approval recorded (${result.approvals} of ${result.required})`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verification-my-reviews'] });
      setApproveDialogOpen(false);
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      console.error('Review error:', error);
      toast.error(error.message || 'Could not submit review. Please try again.');
    },
  });

  const processing = submitReviewMutation.isPending || requestDomainCheck.isPending;

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
    // Try to extract domain from website
    const website = request.website || request.business?.website || '';
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      setDomainInput(url.hostname.replace('www.', ''));
    } catch {
      setDomainInput('');
    }
    setDomainCheckModalOpen(true);
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
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderRequestCard = (request: VerificationRequest, showActions: boolean) => {
    const business = request.business;
    const myReview = myReviewsByRequest.get(request.id);
    const hasAlreadyReviewed = !!myReview;
    const approvalCount = request.approval_count ?? 0;
    const requiredApprovals = request.required_approvals ?? 2;
    
    return (
      <Card key={request.id} className="p-5">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {business?.name || 'Unknown Business'}
                </h3>
                {getStatusBadge(request.status)}
                {business?.is_verified && (
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {business?.category && (
                <p className="text-sm text-muted-foreground">{business.category}</p>
              )}
            </div>
            {business?.slug && (
              <Link
                to={`/business/${business.slug}`}
                target="_blank"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Profile <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Approval Progress (for pending requests) */}
          {request.status === 'pending' && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {approvalCount === 0 
                  ? `Awaiting review (0 of ${requiredApprovals})`
                  : `${approvalCount} of ${requiredApprovals} approvals received`
                }
              </span>
              {hasAlreadyReviewed && (
                <Badge variant="outline" className="text-xs">
                  You {myReview === 'approved' ? 'approved' : 'reviewed'}
                </Badge>
              )}
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {business?.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>{business.location}</span>
              </div>
            )}
            {(request.website || business?.website) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 shrink-0" />
                <button
                  onClick={() => handleWebsiteClick(request.website || business?.website)}
                  className="hover:text-primary hover:underline truncate text-left"
                >
                  {request.website || business?.website}
                </button>
              </div>
            )}
          </div>

          {/* Submitted note */}
          {request.note && (
            <div className="bg-muted/30 rounded-sq-sm p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground mb-1">Note from requester</p>
              <p className="text-foreground">{request.note}</p>
            </div>
          )}

          {/* Admin note (for rejected) */}
          {request.admin_note && request.status === 'rejected' && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-sq-sm p-3 text-sm border border-red-200 dark:border-red-900">
              <p className="text-xs font-medium text-red-600 mb-1">Rejection reason</p>
              <p className="text-red-700 dark:text-red-400">{request.admin_note}</p>
            </div>
          )}

          {/* Domain verification status */}
          {request.requires_domain_check && (
            <div className={`rounded-sq-sm p-3 text-sm border ${
              request.domain_confirmed 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                {request.domain_confirmed ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Domain verified: @{request.domain}
                    </span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      Awaiting domain verification: @{request.domain}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Requested: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
            {request.reviewed_at && (
              <span>Reviewed: {format(new Date(request.reviewed_at), 'MMM d, yyyy h:mm a')}</span>
            )}
          </div>

          {/* Actions */}
          {showActions && request.status === 'pending' && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => openApproveDialog(request)}
                disabled={processing || hasAlreadyReviewed || (request.requires_domain_check && !request.domain_confirmed)}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" />
                {hasAlreadyReviewed ? 'Already Reviewed' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openRejectModal(request)}
                disabled={processing || hasAlreadyReviewed}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              {!request.requires_domain_check && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDomainCheckModal(request)}
                  disabled={processing}
                  className="gap-1.5"
                >
                  <Mail className="h-4 w-4" />
                  Request Domain Check
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
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Business Verification</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Business Verification</h1>
          <p className="text-muted-foreground">
            Review and verify businesses to help golfers identify authentic, trusted organisations.
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            {pendingRequests.length} pending
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending
            {pendingRequests.length > 0 && (
              <span className="ml-1 text-xs bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Each request requires two independent approvals. Any single rejection immediately rejects the request.
          </p>
          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No pending requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                All caught up! New requests will appear here.
              </p>
            </Card>
          ) : (
            pendingRequests.map(request => renderRequestCard(request, true))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-4">
          {approvedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No approved requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Approved verifications will appear here.
              </p>
            </Card>
          ) : (
            approvedRequests.map(request => renderRequestCard(request, false))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-4">
          {rejectedRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <XCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg">No rejected requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Rejected verifications will appear here.
              </p>
            </Card>
          ) : (
            rejectedRequests.map(request => renderRequestCard(request, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this business?</AlertDialogTitle>
            <AlertDialogDescription>
              Your approval will be recorded for <strong>{selectedRequest?.business?.name}</strong>.
              {selectedRequest && (
                <span className="block mt-2 text-muted-foreground">
                  {(selectedRequest.approval_count ?? 0) === 0 
                    ? 'This will be the first approval. One more is needed to verify.'
                    : 'This will complete the verification and the business will receive a verified badge.'
                  }
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && submitReviewMutation.mutate({ 
                requestId: selectedRequest.id, 
                decision: 'approved' 
              })}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
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
              Rejecting the verification request for <strong>{selectedRequest?.business?.name}</strong>. 
              Provide a short reason to help the business improve their verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for rejection</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Website not accessible, business details incomplete..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && submitReviewMutation.mutate({ 
                requestId: selectedRequest.id, 
                decision: 'rejected',
                note: rejectReason 
              })}
              disabled={processing}
            >
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
            <DialogDescription>
              The business owner will need to verify access to an email at this domain before approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domainInput">Domain to verify</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <Input
                  id="domainInput"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value.replace('@', ''))}
                  placeholder="company.com"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The business owner will receive a code at an email ending in @{domainInput || 'domain.com'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDomainCheckModalOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestDomainCheck}
              disabled={processing || !domainInput.trim()}
            >
              {processing ? 'Requesting...' : 'Request Domain Check'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessVerificationsPage;
