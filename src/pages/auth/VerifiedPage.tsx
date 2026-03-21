import { useEffect, useLayoutEffect } from 'react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

export default function VerifiedPage() {
  useHideBottomNav();
  useHideHeader();

  // Bleed behind notch/safe-area like auth pages
  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'clbhouz://';
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const openApp = () => {
    window.location.href = 'clbhouz://';
    setTimeout(() => {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/app/clbhouz/id6752538886';
      } else {
        window.location.href = 'https://clbhouz.co.uk';
      }
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(245,166,35,0.18) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 110%, rgba(245,166,35,0.06) 0%, transparent 60%), #080808',
      }}
    >
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: 0.035, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }}
      />

      <div className="relative flex flex-col items-center gap-6 text-center max-w-sm w-full animate-fade-in">
        {/* Logo */}
        <img
          src="/images/clbhouz-logo.png"
          alt="clbhouz"
          className="h-12 w-auto opacity-80 mb-2"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Check circle */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(245,166,35,0.15)',
          border: '1.5px solid rgba(245,166,35,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(245,166,35,0.1)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px', margin: 0 }}>
          Email Verified
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
          You're all set. Tap below to open the clbhouz app and complete your profile, or close this page and open the app.
        </p>

        {/* CTA Button */}
        <button
          onClick={openApp}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', maxWidth: 280, height: 54,
            background: '#F5A623', color: '#000',
            fontSize: 15, fontWeight: 500, border: 'none',
            borderRadius: 27, cursor: 'pointer',
            boxShadow: '0 0 32px rgba(245,166,35,0.25), 0 4px 16px rgba(0,0,0,0.4)',
            fontFamily: 'inherit',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Open clbhouz
        </button>

        {/* Note */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
          If the app doesn't open, make sure clbhouz is installed on your device.
        </p>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        clbhouz · Golf Social
      </div>
    </div>
  );
}
