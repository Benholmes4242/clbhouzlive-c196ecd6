import React, { useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useDeclineHandicapChip } from '@/lib/whs/useDeclineHandicapChip';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WhsConnectScreen from './WhsConnectScreen';
import HandicapDashboard from './HandicapDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  userId: string;
  /** First name of the profile owner — threaded down for name-prefixed copy. */
  ownerFirstName?: string | null;
}

const SkeletonView = () => (
  <div className="px-5 pt-10 pb-6">
    <Skeleton variant="dark" className="h-3 w-44 rounded mb-5" />
    <Skeleton variant="dark" className="h-16 w-28 rounded mb-3" />
    <Skeleton variant="dark" className="h-4 w-36 rounded mb-8" />
    <div className="space-y-3">
      <Skeleton variant="dark" className="h-4 w-32 rounded" />
      <Skeleton variant="dark" className="h-20 w-full rounded-xl" />
      <Skeleton variant="dark" className="h-20 w-full rounded-xl" />
    </div>
  </div>
);

export const WhsHandicapTab: React.FC<Props> = ({ userId, ownerFirstName = null }) => {
  const navigate = useNavigate();
  const { user: sessionUser, loading: sessionLoading } = useSupabaseSession();
  const { data: connection, isFetched, isError, refetch } = useWhsConnection(userId);
  const declineHandicapChip = useDeclineHandicapChip();

  /* THE CONNECT FLOW OWNS ITS OWN COMPLETION.
     A connection row appearing is NOT the end of the flow - the member still
     has the connected screen to read and its CTA to tap. So the flow latches
     at first settled render: if it started without a connection, it stays
     mounted until it calls onConnected (fired from that CTA only). */
  const startedDisconnected = useRef<boolean | null>(null);
  const [flowFinished, setFlowFinished] = useState(false);

  /* UNRESOLVED IS NOT ABSENT.
     `useWhsConnection` is disabled until `userId` exists, and a DISABLED React
     Query v5 query is pending with fetchStatus 'idle' - so `isLoading` is FALSE
     before it has ever run. `!isLoading` therefore does NOT mean settled, and
     latching on it recorded "disconnected" for connected members. */
  const settled = !sessionLoading && isFetched;

  if (!settled && !isError) return <SkeletonView />;

  if (startedDisconnected.current === null && !isError) {
    startedDisconnected.current = !connection;
  }



  // Never fall through to WhsConnectScreen when the query errored — an
  // already-connected user would be prompted to reconnect. Show a retry
  // state instead (dark card matches the /handicap route theme).
  if (isError) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: 24,
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
          Couldn't load your handicap
        </div>
        <div style={{ fontSize: 13, color: 'rgba(248,250,252,0.65)', maxWidth: 280 }}>
          Check your connection and try again.
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          style={{ background: '#F7931E', color: '#0F172A', border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // The flow stays mounted while it is unfinished, even once a connection row
  // exists - the connected screen is the last thing the member sees.
  if (!connection || (startedDisconnected.current === true && !flowFinished)) {
    // Own profile and no connection: the full-page connect form lives in
    // Manage -> Handicap (/manage/handicap). Redirect there instead of
    // rendering it inside the dark-chrome /handicap route.
    if (!connection && userId === sessionUser?.id) {
      return <Navigate to="/manage/handicap" replace />;
    }

    // Friend view without a connection: keep existing behavior unchanged.
    return (
      <WhsConnectScreen
        onConnected={async () => {
          // Refresh the shared ['whs-connection', userId] cache.
          let res = await refetch();
          // Guard: server-side propagation lag after callConnectWhs. Retry
          // once after a short delay before giving up.
          if (!res.data) {
            await new Promise((r) => setTimeout(r, 500));
            res = await refetch();
          }
          // Only now is the flow over - fired from the connected screen's CTA.
          setFlowFinished(true);
        }}
        onDecline={declineHandicapChip}
        layout="embedded"
      />
    );
  }


  return <HandicapDashboard connection={connection} userId={userId} ownerFirstName={ownerFirstName} />;
};

export default WhsHandicapTab;
