/**
 * Hub Echo Chat Page
 * Full-screen glass page (standalone), opens over the origin page.
 */
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EchoConversationsProvider } from '@/features/echo/components/EchoConversationsProvider';
import { EchoChat } from '@/features/echo/components/EchoChat';
import '../home/hubTheme.css';

export function HubEchoChatPage() {
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
    <div className="glass-page" style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
    }}>
      {/* Glass header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--hub-stroke)',
      }}>
        <button
          onClick={handleBack}
          aria-label="Back"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 0,
            color: 'var(--hub-text)',
            fontSize: '15px',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 style={{
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--hub-text)',
        }}>
          Echo
        </h1>
        <div style={{ width: 72 }} /> {/* spacer to balance back button */}
      </header>

      {/* Chat body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <EchoConversationsProvider>
          <EchoChat />
        </EchoConversationsProvider>
      </div>
    </div>
  );
}
