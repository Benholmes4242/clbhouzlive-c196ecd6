import { Link } from "react-router-dom";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
// Chrome owned solely by AppRoutes (/auth + /signup are darkChrome routes).
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/lib/toast';
import { z } from 'zod';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import { isMedianApp } from '@/utils/median/isMedianApp';
import { BODY, DISPLAY_TRACKING } from '@/lib/tokens/type';

// Toggle wordmark visibility
const SHOW_WORDMARK = false;

interface AuthHeroScreenProps {
  submittingMethod: 'email' | 'apple' | 'google' | null;
  onSubmitEmail: (email: string) => Promise<void> | void;
  onAppleSignIn?: () => void;
  onGoogleSignIn?: () => void;
  errorMessage?: string | null;
  errorNonce?: number;
}

const AppleLogo: React.FC<{ size?: number; color?: string }> = ({ size = 17, color = '#0B0D12' }) => (
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

const GoogleLogo: React.FC<{ size?: number }> = ({ size = 18 }) => (
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

  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasEditedSinceError, setHasEditedSinceError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

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
  const canContinue = trimmed.length > 0 && !submitting;
  const continueActiveLook = canContinue || emailSubmitting;
  const inMedian = useMemo(() => isMedianApp(), []);
  const showApple = inMedian && !!onAppleSignIn;
  const showGoogle = inMedian && !!onGoogleSignIn;
  const showSocial = showApple || showGoogle;


  return (
    <div className="fixed inset-y-0 left-1/2 flex w-full max-w-[480px] -translate-x-1/2 flex-col md:max-w-[440px]">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: '#15171F' }}
      />

      <div className="relative flex-1 flex flex-col px-6 pt-safe overflow-y-auto">
        <div className="flex-1" />

        {/* Brand block: logo + tagline */}
        <div
          className="flex flex-col justify-center items-center gap-3 auth-logo-animate"
          style={{
            paddingTop: 0,
            paddingBottom: 0,
          }}
        >
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            // eslint-disable-next-line no-restricted-syntax -- brand wordmark, proper noun
            alt="clbhouz"
            className="h-[72px] md:h-[80px] w-auto relative z-10"
          />
          {SHOW_WORDMARK && (
            // eslint-disable-next-line i18next/no-literal-string -- brand wordmark, proper noun
            <span className="text-[24px] font-medium tracking-tight" style={{ color: 'rgba(255,255,255,0.96)' }}>clbhouz</span>
          )}
        </div>

        <div className="flex flex-col items-center text-center" style={{ marginTop: 18 }}>
          <h1
            className="text-[30px] md:text-[36px] font-bold leading-[1.25] auth-tagline-animate"
            style={{ letterSpacing: DISPLAY_TRACKING, color: 'rgba(255,255,255,0.96)', textWrap: 'balance' as any, padding: '0 8px' }}
          >
            {t('auth:hero.tagline')}<span aria-hidden="true" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F7931E', verticalAlign: 'baseline', marginLeft: 2 }} />
          </h1>
        </div>

        <div className="flex-1" />

        {/* Bottom action panel */}
        <div
          className="pt-6 -mx-6 px-6"
          style={{
            background: '#15171F',
            paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="auth-button-6 space-y-3">
            {showSocial && (
              <>
                {showApple && (
                  <button
                    type="button"
                    onClick={onAppleSignIn}
                    disabled={submitting}
                    aria-label={t('auth:hero.continueWithApple')}
                    className="w-full flex items-center justify-center gap-2 rounded-sq-sm transition-opacity active:opacity-85 disabled:opacity-60"
                    style={{
                      minHeight: 54,
                      background: '#FFFFFF',
                      border: 'none',
                      color: '#0B0D12',
                      fontSize: 13,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {appleSubmitting ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: '#0B0D12' }} />
                    ) : (
                      <>
                        <AppleLogo size={17} color="#0B0D12" />
                        <span>{t('auth:hero.continueWithApple')}</span>
                      </>
                    )}
                  </button>
                )}

                {showGoogle && (
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={submitting}
                    aria-label={t('auth:hero.continueWithGoogle')}
                    className="w-full flex items-center justify-center gap-2 rounded-sq-sm transition-opacity active:opacity-85 disabled:opacity-60"
                    style={{
                      minHeight: 54,
                      background: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: '#1F1F1F',
                      fontSize: 13,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {googleSubmitting ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: '#1F1F1F' }} />
                    ) : (
                      <>
                        <GoogleLogo size={18} />
                        <span>{t('auth:hero.continueWithGoogle')}</span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-3" aria-hidden="true">
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>{t('auth:hero.or')}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
                </div>

              </>
            )}
            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (emailError) setEmailError(null);
                  setHasEditedSinceError(true);
                }}
                onKeyDown={handleEmailKeyDown}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                placeholder={t('auth:hero.emailPlaceholder')}
                disabled={submitting}
                className="auth-email-input w-full h-[54px] px-5 rounded-sq-sm font-medium text-[15px] text-left focus:outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.96)',
                  transition: 'background-color 140ms ease, border-color 140ms ease',
                }}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {emailError && (
              <p className="text-center" style={{ ...BODY, fontSize: 14, color: '#F87171' }}>{emailError}</p>
            )}

            {errorMessage && !hasEditedSinceError && (
              <p
                key={errorNonce}
                className="text-center auth-error-fade"
                style={{ color: '#F87171' }}
              >
                {errorMessage}
              </p>
            )}

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              aria-label={t('auth:hero.continue')}
              className="w-full h-[54px] flex items-center justify-center gap-2 rounded-sq-sm font-bold transition-all duration-150 active:scale-[0.98]"
              style={{
                fontSize: 13,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                background: continueActiveLook ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                color: continueActiveLook ? '#0A0D12' : 'rgba(255,255,255,0.38)',
                border: continueActiveLook ? 'none' : '1px solid rgba(255,255,255,0.10)',
                boxShadow: continueActiveLook ? '0 6px 20px rgba(255,255,255,0.18)' : 'none',
                cursor: !canContinue ? 'not-allowed' : 'pointer',
              }}
            >
              {emailSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  {t('auth:hero.continue')}
                  {trimmed && <ArrowRight size={17} aria-hidden="true" />}
                </>
              )}
            </button>

            <p
              className="text-center"
              style={{ ...BODY, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}
            >
              {t('auth:hero.codeHint')}
            </p>

            <p
              style={{
                margin: '14px 4px 0',
                ...BODY, fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                textAlign: 'center',
              }}
            >
              <Trans
                i18nKey="auth:hero.termsBlock"
                defaults="By continuing, you agree to our <terms>Terms of Service</terms> and <privacy>Privacy Policy</privacy>. clbhouz has zero tolerance for objectionable content and abusive behavior. Reports are reviewed within 24 hours."
                components={{
                  terms: <Link to="/terms" style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'none' }} />,
                  privacy: <Link to="/privacy" style={{ color: '#FFFFFF', fontWeight: 600, textDecoration: 'none' }} />,
                }}
              />
            </p>
          </div>
        </div>
      </div>

      <style>{`
        html, body { background-color: #15171F !important; }

        @keyframes auth-logo-in {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes auth-tagline-in {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes auth-button-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .auth-logo-animate { animation: auth-logo-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
        .auth-tagline-animate { animation: auth-tagline-in 0.5s ease-out 0.25s both; }
        .auth-button-6 { animation: auth-button-in 0.4s ease-out 0.45s both; }

        .auth-email-input::placeholder {
          color: rgba(255,255,255,0.38);
          font-weight: 500;
          font-size: 15px;
        }

        @keyframes auth-error-fade-in {
          from { opacity: 0; transform: translateY(-3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-error-fade {
          animation: auth-error-fade-in 0.25s ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-logo-animate, .auth-tagline-animate, .auth-button-6, .auth-error-fade {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthHeroScreen;
