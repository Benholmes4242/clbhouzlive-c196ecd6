import { useState } from 'react';
import { X, RefreshCw, Link2Off, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { callSyncWhsOne, callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';

interface Props {
  open: boolean;
  onClose: () => void;
  connection: WhsConnection | null | undefined;
  userId: string | undefined;
}

export default function WhsConnectionSheet({ open, onClose, connection, userId }: Props) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  if (!connection) return null;

  const lastSyncedAt = connection.last_synced_at ? new Date(connection.last_synced_at) : null;
  const isAuthFailed = connection.last_sync_status === 'auth_failed';
  const connectedAt = new Date(connection.created_at);

  const invalidateAll = () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: whsKeys.connection(userId) });
      queryClient.invalidateQueries({ queryKey: whsKeys.friendsLeaderboard(userId) });
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

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const data = await callSyncWhsOne();
      if (!data.ok) {
        toast.error(data.message ?? "Couldn't sync right now.");
        return;
      }
      invalidateAll();
      toast.success(data.handicap_changed ? `Handicap updated to ${data.handicap_index?.toFixed(1)}` : 'Refreshed — no changes');
    } catch {
      toast.error("Couldn't reach clbhouz.");
    } finally {
      setIsSyncing(false);
    }
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
      setDeleteText('');
      setConfirmDelete(false);
      onClose();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="bottom"
          className="rounded-t-[20px] bg-background border-0 px-5"
          hideCloseButton
          style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
        >
          <div className="w-9 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1 }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  England Golf
                </span>
              </div>
              <h2 className="text-[20px] font-bold tracking-tight text-foreground">Connection details</h2>
            </div>
            <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Facts */}
          <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}>
            <FactRow label="Membership" value={connection.membership_number} />
            <FactRow label="Passport ID" value={String(connection.passport_id)} />
            <FactRow label="Connected" value={formatDistanceToNow(connectedAt, { addSuffix: true })} />
            <FactRow label="Last sync" value={lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : '—'} isLast />
          </div>

          {/* Status */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-5"
            style={{
              background: isAuthFailed ? 'rgba(247,147,30,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${isAuthFailed ? 'rgba(247,147,30,0.20)' : 'rgba(16,185,129,0.20)'}`,
            }}
          >
            {isAuthFailed ? (
              <AlertTriangle size={16} style={{ color: '#F7931E' }} />
            ) : (
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
            )}
            <span className="text-[13px] font-medium" style={{ color: isAuthFailed ? '#9A5B0E' : '#0F6E4F' }}>
              {isAuthFailed
                ? 'Sync issue — try Disconnect & reconnect'
                : `Synced ${lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : 'recently'}`}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full min-h-[44px]"
              style={{ background: '#F7931E', color: '#ffffff', boxShadow: '0 2px 10px rgba(247,147,30,0.28)' }}
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin mr-2' : 'mr-2'} />
              {isSyncing ? 'Syncing…' : 'Sync now'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setConfirmDisconnect(true)}
              className="w-full min-h-[44px]"
            >
              <Link2Off size={16} className="mr-2" />
              Disconnect
            </Button>

            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 text-[14px] font-medium text-destructive"
            >
              <Trash2 size={16} />
              Delete all data
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Disconnect confirm */}
      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect England Golf?</AlertDialogTitle>
            <AlertDialogDescription>
              Your handicap and round history will be kept. You can reconnect any time to resume daily syncing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} disabled={isWorking}>
              {isWorking ? 'Disconnecting…' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={(v) => { setConfirmDelete(v); if (!v) setDeleteText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all England Golf data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your synced handicap, all your round history, hole-by-hole data,
              and your friends list from England Golf. This cannot be undone.
              <br /><br />
              Your friends on Clbhouz will still see your last known data, but no new updates.
              <br /><br />
              Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteText !== 'DELETE' || isWorking}
              onClick={handleDelete}
            >
              {isWorking ? 'Deleting…' : 'Delete all data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FactRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2"
      style={isLast ? undefined : { borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
    >
      <span className="text-[12px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}
