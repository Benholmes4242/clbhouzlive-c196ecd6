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

  useEffect(() => {
    const run = async () => {
      try {
        // Wait one tick for Supabase client to process URL hash tokens
        await new Promise(r => setTimeout(r, 150));

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setMessage('Session not found. Redirecting…');
          setTimeout(() => navigate('/auth', { replace: true }), 1500);
          return;
        }

        // Check for password recovery flow
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // ── Grant gate access for verified user ──────────────────────────
        // A freshly-verified user has a valid Supabase session but no gate
        // token. Auto-grant so they aren't blocked by the beta access screen.
        setMessage('Almost there…');
        try {
          const gateRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-site-access`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                accessCode: import.meta.env.VITE_INTERNAL_ACCESS_CODE,
                domain: window.location.hostname,
              }),
            }
          );
          const gateData = await gateRes.json();
          if (gateRes.ok && gateData?.success) {
            localStorage.setItem(
              'clubhouz_gate_session',
              JSON.stringify({
                token: gateData.sessionToken,
                expiresAt: gateData.expiresAt,
              })
            );
          }
        } catch {
          // Non-fatal — gate will re-check on next load
        }
        // ─────────────────────────────────────────────────────────────────

        setMessage('Setting up your profile…');

        // Give the DB trigger time to create the profile row
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
  }, [navigate]);

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
