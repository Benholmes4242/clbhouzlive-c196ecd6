import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BetaGatePage: React.FC = () => {
  const [logoError, setLogoError] = useState(false);
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  useEffect(() => {
    document.body.classList.add('route-auth');
    return () => {
      document.body.classList.remove('route-auth');
    };
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitState('loading');
    try {
      const { error } = await supabase
        .from('beta_waitlist')
        .insert({ email: email.trim().toLowerCase(), source: 'beta_page' });

      if (error) {
        if (error.code === '23505') {
          setSubmitState('duplicate');
        } else {
          setSubmitState('error');
        }
        return;
      }

      // Fire notification edge function (non-blocking)
      supabase.functions.invoke('send-waitlist-notification', {
        body: { email: email.trim().toLowerCase() }
      }).catch(() => {});

      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      {/* Amber radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(245,166,35,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: '0 32px',
          maxWidth: 360,
          width: '100%',
        }}
      >
        {/* Logo */}
        {!logoError && (
          <img
            src="/images/clbhouz-logo.png"
            alt="clbhouz"
            onError={() => setLogoError(true)}
            style={{ height: 48, marginBottom: 8 }}
          />
        )}

        {/* Headline */}
        <h1
          style={{
            fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Private Beta
        </h1>

        {/* Body */}
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            margin: 0,
            maxWidth: 300,
          }}
        >
          clbhouz is currently available by invitation only. If you've been invited, download the app via TestFlight to get started.
        </p>

        {/* Waitlist form */}
        {submitState === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#34D399' }}>
              ✓ You're on the list!
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              We'll email you when you're invited.
            </span>
          </div>
        ) : (
          <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              Interested in joining early?
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSubmitState('idle'); }}
              placeholder="your@email.com"
              required
              style={{
                height: 48, borderRadius: 12,
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${submitState === 'error' || submitState === 'duplicate' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
                color: '#fff', fontSize: 14,
                padding: '0 14px', outline: 'none',
                fontFamily: 'inherit', width: '100%',
                boxSizing: 'border-box' as const,
              }}
            />
            {submitState === 'duplicate' && (
              <span style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', textAlign: 'center' }}>
                This email is already on the waitlist.
              </span>
            )}
            {submitState === 'error' && (
              <span style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', textAlign: 'center' }}>
                Something went wrong — please try again.
              </span>
            )}
            <button
              type="submit"
              disabled={submitState === 'loading'}
              style={{
                height: 44, borderRadius: 22,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14,
                fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)',
                cursor: submitState === 'loading' ? 'wait' : 'pointer',
                opacity: submitState === 'loading' ? 0.6 : 1,
              }}
            >
              {submitState === 'loading' ? 'Joining...' : 'Request Early Access'}
            </button>
          </form>
        )}

        {/* Divider between waitlist and TestFlight */}
        {submitState !== 'success' && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
            — or —
          </span>
        )}

        {/* CTA */}
        <a
          href="https://testflight.apple.com/join/clbhouz"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxWidth: 280,
            height: 52,
            borderRadius: 26,
            background: '#F5A623',
            color: '#000000',
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
          }}
        >
          Download on TestFlight
        </a>

      </div>

      {/* Footer */}
      <span
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 11,
          color: 'rgba(255,255,255,0.15)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 500,
        }}
      >
        clbhouz · Private Beta
      </span>
    </div>
  );
};

export default BetaGatePage;
