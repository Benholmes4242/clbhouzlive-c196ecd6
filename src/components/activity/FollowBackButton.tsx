import React from 'react';
import { Check } from 'lucide-react';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

interface FollowBackButtonProps {
  actorId: string;
  actorDisplayName: string;
  isMock?: boolean;
}

export const FollowBackButton: React.FC<FollowBackButtonProps> = ({
  actorId,
  actorDisplayName,
  isMock = false,
}) => {
  const { user } = useSupabaseSession();
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: actorId,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });
  const isFollowing = cached ?? false;

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) { toast.info('This is sample data'); return; }
    if (!user?.id || !actorId) return;
    if (isFollowing) return;
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: actorId,
        targetUserId: actorId,
        viewerActorType: 'personal',
        viewerActorId: user.id,
        viewerUserId: user.id,
        isFollowing: false,
      });
      toast.success(`You're now following ${actorDisplayName}.`);
    } catch (error) {
      toast.error("We couldn't follow them. Please try again.");
    }
  };

  if (isFollowing) {
    return (
      <div className="min-h-[44px] flex items-center">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: 'rgba(15,23,42,0.06)', border: '0.5px solid rgba(15,23,42,0.15)', fontSize: 12, fontWeight: 600, color: '#64748B' }}>
          <Check className="h-3 w-3" />
          Following
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-[44px] flex items-center">
      <button
        onClick={handleFollowBack}
        disabled={toggle.isPending}
        className="disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '7px 16px', borderRadius: 20,
          background: '#F7931E', color: '#ffffff',
          fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(247,147,30,0.22)',
        }}
      >
        {toggle.isPending ? 'Following...' : 'Follow back'}
      </button>
    </div>
  );
};
