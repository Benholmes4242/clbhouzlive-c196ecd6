import React from 'react';
import { Check } from 'lucide-react';
import { useFollowState } from '@/hooks/useFollowState';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
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
  const { activeActor } = useActiveActor();
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? user?.id;
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: actorId,
    viewerActorType,
    viewerActorId,
  });
  const isFollowing = cached ?? false;

  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMock) { toast.info('This is sample data'); return; }
    if (!user?.id || !actorId || !viewerActorId) return;
    if (isFollowing) return;
    try {
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: actorId,
        targetUserId: actorId,
        viewerActorType,
        viewerActorId,
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)', fontSize: 13, fontWeight: 600, color: '#64748B' }}>
          <Check size={13} />
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
          padding: '8px 16px', borderRadius: 10,
          background: '#F7931E', color: '#ffffff',
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}
      >
        {toggle.isPending ? 'Following...' : 'Follow back'}
      </button>
    </div>
  );
};
