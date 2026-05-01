import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFriendsActivity } from '@/lib/whs/hooks';
import { firstName, shareInvite } from '@/lib/whs/share';
import { callCreateInvite } from '@/lib/whs/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { whsKeys } from '@/lib/whs/hooks';

interface Props {
  ownerUserId: string;
}

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

export const ActivityFeedStrip: React.FC<Props> = ({ ownerUserId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useFriendsActivity(ownerUserId);

  const handleInvite = async (passportId: number, name: string) => {
    const res = await callCreateInvite(passportId, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite for ${firstName(name)}`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? name,
    });
  };

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="mb-6">
      <div className="px-5 flex items-end justify-between mb-2">
        <h3 className="text-[16px] font-bold text-foreground">Friends recently played</h3>
        <span className="text-[11px] text-muted-foreground">Your England Golf friends</span>
      </div>
      <div
        className="flex gap-3 px-5 pt-2 pb-2 overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          willChange: 'transform',
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[140px] h-[120px] rounded-xl bg-muted/60 animate-pulse"
              />
            ))
          : data?.map((f) => {
              const isOnClbhouz = f.is_clbhouz_user;
              const onClick = () => {
                if (isOnClbhouz && f.friend_user_id) {
                  navigate(`/p/${f.friend_user_id}`);
                } else {
                  handleInvite(f.friend_passport_id, f.friend_name);
                }
              };
              return (
                <button
                  key={f.friend_row_id}
                  onClick={onClick}
                  className="relative flex-shrink-0 w-[140px] rounded-xl border p-3 bg-background text-left transition-colors hover:bg-muted/30"
                  style={{
                    borderColor: 'rgba(15,23,42,0.08)',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {f.friend_thumbnail_url ? (
                      <img
                        src={f.friend_thumbnail_url}
                        alt={f.friend_name}
                        className="w-9 h-9 rounded-full object-cover"
                        style={{ borderRadius: '34%' }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 flex items-center justify-center text-[11px] font-bold text-muted-foreground"
                        style={{
                          background: 'rgba(15,23,42,0.06)',
                          borderRadius: '34%',
                        }}
                      >
                        {initials(f.friend_name)}
                      </div>
                    )}
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {firstName(f.friend_name)}
                    </p>
                  </div>
                  <p className="text-[24px] font-bold text-foreground tabular-nums leading-none mb-1">
                    {f.last_round_adjusted_gross ?? '—'}
                  </p>
                  <p className="text-[11px] text-foreground/70 truncate mb-0.5">
                    {f.last_round_course_name ?? 'Round played'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.last_round_played_at
                      ? formatDistanceToNow(new Date(f.last_round_played_at), { addSuffix: true })
                      : ''}
                  </p>
                  <span
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
                    style={
                      isOnClbhouz
                        ? { background: 'rgba(16,185,129,0.12)', color: '#059669' }
                        : { background: 'rgba(15,23,42,0.05)', color: '#64748B' }
                    }
                  >
                    {isOnClbhouz ? (
                      <>
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#10B981' }}
                        />
                        clbhouz
                      </>
                    ) : (
                      'Invite'
                    )}
                  </span>
                </button>
              );
            })}
      </div>
    </section>
  );
};

export default ActivityFeedStrip;
