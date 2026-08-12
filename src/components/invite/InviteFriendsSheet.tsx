/**
 * InviteFriendsSheet
 *
 * Two states, and after BRIEF_INVITE_FRIENDS_SHEET they are siblings: kicker,
 * title, a line of context, and exactly ONE filled control, which is INK.
 *
 *   - CONNECTED: the member's England Golf friends who are not yet on
 *     clbhouz, grouped by invite state (not-yet-invited first), searchable.
 *   - UNCONNECTED: a generic invite link to share.
 *
 * Amber appears only in section kickers and the quiet row Actions.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import { useInvitableFriends } from './useInvitableFriends';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvite, firstName } from '@/lib/whs/share';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import { fmtRelative } from '@/lib/whs/utils/nameFormat';
import {
  A,
  CAPTION,
  SANS,
  Action,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  LABEL as LABEL_METRICS,
  KICKER as KICKER_METRICS,
  TITLE as TITLE_METRICS,
} from '@/lib/tokens/type';

/** Canonical metrics; the sheet keeps its own ink. */
const LABEL: React.CSSProperties = { ...LABEL_METRICS, color: A.DIM };
const KICKER: React.CSSProperties = { ...KICKER_METRICS, color: A.INK };
const TITLE: React.CSSProperties = { ...TITLE_METRICS, color: A.INK };

const DOT = '\u00B7';

interface Props {
  open: boolean;
  onClose: () => void;
  source: string;
}

interface GenericInviteResp {
  ok: boolean;
  share_url?: string;
  share_message?: string;
  code?: string;
}

