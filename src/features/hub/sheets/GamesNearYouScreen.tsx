import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GamesTab } from '@/features/nearby/GamesTab';

type GamesNearYouScreenProps = {
  onClose: () => void;
};

export function GamesNearYouScreen({ onClose }: GamesNearYouScreenProps) {
  const nav = useNavigate();

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Games Near You</h2>
      
      <GamesTab 
        onOpenCreate={() => nav('/hub?sheet=create-game')} 
      />
    </div>
  );
}
