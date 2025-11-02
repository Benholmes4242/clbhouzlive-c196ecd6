/**
 * Hub Games Page
 * 
 * Wrapper for existing Games tab content.
 * Includes pagination fix from Phase 1 audit.
 */

import React from 'react';
import { GamesTab } from '@/features/nearby/GamesTab';
import { useNavigate } from 'react-router-dom';

export function HubGamesPage() {
  const navigate = useNavigate();

  return (
    <GamesTab 
      onOpenCreate={() => navigate('/hub/create-game')} 
    />
  );
}
