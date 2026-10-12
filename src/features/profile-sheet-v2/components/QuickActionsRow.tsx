/**
 * ProfileSheetV2 · QuickActionsRow — "Waiting for you" (BRIEF_SHEET_TOP_V5 G.3/G.4).
 *
 * Sources (unchanged, so nothing can drift from the destination pages):
 *   Messages — useConversations (the inbox RPC); unread = per-conversation unread_count.
 *   Notifications — useUnreadNotifications (a number and nothing else).
 *
 * A full row exists only because something is unread, so there are no unread
 * dots. Message row = newest unread conversation, taps to the THREAD. Notifications
 * row = count plus a fixed line; no preview (we cannot source one without a
 * new request, which is deliberately not made). With nothing waiting the block
 * is one compact pair of plain doors; with one thing waiting, the other is a
 * single plain door beneath it. Height follows what is actually waiting.
 *
 * Not a card: full-width rows with hairlines, so it never reads as a third
 * analytics card.
 */

import React from 'react';
import { Mail, Bell } from 'lucide-react';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatStamp } from '@/pages/messaging-v2/ConversationRow';
import type { InboxConversation } from '@/types/messaging';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CARD_LABEL } from './sheetCardParts';

interface Props {
  gutter: number;
  actorType: 'personal' | 'business';
  actorId: string;
  onNavigate: (route: string) => void;
}

/** Newest (by last_message_at) among conversations with unread_count > 0. */
export function newestUnread(rows: InboxConversation[] | undefined): InboxConversation | null {
  let best: InboxConversation | null = null;
  for (const c of rows ?? []) {
    if ((c.unread_count ?? 0) <= 0) continue;
    if (!best || new Date(c.last_message_at).getTime() > new Date(best.last_message_at).getTime()) best = c;
  }
  return best;
}

export const notificationsLabel = (n: number) => `${n} new notification${n === 1 ? '' : 's'}`;
const NOTIFICATIONS_LINE = 'Reactions and comments on your rounds';

function Row({ lead, title, when, line, onClick, testId, gutter }: {
  gutter: number; lead: React.ReactNode; title: string; when?: string; line: string; onClick: () => void; testId: string;
}) {
  return (
    <button
      type="button"
      data-wait-row={testId}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left',
        padding: `9px ${gutter}px`, background: 'transparent', border: 0, borderTop: `1px solid ${A.TRACK}`,
        cursor: 'pointer', fontFamily: SANS,
      }}
    >
      {lead}
      <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          {when ? (
            <span style={{ marginLeft: 'auto', flex: 'none', fontSize: 10.5, fontWeight: 700, color: A.DIM, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{when}</span>
          ) : null}
        </span>
        <span style={{ display: 'block', fontSize: 12.5, color: A.MUTE, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</span>
      </span>
    </button>
  );
}

function PlainDoor({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      data-plain-door={label}
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        border: `1px solid ${A.TRACK}`, borderRadius: 11, padding: '9px 10px', background: 'transparent',
        fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: A.MUTE, cursor: 'pointer',
      }}
    >
      {icon}{label}
    </button>
  );
}

export default function QuickActionsRow({ gutter, onNavigate }: Props) {
  const { conversations } = useConversations();
  const { unreadCount } = useUnreadNotifications();
  const notifications = unreadCount ?? 0;
  const msg = newestUnread(conversations);

  const toMessages = () => onNavigate('/messages');
  const toNotifications = () => onNavigate('/notificationmessages');
  const mailDoor = <PlainDoor label="Messages" icon={<Mail size={14} color={A.MUTE} />} onClick={toMessages} />;
  const bellDoor = <PlainDoor label="Notifications" icon={<Bell size={14} color={A.MUTE} />} onClick={toNotifications} />;

  if (!msg && notifications <= 0) {
    return (
      <div data-wait-quiet style={{ display: 'flex', gap: 8, padding: `0 ${gutter}px 14px` }}>
        {mailDoor}{bellDoor}
      </div>
    );
  }

  return (
    <div data-wait-block style={{ paddingBottom: 14, fontFamily: SANS }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `2px ${gutter}px 6px` }}>
        <span style={CARD_LABEL}>Waiting for you</span>
        <button
          type="button"
          onClick={toMessages}
          style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: SANS,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: A.AMBER,
          }}
        >
          Inbox <span aria-hidden>{'\u203A'}</span>
        </button>
      </div>
      <div style={{ borderBottom: `1px solid ${A.TRACK}` }}>
        {msg && (
          <Row
            testId="message"
            gutter={gutter}
            lead={<SquircleAvatar size={34} src={msg.avatar_url ?? undefined} alt={msg.title ?? ''} hairlineRing ringColor={DARK_HAIRLINE} />}
            title={msg.title ?? 'Conversation'}
            when={formatStamp(msg.last_message_at)}
            line={msg.last_message_preview ?? ''}
            onClick={() => onNavigate(`/messages/${msg.conversation_id}`)}
          />
        )}
        {notifications > 0 && (
          <Row
            testId="notifications"
            gutter={gutter}
            lead={
              <span aria-hidden style={{ width: 34, height: 34, borderRadius: 11, flex: 'none', background: A.SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={15} color={A.MUTE} />
              </span>
            }
            title={notificationsLabel(notifications)}
            line={NOTIFICATIONS_LINE}
            onClick={toNotifications}
          />
        )}
      </div>
      {(!msg || notifications <= 0) && (
        <div style={{ display: 'flex', padding: `10px ${gutter}px 0` }}>
          {!msg ? mailDoor : bellDoor}
        </div>
      )}
    </div>
  );
}
