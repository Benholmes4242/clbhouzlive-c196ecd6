import React, { useCallback, useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import { UserPlus, Copy, Share2, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useFriendLeaderboard, useSentInvites, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite, firstName } from '@/lib/whs/share';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';

interface Props {
  open: boolean;
  onClose: () => void;
  source: string;
}

const FONT = '"Geist", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK = '#0F172A';
const INK_MUTE = '#94A3B8';
const INK_SOFT = '#475569';
const AMBER = '#F7931E';
const AMBER_BG = '#FFF7EC';
const SURFACE = '#F8FAFC';
const HAIRLINE = 'rgba(15,23,42,0.08)';

interface GenericInviteResp {
  ok: boolean;
  share_url?: string;
  share_message?: string;
  code?: string;
}

async function createGenericInvite(source: string): Promise<GenericInviteResp | null> {
  try {
    const { data, error } = await supabase.rpc('create_generic_invite' as any, {
      p_source: source,
    });
    if (error) {
      console.error('[InviteFriendsSheet] create_generic_invite error', error);
      return null;
    }
    return (data as GenericInviteResp) ?? null;
  } catch (e) {
    console.error('[InviteFriendsSheet] create_generic_invite threw', e);
    return null;
  }
}

export function InviteFriendsSheet({ open, onClose, source }: Props) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { data: whs, isLoading: whsLoading } = useWhsConnection(userId);
  const connected = !!whs;

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" ariaLabelledBy="invite-friends-title">
      <div
        style={{
          padding: '4px 16px 24px',
          fontFamily: FONT,
          background: SURFACE,
          maxHeight: '84vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '4px 4px 14px' }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: AMBER,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            invite friends
          </div>
          <h2
            id="invite-friends-title"
            style={{
              margin: '4px 0 0',
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              letterSpacing: '-0.005em',
            }}
          >
            Golf's better with your circle
          </h2>
        </div>

        {whsLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: INK_MUTE, fontSize: 12 }}>
            loading…
          </div>
        ) : connected && userId ? (
          <ConnectedState source={source} ownerUserId={userId} />
        ) : (
          <UnconnectedState source={source} />
        )}
      </div>
    </BottomSheet>
  );
}

/* ────────────────── State A: WHS connected ────────────────── */

function ConnectedState({ ownerUserId, source }: { ownerUserId: string; source: string }) {
  const { data: friends } = useFriendLeaderboard(ownerUserId);
  const { data: sent } = useSentInvites();

  const invitable = useMemo(
    () =>
      (friends ?? [])
        .filter((f) => !f.is_clbhouz_user && f.friend_passport_id != null)
        .sort((a, b) => {
          const aT = a.last_round_played_at ? new Date(a.last_round_played_at).getTime() : -Infinity;
          const bT = b.last_round_played_at ? new Date(b.last_round_played_at).getTime() : -Infinity;
          if (aT !== bT) return bT - aT;
          return (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99);
        }),
    [friends],
  );

  const sentByPassportId = useMemo(() => {
    const map = new Map<string, { created_at: string }>();
    (sent ?? []).forEach((s: any) => {
      if (s.invitee_passport_id) map.set(String(s.invitee_passport_id), { created_at: s.created_at });
    });
    return map;
  }, [sent]);

  return (
    <>
      <InviteAnyoneRow source={source} />

      <div
        style={{
          padding: '18px 4px 10px',
          fontSize: 10.5,
          fontWeight: 500,
          color: INK_MUTE,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        your england golf friends
      </div>

      {invitable.length === 0 ? (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            color: INK_MUTE,
            fontSize: 12,
            background: '#FFFFFF',
            border: `0.5px solid ${HAIRLINE}`,
            borderRadius: 14,
          }}
        >
          No England Golf friends to invite right now.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invitable.map((f) => {
            const already = f.friend_passport_id != null
              ? sentByPassportId.get(String(f.friend_passport_id))
              : undefined;
            return <EGFriendRow key={String(f.friend_passport_id)} friend={f} already={already} />;
          })}
        </div>
      )}
    </>
  );
}

function InviteAnyoneRow({ source }: { source: string }) {
  const [busy, setBusy] = useState(false);
  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await createGenericInvite(source);
      if (!res?.ok || !res.share_url) {
        toast.error("Couldn't create invite link");
        return;
      }
      await shareInvite({
        share_url: res.share_url,
        share_message: res.share_message ?? res.share_url,
        invitee_name: 'a friend',
      });
    } finally {
      setBusy(false);
    }
  }, [busy, source]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: AMBER_BG,
        border: `0.5px solid ${AMBER}`,
        borderRadius: 14,
        padding: '12px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 13,
          background: AMBER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Share2 size={17} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>Invite anyone</div>
        <div style={{ fontSize: 11, color: INK_SOFT, marginTop: 1 }}>Share your clbhouz link</div>
      </div>
    </button>
  );
}

