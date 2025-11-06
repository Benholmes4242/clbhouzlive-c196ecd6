/**
 * Hub Create Game Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateGameModal } from '@/features/nearby/components/CreateGameModal';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import '../home/hubTheme.css';

export function HubCreateGamePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { createBeacon } = useGameBeacon();

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Navigate back to close this overlay
      nav(-1);
    } else {
      // Deep link fallback
      nav('/clubhouse', { replace: true });
    }
  };

  const handleCreate = async (input: any) => {
    await createBeacon(input);
    handleBack();
  };

  // Render CreateGameModal directly (it handles its own styling)
  // We'll render it always "open" since this page IS the modal
  return (
    <CreateGameModal
      isOpen={true}
      onClose={handleBack}
      onCreateBeacon={handleCreate}
      prefilledClub={(loc.state as any)?.prefilledClub}
      portalContainer={null}
      hubMode={true}
    />
  );
}
