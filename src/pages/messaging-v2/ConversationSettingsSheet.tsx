/**
 * ADDENDUM TO BRIEF_MESSAGES_DARK — THE THREAD DETAILS SHEET.
 *
 * §1.1 IT WAS LIGHT over a dark thread. It is dark now and sits A STEP LIGHTER
 *      than the canvas (EC.PANEL over MSG.BLACK) so it reads as a layer above.
 * §1.3 IT WAS THIN. Avatar, name, three utility actions — no route to the
 *      person and no route to compare, on a thread with someone you may have
 *      played a hundred rounds with. Both routes exist in the app already; this
 *      sheet opens them rather than rebuilding either.
 * §2   IT IS A UTILITY SHEET AND RESTRAINT IS THE DESIGN. It does NOT become a
 *      profile and it does NOT rebuild the compare sheet. The relationship
 *      figures are ONE SUMMARY CARD WITH A DOOR, never a panel.
 * §3.1 NO SHARED GOLF -> NO SUMMARY CARD AND NO COMPARE ROW. The row is
 *      absent, not disabled.
 * §3.2 A BUSINESS THREAD carries no handicap index and no compare: name,
 *      handle, the word Business, and the conversation's own actions.
 * §4   DESTRUCTIVE STAYS RED. In this app red also means UNDER PAR, and that
 *      collision is recorded as a decision: a destructive action that does not
 *      look destructive is worse. If it ever changes it changes app-wide.
 * §5   AMBER ONLY ON THE MEMBER'S OWN FIGURE in the head-to-head — one usage in
 *      this file. Verified badges on this sheet are ink, not amber.
 *
 * SHARED MEDIA: there is no per-conversation media surface in the app, so the
 * row is absent rather than built here.
 *
 * Unchanged: mute / archive / block / leave / delete behaviour and their
 * confirmations, the group member management RPCs, the routes View profile and
 * Compare navigate to, the compare sheet itself, and the token module.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  BadgeCheck,
  Bell,
  BellOff,
  Archive,
  ArchiveRestore,
  LogOut,
  Pencil,
  Plus,
  MoreHorizontal,
  X,
  Check,
  Trash2,
  ChevronRight,
  User,
  Ban,
  GitCompareArrows,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useEntityPickerSearch,
  type PersonResult,
  type BusinessResult,
} from '@/features/search-v2/hooks/useEntityPickerSearch';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { useConversationDetail } from '@/hooks/messaging/useConversationDetail';
import { useConversations } from '@/hooks/messaging/useConversations';
import { useSharedGroundOne } from '@/hooks/messaging/useSharedGround';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFriendLeaderboard } from '@/lib/whs/hooks';
import { useBlockActions } from '@/hooks/useBlockActions';
import { supabase } from '@/integrations/supabase/client';
import { EC } from '@/features/echo-chat/tokens';
import { MSG, MT, FIGS } from '@/features/messaging-dark/tokens';
import type { Json } from '@/integrations/supabase/types';
import type { ConversationMember, MemberRole } from '@/types/messaging';
import { FIELD_PAINT_RAISED_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';

/** §5 — the sheet is a step lighter than the canvas. No new tokens declared. */
const SHEET = EC.PANEL;
const RAISED = EC.RAISED;
const INK = MSG.INK;
const SUB = MSG.INK_2;
const HINT = MSG.INK_3;
const AMBER = MSG.AMBER;
const DANGER = MSG.DANGER;
const HAIRLINE = EC.LINE;

interface Props {
  open: boolean;
  conversationId: string;
  onClose: () => void;
}

type Candidate = {
  actor_type: 'personal' | 'business';
  actor_id: string;
  name: string;
  avatar_url: string | null;
};

const roleLabel = (r: MemberRole): string | null =>
  r === 'owner' ? 'Owner' : r === 'admin' ? 'Admin' : null;

