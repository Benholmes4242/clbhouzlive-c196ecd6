
import React from 'react';
import BenjaminHandicapLayout from './handicap/BenjaminHandicapLayout';
import StandardHandicapCard from './handicap/StandardHandicapCard';

interface HandicapCardProps {
  handicapIndex?: number | null;
  egAppConnected: boolean;
  lastUpdated?: string | null;
  trend?: 'up' | 'down' | 'stable';
  isOwnProfile: boolean;
  onEGConnect: () => void;
  userUsername?: string;
}

const HandicapCard: React.FC<HandicapCardProps> = ({
  handicapIndex,
  egAppConnected,
  lastUpdated,
  isOwnProfile,
  onEGConnect,
  userUsername
}) => {
  // Check if this is Benjamin Holmes' profile
  const isBenjaminHolmes = userUsername === 'benjaminholmes';

  // Render Benjamin's special layout or standard card
  if (isBenjaminHolmes && (handicapIndex !== null && handicapIndex !== undefined)) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <BenjaminHandicapLayout />
      </div>
    );
  }

  return (
    <StandardHandicapCard
      handicapIndex={handicapIndex}
      egAppConnected={egAppConnected}
      lastUpdated={lastUpdated}
      isOwnProfile={isOwnProfile}
      onEGConnect={onEGConnect}
    />
  );
};

export default HandicapCard;
