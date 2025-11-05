/**
 * Hub Create Game Page - Standalone Glass Overlay
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateGameScreen } from '../sheets/CreateGameScreen';
import '../home/hubTheme.css';

export default function HubCreateGamePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const state = location.state as { backgroundLocation?: Location } | null;
    if (state?.backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/clubhouse', { replace: true });
    }
  };

  return (
    <>
      {/* Glass backdrop */}
      <div
        className="fixed inset-0"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(120px)',
          WebkitBackdropFilter: 'blur(120px)',
          zIndex: 9999,
        }}
        onClick={handleBack}
      />

      {/* Glass page content */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <CreateGameScreen onClose={handleBack} />
      </div>
    </>
  );
}
