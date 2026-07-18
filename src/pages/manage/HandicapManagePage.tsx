import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatRelativeAgoLong } from '@/i18n/format';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import { WhsConnectScreen } from '@/components/profile/handicap/whs/WhsConnectScreen';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import DisconnectConfirmSheet from '@/components/settings/sheets/DisconnectConfirmSheet';
import DeleteAllDataConfirmSheet from '@/components/settings/sheets/DeleteAllDataConfirmSheet';
import { useDeclineHandicapChip } from '@/lib/whs/useDeclineHandicapChip';

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';
const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.08)';
const AMBER_SOFT_BG = 'rgba(180,83,9,0.08)';
const AMBER_SOFT_FG = '#B45309';
const DANGER = '#DC2626';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

export default function HandicapManagePage() {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: connection } = useWhsConnection(userId);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const declineHandicapChip = useDeclineHandicapChip();

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
    <ManagePageShell title={connection ? bodyNameForProvider(connection.provider) : 'Connect your official WHS handicap'}>
      <div className="px-4 pt-4 pb-0">
        {connection ? (
          <SyncedBody
            connection={connection}
            onDisconnect={() => setConfirmDisconnect(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        ) : (
          <WhsConnectScreen
            onConnected={async () => {
              invalidateAll();
              navigate('/handicap', { replace: true });
            }}
            onSkip={() => { /* stay on page */ }}
          />
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

  const rows = [
    { label: 'Membership', value: connection.membership_number || '--' },
    { label: 'Passport ID', value: String(connection.passport_id ?? '--') },
    { label: 'Connected', value: formatRelativeAgoLong(connectedAt.toISOString()) },
    { label: 'Last sync', value: lastSyncedAt ? formatRelativeAgoLong(lastSyncedAt.toISOString()) : '--' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT }}>
      {/* Facts card */}
      <div style={{ background: '#fff', border: `1px solid ${HAIR}`, borderRadius: 16, padding: '4px 16px' }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${HAIR}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK_45,
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: INK,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {/* Status pill */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 999,
            background: isAuthFailed ? AMBER_SOFT_BG : GREEN_BG,
          }}
        >
          {isAuthFailed ? (
            <AlertTriangle size={15} color={AMBER_SOFT_FG} strokeWidth={2.4} />
          ) : (
            <CheckCircle2 size={15} color={GREEN} strokeWidth={2.4} />
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isAuthFailed ? AMBER_SOFT_FG : GREEN,
            }}
          >
            {isAuthFailed
              ? 'Sync issue, try disconnect and reconnect'
              : `Synced ${lastSyncedAt ? formatRelativeAgoLong(lastSyncedAt.toISOString()) : 'recently'}`}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: INK_45, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
        Your handicap syncs automatically twice daily.
      </p>

      <button
        onClick={onDisconnect}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 52,
          padding: '12px 16px',
          borderRadius: 14,
          background: '#fff',
          color: INK,
          border: `1px solid ${HAIR}`,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: FONT,
          cursor: 'pointer',
        }}
      >
        <Link2 size={16} color={INK} />
        Disconnect
      </button>

      <button
        onClick={onDelete}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'transparent',
          color: DANGER,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: FONT,
          cursor: 'pointer',
        }}
      >
        <Trash2 size={14} />
        Delete all data
      </button>
    </div>
  );
};
