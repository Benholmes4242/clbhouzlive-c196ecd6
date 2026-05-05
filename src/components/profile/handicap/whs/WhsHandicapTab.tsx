import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWhsConnection } from '@/lib/whs/hooks';
import WhsConnectScreen from './WhsConnectScreen';
import HandicapDashboard from './HandicapDashboard';

interface Props {
  userId: string;
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

export const WhsHandicapTab: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: connection, isLoading, refetch } = useWhsConnection(userId);

  if (isLoading) return <SkeletonView />;

  if (!connection) {
    return (
      <WhsConnectScreen
        onConnected={() => refetch()}
        onSkip={() => navigate(-1)}
      />
    );
  }

  return <HandicapDashboard connection={connection} userId={userId} />;
};

export default WhsHandicapTab;
