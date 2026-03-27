import React, { useEffect, useState } from "react";
import { useAppLogo } from "@/hooks/useAppLogo";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  isSignUp: boolean;
  toggleAuthMode: () => void;
  submitting: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  isSignUp,
  toggleAuthMode,
  submitting,
}) => {
  const { currentLogo } = useAppLogo();
  const [isVisible, setIsVisible] = useState(false);

  // Fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{ 
        backgroundColor: '#0D0D0D',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      {/* Subtle gradient glow behind card */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
        }}
      />
      
      {/* Container with fade-in animation */}
      <div 
        className={cn(
          "relative z-10 w-full max-w-[380px] mx-auto flex flex-col items-center",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(214, 217, 222, 0.5)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          padding: '32px 24px',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out, height 0.25s ease, padding 0.25s ease',
        }}
      >
        {/* Logo section - 16-20px gap to heading */}
        <div className="flex justify-center items-center gap-3 mb-5">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="Logo Mark"
            className="w-auto h-14 object-contain"
          />
          <img
            src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
            alt="clbhouz Logo"
            className="w-auto max-h-[68px] object-contain"
          />
        </div>

        {children}

        {/* Footer links - 16px gap from forgot password */}
        <div className="mt-4 w-full text-center">
          <button
            type="button"
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: '#5E666D' }}
            onClick={toggleAuthMode}
            disabled={submitting}
          >
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <span className="font-semibold" style={{ color: '#F7931E' }}>
                  Sign in →
                </span>
              </>
            ) : (
              <>
                New to clbhouz?{' '}
                <span className="font-semibold" style={{ color: '#F7931E' }}>
                  Sign up →
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
