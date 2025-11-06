/**
 * Hub New Page - Empty Glass Shell
 * Full-screen glass overlay following Hub design pattern
 */

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import '../home/hubTheme.css';

export function HubNewPage() {
  const nav = useNavigate();
  const loc = useLocation();

  // Apply hub-open class for glass theme
  useEffect(() => {
    document.documentElement.classList.add('hub-open');
    return () => document.documentElement.classList.remove('hub-open');
  }, []);

  const handleBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/clubhouse', { replace: true });
    }
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'var(--hub-backdrop)',
        backdropFilter: 'blur(var(--hub-backdrop-blur))',
        WebkitBackdropFilter: 'blur(var(--hub-backdrop-blur))',
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-5 pt-4 pb-3"
        style={{
          background: 'transparent',
          borderBottom: '1px solid var(--hub-header-stroke)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-[15px] transition-colors"
            style={{ color: 'var(--hub-text-body)' }}
          >
            ← Back
          </button>

          <h1
            className="text-[17px] font-semibold"
            style={{ color: 'var(--hub-text)' }}
          >
            New Page
          </h1>

          <TapButton
            onPointerDown={handleBack}
            className="transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
            style={{ color: 'var(--hub-close-idle)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-close-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-close-idle)'}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </TapButton>
        </div>
      </header>

      {/* Body */}
      <main className="w-full h-[calc(100vh-80px)] overflow-y-auto px-3.5 pt-3 pb-6">
        <div
          className="rounded-3xl p-6 flex items-center justify-center"
          style={{
            background: 'var(--hub-glass-bg)',
            border: '1px solid var(--hub-stroke)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            minHeight: '240px',
          }}
        >
          <div style={{ color: 'var(--hub-text-dim)', textAlign: 'center' }}>
            Empty glass page ready for content
          </div>
        </div>
      </main>
    </div>
  );
}
