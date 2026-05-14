import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { callCreateInvite } from '@/lib/whs/api';
import { sendWhsConnectionNudge, hasRecentlyNudged } from '@/lib/whs/nudge';
import { firstNameOf, type HeroState } from './deriveHeroState';

const RIGHT_PILL_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 13px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
  backdropFilter: 'blur(30px) saturate(180%)',
};

const HINT: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.65)',
  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
};

const PassivePill: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      ...RIGHT_PILL_BASE,
      background: 'rgba(255,255,255,0.10)',
      border: '0.5px solid rgba(255,255,255,0.25)',
      color: '#FFFFFF',
      pointerEvents: 'none',
    }}
  >
    {label} <span style={{ opacity: 0.7 }}>{'\u203A'}</span>
  </span>
);

const InviteAction: React.FC<{ friend: FriendYesterday }> = ({ friend }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fname = firstNameOf(friend.name);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sending || sent) return;
    if (friend.friend_passport_id === null) {
      toast.error("Can't invite without an England Golf member ID");
      return;
    }
    setSending(true);
    const res = await callCreateInvite(friend.friend_passport_id, 'best_of_group_card');
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Invite sent to ${fname}`);
    } else {
      toast.error(res.message || 'Could not send invite');
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={sending || sent}
      style={{
        ...RIGHT_PILL_BASE,
        background: 'rgba(247,147,30,0.22)',
        border: '0.5px solid rgba(247,147,30,0.55)',
        color: '#FED7AA',
        cursor: sending || sent ? 'default' : 'pointer',
        opacity: sending ? 0.7 : 1,
      }}
    >
      {sent ? 'INVITED \u2713' : `INVITE ${fname.toUpperCase()} \u203A`}
    </button>
  );
};

const NudgeAction: React.FC<{ friend: FriendYesterday }> = ({ friend }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fname = firstNameOf(friend.name);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!friend.user_id) return;
      const recent = await hasRecentlyNudged(friend.user_id);
      if (!cancelled && recent) setSent(true);
    })();
    return () => { cancelled = true; };
  }, [friend.user_id]);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sending || sent) return;
    if (!friend.user_id) {
      toast.error("Can't send a nudge without a clbhouz user ID");
      return;
    }
    setSending(true);
    const res = await sendWhsConnectionNudge(friend.user_id);
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Nudge sent to ${fname}`);
    } else if (res.reason === 'rate_limited') {
      setSent(true);
      toast.message('Already nudged in the last 7 days');
    } else {
      toast.error('Could not send nudge');
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={sending || sent}
      style={{
        ...RIGHT_PILL_BASE,
        background: 'rgba(34,197,94,0.22)',
        border: '0.5px solid rgba(34,197,94,0.55)',
        color: '#86EFAC',
        cursor: sending || sent ? 'default' : 'pointer',
        opacity: sending ? 0.7 : 1,
      }}
    >
      {sent ? 'NUDGED \u2713' : `NUDGE ${fname.toUpperCase()} \u203A`}
    </button>
  );
};
  state: HeroState;
  friend: FriendYesterday;
}

export const HeroBottomActions: React.FC<Props> = ({ state, friend }) => {
  const isAction = state === 'invite' || state === 'nudge';
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        right: 14,
        zIndex: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isAction ? 'center' : 'flex-end',
        pointerEvents: isAction ? 'auto' : 'none',
      }}
    >
      {state === 'enriched' && <PassivePill label="SCORECARD" />}
      {state === 'syncing' && <PassivePill label={'VIEW \u00B7 SYNCING'} />}
      {state === 'invite' && <InviteAction friend={friend} />}
      {state === 'nudge' && <NudgeAction friend={friend} />}
    </div>
  );
};

export default HeroBottomActions;
