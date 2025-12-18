import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Building2, ExternalLink, Trash2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const SEED_KEY = 'testlab_business_access_v1';

// Fetch businesses with club_id
function useClubBusinesses() {
  return useQuery({
    queryKey: ['admin-club-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, logo_url')
        .not('club_id', 'is', null)
        .eq('is_deleted', false)
        .order('name')
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// Fetch test users
function useTestUsers() {
  return useQuery({
    queryKey: ['admin-test-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('is_test', true)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// Fetch business admins (owners/admins for notifications)
async function getBusinessAdmins(businessId: string) {
  const { data, error } = await supabase
    .from('business_members')
    .select('user_profile_id')
    .eq('business_id', businessId)
    .in('role', ['owner', 'admin']);
  if (error) throw error;
  return data?.map(m => m.user_profile_id) || [];
}

export function BusinessAccessTestLab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  
  const { data: businesses, isLoading: businessesLoading } = useClubBusinesses();
  const { data: testUsers, isLoading: testUsersLoading } = useTestUsers();
  
  // Form state
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('06fcc5f2-4914-4fe3-a072-d9e32b1a7ff6'); // St Andrews Links
  const [selectedRequesterId, setSelectedRequesterId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'team_member' | 'manager'>('team_member');
  const [message, setMessage] = useState('');
  
  // Set default requester when test users load
  React.useEffect(() => {
    if (testUsers && testUsers.length > 0 && !selectedRequesterId) {
      setSelectedRequesterId(testUsers[0].id);
    }
  }, [testUsers, selectedRequesterId]);
  
  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
  const selectedRequester = testUsers?.find(u => u.id === selectedRequesterId);
  
  // Create access request mutation
  const createRequest = useMutation({
    mutationFn: async ({ role, requester }: { role: 'team_member' | 'manager'; requester: typeof selectedRequester }) => {
      if (!selectedBusiness || !requester || !user) {
        throw new Error('Missing required data');
      }
      
      // 1. Insert access request
      const { data: request, error: requestError } = await supabase
        .from('business_access_requests')
        .insert({
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: role,
          message: message || null,
          status: 'pending',
        })
        .select('id')
        .single();
      
      if (requestError) throw requestError;
      
      // 2. Get business admins to notify
      const adminIds = await getBusinessAdmins(selectedBusinessId);
      
      // 3. Create notifications for each admin
      const notifications = adminIds.map(adminId => ({
        user_id: adminId,
        actor_id: requester.id,
        type: 'business_access_request',
        title: 'Access request',
        entity_type: 'business',
        entity_id: selectedBusinessId,
        data: {
          seed_key: SEED_KEY,
          request_id: request.id,
          business_id: selectedBusinessId,
          business_name: selectedBusiness.name,
          business_avatar_url: selectedBusiness.logo_url,
          entity_name: selectedBusiness.name,
          entity_avatar_url: selectedBusiness.logo_url,
          requester_id: requester.id,
          requester_name: requester.display_name || requester.username,
          requester_avatar_url: requester.profile_photo_url,
          role_requested: role,
        },
      }));
      
      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        if (notifError) throw notifError;
      }
      
      return { requestId: request.id, adminCount: adminIds.length };
    },
    onSuccess: (data) => {
      toast.success(`Created request, notified ${data.adminCount} admin(s)`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
    },
    onError: (error) => {
      console.error('Failed to create request:', error);
      toast.error('Failed to create request');
    },
  });
  
  // Create two requests mutation
  const createTwoRequests = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness || !testUsers || testUsers.length === 0 || !user) {
        throw new Error('Missing required data');
      }
      
      const requester = testUsers[0];
      const adminIds = await getBusinessAdmins(selectedBusinessId);
      
      // Create team member request
      const { data: req1, error: err1 } = await supabase
        .from('business_access_requests')
        .insert({
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: 'team_member',
          message: 'Test request for team member access',
          status: 'pending',
        })
        .select('id')
        .single();
      if (err1) throw err1;
      
      // Create manager request
      const { data: req2, error: err2 } = await supabase
        .from('business_access_requests')
        .insert({
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: 'manager',
          message: 'Test request for manager access',
          status: 'pending',
        })
        .select('id')
        .single();
      if (err2) throw err2;
      
      // Create notifications
      const notifications = adminIds.flatMap(adminId => [
        {
          user_id: adminId,
          actor_id: requester.id,
          type: 'business_access_request',
          title: 'Access request',
          entity_type: 'business',
          entity_id: selectedBusinessId,
          data: {
            seed_key: SEED_KEY,
            request_id: req1.id,
            business_id: selectedBusinessId,
            business_name: selectedBusiness.name,
            business_avatar_url: selectedBusiness.logo_url,
            entity_name: selectedBusiness.name,
            entity_avatar_url: selectedBusiness.logo_url,
            requester_id: requester.id,
            requester_name: requester.display_name || requester.username,
            requester_avatar_url: requester.profile_photo_url,
            role_requested: 'team_member',
          },
        },
        {
          user_id: adminId,
          actor_id: requester.id,
          type: 'business_access_request',
          title: 'Access request',
          entity_type: 'business',
          entity_id: selectedBusinessId,
          data: {
            seed_key: SEED_KEY,
            request_id: req2.id,
            business_id: selectedBusinessId,
            business_name: selectedBusiness.name,
            business_avatar_url: selectedBusiness.logo_url,
            entity_name: selectedBusiness.name,
            entity_avatar_url: selectedBusiness.logo_url,
            requester_id: requester.id,
            requester_name: requester.display_name || requester.username,
            requester_avatar_url: requester.profile_photo_url,
            role_requested: 'manager',
          },
        },
      ]);
      
      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);
        if (notifError) throw notifError;
      }
      
      return { count: 2, adminCount: adminIds.length };
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.count} requests, notified ${data.adminCount} admin(s)`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
    },
    onError: (error) => {
      console.error('Failed to create requests:', error);
      toast.error('Failed to create requests');
    },
  });
  
  // Reset test state mutation
  const resetTestState = useMutation({
    mutationFn: async () => {
      // Delete test notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .contains('data', { seed_key: SEED_KEY });
      if (notifError) console.error('Failed to delete notifications:', notifError);
      
      // Delete test access requests (those with test message markers)
      const { error: reqError } = await supabase
        .from('business_access_requests')
        .delete()
        .or('message.ilike.%Test request%,message.is.null')
        .eq('status', 'pending');
      if (reqError) console.error('Failed to delete requests:', reqError);
      
      return true;
    },
    onSuccess: () => {
      toast.success('Test state reset');
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
    },
    onError: (error) => {
      console.error('Failed to reset state:', error);
      toast.error('Failed to reset test state');
    },
  });
  
  const isLoading = businessesLoading || testUsersLoading;
  const isAnyMutating = createRequest.isPending || createTwoRequests.isPending || resetTestState.isPending;
  
  return (
    <div className="rounded-sq-md border-2 border-blue-500/20 bg-blue-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-blue-600" />
        <h2 className="text-sm font-semibold tracking-wide uppercase">Business Access Requests</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Create realistic join requests for a business and test the full approval flow.
      </p>
      
      {isLoading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Business selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Business</label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full rounded-sq-sm border border-border bg-background px-3 py-2 text-sm"
            >
              {businesses?.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {selectedBusiness && (
              <div className="flex items-center gap-2 mt-2">
                <SquircleAvatar
                  src={selectedBusiness.logo_url}
                  alt={selectedBusiness.name}
                  size={32}
                  fallback={selectedBusiness.name.charAt(0)}
                />
                <span className="text-sm font-medium">{selectedBusiness.name}</span>
              </div>
            )}
          </div>
          
          {/* Requester selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Requester (Test User)</label>
            <select
              value={selectedRequesterId}
              onChange={(e) => setSelectedRequesterId(e.target.value)}
              className="w-full rounded-sq-sm border border-border bg-background px-3 py-2 text-sm"
            >
              {testUsers?.map(u => (
                <option key={u.id} value={u.id}>
                  {u.display_name || u.username}
                </option>
              ))}
            </select>
          </div>
          
          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRole('team_member')}
                className={cn(
                  "flex-1 rounded-sq-sm px-3 py-2 text-sm font-medium border transition-colors",
                  selectedRole === 'team_member'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-muted/80"
                )}
              >
                Team member
              </button>
              <button
                onClick={() => setSelectedRole('manager')}
                className={cn(
                  "flex-1 rounded-sq-sm px-3 py-2 text-sm font-medium border transition-colors",
                  selectedRole === 'manager'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted border-border hover:bg-muted/80"
                )}
              >
                Manager
              </button>
            </div>
          </div>
          
          {/* Message field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Message (optional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short note (optional)..."
              className="w-full rounded-sq-sm border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => createRequest.mutate({ role: selectedRole, requester: selectedRequester })}
              disabled={isAnyMutating || !selectedBusiness || !selectedRequester}
              className="flex-1 rounded-sq-sm px-4 py-2.5 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createRequest.isPending ? 'Creating...' : 'Create access request'}
            </button>
            
            <button
              onClick={() => createTwoRequests.mutate()}
              disabled={isAnyMutating || !selectedBusiness || !testUsers?.length}
              className="flex-1 rounded-sq-sm px-4 py-2.5 text-sm font-medium bg-muted border border-border hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTwoRequests.isPending ? 'Creating...' : 'Create 2 requests'}
            </button>
            
            <button
              onClick={() => resetTestState.mutate()}
              disabled={isAnyMutating}
              className="rounded-sq-sm px-4 py-2.5 text-sm font-medium bg-red-500/10 text-red-600 border border-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {resetTestState.isPending ? 'Resetting...' : 'Reset test state'}
            </button>
          </div>
          
          {/* Quick navigation */}
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <button
              onClick={() => navigate('/notificationmessages')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Notifications
            </button>
            <button
              onClick={() => navigate('/business-profiles')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Business Profiles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
