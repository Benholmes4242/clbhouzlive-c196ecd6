/**
 * Hub Create Game Page
 * Full-screen glass page with standard Hub styling
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateGameForm } from '@/features/nearby/components/CreateGameForm';
import { useGameBeacon } from '@/features/nearby/hooks/useGameBeacon';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';
import { HubHeader } from '../components/HubHeader';
import '../home/hubTheme.css';

export function HubCreateGamePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { createBeacon } = useGameBeacon();
  
  useKeyboardAwareScroll(
    'input[data-keyboard-aware], textarea[data-keyboard-aware]'
  );

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  const handleCreate = async (input: any) => {
    await createBeacon(input);
    handleBack();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background">
      {/* Content */}
      <div className="fixed inset-0 flex flex-col">
        <HubHeader title="Create a game" onBack={handleBack} />
        
        <CreateGameForm
          prefilledClub={(loc.state as any)?.prefilledClub}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
