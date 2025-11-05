/**
 * Hub Swing Coach Page - Standalone Glass Overlay
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { SwingCoachScreen } from '../sheets/SwingCoachScreen';
import '../home/hubTheme.css';

export default function HubSwingPage() {
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
        className="fixed inset-0 flex flex-col"
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full h-full flex flex-col overflow-hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-5 py-4 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center -ml-2 transition-colors active:scale-95"
              style={{ color: 'rgba(255, 255, 255, 0.85)' }}
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Swing Coach
            </h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <SwingCoachScreen onClose={handleBack} />
          </div>
        </div>
      </div>
    </>
  );
}
