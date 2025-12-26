import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/**
 * VerifiedPage - Shown after email verification completes
 * 
 * This is a standalone page that works in a mobile browser.
 * After verifying their email, users land here and must manually sign in.
 */
const VerifiedPage: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(20, 20, 22, 1) 0%, #0a0a0a 100%)',
      }}
    >
      {/* Glass container */}
      <div 
        className="flex flex-col items-center gap-6 p-8 rounded-3xl w-full max-w-sm"
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Logo */}
        <img
          src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
          alt="clbhouz"
          className="h-10 w-auto opacity-80"
        />
        
        {/* Success icon */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(47, 158, 68, 0.15)' }}
        >
          <CheckCircle2 className="w-8 h-8 text-[#2F9E44]" />
        </div>
        
        {/* Headline */}
        <h1 
          className="text-white text-xl font-semibold text-center"
          style={{ fontFamily: 'SF Pro Display, system-ui, sans-serif' }}
        >
          You're verified ✅
        </h1>
        
        {/* Body text */}
        <p 
          className="text-white/60 text-[15px] text-center leading-relaxed"
          style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}
        >
          Welcome to Clbhouz. Your email address has been confirmed.
        </p>
        
        <p 
          className="text-white/40 text-[13px] text-center"
          style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}
        >
          Please sign in using your login details in the Clbhouz app (or on the web).
        </p>
        
        {/* Sign in button */}
        <Link
          to="/auth"
          className="w-full h-[54px] flex items-center justify-center rounded-full text-[15px] transition-all duration-200 active:scale-[0.98] mt-2"
          style={{
            fontFamily: 'SF Pro Text, system-ui, sans-serif',
            fontWeight: 500,
            background: 'white',
            color: '#0D0F11',
          }}
        >
          Go to sign in
        </Link>
        
        {/* Secondary text */}
        <p 
          className="text-white/30 text-[12px] text-center"
          style={{ fontFamily: 'SF Pro Text, system-ui, sans-serif' }}
        >
          You can now close this tab.
        </p>
      </div>
    </div>
  );
};

export default VerifiedPage;
