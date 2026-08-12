import React, { useState } from 'react';
import { TITLE } from '@/lib/tokens/type';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { formatRelativeAgoLong } from '@/i18n/format';
import { AppLog } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { A, BIZ_KICKER, BIZ_BODY, bizFigure } from '@/features/courses/components/holes/analytical/tokens';
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

export function AccessRequestsSection({ businessId, businessName, businessAvatarUrl, canManage }: AccessRequestsSectionProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const [confirmApprove, setConfirmApprove] = useState<AccessRequest | null>(null);
  const [confirmDecline, setConfirmDecline] = useState<AccessRequest | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Fetch pending access requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['business-access-requests', businessId],
    queryFn: async () => {
      AppLog.debug('AccessRequestsSection', 'Fetching access requests for business:', businessId);
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

      AppLog.debug('AccessRequestsSection', 'Fetched requests:', data?.length ?? 0);

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
    // Ensure fresh data when navigating to the page (global refetchOnMount: true)
    staleTime: 0,
  });

  // Handle approve via Edge Function
  const handleApprove = async (request: AccessRequest) => {
    // Prevent double-click
    if (loadingId) return;
    
    setLoadingId(request.id);
    
    // Ticket B: Close dialog FIRST, then wait for animation before proceeding
    setConfirmApprove(null);
    
    // Wait for dialog close animation to complete and Radix cleanup
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'business-access-request-decide',
        { body: { request_id: request.id, decision: 'approve' } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.already_resolved) {
        toast.info(`Request already ${data.status}`);
      } else {
        toast.success("Request approved");
      }

      // Wait another frame to ensure UI is stable before invalidations
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Invalidate relevant queries (fire-and-forget so UI always recovers)
      // Include notifications + unread-count to clear orange dot for this resolved request
      void Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['business-team-members', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['business-members', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['business-membership', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] }),
      ]);
    } catch (e: unknown) {
      AppLog.error('AccessRequestsSection', 'Approve error:', e);
      toast.error((e as Error)?.message ?? 'Failed to approve request');
    } finally {
      setLoadingId(null);
    }
  };

  // Handle decline via Edge Function
  const handleDecline = async (request: AccessRequest) => {
    // Prevent double-click
    if (loadingId) return;
    
    const requesterName = request.requester.display_name || request.requester.username || 'A user';
    setLoadingId(request.id);
    
    // Ticket B: Close dialog FIRST, then wait for animation before proceeding
    setConfirmDecline(null);
    
    // Wait for dialog close animation to complete and Radix cleanup
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'business-access-request-decide',
        { body: { request_id: request.id, decision: 'decline' } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.already_resolved) {
        toast.info(`Request already ${data.status}`);
      } else {
        toast.success(`Declined ${requesterName}'s request`);
      }

      // Wait another frame to ensure UI is stable before invalidations
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Invalidate relevant queries (fire-and-forget so UI always recovers)
      // Include notifications + unread-count to clear orange dot for this resolved request
      void Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['business-access-requests', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] }),
        queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] }),
      ]);
    } catch (e: unknown) {
      AppLog.error('AccessRequestsSection', 'Decline error:', e);
      toast.error((e as Error)?.message ?? 'Failed to decline request');
    } finally {
      setLoadingId(null);
    }
  };

  if (!canManage) return null;
  if (isLoading) return null;

  /* ZERO REQUESTS -> NOTHING. Not a heading, not the word "None". Requests
     arrive as notifications; a placeholder announcing its own absence sat
     above the only thing on the page that matters. */
  if (!requests || requests.length === 0) return null;

  return (
    <>
      <section
        className="mb-6"
        style={{
          background: '#FFFFFF',
          border: `1px solid rgba(15,23,42,0.08)`,
          borderRadius: 14,
          padding: '4px 16px',
        }}
      >
        <div className="pt-3 pb-1 flex items-center justify-between">
          <span style={BIZ_KICKER}>{t('business.team.manage.accessRequests')}</span>
          <span style={bizFigure(15)}>{requests.length}</span>
        </div>

        {/* Request cards */}
        <div className="space-y-3" style={{ paddingBottom: 12 }}>
            {requests.map((request) => {
              const requesterName = request.requester.display_name || request.requester.username || 'A user';
              const roleLabel = getRoleLabel(request.requested_role);
              const timeAgo = formatRelativeAgoLong(request.created_at).replace(/ ago$/, '');

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
                      hairlineRing
                      ringColor={LIGHT_HAIRLINE}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK }}>
                        {requesterName}
                      </p>
                      <p style={{ ...BIZ_BODY, marginTop: 2 }}>
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
                      disabled={loadingId !== null}
                      className="h-9 px-3.5 rounded-sq-xs text-[14px] font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      {loadingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Decline'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConfirmApprove(request)}
                      disabled={loadingId !== null}
                      className="h-9 px-3.5 rounded-sq-xs text-[14px] font-semibold bg-[hsl(38,92%,50%)] hover:bg-[hsl(36,84%,46%)] text-white border-0"
                    >
                      {loadingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Approve'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Approve Confirmation Modal */}
      <AlertDialog open={!!confirmApprove} onOpenChange={(open) => !open && setConfirmApprove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={TITLE}>Approve request?</AlertDialogTitle>
            <AlertDialogDescription>
              Add {confirmApprove?.requester.display_name || confirmApprove?.requester.username || 'this user'} to {businessName} as {getRoleLabel(confirmApprove?.requested_role || '')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmApprove && handleApprove(confirmApprove)}
              disabled={loadingId !== null}
            >
              {loadingId === confirmApprove?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Decline Confirmation Modal */}
      <AlertDialog open={!!confirmDecline} onOpenChange={(open) => !open && setConfirmDecline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={TITLE}>Decline request?</AlertDialogTitle>
            <AlertDialogDescription>
              Decline {confirmDecline?.requester.display_name || confirmDecline?.requester.username || 'this user'}'s request to join {businessName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmDecline && handleDecline(confirmDecline)}
              disabled={loadingId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loadingId === confirmDecline?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
