import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Toggle wordmark visibility
const SHOW_WORDMARK = false;

// OAuth cooldown to prevent double-clicks
const OAUTH_COOLDOWN = 2000;

interface AuthHeroScreenProps {
  onAppleSignIn: () => void;
  onGoogleSignIn: () => void;
  onEmailSignUp: () => void;
  onLoginClick: () => void;
  submitting: boolean;
}

const AuthHeroScreen: React.FC<AuthHeroScreenProps> = ({
  onAppleSignIn,
  onGoogleSignIn,
  onEmailSignUp,
  onLoginClick,
  submitting,
}) => {
  const [lastOAuthAttempt, setLastOAuthAttempt] = useState<number>(0);

  // FIX 6: Check for session expiry message on mount
  useEffect(() => {
    const logoutReason = localStorage.getItem('logout_reason');
    if (logoutReason === 'session_expired') {
      toast.info('For your security, please sign in again.', { duration: 5000 });
      localStorage.removeItem('logout_reason');
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
      <div className="relative flex-1 flex flex-col px-6 pt-safe">
        {/* Logo section - enhanced with larger size and glow */}
        <div 
          className="flex flex-col justify-center items-center gap-3 auth-logo-animate"
          style={{ 
            paddingTop: '16vh',
            paddingBottom: '2.5rem',
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
              style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
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
              fontFamily: 'SF Pro Display, system-ui, sans-serif',
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
            {/* Apple button - primary hero with enhanced shadow */}
            <button
              onClick={() => handleOAuthClick('apple', onAppleSignIn)}
              disabled={submitting}
              aria-label="Sign in with Apple"
              aria-busy={submitting}
              className="auth-button-1 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all duration-150 active:scale-[0.98] active:brightness-95 disabled:opacity-50 hover:bg-gray-50"
              style={{
                fontFamily: 'SF Pro Text, system-ui, sans-serif',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.08)',
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continue with Apple
                </>
              )}
            </button>
            
            {/* Google button - enhanced with better contrast */}
            <button
              onClick={() => handleOAuthClick('google', onGoogleSignIn)}
              disabled={submitting}
              aria-label="Sign in with Google"
              aria-busy={submitting}
              className="auth-button-2 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 hover:bg-white/[0.08]"
              style={{
                fontFamily: 'SF Pro Text, system-ui, sans-serif',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.92)',
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            
            {/* Email button - subtle hierarchy difference */}
            <button
              onClick={onEmailSignUp}
              disabled={submitting}
              aria-label="Continue with email"
              className="auth-button-3 w-full h-[56px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 hover:bg-white/[0.06]"
              style={{
                fontFamily: 'SF Pro Text, system-ui, sans-serif',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.88)',
              }}
            >
              Continue with Email
            </button>
            
            {/* Login link - enhanced styling */}
            <div className="text-center pt-2 auth-button-4">
              <button
                onClick={onLoginClick}
                disabled={submitting}
                className="text-[15px] text-white/50 hover:text-white/70 transition-colors py-2 px-4 -mx-4"
                style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}
              >
                Already a member?{' '}
                <span 
                  className="font-medium hover:underline underline-offset-2 transition-colors"
                  style={{ color: '#F7931E' }}
                >
                  Log in
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced animation styles */}
      <style>{`
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
      `}</style>
    </div>
  );
};

export default AuthHeroScreen;
