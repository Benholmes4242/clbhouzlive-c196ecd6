import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Link2Off, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';
import { MiniFlag } from '@/components/profile/handicap/whs/connect/MiniFlag';
import DisconnectConfirmSheet from './DisconnectConfirmSheet';
import DeleteAllDataConfirmSheet from './DeleteAllDataConfirmSheet';

const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';
const RED = '#B91C1C';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  open: boolean;
  onClose: () => void;
  connection: WhsConnection | null | undefined;
  userId: string | undefined;
}

export default function WhsConnectionSheet({ open, onClose, connection, userId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const invalidateAll = () => {
    if (!connection) return;
    if (userId) {
      queryClient.invalidateQueries({ queryKey: whsKeys.connection(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendLeaderboard(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendWindowRankings(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendsActivity(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendCourseBests(userId) });
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.trend(connection.id) });
    queryClient.invalidateQueries({ queryKey: whsKeys.lastRound(connection.id) });
    queryClient.invalidateQueries({ queryKey: ['whs-round-detail'] });
    queryClient.invalidateQueries({ queryKey: whsKeys.counters(connection.id) });
    queryClient.invalidateQueries({ queryKey: whsKeys.allScores(connection.id) });
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

  const handleConnectCta = () => {
    onClose();
    navigate('/handicap');
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
              <EmptyBody onConnect={handleConnectCta} />
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
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────

const HeroArt: React.FC = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
    <defs>
      <radialGradient id="whs-sheet-globe-grad" cx="0.35" cy="0.30" r="0.75">
        <stop offset="0%" stopColor="#FFE5C2"/>
        <stop offset="60%" stopColor="#F7931E"/>
        <stop offset="100%" stopColor="#C97211"/>
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="108" rx="32" ry="4" fill="rgba(15,23,42,0.10)" />
    <circle cx="60" cy="58" r="42" fill="url(#whs-sheet-globe-grad)" stroke={INK} strokeWidth="2" />
    <ellipse cx="60" cy="58" rx="42" ry="14" fill="none" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <ellipse cx="60" cy="58" rx="22" ry="42" fill="none" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <line x1="18" y1="58" x2="102" y2="58" stroke="rgba(15,23,42,0.40)" strokeWidth="1" />
    <line x1="60" y1="16" x2="60" y2="-2" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    <path d="M 60 0 L 78 4 L 60 8 Z" fill={AMBER} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
    <ellipse cx="48" cy="42" rx="8" ry="6" fill="rgba(255,255,255,0.30)" />
  </svg>
);

const EmptyBody: React.FC<{ onConnect: () => void }> = ({ onConnect }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 24px 28px' }}>
    <div style={{ marginBottom: 20 }}>
      <HeroArt />
    </div>

    <p style={{ fontSize: 15, lineHeight: 1.5, color: INK_55, margin: '0 0 24px', maxWidth: 320 }}>
      Link your handicap to track every round, watch your index move, and play against your friends.
    </p>

    <button
      onClick={onConnect}
      style={{
        width: '100%', maxWidth: 360,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '14px 18px', borderRadius: 12,
        background: AMBER, color: '#fff', border: 'none',
        fontSize: 15, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
      }}
    >
      Connect handicap
      <ArrowRight size={18} strokeWidth={2.4} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────
// SYNCED STATE
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
      {/* Facts card */}
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

      {/* Status pill */}
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

      {/* Sync frequency info */}
      <p style={{ fontSize: 13, color: INK_55, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
        Your handicap syncs automatically twice daily.
      </p>

      {/* Actions */}
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
