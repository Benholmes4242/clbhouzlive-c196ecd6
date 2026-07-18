import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useDeclineHandicapChip } from '@/lib/whs/useDeclineHandicapChip';
import WhsConnectScreen from './WhsConnectScreen';
import HandicapDashboard from './HandicapDashboard';

interface Props {
  userId: string;
  /** First name of the profile owner — threaded down for name-prefixed copy. */
  ownerFirstName?: string | null;
}

const SkeletonView = () => (
  <div className="px-5 pt-10 pb-6 animate-pulse">
    <div className="h-3 w-44 bg-muted/60 rounded mb-5" />
    <div className="h-16 w-28 bg-muted rounded mb-3" />
    <div className="h-4 w-36 bg-muted/60 rounded mb-8" />
    <div className="space-y-3">
      <div className="h-4 w-32 bg-muted/60 rounded" />
      <div className="h-20 w-full bg-muted/40 rounded-xl" />
      <div className="h-20 w-full bg-muted/40 rounded-xl" />
    </div>
  </div>
);

export const WhsHandicapTab: React.FC<Props> = ({ userId, ownerFirstName = null }) => {
  const navigate = useNavigate();
  const { data: connection, isLoading, refetch } = useWhsConnection(userId);

  if (isLoading) return <SkeletonView />;

  if (!connection) {
    return (
      <WhsConnectScreen
        onConnected={async () => {
          // Refresh the shared ['whs-connection', userId] cache. Both this
          // observer and HandicapPage.ownConnection update together, so
          // isConnectFlow flips false and the dashboard renders — no navigate
          // needed (user is already on /handicap).
          let res = await refetch();
          // Guard: server-side propagation lag after callConnectWhs. Retry
          // once after a short delay before giving up.
          if (!res.data) {
            await new Promise((r) => setTimeout(r, 500));
            res = await refetch();
          }
        }}
        onSkip={() => navigate(-1)}
      />
    );
  }

  return <HandicapDashboard connection={connection} userId={userId} ownerFirstName={ownerFirstName} />;
};

export default WhsHandicapTab;
