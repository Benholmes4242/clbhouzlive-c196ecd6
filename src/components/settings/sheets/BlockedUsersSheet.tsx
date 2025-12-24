import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, UserX } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface BlockedUsersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface BlockedUser {
  blocked_id: string;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
}

export function BlockedUsersSheet({ open, onOpenChange, userId }: BlockedUsersSheetProps) {
  const queryClient = useQueryClient();

  // Fetch blocked users
  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      // First get blocked user IDs
      const { data: blocks, error: blocksError } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (blocksError) throw blocksError;
      if (!blocks?.length) return [];

      // Then fetch profiles for those users
      const blockedIds = blocks.map(b => b.blocked_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', blockedIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return blocks.map(block => ({
        blocked_id: block.blocked_id,
        created_at: block.created_at,
        profile: profiles?.find(p => p.id === block.blocked_id) || null
      })) as BlockedUser[];
    },
    enabled: open && !!userId,
  });

  // Unblock mutation
  const unblockMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', blockedId);
      
      if (error) throw error;
    },
    onMutate: async (blockedId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['blocked-users', userId] });
      const previous = queryClient.getQueryData(['blocked-users', userId]);
      
      queryClient.setQueryData(['blocked-users', userId], (old: BlockedUser[] | undefined) => 
        old?.filter(u => u.blocked_id !== blockedId) || []
      );
      
      return { previous };
    },
    onError: (err, blockedId, context) => {
      // Rollback on error
      queryClient.setQueryData(['blocked-users', userId], context?.previous);
      toast.error('Failed to unblock user');
    },
    onSuccess: () => {
      toast.success('User unblocked');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users', userId] });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[18px] px-4 pb-8 bg-white max-w-full"
        style={{ maxHeight: '70vh' }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full bg-[#E4E6E9]" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-[#1F2428] text-lg font-semibold">
            Blocked users
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#5E666D]" />
            </div>
          ) : !blockedUsers?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserX className="w-10 h-10 text-[#97A1AA] mb-3" />
              <p className="text-[#5E666D] text-sm">You haven't blocked anyone.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {blockedUsers.map((blocked) => (
                <div 
                  key={blocked.blocked_id}
                  className="flex items-center justify-between py-3 px-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SquircleAvatar
                      src={blocked.profile?.profile_photo_url}
                      alt={blocked.profile?.display_name || 'User'}
                      size={40}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium text-[#1F2428] truncate">
                        {blocked.profile?.display_name || 'Unknown User'}
                      </p>
                      {blocked.profile?.username && (
                        <p className="text-[13px] text-[#5E666D] truncate">
                          @{blocked.profile.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockMutation.mutate(blocked.blocked_id)}
                    disabled={unblockMutation.isPending}
                    className="flex-shrink-0 text-[13px] h-8 px-3 border-[rgba(31,36,40,0.1)] text-[#5E666D] hover:text-[#1F2428]"
                  >
                    {unblockMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Unblock'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
