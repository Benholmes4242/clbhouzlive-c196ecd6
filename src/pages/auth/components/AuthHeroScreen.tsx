import React, { useEffect, useRef, useState } from 'react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

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
}

const AuthHeroScreen: React.FC<AuthHeroScreenProps> = ({ submitting, onSubmitEmail }) => {
  // Dark status bar + safe-area shield for Median.co wrapper
  useMedianStatusBar('dark', '#0A0E14', true, false);

  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

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
            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (emailError) setEmailError(null);
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

        @media (prefers-reduced-motion: reduce) {
          .auth-logo-animate, .auth-tagline-animate, .auth-button-6 {
            animation: none; opacity: 1; transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthHeroScreen;
