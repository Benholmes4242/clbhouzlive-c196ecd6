/**
 * CircleInviteAction — the Circle tab's invite entry.
 *
 * BRIEF_CIRCLE_INVITE_ENTRY: the entry no longer states what has been done and
 * no longer carries a slogan. It states WHAT IS LEFT — the count of England
 * Golf friends not on clbhouz — names three of them, and invites each one
 * directly with the same callCreateInvite + shareInvite path the canonical
 * sheet's rows use. One tap, not two.
 *
 * ONE COUNT: both figures come from useInvitableFriends, the same hook
 * InviteFriendsSheet reads, so the entry and the sheet cannot diverge when an
 * invitee JOINS clbhouz and leaves the invitable set.
 *
 * TWO SILENT STATES:
 *   - zero invitable friends -> the section renders NOTHING. A section
 *     announcing its own irrelevance is worse than an absent one.
 *   - no WHS connection -> heading and the share-a-link row only; there is no
 *     friend list to draw rows from, matching the sheet's UNCONNECTED state.
 */
import React, { useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { useInvitableFriends } from '@/components/invite/useInvitableFriends';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite } from '@/lib/whs/share';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import { fmtHcp } from '@/lib/whs/format';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { DARK_ROW_TITLE } from '../_shared/darkAtoms';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DOT = '\u00B7';
const SOURCE = 'handicap_circle';

/** Dark type scale, this file only. Nothing here at weight 800. */
const KICKER: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: 'var(--hcp-t-60)',
};
const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 7.5,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--hcp-t-60)',
};

interface Props {
  ownerUserId?: string;
}

export const CircleInviteAction: React.FC<Props> = ({ ownerUserId }) => {
  const { t } = useTranslation('common');
  const { openInviteSheet } = useInviteSheet();
  const { data: whs } = useWhsConnection(ownerUserId);
  const connected = !!whs;
  const { invitable, pending, invited, invitedTotal } = useInvitableFriends(
    connected ? ownerUserId : undefined,
  );

  // Zero invitable friends on a connected account: nothing to say.
  if (connected && invitable.length === 0) return null;

  // pending first, then invited — the sheet's own order.
  const rows = [...pending, ...invited].slice(0, 3);

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
      <div style={{ padding: '0 16px' }}>
        <div style={KICKER}>{t('handicap.circle.invite.kicker')}</div>
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: FONT,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              color: 'var(--hcp-t-100)',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {connected
              ? t('handicap.circle.invite.notOnClbhouz', { count: invitable.length })
              : t('handicap.circle.invite.headingUnconnected')}
          </h3>
          {connected && (
            <span style={{ ...LABEL, fontVariantNumeric: 'tabular-nums lining-nums', flexShrink: 0 }}>
              {t('handicap.circle.invite.invitedCount', { count: invitedTotal })}
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {rows.map((f, i) => (
              <InviteRow
                key={String(f.friend_passport_id)}
                friend={f}
                alreadySent={invited.includes(f)}
                divider={i > 0}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => openInviteSheet(SOURCE)}
          style={{
            width: '100%',
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '11px 13px',
            background: 'var(--hcp-bg-2)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 11,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: FONT,
          }}
        >
          <span style={{ ...DARK_ROW_TITLE }}>
            {connected
              ? t('handicap.circle.invite.seeAll', { count: invitable.length })
              : t('handicap.circle.invite.shareLinkRow')}
          </span>
          <ChevronRight size={14} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
        </button>
      </div>
    </section>
  );
};

/**
 * THE STATE IS THE ACTION. An invited friend keeps their row and loses the
 * verb — it shows the member their invite landed and stops a second one.
 */
const InviteRow: React.FC<{
  friend: FriendLeaderboardEntry;
  alreadySent: boolean;
  divider: boolean;
}> = ({ friend, alreadySent, divider }) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const shown = displayName(friend.friend_name);
  const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);
  const hcp = friend.friend_handicap_index;
  const played = friend.last_round_played_at
    ? fmtRelative(friend.last_round_played_at, { compact: true })
    : null;
  const sub =
    played && hcp != null
      ? `${played} ${DOT} ${t('handicap.circle.invite.hcpValue', { value: fmtHcp(hcp) })}`
      : played
      ? played
      : hcp != null
      ? t('handicap.circle.invite.hcpValue', { value: fmtHcp(hcp) })
      : '';

  const onInvite = useCallback(async () => {
    if (busy || alreadySent) return;
    if (friend.friend_passport_id == null) {
      toast.error(t('invite.toast.missingId'));
      return;
    }
    setBusy(true);
    try {
      const res = await callCreateInvite(friend.friend_passport_id, 'copy_link');
      if (!res.ok || !res.share_url) {
        toast.error(res.message ?? t('invite.toast.createFailed'));
        return;
      }
      analyticsEvents.track('invite_sent', { source: SOURCE, kind: 'friend', is_reshare: false });
      queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
      await shareInvite({
        share_url: res.share_url,
        share_message: res.share_message ?? '',
        invitee_name: res.invitee_name ?? friend.friend_name,
      });
    } finally {
      setBusy(false);
    }
  }, [alreadySent, busy, friend, queryClient, t]);

  const body = (
    <>
      {avatarSrc ? (
        <div style={{ position: 'relative', width: 34, height: 34, flex: '0 0 34px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 11, overflow: 'hidden', background: 'var(--hcp-bg-2)' }}>
            <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 11,
              border: '1px solid rgba(255,255,255,0.22)',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: 34,
            height: 34,
            flex: '0 0 34px',
            borderRadius: 11,
            background: getAvatarFallbackColor(
              friend.friend_user_id ?? friend.friend_row_id ?? friend.friend_name,
            ),
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getInitialsFromName(shown) || '?'}
        </div>
      )}

      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>{shown}</span>
        {sub ? <span style={{ ...LABEL, fontSize: 7 }}>{sub}</span> : null}
      </span>

      {alreadySent ? (
        <span style={{ ...LABEL, fontSize: 8, color: 'var(--hcp-t-60)', flexShrink: 0 }}>
          {t('handicap.circle.invite.invited')}
        </span>
      ) : (
        <span
          style={{
            ...LABEL,
            fontSize: 8,
            color: 'var(--hcp-t-100)',
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {t('handicap.circle.invite.invite')}
          <ChevronRight size={10} strokeWidth={2.4} />
        </span>
      )}
    </>
  );

  const style: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    fontFamily: FONT,
    textAlign: 'left',
    background: 'none',
    // Longhand only: mixing `border` with a conditional `borderTop` made React
    // warn about shorthand/non-shorthand conflicts on every rerender.
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderTop: divider ? '1px solid var(--hcp-line)' : 'none',

  };

  if (alreadySent) return <div style={style}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onInvite}
      aria-label={t('invite.inviteAria', { name: shown })}
      style={{ ...style, cursor: busy ? 'default' : 'pointer' }}
    >
      {body}
    </button>
  );
};

export default CircleInviteAction;
