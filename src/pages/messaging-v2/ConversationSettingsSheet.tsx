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
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { FIGS } from '@/lib/tokens/type';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useEntityPickerSearch,
  type PersonResult,
  type BusinessResult,
} from '@/features/search-v2/hooks/useEntityPickerSearch';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { useConversationDetail } from '@/hooks/messaging/useConversationDetail';
import { useConversations } from '@/hooks/messaging/useConversations';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { ConversationMember, MemberRole } from '@/types/messaging';

const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SUB = '#8A9099';
const AMBER = '#F7931E';
const DANGER = '#DC2626';
const HAIRLINE = 'rgba(0,0,0,0.07)';

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
      const members = picks.map((p) => ({
        actor_type: p.actor_type,
        actor_id: p.actor_id,
      }));
      await runRpc(async () => {
        const { error } = await supabase.rpc('msg_add_members', {
          p_conversation_id: conversationId,
          p_as_actor_type: actor.actorType,
          p_as_actor_id: actor.actorId,
          p_members: members as unknown as Json,
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
  }, [actor, detail, conversationId, runRpc]);

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
  }, [actor, detail, conversationId, runRpc]);

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

  // For DMs, derive identity for header
  const dmOther = useMemo<ConversationMember | null>(() => {
    if (!detail || detail.type !== 'direct' || !actor) return null;
    return (
      members.find(
        (m) => !(m.actor_type === actor.actorType && m.actor_id === actor.actorId),
      ) ?? null
    );
  }, [detail, members, actor]);

  const headerTitle = isGroup ? detail?.title ?? 'Group' : dmOther?.name ?? 'Conversation';
  const headerAvatar = isGroup ? detail?.avatar_url ?? null : dmOther?.avatar_url ?? null;
  const headerId = isGroup ? detail?.conversation_id ?? '' : dmOther?.actor_id ?? '';

  return (
    <BottomSheet open={open} onClose={onClose} zIndexBase={1500}>
      <SheetHeader title={t('messaging:sheet.detailsTitle')} onClose={onClose} />

      <div style={{ background: CANVAS, paddingBottom: 32 }}>
        {isLoading || !detail ? (
          <div style={{ padding: '20px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Skeleton style={{ width: 72, height: 72, borderRadius: 24 }} />
              <Skeleton style={{ width: 140, height: 16, borderRadius: 4 }} />
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                <Skeleton style={{ width: 44, height: 44, borderRadius: 16 }} />
                <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Identity */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '16px 16px 24px',
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
                    style={{
                      flex: 1,
                      background: '#FFF',
                      border: `1px solid ${HAIRLINE}`,
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 16,
                      color: INK,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    disabled={busy}
                    style={{
                      background: INK,
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {t('common:action.save')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: INK,
                      textAlign: 'center',
                    }}
                  >
                    {headerTitle}
                  </span>
                  {!isGroup && dmOther?.verified ? (
                    <BadgeCheck size={16} style={{ color: AMBER }} />
                  ) : null}
                  {isGroup && isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setTitleEdit(detail.title ?? '')}
                      aria-label={t('a11y.editTitle')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: SUB,
                        padding: 4,
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                  ) : null}
                </div>
              )}
              {isGroup ? (
                <span style={{ ...FIGS, color: SUB, fontSize: 13 }}>
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              ) : null}
            </div>

            {/* Members (groups only) */}
            {isGroup ? (
              <div style={{ borderBottom: `0.5px solid ${HAIRLINE}` }}>
                <div
                  style={{
                    padding: '16px 16px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: SUB,
                  }}
                >
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
                      padding: '12px 16px',
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
                        borderRadius: 14,
                        background: '#EDEFF2',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={20} color={INK} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{t('messaging:action.addPeople')}</span>
                  </button>
                ) : null}

                {members.map((m) => {
                  const key = `${m.actor_type}:${m.actor_id}`;
                  const isSelf =
                    actor &&
                    m.actor_type === actor.actorType &&
                    m.actor_id === actor.actorId;
                  const isTargetOwner = m.role === 'owner';
                  // Admin can act on non-owners and non-self. Only owner can promote/demote admins.
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
                        padding: '12px 16px',
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 500,
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
                            <BadgeCheck size={13} style={{ color: AMBER, flexShrink: 0 }} />
                          ) : null}
                        </div>
                        {roleLabel(m.role) ? (
                          <div style={{ fontSize: 12, color: SUB }}>{roleLabel(m.role)}</div>
                        ) : null}
                      </div>
                      {showMenu ? (
                        <button
                          type="button"
                          onClick={() => setRowMenu(rowMenu === key ? null : key)}
                          aria-label={t('a11y.memberActions')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: SUB,
                            padding: 6,
                          }}
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
                            background: '#FFF',
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
                              onClick={() =>
                                handleSetRole(m, m.role === 'admin' ? 'member' : 'admin')
                              }
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

            {/* Actions */}
            <div style={{ padding: '8px 0' }}>
              <ActionRow
                icon={
                  muted ? (
                    <BellOff size={20} color={INK} />
                  ) : (
                    <Bell size={20} color={INK} />
                  )
                }
                label={muted ? 'Unmute' : 'Mute notifications'}
                onClick={handleToggleMute}
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
                onClick={handleToggleArchive}
                disabled={busy}
              />
              {isGroup ? (
                <>
                  <ActionRow
                    icon={<LogOut size={20} color={DANGER} />}
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
                      icon={<Trash2 size={20} color={DANGER} />}
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
                <ActionRow
                  icon={<Trash2 size={20} color={DANGER} />}
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

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px',
    background: 'transparent',
    border: 'none',
    color,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
  };
}

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

// ============ helpers ============

function farFutureIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 100);
  return d.toISOString();
}


// ============ Add people sub-sheet ============

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
    return [...p, ...b].filter(
      (c) => !existingKeys.has(`${c.actor_type}:${c.actor_id}`),
    );
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
    <BottomSheet open={open} onClose={handleClose} zIndexBase={1600}>
      <SheetHeader title={t('action.addPeople')} onClose={handleClose} />
      <div style={{ background: CANVAS, paddingBottom: 16 }}>
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
                  background: '#EDEFF2',
                  color: INK,
                  border: 'none',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 13,
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
            placeholder={t('search.peopleAnd')}
            style={{
              width: '100%',
              background: '#FFF',
              border: `1px solid ${HAIRLINE}`,
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 15,
              color: INK,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ maxHeight: '45dvh', overflowY: 'auto' }}>
          {results.map((c) => (
            <button
              key={`${c.actor_type}:${c.actor_id}`}
              type="button"
              onClick={() => toggle(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                width: '100%',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
              }}
            >
              <SquircleAvatar
                src={c.avatar_url}
                userId={c.actor_id}
                alt={c.name}
                size={40}
                hairlineRing
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: INK, fontSize: 15, fontWeight: 500 }}>{c.name}</div>
                <div style={{ color: SUB, fontSize: 12 }}>
                  {c.actor_type === 'business' ? 'Business' : 'Personal'}
                </div>
              </div>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: `1.5px solid ${isSel(c) ? INK : HAIRLINE}`,
                  background: isSel(c) ? INK : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSel(c) ? <Check size={14} color="#FFF" /> : null}
              </div>
            </button>
          ))}
          {query.trim().length > 0 && results.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: SUB, fontSize: 13 }}>
              {t('common:state.noResults')}
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
              background: INK,
              color: '#FFF',
              border: 'none',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 600,
              opacity: selected.length === 0 ? 0.4 : 1,
            }}
          >
            {selected.length > 0 ? t('messaging:addSheet.addWithCount', { count: selected.length }) : t('messaging:addSheet.addZero')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default ConversationSettingsSheet;
export { ConversationSettingsSheet };
