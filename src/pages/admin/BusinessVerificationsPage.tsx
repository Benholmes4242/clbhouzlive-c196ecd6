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
import { CheckCircle, XCircle, ExternalLink, Globe, Building2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAdminVerificationQueueRealtime } from '@/hooks/useBusinessVerificationRealtime';

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

const BusinessVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Enable realtime updates for instant queue refresh
  useAdminVerificationQueueRealtime();

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

  const pendingRequests = requests?.filter(r => r.status === 'pending') ?? [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') ?? [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') ?? [];

  // Approve mutation using new RPC
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc('approve_business_verification', {
        _request_id: requestId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Business verified successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-count'] });
      setApproveDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      console.error('Approve error:', error);
      toast.error(error.message || 'Could not approve verification. Please try again.');
    },
  });

  // Reject mutation using new RPC
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, adminNote }: { requestId: string; adminNote: string }) => {
      const { error } = await supabase.rpc('reject_business_verification', {
        _request_id: requestId,
        _admin_note: adminNote || '',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verification request rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin-business-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-count'] });
      setRejectModalOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      console.error('Reject error:', error);
      toast.error(error.message || 'Could not reject verification. Please try again.');
    },
  });

  const processing = approveMutation.isPending || rejectMutation.isPending;

  const openRejectModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const openApproveDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
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

          {/* Timestamps */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>Requested: {format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
            {request.reviewed_at && (
              <span>Reviewed: {format(new Date(request.reviewed_at), 'MMM d, yyyy h:mm a')}</span>
            )}
          </div>

          {/* Actions */}
          {showActions && request.status === 'pending' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={() => openApproveDialog(request)}
                disabled={processing}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openRejectModal(request)}
                disabled={processing}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
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
            Review and approve verification requests submitted by businesses.
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
              <strong>{selectedRequest?.business?.name}</strong> will receive a verified badge and appear as verified across clbhouz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && approveMutation.mutate(selectedRequest.id)}
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
              Rejecting the verification request for <strong>{selectedRequest?.business?.name}</strong>. You can provide a reason to help them improve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for rejection (optional)</Label>
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
              onClick={() => selectedRequest && rejectMutation.mutate({ 
                requestId: selectedRequest.id, 
                adminNote: rejectReason 
              })}
              disabled={processing}
            >
              {processing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessVerificationsPage;