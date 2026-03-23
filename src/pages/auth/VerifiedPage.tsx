import { useEffect, useLayoutEffect } from 'react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { supabase } from '@/integrations/supabase/client';

export default function VerifiedPage() {
  useHideBottomNav();
  useHideHeader();

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => { document.body.classList.remove('route-auth'); };
  }, []);

  // Fix 1: Write session tokens to localStorage so the WebView can pick them up
  useEffect(() => {
    const passSessionToApp = async () => {
      // Give detectSessionInUrl time to process the URL hash tokens
      await new Promise(r => setTimeout(r, 400));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        localStorage.setItem('clbhouz_email_verified_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          ts: Date.now(),
        }));
      } catch {}
    };

    passSessionToApp();
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: '#000000',
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
          className="h-16 w-auto opacity-90"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Headline */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px', margin: 0 }}>
          Email Verified
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
          Your email has been verified. Please close your clbhouz app and reopen to sign in and start your journey.
        </p>

        {/* Note */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
          You can now close this page.
        </p>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        clbhouz · stay in play
      </div>
    </div>
  );
}
