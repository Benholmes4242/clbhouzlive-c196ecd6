import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
// Chrome owned solely by AppRoutes (/auth + /signup are darkChrome routes).
import { Loader2, Mail } from 'lucide-react';
import { toast } from '@/lib/toast';
import { z } from 'zod';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import { isMedianApp } from '@/utils/median/isMedianApp';
import { Button } from '@/components/ui/button';
import { GUEST_BROWSING_ENABLED } from '@/features/guest/guestConfig';
import { isGuestUser } from '@/features/guest/useIsGuest';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import './auth-hero.css';

// Choose/email state lives here; OTP remains AuthForm-owned. Guest return uses
// the canonical switch/session definition and never creates a guest session.

interface AuthHeroScreenProps {
  submittingMethod: 'email' | 'apple' | 'google' | null;
  onSubmitEmail: (email: string) => Promise<void> | void;
  onAppleSignIn?: () => void;
  onGoogleSignIn?: () => void;
  errorMessage?: string | null;
  errorNonce?: number;
}

// Exported for the guest join card (brief: the Apple logo AuthHeroScreen uses).
export const AppleLogo: React.FC<{ size?: number; color?: string }> = ({ size = 17, color = '#0B0D12' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M16.365 1.43c0 1.14-.42 2.23-1.17 3.02-.83.88-2.18 1.56-3.27 1.47-.13-1.1.42-2.25 1.16-3.04.83-.9 2.27-1.57 3.28-1.45zM20.5 17.27c-.55 1.27-.82 1.84-1.53 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.77-4.04-3.33C.07 16.07-.23 10.99 1.46 8.21c1.2-1.97 3.09-3.12 4.87-3.12 1.81 0 2.95 1 4.45 1 1.46 0 2.35-1 4.45-1 1.58 0 3.26.86 4.46 2.35-3.92 2.15-3.28 7.75-.69 9.83z" />
  </svg>
);

// Exported for the guest join card (brief: the existing GoogleLogo).
export const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
  >
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7C13.42 14.62 18.27 10.75 24 10.75z"/>
  </svg>
);


const AuthHeroScreen: React.FC<AuthHeroScreenProps> = ({
  submittingMethod,
  onSubmitEmail,
  onAppleSignIn,
  onGoogleSignIn,
  errorMessage,
  errorNonce,
}) => {
  const submitting = submittingMethod !== null;
  const emailSubmitting = submittingMethod === 'email';
  const appleSubmitting = submittingMethod === 'apple';
  const googleSubmitting = submittingMethod === 'google';
  const { t } = useTranslation(['auth', 'common']);

  const emailSchema = useMemo(
    () =>
      z
        .string()
        .trim()
        .email({ message: t('auth:hero.invalidEmail') }),
    [t],
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useSupabaseSession();
  const showBrowse = GUEST_BROWSING_ENABLED && !loading && (!user || isGuestUser(user));
  const [step, setStep] = useState<'choose' | 'email'>('choose');
  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasEditedSinceError, setHasEditedSinceError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'email') emailInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (errorMessage) setHasEditedSinceError(false);
  }, [errorMessage, errorNonce]);

  useEffect(() => {
    const logoutReason = safeLocalStorage.get('logout_reason');
    if (logoutReason === 'session_expired') {
      toast.info(t('auth:hero.sessionExpired'), { duration: 5000 });
      safeLocalStorage.remove('logout_reason');
    }
  }, [t]);

  const handleContinue = async () => {
    if (submitting) return;
    setEmailError(null);
    const result = emailSchema.safeParse(loginEmail);
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || t('auth:hero.invalidEmailShort'));
      emailInputRef.current?.focus();
      return;
    }
    await onSubmitEmail(result.data);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  const trimmed = loginEmail.trim();
  const canContinue = emailSchema.safeParse(trimmed).success && !submitting;
  const inMedian = useMemo(() => isMedianApp(), []);
  const showApple = inMedian && !!onAppleSignIn;
  const showGoogle = inMedian && !!onGoogleSignIn;
  const showSocial = showApple || showGoogle;


  const browse = () => {
    const from = location.state?.from;
    navigate(from || '/');
  };

  return (
    <div className="auth-hero-screen">
      <div className="auth-hero-glow" aria-hidden="true" />
      <div className="auth-hero-brand">
        <img src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png" alt="clbhouz" className="auth-logo-animate" />
        <h1 className="auth-tagline-animate">{t('auth:hero.tagline')}<span className="auth-hero-dot" aria-hidden="true" /></h1>
      </div>
      <div className="auth-button-6">
        <div key={step} className={`auth-hero-panel auth-step-enter ${step === 'email' || !showBrowse ? 'auth-hero-panel-bottom' : ''}`}>
          {step === 'choose' ? <>
            {showSocial && <>
              <div className="auth-hero-social">
                {showApple && <Button variant="ghost" type="button" onClick={onAppleSignIn} disabled={submitting} aria-label={t('auth:hero.continueWithApple')} className="auth-hero-circle">
                  {appleSubmitting ? <Loader2 size={24} className="animate-spin" /> : <AppleLogo size={24} color="currentColor" />}
                </Button>}
                {showGoogle && <Button variant="ghost" type="button" onClick={onGoogleSignIn} disabled={submitting} aria-label={t('auth:hero.continueWithGoogle')} className="auth-hero-circle">
                  {googleSubmitting ? <Loader2 size={22} className="animate-spin" /> : <GoogleLogo size={22} />}
                </Button>}
              </div>
              <div className="auth-hero-or">{t('auth:hero.or')}</div>
            </>}
            <Button variant="ghost" type="button" className="auth-hero-pill" disabled={submitting} onClick={() => setStep('email')}>
              <Mail size={19} strokeWidth={2} />{t('auth:hero.continueWithEmail')}
            </Button>
            <p className="auth-hero-terms"><Trans i18nKey="auth:hero.termsShort" components={{ terms: <Link to="/terms" />, privacy: <Link to="/privacy" /> }} /></p>
          </> : <>
            <Button variant="ghost" type="button" className="auth-hero-back" aria-label={t('common:back')} onClick={() => setStep('choose')} disabled={submitting}><span aria-hidden="true">‹</span></Button>
            <h2>{t('auth:hero.emailTitle')}</h2>
            <p className="auth-hero-hint">{t('auth:hero.codeHint')}</p>
            <input ref={emailInputRef} type="email" value={loginEmail} onChange={(e) => {
              setLoginEmail(e.target.value);
              if (emailError) setEmailError(null);
              setHasEditedSinceError(true);
            }} onKeyDown={handleEmailKeyDown} placeholder={t('auth:hero.emailPlaceholder')} aria-label={t('auth:hero.emailPlaceholder')} disabled={submitting} className="auth-hero-input" autoComplete="email" inputMode="email" />
            {emailError && <p role="alert" className="auth-hero-error">{emailError}</p>}
            {errorMessage && !hasEditedSinceError && <p role="alert" key={errorNonce} className="auth-hero-error auth-error-fade">{errorMessage}</p>}
            <Button variant="ghost" type="button" onClick={handleContinue} disabled={!canContinue} className="auth-hero-pill auth-hero-send">
              {emailSubmitting ? <Loader2 size={18} className="animate-spin" /> : t('auth:hero.sendCode')}
            </Button>
          </>}
        </div>
        {step === 'choose' && showBrowse && <Button variant="ghost" type="button" className="auth-hero-band" onClick={browse} disabled={submitting}>{t('auth:hero.lookAround')}<span aria-hidden="true">›</span></Button>}
      </div>
    </div>
  );
};

export default AuthHeroScreen;