const ConversationSettingsSheet: React.FC<Props> = ({ open, conversationId, onClose }) => {
  const { t } = useTranslation(['messaging', 'common']);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const actor = useMessagingActor();
  const { user } = useSupabaseSession();
  const { detail, members, isLoading, refetch } = useConversationDetail(
    open ? conversationId : null,
  );
  const { conversations } = useConversations();
  const inboxRow = useMemo(
    () => conversations.find((c) => c.conversation_id === conversationId) ?? null,
    [conversations, conversationId],
  );
  const muted = !!inboxRow?.is_muted;
  const archived = !!inboxRow?.is_archived;

  const me = useMemo<ConversationMember | null>(() => {
    if (!actor) return null;
    return (
      members.find(
        (m) => m.actor_type === actor.actorType && m.actor_id === actor.actorId,
      ) ?? null
    );
  }, [members, actor]);

  const myRole: MemberRole = me?.role ?? 'member';
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const isGroup = detail?.type === 'group';

  const [titleEdit, setTitleEdit] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [busy, setBusy] = useState(false);

  const invalidateAll = useCallback(() => {
    void refetch();
    qc.invalidateQueries({ queryKey: ['messaging', 'inbox'] });
  }, [refetch, qc]);

  const runRpc = useCallback(
    async <T,>(fn: () => Promise<T>, errMsg: string): Promise<T | null> => {
      try {
        setBusy(true);
        const res = await fn();
        invalidateAll();
        return res;
      } catch (e) {
        console.error(e);
        toast.error(errMsg);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [invalidateAll],
  );

  const handleSaveTitle = useCallback(async () => {
    if (!actor || !detail || titleEdit == null) return;
    const trimmed = titleEdit.trim();
    if (!trimmed) {
      setTitleEdit(null);
      return;
    }
    await runRpc(async () => {
      const { error } = await supabase.rpc('msg_update_group', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_title: trimmed,
        p_avatar_url: detail.avatar_url,
      });
      if (error) throw error;
    }, 'Could not update group');
    setTitleEdit(null);
  }, [actor, detail, titleEdit, runRpc, conversationId]);

  const handleSetRole = useCallback(
    async (target: ConversationMember, role: 'admin' | 'member') => {
      if (!actor) return;
      await runRpc(async () => {
        const { error } = await supabase.rpc('msg_set_role', {
          p_conversation_id: conversationId,
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_target_actor_type: target.actor_type,
          p_target_actor_id: target.actor_id,
          p_role: role,
        });
        if (error) throw error;
      }, 'Could not update role');
      setRowMenu(null);
    },
    [actor, conversationId, runRpc],
  );

  const handleRemove = useCallback(
    async (target: ConversationMember) => {
      if (!actor) return;
      await runRpc(async () => {
        const { error } = await supabase.rpc('msg_remove_member', {
          p_conversation_id: conversationId,
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_target_actor_type: target.actor_type,
          p_target_actor_id: target.actor_id,
        });
        if (error) throw error;
      }, 'Could not remove member');
      setRowMenu(null);
    },
    [actor, conversationId, runRpc],
  );

  const handleAddMembers = useCallback(
    async (picks: Candidate[]) => {
      if (!actor || picks.length === 0) return;
      const payload = picks.map((p) => ({
        actor_type: p.actor_type,
        actor_id: p.actor_id,
      }));
      await runRpc(async () => {
        const { error } = await supabase.rpc('msg_add_members', {
          p_conversation_id: conversationId,
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_members: payload as unknown as Json,
        });
        if (error) throw error;
      }, 'Could not add members');
      setAddOpen(false);
    },
    [actor, conversationId, runRpc],
  );

  const handleToggleMute = useCallback(async () => {
    if (!actor || !detail) return;
    const nextUntil = muted ? null : farFutureIso();
    await runRpc(async () => {
      const { error } = await supabase.rpc('msg_set_mute', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_until: nextUntil,
      });
      if (error) throw error;
    }, 'Could not update mute');
  }, [actor, detail, conversationId, runRpc, muted]);

  const handleToggleArchive = useCallback(async () => {
    if (!actor || !detail) return;
    const next = !archived;
    await runRpc(async () => {
      const { error } = await supabase.rpc('msg_set_archive', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_archived: next,
      });
      if (error) throw error;
    }, 'Could not update archive');
  }, [actor, detail, conversationId, runRpc, archived]);

  const handleLeave = useCallback(async () => {
    if (!actor) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('msg_leave', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
      });
      if (error) {
        toast.error('Could not leave group');
        return;
      }
      qc.invalidateQueries({ queryKey: ['messaging', 'inbox'] });
      onClose();
      navigate('/messages');
    } catch (e) {
      console.error(e);
      toast.error('Could not leave group');
    } finally {
      setBusy(false);
    }
  }, [actor, conversationId, qc, navigate, onClose]);

  const handleDeleteGroup = useCallback(async () => {
    if (!actor) return;
    try {
      setBusy(true);
      const { error } = await supabase.rpc('msg_delete_group', {
        p_conversation_id: conversationId,
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
      });
      if (error) {
        toast.error('Could not delete group');
        return;
      }
      qc.invalidateQueries({ queryKey: ['messaging', 'inbox'] });
      onClose();
      navigate('/messages');
    } catch (e) {
      console.error(e);
      toast.error('Could not delete group');
    } finally {
      setBusy(false);
    }
  }, [actor, conversationId, qc, navigate, onClose]);

  // For DMs, derive identity for the header
  const dmOther = useMemo<ConversationMember | null>(() => {
    if (!detail || detail.type !== 'direct' || !actor) return null;
    return (
      members.find(
        (m) => !(m.actor_type === actor.actorType && m.actor_id === actor.actorId),
      ) ?? null
    );
  }, [detail, members, actor]);

  const isBusinessThread = dmOther?.actor_type === 'business';
  const rivalUserId = !isGroup && !isBusinessThread ? dmOther?.actor_id ?? null : null;

  // §3b — the summary card's two facts. Shared rounds are already cached by the
  // thread strip, so this sheet adds no query on an opened thread.
  const { ground } = useSharedGroundOne(user?.id, open ? rivalUserId : null);
  const hasSharedGolf = !!rivalUserId && ground.count > 0 && ground.rounds.length > 0;

  const h2h = useMemo(() => {
    let mine = 0;
    let theirs = 0;
    for (const r of ground.rounds) {
      if (r.user_gross == null || r.rival_gross == null) continue;
      if (r.user_gross < r.rival_gross) mine += 1;
      else if (r.rival_gross < r.user_gross) theirs += 1;
    }
    return { mine, theirs };
  }, [ground.rounds]);

  // §3a — THEIR HANDICAP INDEX. Read from the circle leaderboard the handicap
  // surfaces already fill; a member outside the circle simply has no line.
  const { data: circle } = useFriendLeaderboard(rivalUserId ? user?.id : undefined);
  const rivalIndex = useMemo(() => {
    if (!rivalUserId) return null;
    const row = (circle ?? []).find((r) => r.friend_user_id === rivalUserId);
    return row?.friend_handicap_index ?? null;
  }, [circle, rivalUserId]);

  const { blockUser } = useBlockActions({ currentUserId: user?.id ?? '' });

  const headerTitle = isGroup ? detail?.title ?? 'Group' : dmOther?.name ?? 'Conversation';
  const headerAvatar = isGroup ? detail?.avatar_url ?? null : dmOther?.avatar_url ?? null;
  const headerId = isGroup ? detail?.conversation_id ?? '' : dmOther?.actor_id ?? '';

  const goProfile = useCallback(() => {
    if (!dmOther) return;
    onClose();
    if (dmOther.actor_type === 'business') {
      navigate(`/business/${dmOther.actor_id}`);
      return;
    }
    navigate(`/profile/${dmOther.username ?? dmOther.actor_id}`);
  }, [dmOther, navigate, onClose]);

  const goCompare = useCallback(() => {
    if (!rivalUserId) return;
    onClose();
    navigate(`/handicap?subtab=circle&compare=${encodeURIComponent(rivalUserId)}`);
  }, [rivalUserId, navigate, onClose]);

  const handleBlock = useCallback(async () => {
    if (!rivalUserId && !dmOther) return;
    if (dmOther?.actor_type !== 'personal') return;
    try {
      setBusy(true);
      await blockUser(dmOther.actor_id);
      onClose();
      navigate('/messages');
    } finally {
      setBusy(false);
    }
  }, [blockUser, dmOther, rivalUserId, navigate, onClose]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      zIndexBase={1500}
      variant="dark"
      surfaceColor={SHEET}
    >
      <SheetHeader title={t('messaging:sheet.detailsTitle')} onClose={onClose} dark />

      <div style={{ background: SHEET, paddingBottom: 28 }}>
        {isLoading || !detail ? (
          <div style={{ padding: '20px 16px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div style={{ width: 72, height: 72, borderRadius: '34%', background: RAISED }} />
              <div style={{ width: 140, height: 13, borderRadius: 3, background: RAISED }} />
              <div style={{ width: 92, height: 10, borderRadius: 3, background: RAISED }} />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: RAISED }} />
                <div style={{ flex: 1, height: 11, borderRadius: 3, background: RAISED }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* §3a WHO */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px 20px',
                borderBottom: `0.5px solid ${HAIRLINE}`,
              }}
            >
              <SquircleAvatar
                src={headerAvatar}
                userId={headerId}
                alt={headerTitle}
                size={72}
                hairlineRing
              />
              {isGroup && isAdmin && titleEdit != null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 320 }}>
                  <input
                    autoFocus
                    value={titleEdit}
                    onChange={(e) => setTitleEdit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveTitle();
                      if (e.key === 'Escape') setTitleEdit(null);
                    }}
                    className={`${FIELD_PAINT_RAISED_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      fontSize: 15,
                      color: INK,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    disabled={busy}
                    style={{
                      background: '#FFFFFF',
                      color: MSG.BLACK,
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 14px',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {t('common:action.save')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: INK }}>
                    {headerTitle}
                  </span>
                  {!isGroup && dmOther?.verified ? (
                    /* §5 verified is INK on this sheet — amber is the member's own figure. */
                    <BadgeCheck size={16} style={{ color: INK }} />
                  ) : null}
                  {isGroup && isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setTitleEdit(detail.title ?? '')}
                      aria-label={t('messaging:a11y.editTitle')}
                      style={{ background: 'transparent', border: 'none', color: HINT, padding: 4 }}
                    >
                      <Pencil size={15} />
                    </button>
                  ) : null}
                </div>
              )}

              {isGroup ? (
                <span style={{ ...MT.CONTEXT, color: SUB }}>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...FIGS }}>
                  {dmOther?.username ? (
                    <span style={{ ...MT.CONTEXT, color: SUB }}>@{dmOther.username}</span>
                  ) : null}
                  {isBusinessThread ? (
                    <span style={{ ...MT.CONTEXT, color: SUB }}>
                      {t('messaging:context.business', { defaultValue: 'Business' })}
                    </span>
                  ) : rivalIndex != null ? (
                    <>
                      {dmOther?.username ? <Dot /> : null}
                      <span style={{ ...MT.CONTEXT, color: SUB }}>
                        Index {rivalIndex.toFixed(1)}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            {/* §3b THE SUMMARY CARD — one card, then a door. Absent with no shared golf. */}
            {hasSharedGolf ? (
              <div style={{ padding: '14px 16px 4px' }}>
                <div
                  style={{
                    background: RAISED,
                    borderRadius: 14,
                    padding: '13px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={MT.MICRO}>Together</span>
                    <span style={{ ...MT.SCORE, color: INK }}>{ground.count}</span>
                  </div>
                  <div style={{ width: '0.5px', alignSelf: 'stretch', background: HAIRLINE }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={MT.MICRO}>Head to head</span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {/* §5 THE ONE AMBER: the member's own figure. */}
                      <span style={{ ...MT.SCORE, color: AMBER }}>{h2h.mine}</span>
                      <span style={{ ...MT.SCORE, color: HINT, fontSize: 13 }}>–</span>
                      <span style={{ ...MT.SCORE, color: INK }}>{h2h.theirs}</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Members (groups only) */}
            {isGroup ? (
              <div style={{ borderBottom: `0.5px solid ${HAIRLINE}` }}>
                <div style={{ ...MT.EYEBROW, padding: '16px 16px 10px' }}>
                  {t('messaging:list.members')}
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 16px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: INK,
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '34%',
                        background: RAISED,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={19} color={INK} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      {t('messaging:action.addPeople')}
                    </span>
                  </button>
                ) : null}

                {members.map((m) => {
                  const key = `${m.actor_type}:${m.actor_id}`;
                  const isSelf =
                    actor && m.actor_type === actor.actorType && m.actor_id === actor.actorId;
                  const isTargetOwner = m.role === 'owner';
                  const canActOnRow = !!isAdmin && !isSelf && !isTargetOwner;
                  const canPromoteDemote = isOwner && !isSelf && !isTargetOwner;
                  const canRemove = canActOnRow;
                  const showMenu = canRemove || canPromoteDemote;
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 16px',
                        position: 'relative',
                      }}
                    >
                      <SquircleAvatar
                        src={m.avatar_url}
                        userId={m.actor_id}
                        alt={m.name ?? 'Member'}
                        size={40}
                        hairlineRing
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <span
                            style={{
                              ...MT.NAME,
                              color: INK,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {m.name ?? m.username ?? 'Member'}
                            {isSelf ? ' (You)' : ''}
                          </span>
                          {m.verified ? (
                            <BadgeCheck size={13} style={{ color: INK, flexShrink: 0 }} />
                          ) : null}
                        </div>
                        {roleLabel(m.role) ? (
                          <div style={{ ...MT.CONTEXT, color: HINT }}>{roleLabel(m.role)}</div>
                        ) : null}
                      </div>
                      {showMenu ? (
                        <button
                          type="button"
                          onClick={() => setRowMenu(rowMenu === key ? null : key)}
                          aria-label={t('messaging:a11y.memberActions')}
                          style={{ background: 'transparent', border: 'none', color: HINT, padding: 6 }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      ) : null}
                      {rowMenu === key && showMenu ? (
                        <div
                          style={{
                            position: 'absolute',
                            top: 44,
                            right: 12,
                            background: RAISED,
                            border: `1px solid ${HAIRLINE}`,
                            borderRadius: 12,
                            minWidth: 180,
                            padding: 6,
                            zIndex: 20,
                          }}
                        >
                          {canPromoteDemote ? (
                            <button
                              type="button"
                              onClick={() => handleSetRole(m, m.role === 'admin' ? 'member' : 'admin')}
                              disabled={busy}
                              style={menuItemStyle(INK)}
                            >
                              {m.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </button>
                          ) : null}
                          {canRemove ? (
                            <button
                              type="button"
                              onClick={() => handleRemove(m)}
                              disabled={busy}
                              style={menuItemStyle(DANGER)}
                            >
                              {t('messaging:action.removeFromGroup')}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* §3c THE ACTIONS */}
            <div style={{ padding: '8px 0 0' }}>
              {!isGroup && dmOther ? (
                <ActionRow
                  icon={<User size={19} color={INK} />}
                  label="View profile"
                  onClick={goProfile}
                  chevron
                />
              ) : null}

              {/* §3.1 no shared golf -> the Compare row is ABSENT, not disabled. */}
              {hasSharedGolf ? (
                <ActionRow
                  icon={<GitCompareArrows size={19} color={INK} />}
                  label="Compare"
                  sub="Head to head, hole by hole"
                  onClick={goCompare}
                  chevron
                />
              ) : null}

              <ActionRow
                icon={muted ? <BellOff size={19} color={INK} /> : <Bell size={19} color={INK} />}
                label={muted ? 'Unmute' : 'Mute notifications'}
                onClick={handleToggleMute}
                disabled={busy}
              />
              <ActionRow
                icon={
                  archived ? (
                    <ArchiveRestore size={19} color={INK} />
                  ) : (
                    <Archive size={19} color={INK} />
                  )
                }
                label={archived ? 'Unarchive conversation' : 'Archive conversation'}
                onClick={handleToggleArchive}
                disabled={busy}
              />

              {!isGroup && dmOther?.actor_type === 'personal' ? (
                <ActionRow
                  icon={<Ban size={19} color={INK} />}
                  label={confirmBlock ? 'Tap again to confirm' : 'Block'}
                  onClick={() => {
                    if (!confirmBlock) {
                      setConfirmBlock(true);
                      setTimeout(() => setConfirmBlock(false), 3000);
                      return;
                    }
                    void handleBlock();
                  }}
                  disabled={busy}
                />
              ) : null}

              {isGroup ? (
                <>
                  <ActionRow
                    icon={<LogOut size={19} color={DANGER} />}
                    label={confirmLeave ? 'Tap again to confirm' : 'Leave group'}
                    onClick={() => {
                      if (!confirmLeave) {
                        setConfirmLeave(true);
                        setTimeout(() => setConfirmLeave(false), 3000);
                        return;
                      }
                      void handleLeave();
                    }}
                    disabled={busy}
                    danger
                  />
                  {isAdmin ? (
                    <ActionRow
                      icon={<Trash2 size={19} color={DANGER} />}
                      label={confirmDelete ? 'Tap again to confirm' : 'Delete group'}
                      onClick={() => {
                        if (!confirmDelete) {
                          setConfirmDelete(true);
                          setTimeout(() => setConfirmDelete(false), 3000);
                          return;
                        }
                        void handleDeleteGroup();
                      }}
                      disabled={busy}
                      danger
                    />
                  ) : null}
                </>
              ) : (
                /* §4 DESTRUCTIVE STAYS RED — a recorded decision, not an accident. */
                <ActionRow
                  icon={<Trash2 size={19} color={DANGER} />}
                  label={confirmLeave ? 'Tap again to confirm' : 'Delete conversation'}
                  onClick={() => {
                    if (!confirmLeave) {
                      setConfirmLeave(true);
                      setTimeout(() => setConfirmLeave(false), 3000);
                      return;
                    }
                    void handleLeave();
                  }}
                  disabled={busy}
                  danger
                />
              )}
            </div>
          </>
        )}
      </div>

      <AddPeopleSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        existingKeys={new Set(members.map((m) => `${m.actor_type}:${m.actor_id}`))}
        onConfirm={(picks) => void handleAddMembers(picks)}
      />
    </BottomSheet>
  );
};

const Dot: React.FC = () => (
  <span aria-hidden style={{ width: 2.5, height: 2.5, borderRadius: 999, background: HINT }} />
);

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '11px 12px',
    background: 'transparent',
    border: 'none',
    color,
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
  };
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  chevron?: boolean;
}
const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  sub,
  onClick,
  disabled,
  danger,
  chevron,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="active:opacity-70"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      width: '100%',
      background: 'transparent',
      border: 'none',
      borderTop: `0.5px solid ${HAIRLINE}`,
      color: danger ? DANGER : INK,
      textAlign: 'left',
    }}
  >
    <div
      style={{
        width: 26,
        height: 26,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.011em' }}>{label}</span>
      {sub ? <span style={{ ...MT.CONTEXT, color: HINT }}>{sub}</span> : null}
    </span>
    {chevron ? <ChevronRight size={17} color={HINT} /> : null}
  </button>
);

// ============ helpers ============

function farFutureIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 100);
  return d.toISOString();
}

// ============ Add people sub-sheet (§1.1 — dark too) ============

interface AddPeopleSheetProps {
  open: boolean;
  onClose: () => void;
  existingKeys: Set<string>;
  onConfirm: (picks: Candidate[]) => void;
}

const AddPeopleSheet: React.FC<AddPeopleSheetProps> = ({
  open,
  onClose,
  existingKeys,
  onConfirm,
}) => {
  const { t } = useTranslation(['messaging', 'common']);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const [selected, setSelected] = useState<Candidate[]>([]);

  const { people, businesses } = useEntityPickerSearch({
    query: debounced,
    enabled: open && debounced.trim().length > 0,
    limit: 8,
  });

  const results: Candidate[] = useMemo(() => {
    const p: Candidate[] = (people ?? []).map((pp: PersonResult) => ({
      actor_type: 'personal',
      actor_id: pp.id,
      name: pp.display_name,
      avatar_url: pp.avatar_url,
    }));
    const b: Candidate[] = (businesses ?? []).map((bb: BusinessResult) => ({
      actor_type: 'business',
      actor_id: bb.id,
      name: bb.name,
      avatar_url: bb.logo_url,
    }));
    return [...p, ...b].filter((c) => !existingKeys.has(`${c.actor_type}:${c.actor_id}`));
  }, [people, businesses, existingKeys]);

  const toggle = (c: Candidate) => {
    setSelected((prev) => {
      const idx = prev.findIndex(
        (s) => s.actor_type === c.actor_type && s.actor_id === c.actor_id,
      );
      if (idx >= 0) {
        const next = prev.slice();
        next.splice(idx, 1);
        return next;
      }
      return [...prev, c];
    });
  };

  const isSel = (c: Candidate) =>
    selected.some((s) => s.actor_type === c.actor_type && s.actor_id === c.actor_id);

  const handleAdd = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
    setSelected([]);
    setQuery('');
  };

  const handleClose = () => {
    setSelected([]);
    setQuery('');
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      zIndexBase={1600}
      variant="dark"
      surfaceColor={SHEET}
    >
      <SheetHeader title={t('messaging:action.addPeople')} onClose={handleClose} dark />
      <div style={{ background: SHEET, paddingBottom: 16 }}>
        {selected.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 4px' }}>
            {selected.map((s) => (
              <button
                key={`${s.actor_type}:${s.actor_id}`}
                type="button"
                onClick={() => toggle(s)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: RAISED,
                  color: INK,
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {s.name}
                <X size={12} />
              </button>
            ))}
          </div>
        ) : null}

        <div style={{ padding: '8px 16px' }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('messaging:search.peopleAnd')}
            className={`msg-input ${FIELD_PAINT_RAISED_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
            style={{
              width: '100%',
              padding: '11px 14px',
              fontSize: 15,
              color: INK,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ maxHeight: '45dvh', overflowY: 'auto' }}>
          {results.map((c) => {
            const sel = isSel(c);
            return (
              <button
                key={`${c.actor_type}:${c.actor_id}`}
                type="button"
                onClick={() => toggle(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 16px',
                  width: '100%',
                  background: sel ? RAISED : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                }}
              >
                <SquircleAvatar
                  src={c.avatar_url}
                  userId={c.actor_id}
                  alt={c.name}
                  size={42}
                  hairlineRing
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...MT.NAME, color: INK, fontWeight: 700 }}>{c.name}</div>
                  {c.actor_type === 'business' ? (
                    <div style={{ ...MT.CONTEXT, color: HINT }}>
                      {t('messaging:context.business', { defaultValue: 'Business' })}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: `1.5px solid ${sel ? '#FFFFFF' : HAIRLINE}`,
                    background: sel ? '#FFFFFF' : 'transparent',
                    color: MSG.BLACK,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {sel ? <Check size={14} strokeWidth={2.5} /> : null}
                </div>
              </button>
            );
          })}
          {query.trim().length > 0 && results.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', ...MT.CONTEXT, color: HINT }}>
              {t('messaging:search.noResults')}
            </div>
          ) : null}
        </div>

        <div style={{ padding: 16 }}>
          <button
            type="button"
            onClick={handleAdd}
            disabled={selected.length === 0}
            style={{
              width: '100%',
              background: selected.length === 0 ? RAISED : '#FFFFFF',
              color: selected.length === 0 ? HINT : MSG.BLACK,
              border: 'none',
              borderRadius: 14,
              padding: '13px 16px',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {selected.length > 0
              ? t('messaging:addSheet.addWithCount', { count: selected.length })
              : t('messaging:addSheet.addZero')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ConversationSettingsSheet;
export { ConversationSettingsSheet };
