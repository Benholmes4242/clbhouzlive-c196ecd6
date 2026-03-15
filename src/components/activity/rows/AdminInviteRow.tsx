import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  RowProps,
  AvatarWithBadge,
  getActorDisplayName,
} from './rowHelpers';
import { NotificationCard } from '@/components/ui/NotificationCard';

export const AdminInviteRow: React.FC<RowProps> = ({
  notification,
  onClick,
  onOpenActionsSheet,
  isSessionNew,
}) => {
  const queryClient = useQueryClient();
  const [isActioning, setIsActioning] = useState(false);
  const [actionedWith, setActionedWith] = useState<'accept' | 'decline' | null>(null);

  const showOrange = isSessionNew || notification.is_unread;
  const inviteId = notification.data?.invite_id || notification.entity_id;
  const role = notification.data?.role;

  const handleAction = async (action: 'accept' | 'decline') => {
    if (isActioning || actionedWith) return;
    setIsActioning(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('accept-admin-invite', {
        body: { inviteId, userId: user.id, action },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setActionedWith(action);

      if (action === 'accept') {
        toast.success('Welcome to the admin team! 🎉');
      } else {
        toast('Invite declined.');
      }

      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['activity-unread-count'] });
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsActioning(false);
    }
  };

  const badgeIcon = <Shield className="h-3 w-3 text-[#F7931E]" />;

  return (
    <NotificationCard
      avatar={<AvatarWithBadge notification={notification} badgeIcon={badgeIcon} />}
      title={
        <>
          <span className={cn(showOrange ? "font-semibold" : "font-medium")}>
            Admin Invitation
          </span>{' '}
          <span className="font-normal text-muted-foreground">
            {notification.message || notification.title}
          </span>
        </>
      }
      subtext={
        actionedWith ? (
          <span className="text-[11px] text-muted-foreground italic">
            {actionedWith === 'accept' ? '✓ Accepted' : 'Declined'}
          </span>
        ) : (
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleAction('accept'); }}
              disabled={isActioning}
              className="flex-1 py-1.5 px-3 rounded-[10px] text-[13px] font-bold text-white transition-all active:scale-[0.95] disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, rgba(251,146,60,0.55) 0%, rgba(234,88,12,0.38) 50%, rgba(194,65,12,0.45) 100%)',
                border: '1px solid rgba(251,146,60,0.5)',
                borderTop: '1px solid rgba(255,200,150,0.35)',
                boxShadow: '0 2px 12px rgba(249,115,22,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              Accept
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAction('decline'); }}
              disabled={isActioning}
              className="flex-1 py-1.5 px-3 rounded-[10px] text-[13px] font-semibold transition-all active:scale-[0.95] disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Decline
            </button>
          </div>
        )
      }
      timestamp={notification.time_ago}
      isNew={showOrange}
      onClick={onClick}
      onMenuClick={onOpenActionsSheet}
    />
  );
};
