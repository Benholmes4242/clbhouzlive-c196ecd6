import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { MEMBER_PANEL, PAGE_CANVAS, inkWithAlpha, surfaceWithAlpha } from '@/lib/tokens/surfaces';
import { SURFACE } from '@/lib/tokens/surface';

const INK = SURFACE.dark.ink;
const BODY_INK = SURFACE.dark.body ?? SURFACE.dark.mute;
const MUTE_INK = SURFACE.dark.mute;
const DIM_INK = SURFACE.dark.dim;

export default function AuthCallback() {
  const { t } = useTranslation('auth');
  useHideBottomNav();
  useHideHeader();

  const navigate = useNavigate();
  const [message, setMessage] = useState(t('callback.signingIn'));

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
          setMessage(t('callback.sessionNotFound'));
          setTimeout(() => navigate('/auth', { replace: true }), 1500);
          return;
        }

        // Password reset flow has been removed (passwordless OTP); fall through to
        // the normal onboarding-aware redirect below.

        setMessage(t('callback.settingUpProfile'));

        await new Promise(r => setTimeout(r, 700));

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, has_completed_onboarding')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || !profile.has_completed_onboarding) {
          navigate('/edit-profile?onboarding=1', { replace: true });
        } else {
          navigate('/', { replace: true });
        }

      } catch (err) {
        console.error('[AuthCallback]', err);
        setMessage(t('callback.somethingWentWrong'));
        setTimeout(() => navigate('/auth', { replace: true }), 1500);
      }
    };

    run();
  }, [navigate, isInMedianApp]);

  // In SFVC/Safari: extract session tokens and write to localStorage for WebView pickup
  useEffect(() => {
    if (isInMedianApp) return;

    const passSessionToWebView = async () => {
      await new Promise(r => setTimeout(r, 300));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        localStorage.setItem('clbhouz_oauth_session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          ts: Date.now(),
        }));
      } catch {}
    };

    passSessionToWebView();
  }, [isInMedianApp]);

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
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, rgba(247,147,30,0.10) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 110%, rgba(247,147,30,0.04) 0%, transparent 60%), ${PAGE_CANVAS}`,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', maxWidth: 380, width: '100%' }}>
          <img
            src="/images/clbhouz-logo.png"
            // eslint-disable-next-line no-restricted-syntax -- brand wordmark, proper noun
            alt="clbhouz"
            className="h-16 w-auto opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, lineHeight: 1.2, letterSpacing: 0, margin: 0 }}>
            {t('callback.verifiedTitle')}
          </h1>
          <p style={{ fontSize: 15, fontWeight: 400, color: BODY_INK, lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
            {t('callback.verifiedBody')}
          </p>
          <p style={{ fontSize: 12, color: DIM_INK, lineHeight: 1.5, maxWidth: 260, margin: 0 }}>
            {t('callback.closePage')}
          </p>
        </div>
        <div style={{ position: 'fixed', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: DIM_INK, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t('callback.brandTagline')}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: `radial-gradient(ellipse 120% 80% at 50% 20%, ${MEMBER_PANEL} 0%, ${PAGE_CANVAS} 100%)`,
      }}
    >
      <div
        className="flex flex-col items-center gap-4 p-8 rounded-3xl"
        style={{
          background: MEMBER_PANEL,
          border: `0.5px solid ${SURFACE.dark.hairline}`,
          boxShadow: `0 10px 30px ${surfaceWithAlpha(PAGE_CANVAS, 0.48)}`,
        }}
      >
        <img
          src="/images/clbhouz-logo.png"
          // eslint-disable-next-line no-restricted-syntax -- brand wordmark, proper noun
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: inkWithAlpha(INK, 0.10), borderTopColor: INK }} aria-label={t('a11y.loading')} />
        <p className="text-sm" style={{ color: MUTE_INK }} aria-live="polite">{message}</p>
      </div>
    </div>
  );
}
