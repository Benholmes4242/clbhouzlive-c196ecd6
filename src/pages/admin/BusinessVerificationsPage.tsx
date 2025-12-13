import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import { CheckCircle, XCircle, ExternalLink, Globe, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BusinessVerificationRequest {
  id: string;
  username: string | null;
  display_name: string | null;
  business_name: string | null;
  business_category: string | null;
  business_location: string | null;
  business_website: string | null;
  business_contact_email: string | null;
  business_contact_phone: string | null;
  verification_status: string | null;
  verification_requested_at: string | null;
}

const BusinessVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<BusinessVerificationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-business-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          username,
          display_name,
          business_name,
          business_category,
          business_location,
          business_website,
          business_contact_email,
          business_contact_phone,
          verification_status,
          verification_requested_at
        `)
        .in('verification_status', ['pending_review', 'verified', 'rejected'])
        .order('verification_requested_at', { ascending: false });

      if (error) throw error;
      return data as BusinessVerificationRequest[];
    },
  });

  const pendingCount = requests?.filter(r => r.verification_status === 'pending_review').length ?? 0;

  const handleUpdateStatus = async (
    profileId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc('update_business_verification_status', {
        p_profile_id: profileId,
        p_status: status,
        p_notes: notes ?? null,
      });

      if (error) throw error;

      toast.success(status === 'verified' ? 'Business verified successfully.' : 'Verification request rejected.');

      await queryClient.invalidateQueries({ queryKey: ['admin-business-verifications'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-business-verifications-count'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      setRejectModalOpen(false);
      setApproveDialogOpen(false);
      setSelectedProfile(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      toast.error('Could not update verification status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (request: BusinessVerificationRequest) => {
    setSelectedProfile(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const openApproveDialog = (request: BusinessVerificationRequest) => {
    setSelectedProfile(request);
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending_review':
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending Review</Badge>;
      case 'verified':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Verified</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Rejected</Badge>;
      case 'unverified':
        return <Badge variant="outline" className="text-muted-foreground">Unverified</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Business Verification Requests</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-sq-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-section">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Business Verification Requests</h1>
          <p className="text-muted-foreground">
            Review and approve verification requests submitted by businesses on clbhouz.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {requests?.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg">No verification requests</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Business verification requests will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Table header for larger screens */}
          <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1.5fr_1fr_auto] gap-4 px-5 py-2 text-sm font-medium text-muted-foreground border-b">
            <span>Business</span>
            <span>Category</span>
            <span>Location</span>
            <span>Contact Details</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {requests?.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {request.business_name || request.display_name || 'Unnamed Business'}
                      </h3>
                      {getStatusBadge(request.verification_status)}
                    </div>
                    {request.username && (
                      <p className="text-sm text-muted-foreground">@{request.username}</p>
                    )}
                  </div>
                  <Link
                    to={`/profile/${request.username || request.id}`}
                    target="_blank"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {request.business_category && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>{request.business_category}</span>
                    </div>
                  )}
                  {request.business_location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{request.business_location}</span>
                    </div>
                  )}
                  {request.business_website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4 shrink-0" />
                      <button
                        onClick={() => handleWebsiteClick(request.business_website)}
                        className="hover:text-primary hover:underline truncate text-left"
                      >
                        {request.business_website}
                      </button>
                    </div>
                  )}
                  {request.business_contact_email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <a href={`mailto:${request.business_contact_email}`} className="hover:text-primary hover:underline truncate">
                        {request.business_contact_email}
                      </a>
                    </div>
                  )}
                  {request.business_contact_phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{request.business_contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Requested At */}
                {request.verification_requested_at && (
                  <p className="text-xs text-muted-foreground">
                    Requested on {new Date(request.verification_requested_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}

                {/* Actions */}
                {request.verification_status === 'pending_review' && (
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
          ))}
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this business?</AlertDialogTitle>
            <AlertDialogDescription>
              This business will receive a verified badge and appear as verified across clbhouz. Are you sure you want to approve this request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProfile && handleUpdateStatus(selectedProfile.id, 'verified')}
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
              If you'd like, you can provide a reason for rejecting this request. This may help the business update their profile before requesting again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason for rejection (optional)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)…"
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
              onClick={() => selectedProfile && handleUpdateStatus(selectedProfile.id, 'rejected', rejectReason)}
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
