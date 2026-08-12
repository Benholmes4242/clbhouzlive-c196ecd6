import React from 'react';
import { Link } from 'react-router-dom';

const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const CANVAS = '#F8FAFC';
const INK = '#0F172A';
const CHARCOAL = '#15171F';
const AMBER = '#F7931E';
const APP_STORE_URL = 'https://apps.apple.com/app/id6752538886';

const AppleGlyph: React.FC = () => (
  <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true">
    <path d="M18.1 13.8c0-3 2.5-4.5 2.6-4.6-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-4-1-2 0-3.9 1.2-5 3-2.1 3.7-.5 9.1 1.5 12.1 1 1.5 2.2 3.1 3.8 3 1.5-.1 2.1-1 4-1s2.4 1 4 .9c1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.6-3.3 1.7-3.4-.1 0-3.2-1.2-3.3-4.7zM15 4.9c.8-1 1.4-2.4 1.2-3.9-1.2.1-2.7.8-3.6 1.9-.8.9-1.5 2.4-1.3 3.8 1.4.1 2.8-.7 3.7-1.8z" fill={INK} />
  </svg>
);

function deriveContextLabel(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return null;
  if (pathname.startsWith('/post/')) return 'a post';
  if (pathname.startsWith('/profile/')) return 'a profile';
  if (pathname.startsWith('/courses/')) return 'a course';
  return 'something';
}

const AppDownloadGate: React.FC = () => {
  const contextLabel = React.useMemo(
    () => (typeof window !== 'undefined' ? deriveContextLabel(window.location.pathname) : null),
    [],
  );

  return (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 2147483000,
      background: CANVAS, fontFamily: SF_STACK,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}
  >
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div
        style={{
          width: '100%', maxWidth: 420, background: CHARCOAL, borderRadius: 28,
          padding: '44px 32px 40px', textAlign: 'center',
          boxShadow: '0 30px 70px rgba(15,23,42,0.30), 0 4px 14px rgba(15,23,42,0.12)',
        }}
      >
        <img
          src="/brand/clbhouz-mark-amber.png"
          alt=""
          style={{ width: 76, height: 76, display: 'block', margin: '0 auto' }}
          draggable={false}
        />

        <div style={{ marginTop: 22, fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: AMBER }}>
          clbhouz
        </div>

        {contextLabel ? (
          <>
            <h1 style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              You've been invited to view {contextLabel} on Clbhouz.
            </h1>
            <p style={{ margin: '13px auto 0', fontSize: 15.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.66)', maxWidth: 320 }}>
              Get the app to see it.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ margin: '10px 0 0', fontSize: 30, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              The home of golf courses.
            </h1>
            <p style={{ margin: '13px auto 0', fontSize: 15.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.66)', maxWidth: 320 }}>
              Every course in the world, gathered into one place, rated and brought to life.
            </p>
          </>
        )}

        <div style={{ marginTop: 30 }}>
          <a
            href={APP_STORE_URL}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#FFFFFF', color: INK, borderRadius: 14,
              padding: '13px 26px 13px 22px', textDecoration: 'none',
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
              minWidth: 220, justifyContent: 'center',
            }}
          >
            <AppleGlyph />
            <span style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 500, opacity: 0.7 }}>Download on the</span>
              <span style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>App Store</span>
            </span>
          </a>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          Coming soon to Android
        </div>

      </div>
    </div>

    <footer style={{ padding: '4px 24px 28px', textAlign: 'center', fontSize: 12, color: 'rgba(100,116,139,0.8)' }}>
      <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
      <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
      <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</Link>
      <div style={{ marginTop: 10, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>
        © CLBHOUZ LTD
      </div>
    </footer>
  </div>
  );
};

export default AppDownloadGate;
