import React from 'react';
import { Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 flex flex-col bg-[#0D0F11]">
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(247, 147, 30, 0.08) 0%, transparent 60%)',
        }}
      />
      
      {/* Content container */}
      <div className="relative flex-1 flex flex-col px-6 pt-safe">
        {/* Logo section */}
        <div className="flex justify-center pt-16 pb-8">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="clbhouz"
            className="h-12 w-auto"
          />
        </div>
        
        {/* Hero text */}
        <div className="flex-1 flex flex-col justify-center items-center text-center -mt-16">
          <h1 
            className="text-[32px] font-bold text-white leading-tight mb-3"
            style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
          >
            Your golf life.<br />Captured.
          </h1>
          <p className="text-[15px] text-white/60 max-w-[280px]">
            Share moments. Track your journey. Discover courses.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="pb-8 space-y-3">
          {/* Apple button */}
          <button
            onClick={onAppleSignIn}
            disabled={submitting}
            className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-full bg-white text-[#0D0F11] font-medium text-[15px] transition-all active:scale-[0.98] disabled:opacity-50"
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
          
          {/* Google button */}
          <button
            onClick={onGoogleSignIn}
            disabled={submitting}
            className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-full bg-white/10 text-white font-medium text-[15px] border border-white/20 transition-all active:scale-[0.98] hover:bg-white/15 disabled:opacity-50"
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
          
          {/* Email button */}
          <button
            onClick={onEmailSignUp}
            disabled={submitting}
            className="w-full h-[52px] flex items-center justify-center gap-2.5 rounded-full bg-white/10 text-white font-medium text-[15px] border border-white/20 transition-all active:scale-[0.98] hover:bg-white/15 disabled:opacity-50"
          >
            Continue with Email
          </button>
          
          {/* Login link */}
          <div className="text-center pt-2">
            <button
              onClick={onLoginClick}
              disabled={submitting}
              className="text-[14px] text-white/60 hover:text-white/80 transition-colors"
            >
              Already a member?{' '}
              <span className="text-[#F7931E] font-medium">Log in</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHeroScreen;
