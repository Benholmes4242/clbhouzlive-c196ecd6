import React, { useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, ChevronRight, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import RoundStatStrip from '../last-round/RoundStatStrip';
import RoundScorecard from '../last-round/RoundScorecard';
import RoundBreakdown from '../last-round/RoundBreakdown';
import { useFriendRoundDetail, useSentInvites, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite, firstName } from '@/lib/whs/share';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

interface Props {
  activity: WhsFriendActivityWithImage | null;
  open: boolean;
  onClose: () => void;
}

const PAGE_BG = '#F8FAFC';
const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER_TINT = 'rgba(247,147,30,0.10)';
const AMBER_DEEP = '#C97211';
const AMBER_INK = '#9A6116';
const FONT_SERIF = 'Georgia, "Iowan Old Style", "Apple Garamond", serif';

const relativeDay = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'TODAY';
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days} DAYS AGO`;
  return format(d, 'd MMM yyyy').toUpperCase();
};

const fmtRelative = (iso: string | null) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const SheetSkeleton: React.FC = () => (
  <div className="animate-pulse" style={{ padding: 20 }}>
    <div style={{ height: 200, background: 'rgba(15,23,42,0.04)', borderRadius: 8 }} />
  </div>
);

export const FriendRoundSheet: React.FC<Props> = ({ activity, open, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inviteSending, setInviteSending] = useState(false);

  const isClbhouz = !!activity?.is_clbhouz_user && !!activity?.friend_user_id;
  const scoreId = isClbhouz ? activity?.last_round_score_id ?? null : null;

  const { data: holesData, isLoading: holesLoading } = useFriendRoundDetail(
    scoreId,
    open && isClbhouz,
  );

  const { data: invites } = useSentInvites();
  const pendingInvite = activity
    ? invites?.find(
        (i) =>
          i.invitee_passport_id === activity.friend_passport_id &&
          i.status === 'pending',
      )
    : undefined;

  const handleInvite = async () => {
    if (!activity) return;
    setInviteSending(true);
    const res = await callCreateInvite(activity.friend_passport_id, 'copy_link');
    setInviteSending(false);
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? activity.friend_name,
    });
  };

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-[10001]"
          style={{ background: 'rgba(15,23,42,0.40)' }}
        />
        <DrawerPrimitive.Content
          aria-labelledby="friend-round-sheet-title"
          className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[20px] outline-none"
          style={{
            background: PAGE_BG,
            maxHeight: '92vh',
            overflow: 'hidden',
            boxShadow: '0 -10px 40px -10px rgba(15,23,42,0.25)',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">
            {activity?.last_round_course_name ?? 'Friend round detail'}
          </DrawerPrimitive.Title>

          {!activity ? (
            <SheetSkeleton />
          ) : (
            <>
              {/* HERO */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 8',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                }}
              >
                {activity.course_thumbnail_image && (
                  <img
                    src={activity.course_thumbnail_image}
                    alt={activity.last_round_course_name ?? ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.85) 100%)',
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.6)',
                  }}
                />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} color={INK} strokeWidth={2.5} />
                </button>

                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    right: 20,
                    bottom: 16,
                    color: '#fff',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      opacity: 0.85,
                      marginBottom: 4,
                    }}
                  >
                    {activity.last_round_played_at
                      ? relativeDay(activity.last_round_played_at)
                      : ''}
                    {activity.last_round_adjusted_gross != null &&
                      ` · GROSS ${activity.last_round_adjusted_gross}`}
                  </p>
                  <h2
                    id="friend-round-sheet-title"
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 900,
                      fontFamily: FONT_SERIF,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  >
                    {activity.last_round_course_name ?? 'Round played'}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 12,
                      fontWeight: 700,
                      opacity: 0.85,
                    }}
                  >
                    by {firstName(activity.friend_name)}
                  </p>
                </div>
              </div>

              {/* SCROLLING BODY */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '4px 0 32px',
                }}
              >
                <RoundStatStrip
                  gross={activity.last_round_adjusted_gross}
                  stableford={activity.last_round_stableford}
                  differential={activity.last_round_differential}
                />

                {isClbhouz ? (
                  <>
                    {holesLoading && <SheetSkeleton />}
                    {!holesLoading &&
                      holesData?.hole_by_hole_fetched &&
                      holesData.holes.length > 0 && (
                        <>
                          <RoundScorecard
                            holes={holesData.holes}
                            isNineHole={holesData.is_nine_hole}
                          />
                          <RoundBreakdown holes={holesData.holes} />
                        </>
                      )}
                    {!holesLoading &&
                      holesData?.hole_by_hole_fetched &&
                      holesData.holes.length === 0 && (
                        <div
                          style={{
                            margin: '24px 20px 0',
                            padding: '20px 16px',
                            background: 'rgba(15,23,42,0.03)',
                            borderRadius: 12,
                            border: `1px dashed ${HAIRLINE}`,
                            textAlign: 'center',
                          }}
                        >
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: INK }}>
                            No hole-by-hole data for {firstName(activity.friend_name)}'s round.
                          </p>
                        </div>
                      )}
                    {!holesLoading && holesData && !holesData.hole_by_hole_fetched && (
                      <div
                        style={{
                          margin: '24px 20px 0',
                          padding: '20px 16px',
                          background: 'rgba(15,23,42,0.03)',
                          borderRadius: 12,
                          border: `1px dashed ${HAIRLINE}`,
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>
                          Hole data is still syncing
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: INK_MUTE, lineHeight: 1.5 }}>
                          Check back in a few hours for {firstName(activity.friend_name)}'s
                          hole-by-hole.
                        </p>
                      </div>
                    )}

                    {activity.friend_user_id && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/p/${activity.friend_user_id}`);
                        }}
                        style={{
                          margin: '20px 20px 0',
                          padding: '12px 16px',
                          width: 'calc(100% - 40px)',
                          background: '#fff',
                          border: `1px solid ${HAIRLINE}`,
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 700,
                          color: INK,
                        }}
                      >
                        View {firstName(activity.friend_name)}'s profile
                        <ChevronRight size={16} color={INK_MUTE} strokeWidth={2.4} />
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        margin: '0 auto 16px',
                        background: AMBER_TINT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(247,147,30,0.20)',
                      }}
                    >
                      <Flag size={28} color={AMBER_DEEP} strokeWidth={2.2} />
                    </div>
                    <h3
                      style={{
                        margin: '0 0 8px',
                        fontSize: 18,
                        fontWeight: 800,
                        color: INK,
                        fontFamily: FONT_SERIF,
                      }}
                    >
                      See {firstName(activity.friend_name)}'s hole by hole
                    </h3>
                    <p
                      style={{
                        margin: '0 auto 24px',
                        fontSize: 13,
                        color: INK_MUTE,
                        lineHeight: 1.5,
                        maxWidth: 280,
                      }}
                    >
                      Invite {firstName(activity.friend_name)} to Clbhouz to unlock detailed
                      round data, head-to-head comparisons, and shared achievements.
                    </p>

                    {pendingInvite ? (
                      <>
                        <button
                          onClick={handleInvite}
                          disabled={inviteSending}
                          style={{
                            padding: '12px 24px',
                            borderRadius: 999,
                            background: '#FFFFFF',
                            border: '1px solid #F7931E',
                            color: AMBER_INK,
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: inviteSending ? 'default' : 'pointer',
                            opacity: inviteSending ? 0.6 : 1,
                          }}
                        >
                          {inviteSending
                            ? 'Preparing…'
                            : `Resend invite to ${firstName(activity.friend_name)}`}
                        </button>
                        <p
                          style={{
                            margin: '10px 0 0',
                            fontSize: 11,
                            color: 'rgba(15,23,42,0.45)',
                          }}
                        >
                          Originally sent {fmtRelative(pendingInvite.sent_at)}
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={handleInvite}
                        disabled={inviteSending}
                        style={{
                          padding: '14px 28px',
                          borderRadius: 999,
                          background: '#F7931E',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: 800,
                          cursor: inviteSending ? 'default' : 'pointer',
                          boxShadow: '0 4px 12px rgba(247,147,30,0.30)',
                          opacity: inviteSending ? 0.7 : 1,
                        }}
                      >
                        {inviteSending
                          ? 'Preparing…'
                          : `Invite ${firstName(activity.friend_name)}`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default FriendRoundSheet;
