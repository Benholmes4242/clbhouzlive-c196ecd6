import React, { useState } from 'react';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AccessRequest {
  id: string;
  business_id: string;
  requester_user_profile_id: string;
  requested_role: string;
  message: string | null;
  status: string;
  created_at: string;
  requester: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
}

interface AccessRequestsSectionProps {
  businessId: string;
  businessName: string;
  businessAvatarUrl?: string | null;
  canManage: boolean;
}

// Normalize role for display: team_member → "Team member", manager → "Manager"
function getRoleLabel(role: string): string {
  switch (role?.toLowerCase()) {
    case 'manager': return 'Manager';
    case 'team_member': 
    default: return 'Team member';
  }
}

// Lowercase role for sentence context: "team member access", "manager access"
function getRoleLabelLower(role: string): string {
  return getRoleLabel(role).toLowerCase();
}

export function AccessRequestsSection({ businessId, businessName, businessAvatarUrl, canManage }: AccessRequestsSectionProps) {
  const queryClient = useQueryClient();
  const [confirmApprove, setConfirmApprove] = useState<AccessRequest | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<AccessRequest | null>(null);

  // Fetch pending access requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['business-access-requests', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_access_requests')
        .select(`
          id,
          business_id,
          requester_user_profile_id,
          requested_role,
          message,
          status,
          created_at
        `)
        .eq('business_id', businessId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch requester profiles separately
      if (!data || data.length === 0) return [];
      
      const requesterIds = data.map(r => r.requester_user_profile_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', requesterIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(r => ({
        ...r,
        requester: profileMap.get(r.requester_user_profile_id) || {
          id: r.requester_user_profile_id,
          display_name: null,
          username: null,
          profile_photo_url: null,
        },
      })) as AccessRequest[];
    },
    enabled: canManage,
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: async (request: AccessRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update request status
      const { error: updateError } = await supabase
        .from('business_access_requests')
        .update({ 
          status: 'approved',
          decided_at: new Date().toISOString(),
          decided_by: user.id,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Add to business_members
      const role = request.requested_role === 'manager' ? 'admin' : 'member';
      const { error: memberError } = await supabase
        .from('business_members')
        .insert({
          business_id: request.business_id,
          user_profile_id: request.requester_user_profile_id,
          role,
        });

      if (memberError && !memberError.message.includes('duplicate')) {
        throw memberError;
      }

      // Send notification to requester with business identity
      const requesterName = request.requester.display_name || request.requester.username || 'A user';
      await supabase.from('notifications').insert({
        user_id: request.requester_user_profile_id,
        actor_id: user.id,
        type: 'business_access_approved',
        title: 'Added to team',
        message: `You now have access to ${businessName}.`,
        entity_type: 'business',
        entity_id: request.business_id,
        data: { 
          business_id: request.business_id,
          business_name: businessName,
          business_avatar_url: businessAvatarUrl || null,
          role_granted: getRoleLabel(request.requested_role),
        },
      });

      return request;
    },
    onSuccess: (request) => {
      const requesterName = request.requester.display_name || request.requester.username || 'A user';
      toast.success(`Approved. ${requesterName} added to team.`);
      queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count', businessId] });
      setConfirmApprove(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });

  // Decline request mutation
  const declineMutation = useMutation({
    mutationFn: async (request: AccessRequest) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('business_access_requests')
        .update({ 
          status: 'rejected',
          decided_at: new Date().toISOString(),
          decided_by: user.id,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Send notification to requester with business identity
      await supabase.from('notifications').insert({
        user_id: request.requester_user_profile_id,
        actor_id: user.id,
        type: 'business_access_declined',
        title: 'Request declined',
        message: `Your request to join ${businessName} was declined.`,
        entity_type: 'business',
        entity_id: request.business_id,
        data: { 
          business_id: request.business_id,
          business_name: businessName,
          business_avatar_url: businessAvatarUrl || null,
        },
      });

      return request;
    },
    onSuccess: () => {
      toast.success('Declined.');
      queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count', businessId] });
      setConfirmDecline(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to decline request');
    },
  });

  if (!canManage) return null;
  if (isLoading) return null;

  // Show empty state if no requests (always show section for context)
  const hasRequests = requests && requests.length > 0;

  return (
    <>
      <section className="p-4 space-y-3">
        {/* Section header */}
        <div>
          <h2 className="text-[15px] font-semibold leading-5 text-foreground">
            Access requests
          </h2>
          {hasRequests && (
            <p className="text-[13px] font-normal leading-[18px] text-muted-foreground mt-1">
              Review and manage requests to join this business.
            </p>
          )}
        </div>

        {/* Empty state */}
        {!hasRequests && (
          <div className="py-8 text-center">
            <p className="text-[15px] font-semibold text-foreground">
              No access requests
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Requests to join this business will appear here.
            </p>
          </div>
        )}

        {/* Request cards */}
        {hasRequests && (
          <div className="space-y-3">
            {requests.map((request) => {
              const requesterName = request.requester.display_name || request.requester.username || 'A user';
              const roleLabel = getRoleLabel(request.requested_role);
              const timeAgo = formatDistanceToNow(new Date(request.created_at), { addSuffix: false });

              return (
                <div 
                  key={request.id} 
                  className="p-3 rounded-sq-sm bg-card border border-border/50 space-y-2"
                >
                  {/* Top row: Avatar + Name + Role */}
                  <div className="flex items-start gap-3">
                    <SquircleAvatar
                      src={request.requester.profile_photo_url || undefined}
                      alt={requesterName}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold leading-5 text-foreground truncate">
                        {requesterName}
                      </p>
                      <p className="text-[13px] font-normal leading-[18px] text-muted-foreground mt-0.5">
                        Requested {roleLabel} access
                      </p>
                    </div>
                  </div>

                  {/* Optional message */}
                  {request.message && (
                    <div className="mt-2">
                      <p className="text-[12px] font-medium text-muted-foreground/70 mb-0.5">
                        Message
                      </p>
                      <p className="text-[13px] font-normal leading-[18px] text-foreground">
                        {request.message}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[12px] font-normal text-muted-foreground/70 mt-1.5">
                    Requested {timeAgo} ago
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2.5 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDecline(request)}
                      disabled={declineMutation.isPending || approveMutation.isPending}
                      className="h-9 px-3.5 rounded-sq-xs text-[14px] font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConfirmApprove(request)}
                      disabled={approveMutation.isPending || declineMutation.isPending}
                      className="h-9 px-3.5 rounded-sq-xs text-[14px] font-semibold"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Approve Confirmation Modal */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve request?</AlertDialogTitle>
            <AlertDialogDescription>
              Add {confirmApprove?.requester.display_name || confirmApprove?.requester.username || 'this user'} to {businessName} as {getRoleLabel(confirmApprove?.requested_role || '')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmApprove && approveMutation.mutate(confirmApprove)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Confirmation Modal */}
      <AlertDialog open={!!confirmDecline} onOpenChange={(open) => !open && setConfirmDecline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline request?</AlertDialogTitle>
            <AlertDialogDescription>
              Decline {confirmDecline?.requester.display_name || confirmDecline?.requester.username || 'this user'}'s request to join {businessName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmDecline && declineMutation.mutate(confirmDecline)}
              disabled={declineMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {declineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