async function createGenericInvite(source: string): Promise<GenericInviteResp | null> {
  try {
    const { data, error } = await (supabase.rpc as unknown as (
      name: string,
      params: { p_source: string },
    ) => Promise<{ data: unknown; error: { message: string } | null }>)('create_generic_invite', {
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
  const { t } = useTranslation('common');
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const { data: whs, isLoading: whsLoading } = useWhsConnection(userId);
  const connected = !!whs;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      ariaLabelledBy="invite-friends-title"
      // Stacks OVER the profile sheet, which sits at 9998/9999.
      zIndexBase={10000}
      maxHeight="90dvh"
      style={{
        height: '75dvh',
        maxHeight: '90dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {whsLoading ? (
        <div style={{ fontFamily: SANS, padding: '4px 20px 24px' }}>
          <InviteHeader />
          <div style={{ ...CAPTION, padding: '24px 0', textAlign: 'center' }}>
            {t('invite.loading')}
          </div>
        </div>
      ) : connected && userId ? (
        <ConnectedState source={source} ownerUserId={userId} />
      ) : (
        <UnconnectedState source={source} />
      )}
    </BottomSheet>
  );
}

/** Kicker + title. Shared by both states so they stay siblings. */
function InviteHeader({ sub }: { sub?: string | null }) {
  const { t } = useTranslation('common');
  return (
    <>
      <div style={KICKER}>{t('invite.kicker')}</div>
      <h2
        id="invite-friends-title"
        style={{
          margin: '4px 0 0',
          ...TITLE,
        }}
      >
        {t('invite.title')}
      </h2>
      {sub ? <div style={{ ...LABEL, marginTop: 5 }}>{sub}</div> : null}
    </>
  );
}

/* ---------------- State A: WHS connected ---------------- */

function ConnectedState({ ownerUserId, source }: { ownerUserId: string; source: string }) {
  const { t } = useTranslation('common');
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 200);
  // BRIEF_CIRCLE_INVITE_ENTRY: the list derivation lives in one shared hook so
  // this sheet and the Circle entry cannot disagree. Behaviour here is
  // unchanged - same filter, same sort, same grouping.
  const { invitable, alreadyFor, invitedTotal } = useInvitableFriends(ownerUserId);

  // Filter on the DISPLAY name, not the raw feed name.
  const filtered = useMemo(() => {
    const needle = debouncedQ.trim().toLowerCase();
    if (!needle) return invitable;
    return invitable.filter((f) => displayName(f.friend_name).toLowerCase().includes(needle));
  }, [invitable, debouncedQ]);

  // Grouping is applied AFTER the existing within-group sort, which is
  // preserved by filtering in order.
  const pending = useMemo(() => filtered.filter((f) => !alreadyFor(f)), [filtered, alreadyFor]);
  const invited = useMemo(() => filtered.filter((f) => !!alreadyFor(f)), [filtered, alreadyFor]);


  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    analyticsEvents.track('invite_sheet_viewed', {
      source,
      connected: true,
      friends: invitable.length,
      invited: invitedTotal,
    });
  }, [source, invitable.length, invitedTotal]);

  useEffect(() => {
    const query = debouncedQ.trim();
    if (query.length === 0) return;
    analyticsEvents.track('invite_searched', {
      query_length: query.length,
      results: filtered.length,
    });
    // Debounced value only, and never the query text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const hasList = invitable.length > 0;
  const isSearching = debouncedQ.trim().length > 0;

  return (
    <div style={{ fontFamily: SANS, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Pinned header */}
      <div style={{ padding: '4px 20px 12px', flexShrink: 0 }}>
        <InviteHeader
          sub={
            hasList
              ? t('invite.sub', { count: invitable.length, invited: invitedTotal })
              : null
          }
        />
        <div style={{ marginTop: 12 }}>
          <ShareLinkButton source={source} />
        </div>
        {hasList && (
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: '#FFFFFF',
              border: `0.5px solid ${A.BORDER}`,
              borderRadius: 18,
              padding: '8px 13px',
            }}
          >
            <Search size={13} color={A.DIM} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('invite.searchPlaceholder')}
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontFamily: SANS,
                color: A.INK,
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Scroller. overscrollBehavior: contain stops scroll chaining into the
          profile sheet behind. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          padding: '0 0 12px',
        }}
      >
        {!hasList ? (
          <div style={{ ...CAPTION, padding: '20px 24px', textAlign: 'center' }}>
            {t('invite.emptyFriends')}
          </div>
        ) : pending.length === 0 && invited.length === 0 ? (
          <div style={{ ...CAPTION, padding: '20px 24px', textAlign: 'center' }}>
            {isSearching ? t('invite.noMatch') : t('invite.emptyFriends')}
          </div>
        ) : (
          <>
            <FriendGroup
              label={t('invite.groupPending')}
              rows={pending}
              alreadyFor={alreadyFor}
              source={source}
            />
            <FriendGroup
              label={t('invite.groupInvited')}
              rows={invited}
              alreadyFor={alreadyFor}
              source={source}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** A group renders nothing at all, header included, when it has no members. */
function FriendGroup({
  label,
  rows,
  alreadyFor,
  source,
}: {
  label: string;
  rows: FriendLeaderboardEntry[];
  alreadyFor: (f: FriendLeaderboardEntry) => { created_at: string } | undefined;
  source: string;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          padding: '14px 20px 8px',
        }}
      >
        <span style={KICKER}>{label}</span>
        <span style={{ ...LABEL, fontVariantNumeric: 'tabular-nums lining' }}>{rows.length}</span>
      </div>
      {/* BRIEF_INVITE_SHEET_SURFACE: no fill here. The rows sit on the sheet's
          own canvas; the hairline above separates them from the header, and
          each row after the first carries its own hairline. */}
      <div style={{ borderTop: `0.5px solid ${A.BORDER}` }}>
        {rows.map((f, i) => (
          <EGFriendRow
            key={String(f.friend_passport_id)}
            friend={f}
            already={alreadyFor(f)}
            source={source}
            divider={i > 0}
          />
        ))}
      </div>
    </>
  );
}

/** The single filled control on the connected state, and it is INK. */
function ShareLinkButton({ source }: { source: string }) {
  const { t } = useTranslation('common');
  const [busy, setBusy] = useState(false);
  const handleClick = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await createGenericInvite(source);
      if (!res?.ok || !res.share_url) {
        toast.error(t('invite.toast.createFailed'));
        return;
      }
      analyticsEvents.track('invite_sent', { source, kind: 'generic', is_reshare: false });
      await shareInvite({
        share_url: res.share_url,
        share_message: res.share_message ?? res.share_url,
        invitee_name: 'a friend',
      });
    } finally {
      setBusy(false);
    }
  }, [busy, source, t]);

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        height: 44,
        background: A.INK,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 12,
        fontSize: 13.5,
        fontWeight: 700,
        fontFamily: SANS,
        cursor: busy ? 'default' : 'pointer',
      }}
    >
      {t('invite.shareLink')}
    </button>
  );
}

