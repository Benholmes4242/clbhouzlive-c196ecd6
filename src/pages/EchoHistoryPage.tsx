import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Pin, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEchoChats, type EchoChatRow } from '@/features/echo-v2/hooks/useEchoChats';
import { EchoWaveform } from '@/features/echo-caddie/components/EchoWaveform';
import '@/features/echo-caddie/echo-caddie.css';
import { formatRelativeRounded } from '@/i18n/format';
import { toast } from '@/lib/toast';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';
import { TITLE } from '@/lib/tokens/type';

/**
 * BRIEF_ECHO_CADDIE §6.2 — NO LIGHT CANVAS SURVIVES ANYWHERE IN ECHO, history
 * included. States 10 and 11 sit on the same dark surface as the caddie, and the
 * mark here is STATIC (§6.1).
 *
 * §7 THREE SEPARATE SOLID INK VALUES — no tone is derived by reducing another
 * element's opacity. AMBER IS GONE from this surface: it means Echo's mark and
 * the member's own figures, and a pin marker is neither.
 */
const CANVAS = '#08090B';
const INK = '#FFFFFF';
const SUB = '#8B929C';
const MUTED = '#8B929C';
const PIN = '#C9CFD7';
const HAIRLINE = 'rgba(255,255,255,0.10)';
const BOTTOM_NAV_CLEAR = 'calc(env(safe-area-inset-bottom, 0px) + 32px)';

const relativeTime = formatRelativeRounded;



type SheetMode = null | 'actions' | 'rename' | 'confirm-delete';

/**
 * Titles are auto-generated from the opening question, so asking the same
 * thing five times yields five identically-titled rows. Group them under the
 * most recent one rather than deduplicating (no chat is ever hidden).
 * Pinned chats are deliberately excluded: pinning is how a chat LEAVES a
 * group.
 */
function titleKey(title: string | null): string {
  return (title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.?!,;:]+$/, '');
}

interface ChatGroup {
  key: string;
  /** Most recent chat — the visible leader row. */
  leader: EchoChatRow;
  /** Remaining chats, most-recent-first. Empty for a singleton. */
  rest: EchoChatRow[];
}

function buildGroups(chats: EchoChatRow[]): ChatGroup[] {
  const out: ChatGroup[] = [];
  const index = new Map<string, ChatGroup>();
  // `chats` arrives pinned-first then most-recent-first, so the first row
  // seen for a key is always the leader and `rest` stays ordered.
  for (const c of chats) {
    const key = titleKey(c.title);
    if (c.pinned || !key) {
      out.push({ key: c.id, leader: c, rest: [] });
      continue;
    }
    const existing = index.get(key);
    if (existing) {
      existing.rest.push(c);
      continue;
    }
    const group: ChatGroup = { key, leader: c, rest: [] };
    index.set(key, group);
    out.push(group);
  }
  return out;
}

const EchoHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: chats = [], isLoading, isError, refetch } = useEchoChats();

  const { t } = useTranslation('echo');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [sheetChatId, setSheetChatId] = useState<string | null>(null);
  // When the sheet was opened from a GROUP LEADER, Delete removes the whole
  // group; Pin and Rename still act on the leader alone.
  const [sheetGroupIds, setSheetGroupIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busy, setBusy] = useState(false);

  const sheetChat = useMemo(
    () => chats.find((c) => c.id === sheetChatId) ?? null,
    [chats, sheetChatId],
  );

  useEffect(() => {
    if (sheetMode === null) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [sheetMode]);

  const groups = useMemo(() => buildGroups(chats), [chats]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const closeSheet = useCallback(() => {
    setSheetMode(null);
    setSheetChatId(null);
    setSheetGroupIds([]);
    setRenameValue('');
    setBusy(false);
  }, []);

  const openActions = useCallback((c: EchoChatRow, groupIds: string[] = []) => {
    setSheetChatId(c.id);
    setSheetGroupIds(groupIds);
    setRenameValue(c.title ?? '');
    setSheetMode('actions');
  }, []);

  const patchList = useCallback(
    (fn: (rows: EchoChatRow[]) => EchoChatRow[]) => {
      qc.setQueryData<EchoChatRow[]>(['echo-v2', 'chats'], (prev) =>
        fn(prev ?? []),
      );
    },
    [qc],
  );

  const handlePinToggle = useCallback(async () => {
    if (!sheetChat) return;
    const nextPinned = !sheetChat.pinned;
    // Pinning lifts this chat out of its group; the remaining siblings
    // re-collapse rather than being left orphaned in an expanded state.
    setExpandedKeys(new Set());
    patchList((rows) =>
      rows
        .map((r) => (r.id === sheetChat.id ? { ...r, pinned: nextPinned } : r))
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bt - at;
        }),
    );
    closeSheet();
    const { error } = await supabase
      .from('echo_chats')
      .update({ pinned: nextPinned })
      .eq('id', sheetChat.id);
    if (error) {
      // Rollback on failure
      toast.error("Couldn't update this chat");
      void qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
    }
  }, [sheetChat, patchList, closeSheet, qc]);

  const handleRenameSave = useCallback(async () => {
    if (!sheetChat) return;
    const next = renameValue.trim();
    if (!next) return;
    // Renaming changes the group key, so the leader leaves; re-collapse.
    setExpandedKeys(new Set());
    setBusy(true);
    patchList((rows) =>
      rows.map((r) => (r.id === sheetChat.id ? { ...r, title: next } : r)),
    );
    const { error } = await supabase
      .from('echo_chats')
      .update({ title: next })
      .eq('id', sheetChat.id);
    if (error) {
      toast.error("Couldn't rename this chat");
      void qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
    }
    closeSheet();
  }, [sheetChat, renameValue, patchList, closeSheet, qc]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!sheetChat) return;
    setBusy(true);
    const ids = sheetGroupIds.length > 1 ? sheetGroupIds : [sheetChat.id];
    patchList((rows) => rows.filter((r) => !ids.includes(r.id)));
    closeSheet();
    const { error } = await supabase.from('echo_chats').delete().in('id', ids);
    if (error) {
      toast.error("Couldn't delete this chat");
      void qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
    }
  }, [sheetChat, sheetGroupIds, patchList, closeSheet, qc]);

  const deleteCount = sheetGroupIds.length > 1 ? sheetGroupIds.length : 1;

  return (
    <div className="echo-root" style={{ background: CANVAS }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: CANVAS,
          paddingBottom: BOTTOM_NAV_CLEAR,
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            paddingBottom: 12,
            paddingLeft: 6,
            paddingRight: 6,
            background: CANVAS,
            borderBottom: `0.5px solid ${HAIRLINE}`,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() => {
              // Prefer real back so we don't push a duplicate /echo entry,
              // which would trap the user in an /echo ↔ /echo/history loop.
              if (window.history.length > 1) navigate(-1);
              else navigate('/echo', { replace: true });
            }}
            className="active:opacity-60"
            style={{
              width: 40,
              height: 40,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: INK,
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <span style={{ ...TITLE, color: INK, flex: 1 }}>
            History
          </span>
          <div style={{ width: 40, height: 40, flexShrink: 0 }} />
        </header>

        <div
          className="flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {isLoading ? (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderBottom: `0.5px solid ${HAIRLINE}`,
                  }}
                >
                  <Skeleton variant="dark" style={{ width: 12, height: 12, borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton variant="dark" style={{ width: '65%', height: 14, borderRadius: 7 }} />
                    <Skeleton variant="dark" style={{ width: '40%', height: 12, borderRadius: 6 }} />
                  </div>
                  <Skeleton variant="dark" style={{ width: 36, height: 11, borderRadius: 5, flexShrink: 0 }} />
                  <Skeleton variant="dark" style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0 }} />
                </li>
              ))}
            </ul>
          ) : isError ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                Couldn't load your chats
              </span>
              <button
                type="button"
                onClick={() => { void refetch(); }}
                className="active:opacity-70"
                style={{
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: '#FFFFFF',
                  color: '#08090B',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          ) : !isError && chats.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                gap: 12,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 17,
                  background: '#14181E',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EchoWaveform size={28} active={false} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                  No chats yet
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    color: SUB,
                    lineHeight: 1.5,
                    maxWidth: 260,
                  }}
                >
                  Ask Echo anything golf to get started
                </span>
              </div>
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {groups.map((g) => {
                const expanded = expandedKeys.has(g.key);
                const groupIds = [g.leader.id, ...g.rest.map((r) => r.id)];
                return (
                  <React.Fragment key={g.key}>
                    <ChatRow
                      chat={g.leader}
                      onOpen={() => navigate(`/echo/${g.leader.id}`, { state: { from: 'history' } })}
                      onActions={() => openActions(g.leader, groupIds)}
                      groupCount={g.rest.length > 0 ? groupIds.length : 0}
                      expanded={expanded}
                      onToggleGroup={() => toggleGroup(g.key)}
                      countLabel={t('history.group.count', {
                        count: groupIds.length,
                        defaultValue: '{{count}} conversations',
                      })}
                    />
                    {g.rest.length > 0 && expanded
                      ? g.rest.map((c) => (
                          <ChatRow
                            key={c.id}
                            chat={c}
                            indented
                            onOpen={() => navigate(`/echo/${c.id}`, { state: { from: 'history' } })}
                            onActions={() => openActions(c)}
                          />
                        ))
                      : null}
                  </React.Fragment>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {sheetMode !== null && sheetChat ? (
        <div
          onClick={closeSheet}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,5,7,0.62)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#14181E',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '12px 16px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                background: '#3A4048',
                margin: '0 auto 16px',
              }}
            />

            {sheetMode === 'actions' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <SheetRow
                  label={sheetChat.pinned ? 'Unpin' : 'Pin'}
                  onClick={handlePinToggle}
                />
                <SheetRow
                  label="Rename"
                  onClick={() => setSheetMode('rename')}
                />
                <SheetRow
                  label="Delete"
                  destructive
                  onClick={() => setSheetMode('confirm-delete')}
                />
              </div>
            ) : sheetMode === 'rename' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ ...TITLE, color: INK }}>
                    Rename chat
                  </span>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={closeSheet}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: SUB,
                      padding: 4,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Chat title"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    background: '#1D222A',
                    border: 'none',
                    outline: 'none',
                    fontSize: 14,
                    color: INK,
                  }}
                />
                <button
                  type="button"
                  disabled={busy || !renameValue.trim()}
                  onClick={handleRenameSave}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: '#FFFFFF',
                    color: '#08090B',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: busy || !renameValue.trim() ? 0.5 : 1,
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ ...TITLE, color: INK }}>
                  {deleteCount > 1
                    ? t('history.delete.group.title', {
                        count: deleteCount,
                        defaultValue: 'Delete all {{count}} conversations?',
                      })
                    : t('history.delete.one.title', { defaultValue: 'Delete this chat?' })}
                </span>
                <span style={{ fontSize: 13, color: SUB, lineHeight: 1.45 }}>
                  {t('history.delete.one.body', { defaultValue: "This can't be undone." })}
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={closeSheet}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#1D222A',
                      color: INK,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDeleteConfirm}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#E5484D',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ChatRow: React.FC<{
  chat: EchoChatRow;
  onOpen: () => void;
  onActions: () => void;
  /** >0 when this row leads a group of identically-titled chats. */
  groupCount?: number;
  expanded?: boolean;
  onToggleGroup?: () => void;
  countLabel?: string;
  indented?: boolean;
}> = ({ chat, onOpen, onActions, groupCount = 0, expanded, onToggleGroup, countLabel, indented }) => {
  const title = (chat.title && chat.title.trim()) || 'New chat';
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        paddingLeft: indented ? 32 : 14,
        borderBottom: `0.5px solid ${HAIRLINE}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <button
          type="button"
          onClick={onOpen}
          className="active:opacity-70"
          style={{
            width: '100%',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {chat.pinned ? <Pin size={12} color={PIN} style={{ flexShrink: 0 }} /> : null}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>
            {relativeTime(chat.last_message_at)}
          </span>
        </button>
        {groupCount > 1 && onToggleGroup ? (
          <button
            type="button"
            onClick={onToggleGroup}
            aria-expanded={!!expanded}
            className="active:opacity-70"
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: 11,
              fontWeight: 600,
              color: SUB,
              cursor: 'pointer',
            }}
          >
            {countLabel}
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="More"
        onClick={onActions}
        className="active:opacity-60"
        style={{
          width: 32,
          height: 32,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: SUB,
          flexShrink: 0,
          marginLeft: 2,
        }}
      >
        <MoreHorizontal size={18} />
      </button>
    </li>
  );
};

const SheetRow: React.FC<{
  label: string;
  onClick: () => void;
  destructive?: boolean;
}> = ({ label, onClick, destructive }) => (
  <button
    type="button"
    onClick={onClick}
    className="active:opacity-70"
    style={{
      width: '100%',
      padding: '12px 4px',
      background: 'transparent',
      border: 'none',
      borderBottom: `0.5px solid ${HAIRLINE}`,
      color: destructive ? '#E5484D' : INK,
      fontSize: 15,
      fontWeight: 500,
      textAlign: 'left',
    }}
  >
    {label}
  </button>
);

export default EchoHistoryPage;
