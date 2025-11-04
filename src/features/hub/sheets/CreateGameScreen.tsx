import React from 'react';

type CreateGameScreenProps = {
  onClose: () => void;
};

export function CreateGameScreen({ onClose }: CreateGameScreenProps) {
  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Create a Game</h2>
      
      <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <p className="text-[15px]">Game creation form coming soon</p>
      </div>
    </div>
  );
}
