import React, { useMemo, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Search } from 'lucide-react';
import SheetHeader from '@/components/ui/SheetHeader';
import {
  useFriendLeaderboard,
  useFriendRivalries,
  useUpsertRivalOverride,
  useDeleteRivalOverride,
  useDismissRival,
  useClearRivalDismissal,
} from '@/lib/whs/hooks';
import { firstName } from '@/lib/whs/utils/initials';
import { toast } from 'sonner';
import { PinnedRivalRow } from './PinnedRivalRow';
import { AutoPickedRow } from './AutoPickedRow';
import { CandidateRow } from './CandidateRow';
import { RemoveLastConfirmation } from './RemoveLastConfirmation';
import { nextAvailableSlot } from './_shared/nextAvailableSlot';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

const FONT = 'Geist, system-ui, -apple-system, sans-serif';
const INK_MUTE = 'var(--hcp-t-60)';
const HAIRLINE = 'var(--hcp-line-2)';

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export const ManageRivalsSheet: React.FC<Props> = ({ userId, open, onClose }) => {
  const [query, setQuery] = useState('');
  const [removalTarget, setRemovalTarget] = useState<FriendRivalryHydrated | null>(null);

  const { data: rivalries = [], isLoading: rivalriesLoading } = useFriendRivalries(userId);
  const { data: leaderboard = [], isLoading: lbLoading } = useFriendLeaderboard(userId);
  const upsert = useUpsertRivalOverride();
  const remove = useDeleteRivalOverride();
  const dismiss = useDismissRival();
  const clearDismissal = useClearRivalDismissal();

  const pinned = useMemo(
    () =>
      rivalries
        .filter((r) => r.slot_kind === 'pinned')
        .sort((a, b) => a.slot_index - b.slot_index),
    [rivalries],
  );
  const autoPicked = useMemo(
    () => rivalries.filter((r) => r.slot_kind !== 'pinned'),
    [rivalries],
  );

  const currentIdentifiers = useMemo(() => {
    const set = new Set<string>();
    for (const r of rivalries) {
      if (r.rival_user_id) set.add(`u:${r.rival_user_id}`);
      if (r.rival_friend_row_id) set.add(`f:${r.rival_friend_row_id}`);
    }
    return set;
  }, [rivalries]);

  const candidates = useMemo(() => {
    const rows = (leaderboard ?? []).filter((e) => {
      if (e.is_self) return false;
      if (e.friend_user_id && currentIdentifiers.has(`u:${e.friend_user_id}`)) return false;
      if (e.friend_row_id && currentIdentifiers.has(`f:${e.friend_row_id}`)) return false;
      return true;
    });
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.friend_name.toLowerCase().includes(q));
  }, [leaderboard, currentIdentifiers, query]);

  const busy = upsert.isPending || remove.isPending || dismiss.isPending || clearDismissal.isPending;

  const identityOf = (
    friend_user_id: string | null,
    friend_row_id: string | null,
  ) =>
    friend_user_id
      ? { rival_user_id: friend_user_id, rival_friend_row_id: null }
      : { rival_user_id: null, rival_friend_row_id: friend_row_id };

  const handleAdd = async (
    friend_user_id: string | null,
    friend_row_id: string | null,
  ) => {
    const slotIndex = nextAvailableSlot(rivalries);
    const identity = identityOf(friend_user_id, friend_row_id);
    try {
      await clearDismissal.mutateAsync({ userId, identity });
      await upsert.mutateAsync({ userId, slotIndex, ...identity });
      toast.success('Rival pinned');
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not pin rival');
    }
  };

  const handlePinAuto = async (rivalry: FriendRivalryHydrated) => {
    const identity = identityOf(rivalry.rival_user_id, rivalry.rival_friend_row_id);
    try {
      await clearDismissal.mutateAsync({ userId, identity });
      await upsert.mutateAsync({
        userId,
        slotIndex: rivalry.slot_index,
        ...identity,
      });
      toast.success(`${firstName(rivalry.rival_name ?? 'Rival')} pinned`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not pin rival');
    }
  };

  const handleDismissAuto = async (rivalry: FriendRivalryHydrated) => {
    const identity = identityOf(rivalry.rival_user_id, rivalry.rival_friend_row_id);
    try {
      await dismiss.mutateAsync({ userId, identity });
      toast.success(`${firstName(rivalry.rival_name ?? 'Rival')} won't be suggested again`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not dismiss');
    }
  };

  const handleRemoveRequest = (rivalry: FriendRivalryHydrated) => {
    if (pinned.length === 1) {
      setRemovalTarget(rivalry);
    } else {
      void doRemove(rivalry);
    }
  };

  const doRemove = async (rivalry: FriendRivalryHydrated) => {
    try {
      await remove.mutateAsync({ userId, slotIndex: rivalry.slot_index });
      toast.success(`${firstName(rivalry.rival_name ?? 'Rival')} removed`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not remove rival');
    } finally {
      setRemovalTarget(null);
    }
  };

  const isLoading = rivalriesLoading || lbLoading;

  return (
    <>
      <DrawerPrimitive.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 80 }}
          />
          <DrawerPrimitive.Content
            className="hcp-dark"
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 81,
              background: 'var(--hcp-bg-1)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: '75dvh',
              maxHeight: '75dvh',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: FONT,
            }}
          >
            <DrawerPrimitive.Title className="sr-only">Manage rivals</DrawerPrimitive.Title>
            <div
              aria-hidden
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '8px 0 4px',
                flexShrink: 0,
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hcp-line-2)' }} />
            </div>

            <SheetHeader
              eyebrow="MANAGE RIVALS"
              title="Your rivals"
              sub="Pin the rivals you want to track. Auto-picks fill any open slots."
              onClose={onClose}
              dark
            />

            <div style={{ padding: '10px 16px 10px', flexShrink: 0 }}>
              <SearchField value={query} onChange={setQuery} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
              {isLoading && rivalries.length === 0 && (leaderboard?.length ?? 0) === 0 ? (
                <div style={{ padding: 20, color: INK_MUTE, fontSize: 13 }}>
                  Loading your circle…
                </div>
              ) : (
                <>
                  {pinned.length > 0 && (
                    <Section title={`PINNED (${pinned.length})`}>
                      {pinned.map((r) => (
                        <PinnedRivalRow
                          key={`pinned-${r.slot_index}`}
                          rivalry={r}
                          busy={busy}
                          onRemove={() => handleRemoveRequest(r)}
                        />
                      ))}
                    </Section>
                  )}

                  {autoPicked.length > 0 && (
                    <Section
                      title="AUTO-PICKED"
                      subtitle="Tap ✕ to stop suggesting someone."
                    >
                      {autoPicked.map((r) => (
                        <AutoPickedRow
                          key={`auto-${r.slot_index}`}
                          rivalry={r}
                          onPin={() => handlePinAuto(r)}
                          onDismiss={() => handleDismissAuto(r)}
                          busy={busy}
                        />
                      ))}
                    </Section>
                  )}

                  <Section title="ADD FROM YOUR CIRCLE">
                    {candidates.length === 0 ? (
                      <div style={{ padding: '12px 8px', color: INK_MUTE, fontSize: 13 }}>
                        {query.trim()
                          ? `No one matches "${query}".`
                          : 'Everyone in your circle is already in your rivals list.'}
                      </div>
                    ) : (
                      candidates.map((c) => (
                        <CandidateRow
                          key={c.friend_user_id ?? c.friend_row_id ?? c.friend_connection_id ?? c.friend_name}
                          candidate={c}
                          onAdd={() => handleAdd(c.friend_user_id, c.friend_row_id)}
                          busy={busy}
                        />
                      ))
                    )}
                  </Section>
                </>
              )}
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>

      <RemoveLastConfirmation
        open={!!removalTarget}
        busy={busy}
        onCancel={() => setRemovalTarget(null)}
        onConfirm={() => removalTarget && doRemove(removalTarget)}
      />
    </>
  );
};

const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ marginTop: 12 }}>
    <p
      style={{
        margin: '0 0 8px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: '#C97211',
        fontFamily: FONT,
      }}
    >
      {title}
    </p>
    {subtitle && (
      <p style={{ margin: '0 0 8px', fontSize: 12, color: INK_MUTE, fontFamily: FONT }}>
        {subtitle}
      </p>
    )}
    <div>{children}</div>
  </div>
);

const SearchField: React.FC<{ value: string; onChange: (v: string) => void }> = ({
  value,
  onChange,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      borderRadius: 10,
      background: 'var(--hcp-bg-2)',
      border: `1px solid ${HAIRLINE}`,
    }}
  >
    <Search size={14} color={INK_MUTE} strokeWidth={2.2} />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search your circle"
      style={{
        flex: 1,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: 14,
        color: 'var(--hcp-t-100)',
        fontFamily: 'inherit',
      }}
    />
  </div>
);

export default ManageRivalsSheet;
