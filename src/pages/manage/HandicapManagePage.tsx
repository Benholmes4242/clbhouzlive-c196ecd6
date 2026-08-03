import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatRelativeAgoLong } from '@/i18n/format';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import { WhsConnectScreen } from '@/components/profile/handicap/whs/WhsConnectScreen';
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import { MiniFlag } from '@/components/profile/handicap/whs/connect/MiniFlag';
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
  const { data: connection, isLoading: connectionLoading } = useWhsConnection(userId);
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

  if (connectionLoading) {
    return (
      <ManagePageShell title="Handicap">
        <div className="px-4 pt-4 pb-0 space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </ManagePageShell>
    );
  }

  return (
    <ManagePageShell title={connection ? bodyNameForProvider(connection.provider) : 'Connect your official WHS handicap'} fill>
      <div className="px-4 pt-4 pb-0 flex flex-col flex-1 min-h-0">
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
            onDecline={declineHandicapChip}
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

const isoForProvider = (provider: string | null | undefined): string => {
  if (!provider) return 'GB-ENG';
  const p = provider.toLowerCase();
  if (p.includes('england')) return 'GB-ENG';
  if (p.includes('scotland')) return 'GB-SCT';
  if (p.includes('wales')) return 'GB-WLS';
  if (p.includes('ireland')) return 'IE';
  return 'GB-ENG';
};

const SyncedBody: React.FC<{
  connection: WhsConnection;
  onDisconnect: () => void;
  onDelete: () => void;
}> = ({ connection, onDisconnect, onDelete }) => {
  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  // Single source of truth - see src/lib/whs/syncHealth.ts. Status only, never last_sync_error.
  const isAuthFailed = getSyncHealth(connection).kind === 'reauth_auth';

  const connectedAt = new Date(connection.created_at);
  const bodyName = bodyNameForProvider(connection.provider);
  const iso = isoForProvider(connection.provider);

  const tiles = [
    { label: 'Membership', value: connection.membership_number || '--' },
    { label: 'Passport ID', value: String(connection.passport_id ?? '--') },
    { label: 'Connected', value: formatRelativeAgoLong(connectedAt.toISOString()) },
    { label: 'Last sync', value: lastSyncedAt ? formatRelativeAgoLong(lastSyncedAt.toISOString()) : '--' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ fontFamily: FONT, padding: '20px 0 8px' }}>
      {/* Middle region - centered */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {/* Identity cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ transform: 'scale(1.35)', transformOrigin: 'center' }}>
            <MiniFlag iso={iso} />
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: INK_45,
            }}
          >
            Connected to {bodyName}
          </div>
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
              <AlertTriangle size={16} color={AMBER_SOFT_FG} strokeWidth={2.4} />
            ) : (
              <CheckCircle2 size={16} color={GREEN} strokeWidth={2.4} />
            )}
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: isAuthFailed ? AMBER_SOFT_FG : GREEN,
              }}
            >
              {isAuthFailed
                ? 'Sync issue, try disconnect and reconnect'
                : `Synced ${lastSyncedAt ? formatRelativeAgoLong(lastSyncedAt.toISOString()) : 'recently'}`}
            </span>
          </div>
          <p style={{ fontSize: 13, color: INK_45, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
            Your handicap syncs automatically twice daily.
          </p>
        </div>

        {/* 2x2 tile grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {tiles.map((t) => (
            <div
              key={t.label}
              style={{
                background: '#fff',
                border: `1px solid ${HAIR}`,
                borderRadius: 16,
                padding: '18px 14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK_45,
                }}
              >
                {t.label}
              </div>
              <div
                style={{
                  fontSize: 'clamp(16px, 4.6vw, 19px)',
                  fontWeight: 800,
                  color: INK,
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pinned actions */}
      <div style={{ padding: '14px 0 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onDisconnect}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 54,
            padding: '12px 16px',
            borderRadius: 16,
            background: '#fff',
            color: INK,
            border: `1px solid ${HAIR}`,
            fontSize: 15.5,
            fontWeight: 800,
            fontFamily: FONT,
            cursor: 'pointer',
          }}
        >
          <Link2 size={18} color={INK} />
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
            minHeight: 44,
            padding: '10px 16px',
            borderRadius: 12,
            background: 'transparent',
            color: DANGER,
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: FONT,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={16} />
          Delete all data
        </button>
      </div>
    </div>
  );
};
