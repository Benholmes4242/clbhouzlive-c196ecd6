/**
 * InviteFriendsSheet
 *
 * IF1 connected header, figures and rows live in ConnectedInviteState.
 * Unconnected presentation and BottomSheet lifecycle remain unchanged.
 *
 *   - CONNECTED: the member's England Golf friends who are not yet on
 *     clbhouz, grouped by invite state (not-yet-invited first), searchable.
 *   - UNCONNECTED: a generic invite link to share.
 *
 * No amber in the connected sheet; unconnected styling is frozen for IF2.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useWhsConnection } from '@/lib/whs/hooks';
import { ConnectedInviteState } from './ConnectedInviteState';
import { shareInvite } from '@/lib/whs/share';
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
/* Local floor overrides: LABEL to 11, KICKER to 11. Shared metrics untouched. */
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
      ariaLabelledBy="invite-friends-title"
      // Stacks OVER the profile sheet, which sits at 9998/9999.
      zIndexBase={10000}
      maxHeight="85dvh"
      style={{
        height: 'auto',
        maxHeight: '85dvh',
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
        <ConnectedInviteState source={source} ownerUserId={userId} createGeneric={createGenericInvite} />
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
                fontVariantNumeric: 'tabular-nums lining-nums',
                fontSize: 13,
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
            color: A.CANVAS,
            border: 'none',
            borderRadius: 12,
            /* CAPS BUTTON: two points down, caps at 0.10em, height unchanged. */
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
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
