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
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0 flex flex-col"
        style={{
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.16)',
        }}
      >
        <HubHeader title="Create a game" onBack={handleBack} />
        
        <CreateGameForm
          prefilledClub={(loc.state as any)?.prefilledClub}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
