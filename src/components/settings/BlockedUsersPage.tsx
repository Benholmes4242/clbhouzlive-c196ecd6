import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldBan } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SettingsSkeleton } from './ui';

interface BlockedUser {
  blocked_id: string;
  blocked_at: string;
  blocked_user: {
    id: string;
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null;
}

/**
 * BlockedUsersPage - Manage blocked users
 */
export function BlockedUsersPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [blockedUsers, setBlockedUsers] = React.useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [unblockingId, setUnblockingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    loadBlockedUsers();
  }, [user]);

  const loadBlockedUsers = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch blocked user profiles separately
      const blockedUserIds = (data || []).map(b => b.blocked_id);
      if (blockedUserIds.length === 0) {
        setBlockedUsers([]);
        setIsLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', blockedUserIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      
      const mapped: BlockedUser[] = (data || []).map(block => ({
        blocked_id: block.blocked_id,
        blocked_at: block.created_at,
        blocked_user: profileMap.get(block.blocked_id) || null
      }));

      setBlockedUsers(mapped);
    } catch (err) {
      console.error('[BlockedUsers] load error:', err);
      toast.error('Failed to load blocked users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string, username: string | null) => {
    if (!user) return;
    setUnblockingId(blockedId);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

      if (error) throw error;

      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      toast.success(`Unblocked ${username || 'user'}`);
    } catch (err) {
      console.error('[BlockedUsers] unblock error:', err);
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-[#0A0A0A]">
        <DetailHeader onBack={() => navigate('/settings')} />
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
          <SettingsSkeleton sections={[{ title: 'Blocked users', rows: 3 }]} />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-[#0A0A0A]">
      <DetailHeader onBack={() => navigate('/settings')} />
      
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-28">
        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <ShieldBan className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No blocked users</h3>
            <p className="text-[13px] text-white/50">
              When you block someone, they'll appear here.
            </p>
          </div>
        ) : (
          <div 
            className="rounded-[18px] overflow-hidden border border-white/5"
            style={{
              background: 'rgba(10,10,10,0.78)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
            }}
          >
            {blockedUsers.map((block, idx) => (
              <div 
                key={block.blocked_id}
                className="relative flex items-center justify-between px-[14px] py-[12px] min-h-[56px]"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden"
                  >
                    {block.blocked_user?.profile_photo_url ? (
                      <img 
                        src={block.blocked_user.profile_photo_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white/40 text-sm font-medium">
                        {(block.blocked_user?.display_name || block.blocked_user?.username || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {block.blocked_user?.display_name || block.blocked_user?.username || 'Unknown user'}
                    </p>
                    {block.blocked_user?.username && (
                      <p className="text-[13px] text-white/50">@{block.blocked_user.username}</p>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblock(block.blocked_id, block.blocked_user?.username ?? null)}
                  disabled={unblockingId === block.blocked_id}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  {unblockingId === block.blocked_id ? 'Unblocking...' : 'Unblock'}
                </Button>

                {/* Divider */}
                {idx < blockedUsers.length - 1 && (
                  <div 
                    className="absolute bottom-0 left-[14px] right-[14px] h-[1px]"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageRoot>
  );
}

function DetailHeader({ onBack }: { onBack: () => void }) {
  return (
    <header 
      className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-white/5"
      style={{
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        paddingTop: 'max(env(safe-area-inset-top), 12px)',
      }}
    >
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>
      <h1 className="text-lg font-semibold text-white">Blocked users</h1>
    </header>
  );
}

export default BlockedUsersPage;
