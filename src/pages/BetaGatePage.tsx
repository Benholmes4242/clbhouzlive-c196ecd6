import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const GEIST = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase
        .from('beta_waitlist')
        .insert({ email: cleanEmail, source: 'coming_soon' });

      if (error) {
        if (error.code === '23505') {
          setSubmitState('duplicate');
        } else {
          setSubmitState('error');
        }
        return;
      }

      supabase.functions.invoke('send-waitlist-notification', {
        body: { email: cleanEmail }
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
        background: '#0A0E14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflowY: 'auto',
        fontFamily: GEIST,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          padding: '32px',
          maxWidth: 420,
          width: '100%',
        }}
      >
        {!logoError && (
          <img
            src="/images/clbhouz-logo.png"
            alt="clbhouz"
            onError={() => setLogoError(true)}
            style={{ height: 44, marginBottom: 4 }}
          />
        )}

        <h1
          style={{
            fontFamily: GEIST,
            fontSize: 40,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          clbhouz is coming soon
        </h1>

        <p
          style={{
            fontFamily: GEIST,
            fontSize: 13,
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            margin: 0,
            maxWidth: 420,
          }}
        >
          clbhouz is a social platform for golfers: share your rounds, rate and discover the world's best courses, track your official handicap, and compete with friends.
        </p>

        {/* Notify capture */}
        {submitState === 'success' || submitState === 'duplicate' ? (
          <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <span style={{ fontFamily: GEIST, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              {submitState === 'duplicate'
                ? "You're already on the list."
                : "You're on the list. We'll email you when we launch."}
            </span>
          </div>
        ) : (
          <form
            onSubmit={handleWaitlistSubmit}
            style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (submitState === 'error') setSubmitState('idle'); }}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${submitState === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  color: '#fff',
                  fontSize: 14,
                  padding: '0 14px',
                  outline: 'none',
                  fontFamily: GEIST,
                  boxSizing: 'border-box',
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={submitState === 'loading'}
                style={{
                  height: 48,
                  padding: '0 18px',
                  borderRadius: 12,
                  background: '#F7931E',
                  color: '#0A0E14',
                  fontFamily: GEIST,
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: submitState === 'loading' ? 'wait' : 'pointer',
                  opacity: submitState === 'loading' ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {submitState === 'loading' ? '…' : 'Notify me'}
              </button>
            </div>
            {submitState === 'error' && (
              <span style={{ fontFamily: GEIST, fontSize: 13, color: '#f87171' }}>
                Something went wrong — please try again.
              </span>
            )}
          </form>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          fontFamily: GEIST,
        }}
      >
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
          <span style={{ margin: '0 8px' }}>·</span>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 500,
          }}
        >
          clbhouz — clbhouz.co.uk
        </span>
      </div>
    </div>
  );
};

export default BetaGatePage;
