import { UserX } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A } from '@/features/courses/components/holes/analytical/tokens';


type BlockedUserRow = {
  blocked_id: string;
  user_profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name: string | null;
  } | null;
};

export default function BlockedPage() {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { data: blocked = [], isLoading, isError, refetch } = useQuery<BlockedUserRow[]>({
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, user_profiles!user_blocks_blocked_id_fkey(id, username, avatar_url, full_name)')
        .eq('blocker_id', userId);
      if (error) throw error;
      return (data ?? []) as unknown as BlockedUserRow[];
    },
    enabled: !!userId,
  });

  const handleUnblock = async (blockedId: string) => {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', userId!)
        .eq('blocked_id', blockedId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['blocked-users', userId] });
      toast.success('User has been unblocked.');
    } catch {
      toast.error('Could not unblock user.');
    }
  };

  return (
    <ManagePageShell title="Blocked users">
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="rounded-2xl p-2" style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton variant="dark" className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="dark" className="h-3.5 w-32" />
                  <Skeleton variant="dark" className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <p className="text-[15px] font-medium text-foreground">Couldn't load blocked users</p>
            <p className="text-[13px]" style={{ color: A.MUTE }}>Check your connection and try again.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserX size={36} className="mb-3" style={{ color: A.MUTE }} />
            <p className="text-[15px] font-medium text-foreground">No blocked users</p>
            <p className="text-[13px] mt-1" style={{ color: A.MUTE }}>Users you block will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: A.PANEL, border: `1px solid ${A.BORDER}` }}>
            {blocked.map((item, idx) => {
              const p = item.user_profiles;
              return (
                <div
                  key={item.blocked_id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderTop: idx === 0 ? 'none' : `0.5px solid ${A.BORDER}`,
                  }}
                >
                  <SquircleAvatar
                    src={p?.avatar_url}
                    alt={p?.full_name || p?.username || ''}
                    userId={item.blocked_id}
                    size={40}
                    hairlineRing
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-foreground" style={{ lineHeight: 1.3 }}>{p?.full_name ?? 'Unknown'}</p>
                    {p?.username && (
                      <p className="text-[13px]" style={{ color: A.MUTE, lineHeight: 1.35 }}>@{p.username}</p>
                    )}
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
      </div>
    </ManagePageShell>
  );
}
