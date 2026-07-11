import React from 'react';
import { Link } from 'react-router-dom';
import clbhouzLogo from '@/assets/clbhouz-logo.png';

const APP_STORE_URL = 'https://apps.apple.com/app/id6752538886';

/**
 * Marketing landing shown to plain web visitors (non-native, non-preview).
 * clbhouz is an app-only product; this page tells visitors to install the
 * iOS app and links them to the App Store. No waitlist, no email capture,
 * no "coming soon"/date language, no auth surface — visitors cannot use
 * the app in a browser.
 *
 * Native app users NEVER see this page (RootGate short-circuits before it
 * mounts). Lovable preview + localhost also bypass it.
 */
const AppDownloadGate: React.FC = () => {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={clbhouzLogo}
          alt="clbhouz"
          width={72}
          height={72}
          style={{ borderRadius: 18, marginBottom: 20, boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}
        />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            lineHeight: 1.1,
          }}
        >
          clbhouz
        </h1>
        <p
          style={{
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.55,
            color: '#475569',
            margin: '0 0 36px',
            maxWidth: 380,
          }}
        >
          clbhouz is a social platform for golfers: share your rounds, rate and
          discover courses, track your handicap, and compete with friends.
        </p>

        <a
          href={APP_STORE_URL}
          rel="noopener noreferrer"
          aria-label="Download clbhouz on the App Store"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px',
            background: '#0F172A',
            color: '#FFFFFF',
            borderRadius: 14,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '-0.005em',
            minWidth: 240,
            justifyContent: 'center',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.05 12.04c-.03-2.9 2.37-4.29 2.48-4.36-1.35-1.97-3.46-2.24-4.21-2.27-1.79-.18-3.5 1.06-4.41 1.06-.92 0-2.32-1.03-3.82-1.01-1.96.03-3.78 1.14-4.79 2.9-2.05 3.55-.52 8.79 1.47 11.67.97 1.41 2.13 2.99 3.63 2.93 1.46-.06 2.01-.94 3.78-.94 1.76 0 2.26.94 3.79.91 1.56-.03 2.55-1.43 3.51-2.85 1.11-1.63 1.57-3.21 1.6-3.3-.04-.02-3.06-1.17-3.09-4.66zM14.19 3.5c.8-.98 1.35-2.33 1.2-3.68-1.16.05-2.58.78-3.42 1.75-.75.86-1.41 2.24-1.23 3.56 1.3.1 2.64-.66 3.45-1.63z" />
          </svg>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
            <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.75, letterSpacing: '0.02em' }}>
              Download on the
            </span>
            <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>App Store</span>
          </span>
        </a>

        <p style={{ fontSize: 12, color: '#94A3B8', margin: '20px 0 0' }}>
          iPhone &amp; iPad
        </p>
      </div>

      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)',
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          fontSize: 12,
          color: '#64748B',
        }}
      >
        <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
          Privacy Policy
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
          Terms of Service
        </Link>
      </footer>
    </main>
  );
};

export default AppDownloadGate;
