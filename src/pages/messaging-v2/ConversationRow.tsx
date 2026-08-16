/**
 * BRIEF_MESSAGES_ECHO_PALETTE §2 — THE LIST.
 *
 * 68px, avatar 46, so twelve threads fit on a phone. Every row carries a
 * preview (§2.1), unread is a WHITE count plus a brighter ink tier (§2.2), and
 * the context line says where and when the two of you last played (§2.3).
 *
 * §2.4 NO "..." BUTTON. Mute / archive / delete now live behind a long press on
 * the row itself — the same sheet, one fewer piece of furniture on every row.
 */

import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  BellOff,
  BadgeCheck,
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
import { formatWeekdayShort, formatMonthShort, formatRelative } from '@/i18n/format';
import { EC } from '@/features/echo-chat/tokens';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import { resolvePreview } from './messagePreview';
import type { SharedGround } from '@/hooks/messaging/useSharedGround';

const SHEET_INK = MSG.INK;
const SHEET_DANGER = MSG.DANGER;
/* ADDENDUM §1.1 — the row menu is a dark sheet too: EC.PANEL over #05070A. */
const SHEET_SURFACE = EC.PANEL;

interface Props {
  conversation: InboxConversation;
  /** Shared golf with the other member. Absent for groups and businesses. */
  ground?: SharedGround;
}

interface Identity {
  name: string;
  avatarUrl: string | null;
  userId: string;
  verified: boolean;
  isBusiness: boolean;
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
      isBusiness: false,
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
    isBusiness: p?.actor_type === 'business',
  };
}

function formatStamp(iso: string | null): string {
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
  const withinWeek = now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (withinWeek) return formatWeekdayShort(d);
  return `${String(d.getDate()).padStart(2, '0')} ${formatMonthShort(d)}`;
}

function farFutureIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 100);
  return d.toISOString();
}

/** §2.3 "Sundridge Park · 3 days ago", or "Business", or nothing at all. */
function resolveContext(
  identity: Identity,
  isGroup: boolean,
  ground: SharedGround | undefined,
  memberCount: number,
  t: (k: string, o?: Record<string, unknown>) => string,
): string | null {
  if (identity.isBusiness) return t('context.business', { defaultValue: 'Business' });
  if (isGroup) {
    return t('context.members', {
      count: memberCount,
      defaultValue: `${memberCount} members`,
    });
  }
  if (!ground || ground.count === 0) return null;
  if (ground.lastCourseName && ground.lastPlayDate) {
    return `${ground.lastCourseName} · ${formatRelative(ground.lastPlayDate)}`;
  }
  return t('context.roundsTogether', {
    count: ground.count,
    defaultValue: `${ground.count} rounds together`,
  });
}

export const ConversationRow: React.FC<Props> = ({ conversation, ground }) => {
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
  const time = formatStamp(conversation.last_message_at);
  const preview = resolvePreview(conversation, t as never);

  // §2.2 UNREAD IS A BRIGHTER INK TIER. Three solid values, no alpha tricks.
  const nameColor = unread ? MSG.INK : MSG.INK_2;
  const previewColor = unread ? MSG.INK_2 : MSG.INK_3;

  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isGroup = conversation.type === 'group';
  const muted = !!conversation.is_muted;
  const archived = !!conversation.is_archived;
  const context = resolveContext(
    identity,
    isGroup,
    ground,
    conversation.participants.length,
    t as never,
  );

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

  // §2.4 the row's own long press replaces the per-row "..." button.
  const longPressRef = useRef<number | null>(null);
  const longFiredRef = useRef(false);
  const startPress = () => {
    longFiredRef.current = false;
    longPressRef.current = window.setTimeout(() => {
      longFiredRef.current = true;
      setConfirmLeave(false);
      setMenuOpen(true);
    }, 480);
  };
  const endPress = () => {
    if (longPressRef.current) window.clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };

  const handleRowActivate = () => {
    if (menuOpen || longFiredRef.current) return;
    navigate(`/messages/${conversation.conversation_id}`);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="msg-row"
        onClick={handleRowActivate}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onPointerLeave={endPress}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRowActivate();
          }
        }}
      >
        <SquircleAvatar
          src={identity.avatarUrl}
          userId={identity.userId}
          alt={identity.name}
          size={46}
          hairlineRing
        />

        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ gap: 2 }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="truncate"
              style={{ ...MT.NAME, color: nameColor, minWidth: 0 }}
            >
              {identity.name}
            </span>
            {identity.verified ? (
              <BadgeCheck size={13} style={{ color: MSG.INK_2, flexShrink: 0 }} />
            ) : null}
            {muted ? <BellOff size={11} style={{ color: MSG.INK_3, flexShrink: 0 }} /> : null}
          </div>

          <span className="truncate" style={{ ...MT.PREVIEW, color: previewColor, minWidth: 0 }}>
            {preview}
          </span>

          {context ? (
            <span className="truncate" style={{ ...MT.CONTEXT, minWidth: 0 }}>
              {context}
            </span>
          ) : null}
        </div>

        <div
          className="flex flex-col items-end justify-center"
          style={{ flexShrink: 0, gap: 5, minWidth: 34 }}
        >
          <span style={MT.TIME}>{time}</span>
          {unread ? (
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                ...MT.BADGE,
                /* §2.2 WHITE, NOT AMBER. Amber is the viewing member, and an
                   unread count is not the viewing member. */
                background: MSG.INK,
                color: MSG.BLACK,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                lineHeight: '18px',
              }}
            >
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          ) : null}
        </div>
      </div>

      <BottomSheet
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          setConfirmLeave(false);
        }}
        zIndexBase={1500}
        variant="dark"
        surfaceColor={SHEET_SURFACE}
      >
        <SheetHeader title={identity.name} onClose={() => setMenuOpen(false)} dark />
        <div style={{ background: SHEET_SURFACE, paddingBottom: 32 }}>
          <ActionRow
            icon={muted ? <BellOff size={20} color={SHEET_INK} /> : <Bell size={20} color={SHEET_INK} />}
            label={muted ? 'Unmute' : 'Mute notifications'}
            onClick={() => void handleToggleMute()}
            disabled={busy}
          />
          <ActionRow
            icon={
              archived ? (
                <ArchiveRestore size={20} color={SHEET_INK} />
              ) : (
                <Archive size={20} color={SHEET_INK} />
              )
            }
            label={archived ? 'Unarchive' : 'Archive'}
            onClick={() => void handleToggleArchive()}
            disabled={busy}
          />
          {isGroup ? (
            <ActionRow
              icon={<LogOut size={20} color={SHEET_DANGER} />}
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
              icon={<Trash2 size={20} color={SHEET_DANGER} />}
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
      color: danger ? SHEET_DANGER : SHEET_INK,
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