function EGFriendRow({
  friend,
  already,
}: {
  friend: any;
  already?: { created_at: string };
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);

  const club = friend.last_round_course_name ?? null;
  const hcp = friend.friend_handicap_index;
  const sub =
    club && hcp != null
      ? `${club} · ${fmtHcp(hcp)}`
      : club
      ? club
      : hcp != null
      ? fmtHcp(hcp)
      : '';

  const alreadySub = already
    ? `Invited ${fmtRelative(already.created_at, { compact: true })}`
    : null;

  const onInvite = useCallback(async () => {
    if (busy || friend.friend_passport_id == null) return;
    setBusy(true);
    try {
      const res = await callCreateInvite(friend.friend_passport_id, 'invite_sheet');
      if (!res.ok || !res.share_url) {
        toast.error(res.message ?? "Couldn't create invite");
        return;
      }
      queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
      await shareInvite({
        share_url: res.share_url,
        share_message: res.share_message ?? '',
        invitee_name: res.invitee_name ?? friend.friend_name,
      });
    } finally {
      setBusy(false);
    }
  }, [busy, friend, queryClient]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#FFFFFF',
        border: `0.5px solid ${HAIRLINE}`,
        borderRadius: 14,
        padding: '10px 12px',
      }}
    >
      {avatarSrc ? (
        <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '34%',
              overflow: 'hidden',
              background: '#F1F5F9',
            }}
          >
            <img
              src={avatarSrc}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '34%',
              border: '1px solid rgba(15,23,42,0.10)',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '34%',
            background: getAvatarFallbackColor(
              friend.friend_user_id ?? friend.friend_row_id ?? friend.friend_name,
            ),
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getInitialsFromName(friend.friend_name) || '?'}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayName(friend.friend_name)}
        </div>
        <div
          style={{
            fontSize: 11,
            color: INK_MUTE,
            marginTop: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {alreadySub ?? sub}
        </div>
      </div>

      <button
        type="button"
        onClick={onInvite}
        disabled={busy}
        aria-label={`Invite ${firstName(friend.friend_name)}`}
        style={{
          flexShrink: 0,
          padding: '7px 14px',
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: busy ? 'default' : 'pointer',
          background: already ? 'transparent' : AMBER,
          color: already ? AMBER : '#fff',
          border: already ? `1px solid ${AMBER}` : 'none',
        }}
      >
        {already ? 'Re-share' : 'Invite'}
      </button>
    </div>
  );
}

/* ────────────────── State B: no WHS ────────────────── */

function UnconnectedState({ source }: { source: string }) {
  const [link, setLink] = useState<{ url: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    createGenericInvite(source).then((res) => {
      if (cancelled) return;
      if (res?.ok && res.share_url) {
        setLink({ url: res.share_url, message: res.share_message ?? res.share_url });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const onCopy = useCallback(async () => {
    // Re-create + copy so send is logged each time.
    const res = await createGenericInvite(source);
    const url = res?.share_url ?? link?.url;
    if (!url) {
      toast.error("Couldn't create link");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy link");
    }
  }, [source, link]);

  const onShare = useCallback(async () => {
    const res = await createGenericInvite(source);
    const url = res?.share_url ?? link?.url;
    const message = res?.share_message ?? link?.message ?? url ?? '';
    if (!url) {
      toast.error("Couldn't create link");
      return;
    }
    await shareInvite({ share_url: url, share_message: message, invitee_name: 'a friend' });
  }, [source, link]);

  return (
    <div style={{ padding: '8px 4px 4px', textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 19,
          background: AMBER_BG,
          border: `0.5px solid ${AMBER}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <UserPlus size={24} color={AMBER} strokeWidth={2} />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: INK,
          marginBottom: 6,
        }}
      >
        Bring your fourball
      </div>
      <div
        style={{
          fontSize: 12,
          color: INK_SOFT,
          maxWidth: 300,
          margin: '0 auto 18px',
          lineHeight: 1.45,
        }}
      >
        Send your personal link — they download the app and you're connected from day one.
      </div>

      {/* Link row */}
      <button
        type="button"
        onClick={onCopy}
        disabled={loading || !link}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: SURFACE,
          border: `0.5px solid ${HAIRLINE}`,
          borderRadius: 999,
          padding: '9px 14px',
          cursor: loading ? 'default' : 'pointer',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: 'left',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 11,
            color: INK_SOFT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {loading ? 'preparing link…' : link?.url ?? '—'}
        </span>
        <Copy size={14} color={AMBER} />
      </button>

      {/* Share CTA */}
      <button
        type="button"
        onClick={onShare}
        disabled={loading || !link}
        style={{
          width: '100%',
          background: AMBER,
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '13px 16px',
          fontSize: 13.5,
          fontWeight: 700,
          fontFamily: FONT,
          cursor: loading ? 'default' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 14px rgba(247,147,30,0.28)',
        }}
      >
        <Send size={15} strokeWidth={2.2} />
        Share invite
      </button>
    </div>
  );
}

export default InviteFriendsSheet;
