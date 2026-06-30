import React, { useState } from 'react';
import { Link2Off, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
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

export default function HandicapManagePage() {
  const { user } = useSupabaseSession();
  const userId = user?.id;
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
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <ManagePageShell title={connection ? 'England Golf' : 'Connect handicap'}>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-3 px-1">
          <MiniFlag iso="GB-ENG" />
          <span className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: AMBER, fontFamily: FONT }}>
            England Golf
          </span>
        </div>

        {connection ? (
          <SyncedBody
            connection={connection}
            onDisconnect={() => setConfirmDisconnect(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
            <WhsConnectScreen onConnected={() => { invalidateAll(); }} onSkip={() => { /* stay on page */ }} />
          </div>
        )}
      </div>

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
    </ManagePageShell>
  );
}

const SyncedBody: React.FC<{
  connection: WhsConnection;
  onDisconnect: () => void;
  onDelete: () => void;
}> = ({ connection, onDisconnect, onDelete }) => {
  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isAuthFailed = connection.last_sync_status === 'auth_failed';
  const connectedAt = new Date(connection.created_at);

  return (
    <div className="space-y-4">
      {/* Facts card */}
      <div className="rounded-2xl px-4" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
        <FactRow label="Membership" value={connection.membership_number || '\u2014'} />
        <FactRow label="Passport ID" value={String(connection.passport_id ?? '\u2014')} />
        <FactRow label="Connected" value={formatDistanceToNow(connectedAt, { addSuffix: true })} />
        <FactRow
          label="Last sync"
          value={lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : '\u2014'}
          isLast
        />
      </div>

      {/* Status pill */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 999,
          background: isAuthFailed ? 'rgba(247,147,30,0.10)' : 'rgba(5,150,105,0.10)',
        }}
      >
        {isAuthFailed
          ? <AlertTriangle size={16} color={AMBER} strokeWidth={2.4} />
          : <CheckCircle2 size={16} color={GREEN} strokeWidth={2.4} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: isAuthFailed ? AMBER : GREEN, fontFamily: FONT }}>
          {isAuthFailed
            ? 'Sync issue \u2014 try disconnect & reconnect'
            : `Synced ${lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : 'recently'}`}
        </span>
      </div>

      <p style={{ fontSize: 13, color: INK_55, textAlign: 'center', lineHeight: 1.5, fontFamily: FONT }}>
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
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '0.5px solid rgba(15,23,42,0.08)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: INK_55, fontFamily: FONT }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: INK, fontVariantNumeric: 'tabular-nums', fontFamily: FONT }}>
        {value}
      </span>
    </div>
  );
}
