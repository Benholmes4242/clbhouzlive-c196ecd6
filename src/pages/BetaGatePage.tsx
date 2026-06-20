import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const GEIST = '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const BetaGatePage: React.FC = () => {
  const [logoError, setLogoError] = useState(false);
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [remaining, setRemaining] = useState(() => getRemaining(LAUNCH));

  useEffect(() => {
    document.body.classList.add('route-auth');
    return () => {
      document.body.classList.remove('route-auth');
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(LAUNCH)), 1000);
    return () => clearInterval(id);
  }, []);

  const launched = remaining.ms <= 0;

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

  const eyebrowStyle: React.CSSProperties = {
    fontFamily: GEIST,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#F7931E',
    margin: 0,
  };

  const renderStoreButton = (label: string, url: string) => {
    const disabled = !url;
    const btn = (
      <div
        style={{
          minHeight: 52,
          borderRadius: 14,
          background: '#FFFFFF',
          color: '#0A0E14',
          fontFamily: GEIST,
          fontWeight: 600,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          opacity: disabled ? 0.4 : 1,
          textDecoration: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {label}
      </div>
    );
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {disabled ? (
          <div style={{ width: '100%', pointerEvents: 'none' }}>{btn}</div>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
            {btn}
          </a>
        )}
        {disabled && (
          <span style={{ fontFamily: GEIST, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            live later today
          </span>
        )}
      </div>
    );
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

        {!launched ? (
          <>
            <span style={eyebrowStyle}>clbhouz is coming</span>

            {/* Countdown */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
              }}
            >
              {[
                { v: remaining.d, label: 'days' },
                { v: remaining.h, label: 'hours' },
                { v: remaining.m, label: 'mins' },
                { v: remaining.s, label: 'secs' },
              ].map((unit, i) => (
                <React.Fragment key={unit.label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
                    <span
                      style={{
                        fontFamily: GEIST,
                        fontSize: 56,
                        fontWeight: 200,
                        color: '#FFFFFF',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {pad2(unit.v)}
                    </span>
                    <span
                      style={{
                        fontFamily: GEIST,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: 10,
                      }}
                    >
                      {unit.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <span
                      style={{
                        fontFamily: GEIST,
                        fontSize: 40,
                        fontWeight: 200,
                        color: 'rgba(255,255,255,0.25)',
                        lineHeight: 1,
                      }}
                    >
                      :
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p
              style={{
                fontFamily: GEIST,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.55)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              On iPhone and Android, 22 June 2026.
            </p>

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
                    : "You're on the list. We'll email you on launch day."}
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
          </>
        ) : (
          <>
            <span style={eyebrowStyle}>available now</span>
            <h1
              style={{
                fontFamily: GEIST,
                fontSize: 34,
                fontWeight: 800,
                color: '#FFFFFF',
                margin: 0,
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}
            >
              clbhouz is live.
            </h1>
            <p
              style={{
                fontFamily: GEIST,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.55)',
                textAlign: 'center',
                margin: 0,
              }}
            >
              Download on the App Store or Google Play.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                width: '100%',
                maxWidth: 380,
                flexWrap: 'wrap',
              }}
            >
              {renderStoreButton('App Store', APP_STORE_URL)}
              {renderStoreButton('Google Play', PLAY_STORE_URL)}
            </div>
          </>
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
