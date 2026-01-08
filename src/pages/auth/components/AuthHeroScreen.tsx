import React from 'react';
import { Loader2 } from 'lucide-react';

// Toggle wordmark visibility
const SHOW_WORDMARK = false;

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

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Background - solid dark color */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#0d0d0d',
        }}
      />
      
      {/* Subtle vignette overlay - darkens edges by ~4-5% */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0, 0, 0, 0.35) 100%)',
        }}
      />
      
      {/* Ultra-fine grain texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content container */}
      <div className="relative flex-1 flex flex-col px-6 pt-safe">
        {/* Logo section - positioned at ~20% from top */}
        <div 
          className="flex justify-center items-center gap-2.5 animate-auth-logo-in"
          style={{ 
            paddingTop: '18vh',
            paddingBottom: '2rem',
          }}
        >
          {/* Subtle radial glow behind logo */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '180px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(247, 147, 30, 0.05) 0%, transparent 70%)',
              filter: 'blur(30px)',
              top: 'calc(18vh - 40px)',
            }}
          />
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-[70px] w-auto relative z-10"
          />
          {SHOW_WORDMARK && (
            <span 
              className="text-white/90 text-[22px] font-medium tracking-tight"
              style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
            >
              clbhouz
            </span>
          )}
        </div>
        
        {/* Hero text - increased spacing, refined typography */}
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-8">
          <h1 
            className="text-[32px] font-semibold text-white leading-tight mb-4"
            style={{ 
              fontFamily: 'SF Pro Display, system-ui, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            Your home of golf.
          </h1>
          <p 
            className="text-[15px] text-white/70 max-w-[280px]"
            style={{ 
              fontFamily: 'SF Pro Text, system-ui, sans-serif',
              lineHeight: '1.5',
            }}
          >
            Everywhere you play. Every moment remembered.
          </p>
        </div>
        
        {/* Action buttons - glass container */}
        <div 
          className="pb-8 pt-6 -mx-6 px-6"
          style={{
            background: 'rgba(13, 13, 13, 0.95)',
            backdropFilter: 'blur(22px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div className="space-y-3">
            {/* Apple button - primary hero, white with subtle inner highlight */}
            <button
              onClick={onAppleSignIn}
              disabled={submitting}
              className="w-full h-[54px] flex items-center justify-center gap-2.5 rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all duration-150 active:scale-[0.98] active:brightness-95 disabled:opacity-50 mb-1"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continue with Apple
                </>
              )}
            </button>
            
            {/* Google button - secondary, darker with hairline border */}
            <button
              onClick={onGoogleSignIn}
              disabled={submitting}
              className="w-full h-[54px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'rgba(26, 28, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            
            {/* Email button - secondary, darker with hairline border */}
            <button
              onClick={onEmailSignUp}
              disabled={submitting}
              className="w-full h-[54px] flex items-center justify-center gap-2.5 rounded-full font-medium text-[15px] transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'rgba(26, 28, 32, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              Continue with Email
            </button>
            
            
            {/* Login link - polished with increased tap target */}
            <div className="text-center pt-1">
              <button
                onClick={onLoginClick}
                disabled={submitting}
                className="text-[14px] text-white/55 hover:text-white/75 transition-colors py-2 px-4 -mx-4"
              >
                Already a member?{' '}
                <span 
                  className="font-medium hover:underline underline-offset-2"
                  style={{ color: '#F7931E' }}
                >
                  Log in
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logo entrance animation styles */}
      <style>{`
        @keyframes auth-logo-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-auth-logo-in {
          animation: auth-logo-in 700ms ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AuthHeroScreen;
