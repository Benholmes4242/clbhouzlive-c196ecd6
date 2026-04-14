import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

export default function CheckEmailPage() {
  useHideBottomNav();
  useHideHeader();
  useMedianStatusBar('dark', '#000000', true, false);

  useLayoutEffect(() => {
    document.body.classList.add('route-auth');
    return () => document.body.classList.remove('route-auth');
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || 'your inbox';

  // Belt-and-suspenders: auto-navigate if Supabase detects email verification via another mechanism
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email_confirmed_at) {
        navigate('/edit-profile', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fix 2: Read handshake token written by VerifiedPage in SFSafariViewController
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Path A: session already in WebView (defensive)
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (existing?.user?.email_confirmed_at) {
        navigate('/edit-profile', { replace: true });
        return;
      }

      // Path B: read handshake token written by VerifiedPage
      try {
        const raw = localStorage.getItem('clbhouz_email_verified_session');
        if (!raw) return;

        const payload = JSON.parse(raw);
        // Only accept tokens written in the last 10 minutes
        if (!payload.access_token || !payload.refresh_token || Date.now() - payload.ts > 10 * 60 * 1000) {
          localStorage.removeItem('clbhouz_email_verified_session');
          return;
        }

        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });

        localStorage.removeItem('clbhouz_email_verified_session');

        if (error || !session?.user) return;

        // New user — always go to edit-profile (has_completed_onboarding is false)
        navigate('/edit-profile', { replace: true });
      } catch {}
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also run immediately in case they're already back
    handleVisibilityChange();
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: '#000000',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Subtle grain texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="flex flex-col items-center gap-5 p-8 rounded-3xl max-w-sm w-full text-center"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(247,147,30,0.10)',
            border: '1px solid rgba(247,147,30,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Mail style={{ width: 26, height: 26, color: '#F7931E' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Almost there
          </span>
        </div>

        <div className="space-y-2">
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em', margin: 0 }}>Check your inbox</h1>
          <p className="text-sm text-white/50 leading-relaxed">
            We sent a verification link to{' '}
            <span className="text-white/80 font-medium">{email}</span>.
            Tap it to complete your signup.
          </p>
        </div>

        <p className="text-xs text-white/30 leading-relaxed pt-2">
          Didn't receive it? Typical — these things always end up in spam.{' '}
          Check your junk folder, it's almost certainly lurking in there.{' '}
          Still nothing?{' '}
          <button
            onClick={() => navigate('/auth')}
            className="text-white/50 underline underline-offset-2"
          >
            Go back and try again
          </button>.
        </p>
      </div>
    </div>
  );
}
