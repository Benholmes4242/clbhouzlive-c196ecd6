import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Building2, ExternalLink, Trash2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callEdge } from '@/utils/callEdge';

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
  
  // Create access request mutation (via Edge Function)
  const createRequest = useMutation({
    mutationFn: async ({ role, requester }: { role: 'team_member' | 'manager'; requester: typeof selectedRequester }) => {
      if (!selectedBusiness || !requester || !user) {
        throw new Error('Missing required data');
      }
      
      const result = await callEdge('admin-testlab-business-access', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: role,
          message: message || null,
          seed_key: SEED_KEY,
        }),
      });
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Created request, notified ${data.admin_count} admin(s)`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-access-requests'] });
    },
    onError: (error: any) => {
      console.error('Failed to create request:', error);
      toast.error(error.message || 'Failed to create request');
    },
  });
  
  // Create two requests mutation (via Edge Function)
  const createTwoRequests = useMutation({
    mutationFn: async () => {
      if (!selectedBusiness || !testUsers || testUsers.length === 0 || !user) {
        throw new Error('Missing required data');
      }
      
      const requester = testUsers[0];
      
      // Create team member request
      const result1 = await callEdge('admin-testlab-business-access', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: 'team_member',
          message: 'Test request for team member access',
          seed_key: SEED_KEY,
        }),
      });
      
      // Create manager request
      const result2 = await callEdge('admin-testlab-business-access', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          business_id: selectedBusinessId,
          requester_user_profile_id: requester.id,
          requested_role: 'manager',
          message: 'Test request for manager access',
          seed_key: SEED_KEY,
        }),
      });
      
      return { 
        count: 2, 
        adminCount: result1.admin_count || result2.admin_count || 0,
      };
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.count} requests, notified ${data.adminCount} admin(s)`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-access-requests'] });
    },
    onError: (error: any) => {
      console.error('Failed to create requests:', error);
      toast.error(error.message || 'Failed to create requests');
    },
  });
  
  // Reset test state mutation (via Edge Function)
  const resetTestState = useMutation({
    mutationFn: async () => {
      const result = await callEdge('admin-testlab-business-access', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset',
          seed_key: SEED_KEY,
        }),
      });
      
      return result;
    },
    onSuccess: (data) => {
      toast.success(`Test state reset (${data.deleted_notifications} notifications, ${data.deleted_requests} requests)`);
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-pending-requests-count'] });
      queryClient.invalidateQueries({ queryKey: ['business-access-requests'] });
    },
    onError: (error: any) => {
      console.error('Failed to reset state:', error);
      toast.error(error.message || 'Failed to reset test state');
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
