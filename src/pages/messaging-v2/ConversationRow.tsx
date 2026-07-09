import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, BadgeCheck } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import type { InboxConversation, InboxParticipant } from '@/types/messaging';

const INK = '#1A1D21';
const SUB = '#8A9099';
const HINT = '#AEB4BC';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(0,0,0,0.07)';

interface Props {
  conversation: InboxConversation;
}

interface Identity {
  name: string;
  avatarUrl: string | null;
  userId: string;
  verified: boolean;
}

function resolveIdentity(
  c: InboxConversation,
  selfActorType: string | null,
  selfActorId: string | null,
): Identity {
  if (c.type === 'group') {
    return {
      name: c.title ?? 'Group',
      avatarUrl: c.avatar_url,
      userId: c.conversation_id,
      verified: false,
    };
  }
  const others = c.participants.filter(
    (p) => !(p.actor_type === selfActorType && p.actor_id === selfActorId),
  );
  const p: InboxParticipant | undefined = others[0] ?? c.participants[0];
  return {
    name: p?.name ?? p?.username ?? 'Unknown',
    avatarUrl: p?.avatar_url ?? null,
    userId: p?.actor_id ?? c.conversation_id,
    verified: !!p?.verified,
  };
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYest =
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate();
  if (isYest) return 'Yesterday';
  const withinWeek = now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (withinWeek) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  return `${day} ${month}`;
}

export const ConversationRow: React.FC<Props> = ({ conversation }) => {
  const navigate = useNavigate();
  const actor = useMessagingActor();
  const identity = resolveIdentity(
    conversation,
    actor?.actorType ?? null,
    actor?.actorId ?? null,
  );

  const unread = conversation.unread_count > 0;
  const time = formatRelative(conversation.last_message_at);

  return (
    <button
      type="button"
      onClick={() => navigate(`/messages-v2/${conversation.conversation_id}`)}
      className="w-full text-left flex items-center gap-3 active:opacity-70 transition-opacity"
      style={{
        padding: '10px 16px',
        minHeight: 72,
        borderBottom: `1px solid ${HAIRLINE}`,
        background: '#FFFFFF',
      }}
    >
      <SquircleAvatar
        src={identity.avatarUrl}
        userId={identity.userId}
        alt={identity.name}
        size={52}
      />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate"
            style={{
              color: INK,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: '20px',
              flex: 1,
              minWidth: 0,
            }}
          >
            {identity.name}
          </span>
          {identity.verified ? (
            <BadgeCheck size={14} style={{ color: AMBER, flexShrink: 0 }} />
          ) : null}
          <span
            style={{
              color: HINT,
              fontSize: 12,
              lineHeight: '16px',
              flexShrink: 0,
              marginLeft: 4,
            }}
          >
            {time}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="truncate"
            style={{
              color: SUB,
              fontSize: 14,
              lineHeight: '18px',
              flex: 1,
              minWidth: 0,
              fontWeight: unread ? 500 : 400,
            }}
          >
            {conversation.last_message_preview ?? ''}
          </span>
          {conversation.is_muted ? (
            <BellOff size={14} style={{ color: HINT, flexShrink: 0 }} />
          ) : null}
          {unread ? (
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                background: AMBER,
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                flexShrink: 0,
                lineHeight: '20px',
              }}
            >
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
};

export default ConversationRow;
