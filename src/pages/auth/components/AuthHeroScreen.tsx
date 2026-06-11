import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import { isMedianApp } from '@/utils/median/isMedianApp';

// Toggle wordmark visibility
const SHOW_WORDMARK = false;

// Email validation schema
const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Please enter a valid email address' });

interface AuthHeroScreenProps {
  submitting: boolean;
  onSubmitEmail: (email: string) => Promise<void> | void;
  onAppleSignIn?: () => void;
  onGoogleSignIn?: () => void;
  errorMessage?: string | null;
  errorNonce?: number;
}

const AppleLogo: React.FC<{ size?: number }> = ({ size = 17 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#000000"
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
  submitting,
  onSubmitEmail,
  onAppleSignIn,
  onGoogleSignIn,
  errorMessage,
  errorNonce,
}) => {

  // Dark status bar + safe-area shield for Median.co wrapper
  useMedianStatusBar('dark', '#0A0E14', true, false);

  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [hasEditedSinceError, setHasEditedSinceError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Re-announce external errors whenever a new one arrives
  useEffect(() => {
    if (errorMessage) setHasEditedSinceError(false);
  }, [errorMessage, errorNonce]);

  // Show session-expired toast on mount (preserved behaviour)
  useEffect(() => {
    const logoutReason = safeLocalStorage.get('logout_reason');
    if (logoutReason === 'session_expired') {
      toast.info('For your security, please sign in again.', { duration: 5000 });
      safeLocalStorage.remove('logout_reason');
    }
  }, []);

  const handleContinue = async () => {
    setEmailError(null);
    const result = emailSchema.safeParse(loginEmail);
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Invalid email');
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
  const showApple = useMemo(() => isMedianApp() && !!onAppleSignIn, [onAppleSignIn]);

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0A0E14 0%, #0C1119 100%)' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative flex-1 flex flex-col px-6 pt-safe overflow-y-auto">
        {/* Logo */}
        <div
          className="flex flex-col justify-center items-center gap-3 auth-logo-animate"
          style={{
            paddingTop: 'clamp(32px, 12vh, 100px)',
            paddingBottom: '2rem',
          }}
        >
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-[90px] md:h-[100px] w-auto relative z-10"
          />
          {SHOW_WORDMARK && (
            <span className="text-white/90 text-[24px] font-medium tracking-tight">clbhouz</span>
          )}
        </div>

        {/* Tagline */}
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-4">
          <h1
            className="text-[38px] md:text-[44px] font-semibold text-white leading-tight auth-tagline-animate"
            style={{ letterSpacing: '-0.02em' }}
          >
            stay in play.
          </h1>
        </div>

        {/* Bottom action panel */}
        <div
          className="pb-8 pt-6 -mx-6 px-6"
          style={{
            background: 'rgba(8, 11, 16, 0.55)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="auth-button-6 space-y-3">
            {showApple && (
              <>
                <button
                  type="button"
                  onClick={onAppleSignIn}
                  disabled={submitting}
                  aria-label="Continue with Apple"
                  className="w-full flex items-center justify-center gap-2 rounded-[14px] transition-opacity active:opacity-85 disabled:opacity-60"
                  style={{
                    minHeight: 52,
                    background: '#FFFFFF',
                    border: 'none',
                    color: '#000000',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" style={{ color: '#000' }} />
                  ) : (
                    <>
                      <AppleLogo size={17} />
                      <span>Continue with Apple</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>or</span>
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
                placeholder="Email address"
                disabled={submitting}
                className="auth-email-input w-full h-[54px] px-6 rounded-[14px] font-medium text-[15px] text-center focus:outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255, 255, 255, 0.88)',
                }}
                autoComplete="email"
                inputMode="email"
              />
            </div>

            {emailError && (
              <p className="text-red-400 text-[13px] text-center">{emailError}</p>
            )}

            {errorMessage && !hasEditedSinceError && (
              <p
                key={errorNonce}
                className="text-red-400 text-[13px] text-center auth-error-fade"
              >
                {errorMessage}
              </p>
            )}

            <button
              onClick={handleContinue}
              disabled={!canContinue}
              aria-label="Continue"
              className="w-full h-[54px] flex items-center justify-center gap-2 rounded-[14px] font-bold text-[15px] transition-all duration-150 active:scale-[0.98]"
              style={{
                background: canContinue ? '#F7931E' : 'rgba(255,255,255,0.05)',
                color: canContinue ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                border: canContinue ? 'none' : '1px solid rgba(255,255,255,0.10)',
                boxShadow: 'none',
                cursor: !canContinue ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Continue
                  {trimmed && <ArrowRight size={17} aria-hidden="true" />}
                </>
              )}
            </button>

            <p
              className="text-center"
              style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}
            >
              We'll email you a 6-digit code. No password needed.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        html, body { background-color: #0A0E14 !important; }

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
          color: rgba(255, 255, 255, 0.55);
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
