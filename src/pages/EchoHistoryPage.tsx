import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MoreHorizontal, Pin, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useEchoChats, type EchoChatRow } from '@/features/echo-v2/hooks/useEchoChats';
import { AnimatedEchoWave } from '@/features/echo-v2/components/AnimatedEchoWave';
import { formatRelativeRounded } from '@/i18n/format';
import { toast } from '@/lib/toast';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SUB = '#8A9099';
const MUTED = '#AEB4BC';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(0,0,0,0.07)';
const BOTTOM_NAV_CLEAR = 'calc(env(safe-area-inset-bottom, 0px) + 32px)';

const relativeTime = formatRelativeRounded;



type SheetMode = null | 'actions' | 'rename' | 'confirm-delete';

const EchoHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: chats = [], isLoading, isError, refetch } = useEchoChats();

  const [sheetChatId, setSheetChatId] = useState<string | null>(null);
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

  const closeSheet = useCallback(() => {
    setSheetMode(null);
    setSheetChatId(null);
    setRenameValue('');
    setBusy(false);
  }, []);

  const openActions = useCallback((c: EchoChatRow) => {
    setSheetChatId(c.id);
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
    const id = sheetChat.id;
    patchList((rows) => rows.filter((r) => r.id !== id));
    closeSheet();
    const { error } = await supabase.from('echo_chats').delete().eq('id', id);
    if (error) {
      toast.error("Couldn't delete this chat");
      void qc.invalidateQueries({ queryKey: ['echo-v2', 'chats'] });
    }
  }, [sheetChat, patchList, closeSheet, qc]);

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
          <span style={{ fontSize: 15, fontWeight: 600, color: INK, flex: 1 }}>
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
                  <Skeleton variant="light" style={{ width: 12, height: 12, borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton variant="light" style={{ width: '65%', height: 14, borderRadius: 7 }} />
                    <Skeleton variant="light" style={{ width: '40%', height: 12, borderRadius: 6 }} />
                  </div>
                  <Skeleton variant="light" style={{ width: 36, height: 11, borderRadius: 5, flexShrink: 0 }} />
                  <Skeleton variant="light" style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0 }} />
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
                  background: '#15171F',
                  color: '#F5F6F7',
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
                  background: '#15171F',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AnimatedEchoWave size={28} active={false} />
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
              {chats.map((c) => {
                const title = (c.title && c.title.trim()) || 'New chat';
                return (
                  <li
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderBottom: `0.5px solid ${HAIRLINE}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/echo/${c.id}`, { state: { from: 'history' } })
                      }
                      className="active:opacity-70"
                      style={{
                        flex: 1,
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
                      {c.pinned ? (
                        <Pin size={12} color={AMBER} style={{ flexShrink: 0 }} />
                      ) : null}
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
                      <span
                        style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}
                      >
                        {relativeTime(c.last_message_at)}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="More"
                      onClick={() => openActions(c)}
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
            background: 'rgba(15,23,42,0.35)',
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
              background: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '12px 16px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
              boxShadow: '0 -8px 24px rgba(15,23,42,0.12)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                background: '#E2E8F0',
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
                  <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
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
                    background: '#EDEFF2',
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
                    background: '#15171F',
                    color: '#F5F6F7',
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
                <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>
                  Delete this chat?
                </span>
                <span style={{ fontSize: 13, color: SUB, lineHeight: 1.45 }}>
                  This can&apos;t be undone.
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={closeSheet}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: '#EDEFF2',
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
                      background: '#B42318',
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
      color: destructive ? '#B42318' : INK,
      fontSize: 15,
      fontWeight: 500,
      textAlign: 'left',
    }}
  >
    {label}
  </button>
);

export default EchoHistoryPage;
