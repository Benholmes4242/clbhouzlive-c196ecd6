import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { Squircle } from '@/components/ui/squircle';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface JoinRequest {
  id: string;
  state: 'pending' | 'approved' | 'rejected';
  requester_id: string;
  created_at: string;
  requester?: {
    id: string;
    display_name: string;
    username: string;
    profile_photo_url: string | null;
    home_club: string | null;
    eg_handicap_index: number | null;
  };
}

interface HostApprovalSheetProps {
  gameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HostApprovalSheet({ gameId, open, onOpenChange }: HostApprovalSheetProps) {
  const queryClient = useQueryClient();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!gameId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-join-requests', {
        body: { game_id: gameId },
      });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      if (data && data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open, fetchRequests]);

  // Realtime subscription
  useEffect(() => {
    if (!open || !gameId) return;

    const channel = supabase
      .channel(`jr_${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, gameId, fetchRequests]);

  const handleAction = async (requestId: string, approve: boolean) => {
    haptic('medium');
    setProcessing(requestId);

    try {
      const { data, error } = await supabase.functions.invoke('decide-join-request', {
        body: { 
          request_id: requestId, 
          action: approve ? 'approve' : 'decline' 
        },
      });

      if (error || !data?.success) {
        console.error('Approval error:', error);
        toast.error('Failed to process request. Please try again.');
        await fetchRequests();
        return;
      }

      // Optimistically remove the request from the list
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      
      // Invalidate queries to refresh all related data
      queryClient.invalidateQueries({ queryKey: ['userGames'] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['pendingRequestCount', gameId] });
      queryClient.invalidateQueries({ queryKey: ['gameJoinRequests', gameId] });
      
      // Show success message
      if (approve) {
        toast.success('Player added to game');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
      await fetchRequests();
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = requests.filter((r) => r.state === 'pending').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-neutral-900 border-t border-neutral-800 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="text-white">
            Join Requests {pendingCount > 0 && `(${pendingCount})`}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-neutral-400 text-sm">Loading…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-neutral-400 text-sm">No requests yet</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 bg-neutral-800 rounded-sq-sm border border-neutral-700"
              >
                <SquircleAvatar
                  src={r.requester?.profile_photo_url}
                  alt={r.requester?.display_name || 'User'}
                  userId={r.requester?.id}
                  size={40}
                  hideRing
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {r.requester?.display_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-neutral-400 truncate">
                    @{r.requester?.username || 'unknown'}
                  </div>
                  {r.requester?.eg_handicap_index !== null && (
                    <div className="text-xs text-neutral-500">
                      HCP: {r.requester.eg_handicap_index.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.state === 'pending' ? (
                    <>
                      <TapButton
                        onClick={() => handleAction(r.id, false)}
                        disabled={processing === r.id}
                        className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-sq-xs text-sm font-medium"
                      >
                        {processing === r.id ? '...' : 'Reject'}
                      </TapButton>
                      <TapButton
                        onClick={() => handleAction(r.id, true)}
                        disabled={processing === r.id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sq-xs text-sm font-medium"
                      >
                        {processing === r.id ? '...' : 'Approve'}
                      </TapButton>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-sq-xs text-xs font-medium ${
                        r.state === 'approved'
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {r.state === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
