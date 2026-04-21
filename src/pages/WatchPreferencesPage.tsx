import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Bookmark, EyeOff, Undo2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useWatchPreferences } from '@/components/watch/hooks/useWatchPreferences';
import { useUcpSignal } from '@/components/watch/hooks/useUcpSignal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { WatchPreferenceRow } from '@/components/watch/hooks/useWatchPreferences';

type Tab = 'dismissed' | 'saved';

export default function WatchPreferencesPage() {
  useHideBottomNav();
  useHideHeader();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('dismissed');
  const [resetOpen, setResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { data: rows = [], isLoading } = useWatchPreferences(userId, tab);
  const { remove } = useUcpSignal(userId);

  const handleUndo = async (row: WatchPreferenceRow) => {
    await remove({ postId: row.postId, signalType: row.signalType });
    toast.success(tab === 'dismissed' ? "We'll show this again" : 'Removed from saved');
  };

  const handleReset = async () => {
    if (!userId) return;
    setIsResetting(true);
    const { error } = await (supabase.rpc as any)('reset_watch_personalization', {
      p_user_id: userId,
    });
    setIsResetting(false);
    setResetOpen(false);
    if (error) {
      toast.error('Could not reset personalization');
      return;
    }
    toast.success('Personalization reset');
    queryClient.invalidateQueries({ queryKey: ['watch-preferences'] });
    queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
    queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-1 pb-4">
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(15,23,42,0.05)',
            border: '0.5px solid rgba(15,23,42,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={2.5} style={{ color: '#64748B' }} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              Watch
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
            Preferences
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2 flex gap-6" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.08)' }}>
        <TabButton
          active={tab === 'dismissed'}
          onClick={() => setTab('dismissed')}
          icon={<EyeOff size={14} />}
          label="Not Interested"
        />
        <TabButton
          active={tab === 'saved'}
          onClick={() => setTab('saved')}
          icon={<Bookmark size={14} />}
          label="Saved"
        />
      </div>

      {/* List */}
      <div className="px-4 pt-3 pb-32">
        {isLoading ? (
          <div className="text-center text-sm text-slate-500 py-12">Loading…</div>
        ) : rows.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="flex flex-col">
            {rows.map((row) => (
              <PreferenceRow key={row.id} row={row} tab={tab} onUndo={() => handleUndo(row)} />
            ))}
          </div>
        )}

        {/* Reset */}
        <div className="pt-8">
          <button
            onClick={() => setResetOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:opacity-70 transition-opacity"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(220,38,38,0.18)',
              color: '#DC2626',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <RotateCcw size={15} />
            Reset all personalization
          </button>
          <p className="text-[12px] text-slate-500 text-center mt-2 px-6">
            Clears every "not interested", saved item, and watch history signal.
          </p>
        </div>
      </div>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Watch personalization?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every dismissal, save, and watch progress signal. Your Watch feed will
              start fresh — but it can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? 'Resetting…' : 'Reset everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 pb-2.5 transition-colors"
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: active ? '#0F172A' : '#94A3B8',
        borderBottom: active ? '2px solid #0F172A' : '2px solid transparent',
        marginBottom: -1,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function PreferenceRow({
  row,
  tab,
  onUndo,
}: {
  row: WatchPreferenceRow;
  tab: Tab;
  onUndo: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '0.5px solid rgba(15,23,42,0.06)' }}
    >
      <div
        style={{
          width: 56,
          height: 72,
          borderRadius: 8,
          overflow: 'hidden',
          background: '#0F172A',
          flexShrink: 0,
        }}
      >
        {row.thumbnailUrl ? (
          <img
            src={row.thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-slate-900 truncate">
          @{row.creatorUsername || row.creatorDisplayName || 'unknown'}
        </div>
        {row.caption ? (
          <div className="text-[12px] text-slate-500 line-clamp-2 mt-0.5">{row.caption}</div>
        ) : null}
        <div className="text-[11px] text-slate-400 mt-1">
          {new Date(row.lastInteractionAt).toLocaleDateString()}
        </div>
      </div>
      <button
        onClick={onUndo}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg active:opacity-70"
        style={{
          background: '#ffffff',
          border: '0.5px solid rgba(15,23,42,0.12)',
          fontSize: 12,
          fontWeight: 600,
          color: '#0F172A',
          flexShrink: 0,
        }}
        aria-label={tab === 'dismissed' ? 'Undo' : 'Remove'}
      >
        <Undo2 size={13} />
        {tab === 'dismissed' ? 'Undo' : 'Remove'}
      </button>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-[15px] font-semibold text-slate-700 mb-1">
        {tab === 'dismissed' ? 'Nothing dismissed yet' : 'Nothing saved yet'}
      </div>
      <p className="text-[13px] text-slate-500">
        {tab === 'dismissed'
          ? 'Long-press any video in Watch and tap "Not interested" to tune your feed.'
          : 'Long-press any video in Watch and tap "Save" to keep it here.'}
      </p>
    </div>
  );
}
