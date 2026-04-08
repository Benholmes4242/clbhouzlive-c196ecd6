import React, { useState, useEffect, useRef } from 'react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import PasswordBottomSheet from './PasswordBottomSheet';

// Toggle wordmark visibility
const SHOW_WORDMARK = false;

// OAuth cooldown to prevent double-clicks
const OAUTH_COOLDOWN = 2000;

// Email validation schema
const emailSchema = z.string().trim().email({ message: 'Please enter a valid email address' });

interface AuthHeroScreenProps {
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
  onEmailSignUp: () => void;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => void;
  submitting: boolean;
}

const AuthHeroScreen: React.FC<AuthHeroScreenProps> = ({
  onAppleSignIn,
  onGoogleSignIn,
  onEmailSignUp,
  onEmailLogin,
  onForgotPassword,
  submitting,
}) => {
  // Dark status bar + safe-area shield for Median.co wrapper
  useMedianStatusBar('dark', '#0d0d0d', true, false);

  const [lastOAuthAttempt, setLastOAuthAttempt] = useState<number>(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // FIX 6: Check for session expiry message on mount
  useEffect(() => {
    const logoutReason = safeLocalStorage.get('logout_reason');
    if (logoutReason === 'session_expired') {
      toast.info('For your security, please sign in again.', { duration: 5000 });
      safeLocalStorage.remove('logout_reason');
    }
  }, []);

  // FIX 4: OAuth button debouncing
  const handleOAuthClick = (provider: 'google' | 'apple', handler: () => void) => {
    const now = Date.now();
    if (now - lastOAuthAttempt < OAUTH_COOLDOWN) {
      console.log('[Auth] OAuth attempt too soon, ignoring');
      return;
    }
    
    setLastOAuthAttempt(now);
    handler();
  };

  // Validate and continue to password sheet
  const handleContinue = () => {
    setEmailError(null);
    
    const result = emailSchema.safeParse(loginEmail);
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Invalid email');
      emailInputRef.current?.focus();
      return;
    }
    
    setShowPasswordSheet(true);
  };

  // Handle password submission
  const handlePasswordSubmit = async (password: string) => {
    await onEmailLogin(loginEmail.trim(), password);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    setShowPasswordSheet(false);
    onForgotPassword(loginEmail.trim());
  };

  // Handle Enter key on email input
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Background - solid dark with subtle gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 100%)',
        }}
      />
      
      {/* Radial glow behind logo area */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: '100%',
          height: '60%',
          background: 'radial-gradient(circle at center 30%, rgba(247, 147, 30, 0.04) 0%, transparent 50%)',
          opacity: 0.4,
        }}
      />
      
      {/* Subtle vignette overlay - darkens edges */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.4) 100%)',
        }}
      />
      
      {/* Ultra-fine grain texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content container */}
      <div className="relative flex-1 flex flex-col px-6 pt-safe overflow-y-auto">
        {/* Logo section - enhanced with larger size and glow */}
        <div 
          className="flex flex-col justify-center items-center gap-3 auth-logo-animate"
          style={{ 
            paddingTop: 'clamp(32px, 12vh, 100px)',
            paddingBottom: '2rem',
          }}
        >
          {/* Subtle radial glow behind logo */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(247, 147, 30, 0.03) 0%, transparent 60%)',
              filter: 'blur(25px)',
              top: 'calc(16vh - 40px)',
            }}
          />
          
          {/* Logo - larger for more presence */}
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-[90px] md:h-[100px] w-auto relative z-10"
          />
          
          {SHOW_WORDMARK && (
            <span 
              className="text-white/90 text-[24px] font-medium tracking-tight"
            >
              clbhouz
            </span>
          )}
        </div>
        
        {/* Hero text - larger, more impactful */}
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-4">
          <h1 
            className="text-[38px] md:text-[44px] font-semibold text-white leading-tight auth-tagline-animate"
            style={{ 
              letterSpacing: '-0.02em',
            }}
          >
            stay in play.
          </h1>
        </div>
        
        {/* Action buttons - enhanced glass container */}
        <div 
          className="pb-8 pt-6 -mx-6 px-6"
          style={{
            background: 'rgba(13, 13, 13, 0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 -12px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="space-y-3">
            {/* Apple button - Coming soon */}
            <button
              disabled={true}
              aria-label="Continue with Apple — Coming soon"
              className="auth-button-1 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 cursor-not-allowed"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.92)',
                opacity: 0.5,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="flex flex-col items-center">
                <span>Continue with Apple</span>
                <span style={{ fontSize: '11px', opacity: 0.5 }}>Coming soon</span>
              </span>
            </button>
            
            {/* Google button - enhanced with better contrast */}
            <button
              disabled={true}
              aria-label="Continue with Google — Coming soon"
              className="auth-button-2 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 cursor-not-allowed"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.92)',
                opacity: 0.5,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="flex flex-col items-center">
                <span>Continue with Google</span>
                <span style={{ fontSize: '11px', opacity: 0.5 }}>Coming soon</span>
              </span>
            </button>
            
            {/* Email button - subtle hierarchy difference */}
            <button
              onClick={onEmailSignUp}
              disabled={submitting}
              aria-label="Create account with Email"
              className="auth-button-3 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 hover:bg-white/[0.06]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              Create account with Email
            </button>
            
            {/* OR Divider */}
            <div className="flex items-center gap-3 py-2 auth-button-4">
              <div className="flex-1 h-px bg-neutral-700" />
              <span 
                className="text-sm font-medium text-neutral-500"
              >
                OR
              </span>
              <div className="flex-1 h-px bg-neutral-700" />
            </div>
            
            {/* Sign-in eyebrow label */}
            <p
              className="auth-button-5 text-center"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              Already have an account? Sign in below
            </p>
            
            {/* Email input for login */}
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
                  className="w-full h-[56px] px-5 rounded-full bg-neutral-900 border border-neutral-700 text-white placeholder:text-neutral-500 text-[16px] focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all disabled:opacity-50"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              
              {/* Email error message */}
              {emailError && (
                <p className="text-red-400 text-[13px] text-center">
                  {emailError}
                </p>
              )}
              
              {/* Continue button - white primary style when email present */}
              <button
                onClick={handleContinue}
                disabled={submitting || !loginEmail.trim()}
                aria-label="Continue to login"
                className={`w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
                  loginEmail.trim() 
                    ? 'bg-white text-[#0D0F11] hover:bg-gray-50 active:brightness-95' 
                    : 'hover:bg-white/[0.08]'
                }`}
                style={{
                  ...(loginEmail.trim() 
                    ? { boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.08)' }
                    : { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.92)' }
                  ),
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Bottom Sheet */}
      <PasswordBottomSheet
        isOpen={showPasswordSheet}
        email={loginEmail}
        onClose={() => setShowPasswordSheet(false)}
        onSubmit={handlePasswordSubmit}
        onForgotPassword={handleForgotPassword}
        submitting={submitting}
      />
      
      {/* Enhanced animation styles */}
      <style>{`
        html, body {
          background-color: #0d0d0d !important;
        }

        @keyframes auth-logo-in {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes auth-tagline-in {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes auth-button-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .auth-logo-animate {
          animation: auth-logo-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
        }
        
        .auth-tagline-animate {
          animation: auth-tagline-in 0.5s ease-out 0.25s both;
        }
        
        .auth-button-1 { animation: auth-button-in 0.4s ease-out 0.35s both; }
        .auth-button-2 { animation: auth-button-in 0.4s ease-out 0.45s both; }
        .auth-button-3 { animation: auth-button-in 0.4s ease-out 0.55s both; }
        .auth-button-4 { animation: auth-button-in 0.4s ease-out 0.65s both; }
        .auth-button-5 { animation: auth-button-in 0.4s ease-out 0.75s both; }
        .auth-button-6 { animation: auth-button-in 0.4s ease-out 0.85s both; }
        
        @media (prefers-reduced-motion: reduce) {
          .auth-logo-animate,
          .auth-tagline-animate,
          .auth-button-1,
          .auth-button-2,
          .auth-button-3,
          .auth-button-4,
          .auth-button-5,
          .auth-button-6 {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthHeroScreen;
