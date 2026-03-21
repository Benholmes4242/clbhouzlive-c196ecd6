import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

export default function AuthCallback() {
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  const isInMedianApp =
    typeof window !== 'undefined' && (
      window.navigator.userAgent.toLowerCase().includes('median') ||
      window.navigator.userAgent.toLowerCase().includes('gonative') ||
      (window as any).median !== undefined ||
      (window as any).gonative !== undefined
    );

  useEffect(() => {
    if (!isInMedianApp) return;

    const run = async () => {
      try {
        await new Promise(r => setTimeout(r, 150));

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setMessage('Session not found. Redirecting…');
          setTimeout(() => navigate('/auth', { replace: true }), 1500);
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        setMessage('Setting up your profile…');

        await new Promise(r => setTimeout(r, 700));

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, has_completed_onboarding')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || !profile.has_completed_onboarding) {
          navigate('/edit-profile', { replace: true });
        } else {
          navigate('/', { replace: true });
        }

      } catch (err) {
        console.error('[AuthCallback]', err);
        setMessage('Something went wrong. Redirecting…');
        setTimeout(() => navigate('/auth', { replace: true }), 1500);
      }
    };

    run();
  }, [navigate, isInMedianApp]);

  if (!isInMedianApp) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(245,166,35,0.18) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 110%, rgba(245,166,35,0.06) 0%, transparent 60%), #080808',
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', maxWidth: 380, width: '100%' }}>
          <img
            src="/images/clbhouz-logo.png"
            alt="clbhouz"
            style={{ height: 48, width: 'auto', opacity: 0.8, marginBottom: 8 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(245,166,35,0.15)',
            border: '1.5px solid rgba(245,166,35,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px', margin: 0 }}>
            You're signed in
          </h1>
          <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            Your account is ready. Return to the clbhouz app to start your journey.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
            You can close this page.
          </p>
        </div>
        <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          clbhouz · Golf Social
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-3xl"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        <img
          src="/images/clbhouz-logo.png"
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" aria-label="Loading" />
        <p className="text-white/50 text-sm" aria-live="polite">{message}</p>
      </div>
    </div>
  );
}
