import React from 'react';

const INK = '#0F172A';
const MUTE = '#64748B';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SUPPORT_EMAIL = 'support@clbhouz.com';

/**
 * Terminal screen for an account whose user_profiles.deleted_at is non-null.
 * Rendered by DeletedAccountGate (global, one place) after the session has been
 * signed out. Two actions: contact support, and a route back to /auth so the
 * member is not pinned here for the rest of the session. There is deliberately no
 * "restore my account" — the deletion sweeps cannot be undone by anything in
 * this codebase, so such a button would promise what the system cannot deliver.
 */
const DeletedAccountScreen: React.FC<{ onSignInDifferent?: () => void }> = ({
  onSignInDifferent,
}) => (
  <div
    role="alert"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2147483000,
      background: '#F8FAFC',
      color: INK,
      fontFamily: FONT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '32px 24px',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
    }}
  >
    <div style={{ maxWidth: 440, margin: '0 auto', width: '100%' }}>
      <span
        style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: MUTE,
        }}
      >
        Account closed
      </span>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', margin: '10px 0 0', lineHeight: 1.15 }}>
        This account has been deleted
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTE, margin: '14px 0 0' }}>
        Your clbhouz account was permanently deleted, so it can no longer be
        used to sign in. Rounds, posts and reviews attached to it were removed
        and cannot be recovered.
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTE, margin: '10px 0 0' }}>
        If you believe this is a mistake, get in touch and we will look into it.
      </p>

      <a
        href={`mailto:${SUPPORT_EMAIL}?subject=Deleted%20account`}
        style={{
          display: 'block', textAlign: 'center', marginTop: 28,
          padding: '15px 18px', borderRadius: 12,
          background: INK, color: '#FFF',
          fontSize: 15, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Contact support
      </a>

      {onSignInDifferent && (
        <button
          type="button"
          onClick={onSignInDifferent}
          style={{
            display: 'block', width: '100%', textAlign: 'center', marginTop: 10,
            padding: '15px 18px', borderRadius: 12,
            background: 'transparent', color: INK,
            border: '1px solid #EDF0F3',
            fontSize: 15, fontWeight: 600, fontFamily: FONT,
          }}
        >
          Sign in with a different account
        </button>
      )}
    </div>
  </div>
);

export default DeletedAccountScreen;
