import React, { useState } from 'react';
import { X, Link2Off, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import { MiniFlag } from '@/components/profile/handicap/whs/connect/MiniFlag';
import { WhsConnectScreen } from '@/components/profile/handicap/whs/WhsConnectScreen';
import DisconnectConfirmSheet from '@/components/settings/sheets/DisconnectConfirmSheet';
import DeleteAllDataConfirmSheet from '@/components/settings/sheets/DeleteAllDataConfirmSheet';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
const RED = '#B91C1C';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
  onConnected?: () => void;
}

/**
 * ONE canonical handicap connect sheet used everywhere (Settings, Edit
 * Profile, Onboarding). When not connected it embeds the existing self-
 * contained WhsConnectScreen flow (country picker → England Golf form →
 * syncing → welcome). When connected it shows the manage view lifted from
 * WhsConnectionSheet (synced facts + disconnect/delete).
 */
export default function HandicapConnectSheet({ open, onClose, userId, onConnected }: Props) {
  const queryClient = useQueryClient();
  const { data: connection } = useWhsConnection(userId);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const invalidateAll = (conn?: WhsConnection | null) => {
    const c = conn ?? connection;
    if (userId) {
      queryClient.invalidateQueries({ queryKey: whsKeys.connection(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendLeaderboard(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendWindowRankings(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendsActivity(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendCourseBests(userId) });
    }
    if (c) {
      queryClient.invalidateQueries({ queryKey: whsKeys.trend(c.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.lastRound(c.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.counters(c.id) });
      queryClient.invalidateQueries({ queryKey: whsKeys.allScores(c.id) });
    }
    queryClient.invalidateQueries({ queryKey: ['whs-round-detail'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
  };

  const handleDisconnect = async () => {
    setIsWorking(true);
    try {
      const res = await callDisconnectWhs();
      if (!res.ok) {
        toast.error(res.error ?? 'Disconnect failed.');
        return;
      }
      invalidateAll();
      toast.success('Disconnected', { description: 'Your historical data is kept.' });
      setConfirmDisconnect(false);
      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    setIsWorking(true);
    try {
      const res = await callDeleteWhsData();
      if (!res.ok) {
        toast.error(res.error ?? 'Delete failed.');
        return;
      }
      invalidateAll();
      toast.success('Data deleted');
      setConfirmDelete(false);
      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  const handleConnected = () => {
    invalidateAll();
    onConnected?.();
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="p-0 rounded-t-[20px] border-0 max-h-[92dvh] flex flex-col"
          style={{ fontFamily: FONT, color: INK, background: '#fff' }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.18)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '4px 20px 16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MiniFlag iso="GB-ENG" />
                <SectionEyebrow label="England Golf" color="amber" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', margin: 0, lineHeight: 1.2 }}>
                {connection ? 'Connection details' : 'Connect handicap'}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'transparent', border: 'none', padding: 6, marginLeft: 8, cursor: 'pointer', color: INK_55 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            {connection ? (
              <SyncedBody
                connection={connection}
                onDisconnect={() => setConfirmDisconnect(true)}
                onDelete={() => setConfirmDelete(true)}
              />
            ) : (
              <div style={{ padding: '0 8px' }}>
                <WhsConnectScreen onConnected={handleConnected} onSkip={onClose} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DisconnectConfirmSheet
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={handleDisconnect}
        isWorking={isWorking}
      />

      <DeleteAllDataConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        isWorking={isWorking}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SYNCED STATE (lifted verbatim from WhsConnectionSheet)
// ─────────────────────────────────────────────────────────────────────

const SyncedBody: React.FC<{
  connection: WhsConnection;
  onDisconnect: () => void;
  onDelete: () => void;
}> = ({ connection, onDisconnect, onDelete }) => {
  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isAuthFailed = connection.last_sync_status === 'auth_failed';
  const connectedAt = new Date(connection.created_at);

  return (
    <div style={{ padding: '4px 20px 24px' }}>
      <div style={{
        background: '#F8FAFC',
        border: '0.5px solid rgba(15,23,42,0.10)',
        borderRadius: 14,
        padding: '4px 16px',
        marginBottom: 16,
      }}>
        <FactRow label="Membership" value={connection.membership_number || '—'} />
        <FactRow label="Passport ID" value={String(connection.passport_id ?? '—')} />
        <FactRow label="Connected" value={formatDistanceToNow(connectedAt, { addSuffix: true })} />
        <FactRow
          label="Last sync"
          value={lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : '—'}
          isLast
        />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderRadius: 999,
        background: isAuthFailed ? 'rgba(247,147,30,0.10)' : 'rgba(5,150,105,0.10)',
        marginBottom: 12,
      }}>
        {isAuthFailed
          ? <AlertTriangle size={16} color={AMBER} strokeWidth={2.4} />
          : <CheckCircle2 size={16} color={GREEN} strokeWidth={2.4} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: isAuthFailed ? AMBER : GREEN }}>
          {isAuthFailed
            ? 'Sync issue — try disconnect & reconnect'
            : `Synced ${lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : 'recently'}`}
        </span>
      </div>

      <p style={{ fontSize: 13, color: INK_55, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
        Your handicap syncs automatically twice daily.
      </p>

      <button
        onClick={onDisconnect}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px 16px', borderRadius: 12,
          background: '#fff', color: INK,
          border: '1px solid rgba(15,23,42,0.14)',
          fontSize: 15, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <Link2Off size={16} />
        Disconnect
      </button>

      <button
        onClick={onDelete}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '11px 16px', borderRadius: 12,
          background: 'transparent', color: RED,
          border: 'none',
          fontSize: 13, fontWeight: 500, fontFamily: FONT, cursor: 'pointer',
        }}
      >
        <Trash2 size={14} />
        Delete all data
      </button>
    </div>
  );
};

function FactRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.08)',
    }}>
      <SectionEyebrow label={label} />
      <span style={{ fontSize: 14, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}