function EGFriendRow({
  friend,
  already,
  source,
  divider = false,
}: {
  friend: FriendLeaderboardEntry;
  already?: { created_at: string };
  source: string;
  divider?: boolean;
}) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const avatarSrc = pickAvatarSrc(friend.friend_thumbnail_url, friend.friend_profile_photo_url);

  // Compute the display name ONCE and derive the initials from it. The feed
  // supplies surname-first, so passing the raw name to getInitialsFromName
  // produced "GM" for "Matthew Grice".
  const shown = displayName(friend.friend_name);

  const club = friend.last_round_course_name ?? null;
  const hcp = friend.friend_handicap_index;
  // An invited friend keeps their golf: the meta line always shows club and
  // handicap. The invite state sits beneath the action instead.
  const sub =
    club && hcp != null
      ? `${club} ${DOT} ${fmtHcp(hcp)}`
      : club
      ? club
      : hcp != null
      ? fmtHcp(hcp)
      : '';

  const onInvite = useCallback(async () => {
    if (friend.friend_passport_id == null) {
      toast.error(t('invite.toast.missingId'));
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await callCreateInvite(friend.friend_passport_id, 'copy_link');
      if (!res.ok || !res.share_url) {
        toast.error(res.message ?? t('invite.toast.createFailed'));
        return;
      }
      analyticsEvents.track('invite_sent', {
        source,
        kind: 'friend',
        is_reshare: !!already,
      });
      queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
      await shareInvite({
        share_url: res.share_url,
        share_message: res.share_message ?? '',
        invitee_name: res.invitee_name ?? friend.friend_name,
      });
    } finally {
      setBusy(false);
    }
  }, [busy, friend, queryClient, t, source, already]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        ...(divider ? { borderTop: `0.5px solid ${A.BORDER}` } : null),
      }}
    >
      {avatarSrc ? (
        <div style={{ position: 'relative', width: 34, height: 34, flex: '0 0 34px' }}>
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
            flex: '0 0 34px',
            borderRadius: '34%',
            background: getAvatarFallbackColor(
              friend.friend_user_id ?? friend.friend_row_id ?? friend.friend_name,
            ),
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {getInitialsFromName(shown) || '?'}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: A.INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {shown}
        </div>
        {sub ? (
          <div
            style={{
              ...LABEL,
              color: A.MUTE,
              marginTop: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {/* The shared quiet Action's shape, inline so it can carry the
            per-friend aria-label. Never a filled or outlined pill. */}
        <button
          type="button"
          onClick={onInvite}
          disabled={busy}
          aria-label={t('invite.inviteAria', { name: firstName(friend.friend_name) })}
          style={{
            minHeight: 32,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            padding: 0,
            marginLeft: 'auto',
            fontFamily: SANS,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
        >
          <span style={{ ...LABEL, color: A.INK }}>
            {already ? t('invite.reshare') : t('invite.invite')}
          </span>
          <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
            {'\u203A'}
          </span>
        </button>
        {already && (
          <div style={{ ...LABEL, marginTop: 2 }}>
            {t('invite.invitedAgo', { ago: fmtRelative(already.created_at, { compact: true }) })}
          </div>
        )}
      </div>

    </div>
  );
}

/* ---------------- State B: no WHS ---------------- */

function UnconnectedState({ source }: { source: string }) {
  const { t } = useTranslation('common');
  const [link, setLink] = useState<{ url: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const viewedRef = useRef(false);
  useEffect(() => {
    if (loading || viewedRef.current) return;
    viewedRef.current = true;
    analyticsEvents.track('invite_sheet_viewed', {
      source,
      connected: false,
      friends: 0,
      invited: 0,
    });
  }, [loading, source]);

  const onCopy = useCallback(async () => {
    // Re-create + copy so send is logged each time.
    const res = await createGenericInvite(source);
    const url = res?.share_url ?? link?.url;
    if (!url) {
      toast.error(t('invite.toast.createFailed'));
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      analyticsEvents.track('invite_sent', { source, kind: 'generic', is_reshare: false });
      toast.success(t('invite.toast.linkCopied'));
    } catch {
      toast.error(t('invite.toast.copyFailed'));
    }
  }, [source, link, t]);

  const onShare = useCallback(async () => {
    const res = await createGenericInvite(source);
    const url = res?.share_url ?? link?.url;
    const message = res?.share_message ?? link?.message ?? url ?? '';
    if (!url) {
      toast.error(t('invite.toast.createFailed'));
      return;
    }
    analyticsEvents.track('invite_sent', { source, kind: 'generic', is_reshare: false });
    await shareInvite({ share_url: url, share_message: message, invitee_name: 'a friend' });
  }, [source, link, t]);

  return (
    <div style={{ fontFamily: SANS, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ padding: '4px 20px 12px', flexShrink: 0 }}>
        <div style={KICKER}>{t('invite.kicker')}</div>
        <h2
          id="invite-friends-title"
          style={{
            margin: '4px 0 0',
            ...TITLE,
          }}
        >
          {t('invite.unconnected.title')}
        </h2>
        <div style={{ ...CAPTION, marginTop: 6 }}>{t('invite.unconnected.body')}</div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          padding: '0 20px 16px',
        }}
      >
        {loading ? (
          <div style={{ ...CAPTION, padding: '8px 0 14px' }}>
            {t('invite.unconnected.preparing')}
          </div>
        ) : link?.url ? (
          // Absent values render nothing: with no link there is no row at all.
          <div style={{ padding: '4px 0 14px' }}>
            <div
              style={{
                fontFamily: SANS,
                fontVariantNumeric: 'tabular-nums lining',
                fontSize: 12.5,
                color: A.MUTE,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {link.url}
            </div>
            <Action
              label={t('invite.unconnected.copy')}
              onClick={onCopy}
              align="left"
              style={{ marginTop: 4 }}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={onShare}
          disabled={loading || !link}
          style={{
            width: '100%',
            height: 44,
            background: A.INK,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 700,
            fontFamily: SANS,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading || !link ? 0.5 : 1,
          }}
        >
          {t('invite.unconnected.share')}
        </button>
      </div>
    </div>
  );
}

export default InviteFriendsSheet;
