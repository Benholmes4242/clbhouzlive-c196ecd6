import React from 'react';
import { Check, X, Loader2, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

export function AccessRequestsSection({ businessId, businessName, businessAvatarUrl, canManage }: AccessRequestsSectionProps) {
  const queryClient = useQueryClient();

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
      await supabase.from('notifications').insert({
        user_id: request.requester_user_profile_id,
        actor_id: user.id,
        type: 'business_access_approved',
        title: 'Access request approved',
        message: `Your request to join ${businessName} has been approved`,
        entity_type: 'business',
        entity_id: request.business_id,
        data: { 
          business_id: request.business_id,
          business_name: businessName,
          business_avatar_url: businessAvatarUrl || null,
          role,
        },
      });

      return request;
    },
    onSuccess: (request) => {
      toast.success(`${request.requester.display_name || 'Request'} approved`);
      queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-team', businessId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
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
        title: 'Access request declined',
        message: `Your request to join ${businessName} was declined`,
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
    onSuccess: (request) => {
      toast.success('Request declined');
      queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to decline request');
    },
  });

  if (!canManage) return null;
  if (isLoading) return null;
  if (!requests || requests.length === 0) return null;

  const roleLabel = (role: string) => {
    switch (role) {
      case 'manager': return 'Manager access';
      default: return 'Team access';
    }
  };

  return (
    <section>
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        Access requests
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
          {requests.length}
        </span>
      </h2>
      <div className="divide-y divide-border rounded-sq-md border border-border overflow-hidden bg-background">
        {requests.map((request) => (
          <div key={request.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <SquircleAvatar
                src={request.requester.profile_photo_url || undefined}
                alt={request.requester.display_name || 'User'}
                size={44}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] truncate">
                  {request.requester.display_name || request.requester.username || 'Unknown'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{roleLabel(request.requested_role)}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {request.message && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-sq-sm p-3">
                "{request.message}"
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rejectMutation.mutate(request)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1.5" />
                    Decline
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(request)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        These people have requested to join your team.
      </p>
    </section>
  );
}
