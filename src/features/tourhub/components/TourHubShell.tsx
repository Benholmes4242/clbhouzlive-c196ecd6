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

export function TourHubShell({ children, immersive = false, showBack = true, onBack }: TourHubShellProps) {
  const { setVariant } = useHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  const backButton = showBack ? (
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

  // Tournament detail pages: immersive negative-margin + max-width container
  if (immersive) {
    return (
      <PageRoot
        className="min-h-screen w-full"
        immersive
        immersiveStatusBar
      >
        {backButton}
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </PageRoot>
    );
  }

  // Match handicap page: dark PageRoot canvas + default (non-immersive)
  // status bar so the safe-area notch renders as the same dark band as the
  // header chrome. PageRoot dark adds .hcp-dark and pads for the bottom nav.
  return (
    <PageRoot
      dark
      className="min-h-screen w-full"
      style={{ background: 'var(--hcp-bg-0)' }}
    >
      {backButton}
      {children}
    </PageRoot>
  );
}
