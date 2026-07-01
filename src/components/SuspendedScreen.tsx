import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SuspensionDetails } from '@/hooks/useSuspensionStatus';

type Props = { suspension: SuspensionDetails };

function formatUntil(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * Terminal screen for suspended accounts. Rendered by RootGate OUTSIDE
 * ClubhouseWrapped so there is no bottom nav / global chrome / feed access.
 */
const SuspendedScreen: React.FC<Props> = ({ suspension }) => {
  const [signingOut, setSigningOut] = React.useState(false);
  const isPermanent = suspension.permanent || !suspension.suspended_until;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      // RootGate will re-evaluate and redirect to /auth.
      window.location.replace('/auth');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0F172A',
        color: '#F8FAFC',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top, 0px), 32px) 24px max(env(safe-area-inset-bottom, 0px), 32px)',
        fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 440, width: '100%', margin: '0 auto' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#F7931E',
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Account status
        </div>
        <h1
          style={{
            fontSize: 28,
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            margin: 0,
            marginBottom: 12,
          }}
        >
          Your account is suspended
        </h1>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.5,
            color: '#CBD5E1',
            margin: 0,
            marginBottom: 20,
          }}
        >
          {isPermanent
            ? 'Your account has been suspended indefinitely.'
            : `Your account is suspended until ${formatUntil(suspension.suspended_until)}.`}
        </p>

        {suspension.reason ? (
          <div
            style={{
              border: '1px solid rgba(248, 250, 252, 0.12)',
              background: 'rgba(248, 250, 252, 0.04)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#94A3B8',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Reason
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: '#F8FAFC', whiteSpace: 'pre-wrap' }}>
              {suspension.reason}
            </div>
          </div>
        ) : null}

        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#94A3B8', margin: 0, marginBottom: 20 }}>
          If you believe this is a mistake, you can appeal.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="mailto:support@clbhouz.com?subject=Account%20suspension%20appeal"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '13px 16px',
              borderRadius: 999,
              background: '#F7931E',
              color: '#0F172A',
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              letterSpacing: '-0.005em',
            }}
          >
            Contact support
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 16px',
              borderRadius: 999,
              background: 'transparent',
              color: '#F8FAFC',
              border: '1px solid rgba(248, 250, 252, 0.24)',
              fontWeight: 500,
              fontSize: 15,
              cursor: signingOut ? 'default' : 'pointer',
              opacity: signingOut ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuspendedScreen;
