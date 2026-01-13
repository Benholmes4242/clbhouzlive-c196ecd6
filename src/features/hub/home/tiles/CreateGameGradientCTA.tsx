/**
 * CreateGameGradientCTA - Full-width gradient Create Game button
 * Premium CTA with gradient background
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateGameTripSheetV2 } from '@/features/hub/components/create-game-trip-v2';
import { haptic } from '@/utils/haptics';

// Fallback gradient image for the CTA
const GRADIENT_BG = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=200&fit=crop&q=80';

export function CreateGameGradientCTA() {
  const [createOpen, setCreateOpen] = useState(false);

  const openCreateGame = () => {
    haptic('light');
    setCreateOpen(true);
  };

  return (
    <>
      <button
        onClick={openCreateGame}
        className="w-full h-[64px] rounded-[22px] overflow-hidden relative flex items-center gap-4 px-5 transition-all active:scale-[0.98]"
        style={{
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${GRADIENT_BG})` }}
        />
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)',
          }}
        />
        
        {/* Plus icon circle */}
        <div 
          className="relative h-10 w-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255, 255, 255, 0.25)' }}
        >
          <Plus className="h-5 w-5 text-white" />
        </div>
        
        {/* Text */}
        <div className="relative text-white text-[18px] font-extrabold">
          Create a Game
        </div>
      </button>

      <CreateGameTripSheetV2
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
