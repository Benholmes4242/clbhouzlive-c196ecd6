import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * TourBackChip — inline back affordance for non-immersive detail pages.
 * Render as the FIRST child inside a ShellSlot, above the page masthead block,
 * so it shares the ShellSlot's fixed band (no overlap, no doubled chrome padding).
 */
export function TourBackChip({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{ background: '#0F172A', padding: '6px 8px 0' }}>
      <button
        type="button"
        onClick={onBack ?? (() => navigate(-1))}
        aria-label="Back"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 13,
          fontWeight: 600,
          padding: '4px 6px',
          margin: 0,
        }}
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Back
      </button>
    </div>
  );
}

export function TourHubShell({ children, immersive = false, showBack = true, onBack }: TourHubShellProps) {
  const { setVariant } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  // Floating overlay back button — ONLY for immersive pages (Tournament hero).
  // Non-immersive pages should render <TourBackChip /> inside their ShellSlot.
  const overlayBackButton = showBack && immersive ? (
    <button
      onClick={onBack ?? (() => navigate(-1))}
      aria-label="Back"
      style={{
        position: 'fixed',
        top: 'calc(var(--chrome-total-h, 47px) + 8px)',
        left: 12,
        zIndex: 50,
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(10,14,20,0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '0.5px solid rgba(255,255,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <ArrowLeft size={20} strokeWidth={2.5} color="#fff" />
    </button>
  ) : null;

  if (immersive) {
    return (
      <PageRoot
        className="min-h-screen w-full"
        immersive
        immersiveStatusBar
      >
        {overlayBackButton}
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot
      dark
      className="min-h-screen w-full"
      style={{ background: 'var(--hcp-bg-0)' }}
    >
      {children}
    </PageRoot>
  );
}
