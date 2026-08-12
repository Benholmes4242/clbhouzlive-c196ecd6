import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  BellOff,
  BadgeCheck,
  MoreHorizontal,
  Bell,
  Archive,
  ArchiveRestore,
  LogOut,
  Trash2,
} from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { supabase } from '@/integrations/supabase/client';
import type { InboxConversation, InboxParticipant } from '@/types/messaging';
import { formatWeekdayShort, formatMonthShort } from '@/i18n/format';
import { FIGURE, FIGS } from '@/lib/tokens/type';

const INK = '#1F2428';
const SUB = '#8A9099';
const HINT = '#AEB4BC';
const AMBER = '#F7931E';
const DANGER = '#DC2626';
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
    return formatWeekdayShort(d);
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = formatMonthShort(d);
  return `${day} ${month}`;
}

function farFutureIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 100);
  return d.toISOString();
}

export const ConversationRow: React.FC<Props> = ({ conversation }) => {
  const { t } = useTranslation('messaging');
  const navigate = useNavigate();
  const actor = useMessagingActor();
  const qc = useQueryClient();
  const identity = resolveIdentity(
    conversation,
    actor?.actorType ?? null,
    actor?.actorId ?? null,
  );

  const unread = conversation.unread_count > 0;
  const time = formatRelative(conversation.last_message_at);
  const previewColor = unread ? INK : SUB;
  const nameWeight = 500;
  const previewWeight = unread ? 500 : 400;
  const timeColor = unread ? AMBER : HINT;

  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isGroup = conversation.type === 'group';
  const muted = !!conversation.is_muted;
  const archived = !!conversation.is_archived;

  const invalidateInbox = useCallback(() => {
    if (!actor) return;
    qc.invalidateQueries({
      queryKey: ['messaging', 'inbox', actor.actorType, actor.actorId],
    });
    qc.invalidateQueries({ queryKey: ['messaging', 'inbox'] });
  }, [qc, actor]);

  const handleToggleMute = useCallback(async () => {
    if (!actor) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('msg_set_mute', {
        p_conversation_id: conversation.conversation_id,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_until: muted ? null : farFutureIso(),
      });
      if (error) throw error;
      invalidateInbox();
      setMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Could not update mute');
    } finally {
      setBusy(false);
    }
  }, [actor, conversation.conversation_id, muted, invalidateInbox]);

  const handleToggleArchive = useCallback(async () => {
    if (!actor) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('msg_set_archive', {
        p_conversation_id: conversation.conversation_id,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_archived: !archived,
      });
      if (error) throw error;
      invalidateInbox();
      setMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error('Could not update archive');
    } finally {
      setBusy(false);
    }
  }, [actor, conversation.conversation_id, archived, invalidateInbox]);

  const handleLeaveOrDelete = useCallback(async () => {
    if (!actor) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('msg_leave', {
        p_conversation_id: conversation.conversation_id,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
      });
      if (error) {
        toast.error(isGroup ? 'Could not leave group' : 'Could not delete conversation');
        return;
      }
      invalidateInbox();
      setMenuOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(isGroup ? 'Could not leave group' : 'Could not delete conversation');
    } finally {
      setBusy(false);
    }
  }, [actor, conversation.conversation_id, isGroup, invalidateInbox]);

  const handleRowActivate = () => {
    if (menuOpen) return;
    navigate(`/messages/${conversation.conversation_id}`);
  };

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleRowActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowActivate();
          }
        }}
        className="w-full text-left flex items-center gap-3 active:bg-black/[0.03] transition-colors cursor-pointer"
        style={{
          padding: '12px 14px',
          minHeight: 72,
          borderBottom: `0.5px solid ${HAIRLINE}`,
          background: 'transparent',
        }}
      >
        <SquircleAvatar
          src={identity.avatarUrl}
          userId={identity.userId}
          alt={identity.name}
          size={52}
          hairlineRing
        />
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="truncate"
                style={{
                  color: INK,
                  fontSize: 16,
                  fontWeight: nameWeight,
                  lineHeight: '20px',
                  minWidth: 0,
                }}
              >
                {identity.name}
              </span>
              {identity.verified ? (
                <BadgeCheck size={14} style={{ color: AMBER, flexShrink: 0 }} />
              ) : null}
            </div>
            <span
              className="truncate"
              style={{
                color: previewColor,
                fontSize: 14,
                lineHeight: '18px',
                fontWeight: previewWeight,
                minWidth: 0,
              }}
            >
              {conversation.last_message_preview ?? ''}
            </span>
          </div>
          <div
            className="flex flex-col items-end justify-center gap-1"
            style={{ flexShrink: 0, minWidth: 40 }}
          >
            <span
              style={{
                ...FIGS,
                color: timeColor,
                fontSize: 12,
                lineHeight: '16px',
                fontWeight: unread ? 500 : 400,
              }}
            >
              {time}
            </span>
            {unread ? (
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{
                  ...FIGURE,
                  background: AMBER,
                  color: '#FFFFFF',
                  fontSize: 12,
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  lineHeight: '20px',
                }}
              >
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            ) : conversation.is_muted ? (
              <BellOff size={14} style={{ color: HINT }} />
            ) : null}
          </div>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setConfirmLeave(false);
              setMenuOpen(true);
            }}
            onPointerDown={stop}
            aria-label={t('a11y.conversationActions')}
            style={{
              background: 'transparent',
              border: 'none',
              color: SUB,
              padding: 6,
              marginLeft: 2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <BottomSheet
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          setConfirmLeave(false);
        }}
        zIndexBase={1500}
      >
        <SheetHeader title={identity.name} onClose={() => setMenuOpen(false)} />
        <div style={{ background: '#F8FAFC', paddingBottom: 32 }}>
          <ActionRow
            icon={muted ? <BellOff size={20} color={INK} /> : <Bell size={20} color={INK} />}
            label={muted ? 'Unmute' : 'Mute notifications'}
            onClick={() => void handleToggleMute()}
            disabled={busy}
          />
          <ActionRow
            icon={
              archived ? (
                <ArchiveRestore size={20} color={INK} />
              ) : (
                <Archive size={20} color={INK} />
              )
            }
            label={archived ? 'Unarchive' : 'Archive'}
            onClick={() => void handleToggleArchive()}
            disabled={busy}
          />
          {isGroup ? (
            <ActionRow
              icon={<LogOut size={20} color={DANGER} />}
              label={confirmLeave ? 'Tap again to confirm' : 'Leave group'}
              onClick={() => {
                if (!confirmLeave) {
                  setConfirmLeave(true);
                  setTimeout(() => setConfirmLeave(false), 3000);
                  return;
                }
                void handleLeaveOrDelete();
              }}
              disabled={busy}
              danger
            />
          ) : (
            <ActionRow
              icon={<Trash2 size={20} color={DANGER} />}
              label={confirmLeave ? 'Tap again to confirm' : 'Delete conversation'}
              onClick={() => {
                if (!confirmLeave) {
                  setConfirmLeave(true);
                  setTimeout(() => setConfirmLeave(false), 3000);
                  return;
                }
                void handleLeaveOrDelete();
              }}
              disabled={busy}
              danger
            />
          )}
        </div>
      </BottomSheet>
    </>
  );
};

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({ icon, label, onClick, disabled, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      width: '100%',
      background: 'transparent',
      border: 'none',
      color: danger ? DANGER : INK,
      fontSize: 15,
      fontWeight: 500,
      textAlign: 'left',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </div>
    {label}
  </button>
);

export default ConversationRow;
