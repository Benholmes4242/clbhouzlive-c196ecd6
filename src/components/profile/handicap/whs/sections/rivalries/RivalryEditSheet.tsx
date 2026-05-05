import React, { useMemo, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { X, Search, Trash2, Check } from 'lucide-react';
import { useFriendLeaderboard, useUpsertRivalOverride, useDeleteRivalOverride } from '@/lib/whs/hooks';
import { initials, firstName } from '@/lib/whs/utils/initials';
import { fmtHcp } from '@/lib/whs/format';
import { toast } from 'sonner';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  userId: string;
  rivalry: FriendRivalryHydrated | null;
  slotIndex: number | null;
  open: boolean;
  onClose: () => void;
}

const INK = '#0F172A';
const INK_MUTE = 'rgba(15,23,42,0.55)';
const HAIRLINE = 'rgba(15,23,42,0.08)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const AMBER_TINT = 'rgba(247,147,30,0.10)';

export const RivalryEditSheet: React.FC<Props> = ({ userId, rivalry, slotIndex, open, onClose }) => {
  const [query, setQuery] = useState('');
  const { data: leaderboard, isLoading } = useFriendLeaderboard(userId);
  const upsert = useUpsertRivalOverride();
  const remove = useDeleteRivalOverride();

  const candidates = useMemo(() => {
    const rows = (leaderboard ?? []).filter((e) => !e.is_self);
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.friend_name.toLowerCase().includes(q));
  }, [leaderboard, query]);

  const isPinned = rivalry?.slot_kind === 'pinned';
  const sIdx = slotIndex ?? rivalry?.slot_index ?? null;

  const handlePick = async (friend_row_id: string | null, friend_user_id: string | null) => {
    if (sIdx === null) return;
    try {
      await upsert.mutateAsync({
        userId,
        slotIndex: sIdx,
        rival_user_id: friend_user_id ?? undefined,
        rival_friend_row_id: friend_row_id ?? undefined,
      });
      toast.success('Rival pinned');
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not pin rival');
    }
  };

  const handleUnpin = async () => {
    if (sIdx === null) return;
    try {
      await remove.mutateAsync({ userId, slotIndex: sIdx });
      toast.success('Pin removed');
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not remove pin');
    }
  };

  const busy = upsert.isPending || remove.isPending;

  return (
    <DrawerPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 80 }} />
        <DrawerPrimitive.Content
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 81,
            background: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'SF Pro Display, system-ui, sans-serif',
          }}
        >
          <DrawerPrimitive.Title className="sr-only">Edit rival</DrawerPrimitive.Title>
          <div aria-hidden style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.15)' }} />
          </div>

          <div style={{ padding: '8px 20px 12px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ width: 3, height: 8, borderRadius: 1, background: AMBER }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: AMBER, letterSpacing: '0.16em' }}>
                  PIN A RIVAL · SLOT {(sIdx ?? 0) + 1}
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(15,23,42,0.06)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} color={INK} strokeWidth={2.4} />
              </button>
            </div>

            <h3 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
              letterSpacing: '-0.02em',
              color: INK,
              lineHeight: 1.15,
            }}>
              {rivalry?.rival_name ? `Replace ${firstName(rivalry.rival_name)}` : 'Choose a rival'}
            </h3>
            <p style={{ margin: '6px 0 12px', fontSize: 13, color: INK_MUTE, lineHeight: 1.5 }}>
              Pick someone from your circle. Pinned rivals stay in your slot until you remove them.
            </p>

            {/* Search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.04)',
              border: `1px solid ${HAIRLINE}`,
            }}>
              <Search size={14} color={INK_MUTE} strokeWidth={2.2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your circle"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: INK,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {isPinned && (
              <button
                onClick={handleUnpin}
                disabled={busy}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.20)',
                  color: '#B91C1C',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: busy ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Trash2 size={13} strokeWidth={2.2} />
                Unpin — let auto-pick choose
              </button>
            )}
          </div>

          {/* Picker list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 24px' }}>
            {isLoading ? (
              <div style={{ padding: 20, color: INK_MUTE, fontSize: 13 }}>Loading your circle…</div>
            ) : candidates.length === 0 ? (
              <div style={{ padding: 20, color: INK_MUTE, fontSize: 13 }}>
                No one matches “{query}”.
              </div>
            ) : (
              candidates.map((c) => {
                const rowId = (c as any).friend_row_id as string | undefined;
                const isCurrent = rivalry?.rival_friend_row_id && rowId === rivalry.rival_friend_row_id;
                return (
                  <button
                    key={`${c.friend_user_id ?? c.friend_connection_id ?? c.friend_name}`}
                    onClick={() => handlePick(rowId ?? null, c.friend_user_id)}
                    disabled={busy}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${HAIRLINE}`,
                      cursor: busy ? 'wait' : 'pointer',
                      textAlign: 'left',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: '34%',
                      overflow: 'hidden',
                      background: 'rgba(15,23,42,0.06)',
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {c.friend_thumbnail_url ? (
                        <img src={c.friend_thumbnail_url} alt={c.friend_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{initials(c.friend_name)}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 14, fontWeight: 700, color: INK,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {firstName(c.friend_name)}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
                        HCP {fmtHcp(c.friend_handicap_index)}
                        {!c.is_clbhouz_user && (
                          <span style={{ marginLeft: 8, color: AMBER_DEEP, fontWeight: 700, letterSpacing: '0.08em', fontSize: 9 }}>
                            INVITE
                          </span>
                        )}
                      </p>
                    </div>
                    {isCurrent && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 8px', borderRadius: 999,
                        background: AMBER_TINT, color: AMBER_DEEP,
                        fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
                        border: '1px solid rgba(247,147,30,0.20)',
                      }}>
                        <Check size={10} strokeWidth={2.5} />CURRENT
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default RivalryEditSheet;
