/**
 * CreateGameSquareTile - Square tile for 2-up grid
 * Plus icon with "Create a Game" text
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { HubGamesHubSheet } from '@/features/hub/components/HubGamesHubSheet';
import { haptic } from '@/utils/haptics';

export function CreateGameSquareTile() {
  const [gamesHubOpen, setGamesHubOpen] = useState(false);

  const openCreateGame = () => {
    haptic('light');
    setGamesHubOpen(true);
  };

  return (
    <>
      <button
        onClick={openCreateGame}
        className="w-full h-full rounded-[22px] p-4 flex flex-col items-center justify-center transition-all active:scale-[0.98]"
        style={{
          background: 'var(--hub-glass-bg)',
          border: '1px solid var(--hub-stroke)',
          boxShadow: 'var(--hub-shadow-tile)',
        }}
      >
        {/* Plus icon circle */}
        <div 
          className="h-12 w-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--hub-glass-bg-input)' }}
        >
          <Plus className="h-6 w-6" style={{ color: 'var(--hub-text-dim)' }} />
        </div>
        
        {/* Label */}
        <div 
          className="mt-3 text-[15px] font-bold"
          style={{ color: 'var(--hub-text-body)' }}
        >
          Create a Game
        </div>
      </button>

      <HubGamesHubSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
        initialTab="yours"
      />
    </>
  );
}
