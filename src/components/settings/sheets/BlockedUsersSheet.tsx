import { X, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function BlockedUsersSheet({ open, onClose, userId }: Props) {
  const queryClient = useQueryClient();

  const { data: blocked = [], isLoading } = useQuery({
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, user_profiles!user_blocks_blocked_id_fkey(id, username, avatar_url, full_name)')
        .eq('blocker_id', userId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId && open,
  });

  const handleUnblock = async (blockedId: string) => {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', blockedId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['blocked-users', userId] });
      toast.success('User has been unblocked.');
    } catch {
      toast.error('Could not unblock user.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5 max-h-[80vh] overflow-y-auto"
        hideCloseButton
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Blocked Users</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserX size={36} className="text-muted-foreground mb-3" />
            <p className="text-[15px] font-medium text-foreground">No blocked users</p>
            <p className="text-[13px] text-muted-foreground mt-1">Users you block will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {blocked.map((item: any) => {
              const p = item.user_profiles;
              return (
                <div key={item.blocked_id} className="flex items-center gap-3 py-2">
                  <SquircleAvatar
                    src={p?.avatar_url}
                    alt={p?.full_name || p?.username || ''}
                    userId={item.blocked_id}
                    size={40}
                    hideRing
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-foreground truncate">{p?.full_name ?? 'Unknown'}</p>
                    <p className="text-[13px] text-muted-foreground">@{p?.username ?? '—'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[36px] shrink-0"
                    onClick={() => handleUnblock(item.blocked_id)}
                  >
                    Unblock
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
