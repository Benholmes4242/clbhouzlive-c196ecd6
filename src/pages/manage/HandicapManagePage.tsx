import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { callDisconnectWhs, callDeleteWhsData } from '@/lib/whs/api';
import { useWhsConnection, whsKeys } from '@/lib/whs/hooks';
import type { WhsConnection } from '@/lib/whs/types';

import { WhsConnectScreen } from '@/components/profile/handicap/whs/WhsConnectScreen';
import ManageScreen from '@/components/profile/handicap/whs/connect/ManageScreen';
import { CANVAS, SURFACE } from "@/components/profile/handicap/whs/connect/designTokens";
import { bodyNameForProvider } from '@/lib/whs/whsCountries';
import DisconnectConfirmSheet from '@/components/settings/sheets/DisconnectConfirmSheet';
import DeleteAllDataConfirmSheet from '@/components/settings/sheets/DeleteAllDataConfirmSheet';
import { useDeclineHandicapChip } from '@/lib/whs/useDeclineHandicapChip';
import { A } from '@/features/courses/components/holes/analytical/tokens';


export default function HandicapManagePage() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: connection, isFetched: connectionFetched } = useWhsConnection(userId);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const declineHandicapChip = useDeclineHandicapChip();

  /* UNRESOLVED IS NOT ABSENT.
     `useWhsConnection` is disabled until the session resolves `userId`, and a
     DISABLED React Query v5 query is pending with fetchStatus 'idle' - so its
     `isLoading` is FALSE before it has ever run. Latching off `!isLoading`
     therefore recorded "disconnected" on the first render of EVERY mount, for
     connected members too, and the sticky latch kept the connect flow up for
     the page's whole lifetime. The latch itself is correct; the signal was not.
     Settled = session resolved AND the connection query actually fetched. */
  const settled = !sessionLoading && connectionFetched;

  /* Latched at the first SETTLED render: a page that opened on the connect
     flow keeps it mounted until the flow reports completion. */
  const startedDisconnected = useRef<boolean | null>(null);
  const [flowFinished, setFlowFinished] = useState(false);
  if (settled && startedDisconnected.current === null) {
    startedDisconnected.current = !connection;
  }


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

  // Session gate + query gate. While EITHER is outstanding we paint the loading
  // state - never the connect flow (which would be a claim about data we do not
  // have yet) and never the connected view.
  if (!settled) {
    // No header here: the resolved surface may be immersive (connect flow) or
    // shelled (connected). Painting a header now would flash a bar that then
    // disappears.
    return (
      <div style={{ background: SURFACE, minHeight: '100dvh' }}>
        <div className="px-4 pt-4 pb-0 space-y-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
          <Skeleton variant="dark" className="h-24 w-full rounded-2xl" />
          <Skeleton variant="dark" className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // CONNECT FLOW: immersive. The page owns its single back + title; no app
  // header, and the wash runs through the notch.
  //
  // The flow owns its own completion: a connection row appearing mid-flow must
  // NOT tear it down before the member has seen (and dismissed) the connected
  // screen. onConnected fires from that screen's CTA only.
  if (!connection || (startedDisconnected.current === true && !flowFinished)) {
    return (
      <WhsConnectScreen
        onConnected={async () => {
          invalidateAll();
          setFlowFinished(true);
          navigate('/handicap', { replace: true });
        }}
        onDecline={declineHandicapChip}
      />
    );
  }


  return (
    <ManagePageShell
      title={bodyNameForProvider(connection.provider)}
      fill
    >
      <div className="flex flex-col flex-1 min-h-0" style={{ background: CANVAS }}>
        <ManageScreen
          connection={connection}
          onDisconnect={() => setConfirmDisconnect(true)}
          onDelete={() => setConfirmDelete(true)}
          onReconnect={() => setConfirmDisconnect(true)}
        />
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

