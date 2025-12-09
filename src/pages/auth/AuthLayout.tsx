import React, { useEffect, useState } from "react";
import { useAppLogo } from "@/hooks/useAppLogo";
import { Link } from "react-router-dom";
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
      className="min-h-screen flex items-center justify-center px-4 pt-[90px] pb-10 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-page)' }}
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
          "px-6 py-8",
          "rounded-sq-lg",
          "transition-all duration-500 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid rgba(214, 217, 222, 0.5)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo section */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="Logo Mark"
            className="w-auto h-12 object-contain"
          />
          <img
            src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
            alt="clbhouz Logo"
            className="w-auto max-h-14 object-contain"
          />
        </div>

        {children}

        {/* Footer links */}
        <div className="mt-6 w-full text-center">
          {isSignUp ? (
            <button
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
              onClick={toggleAuthMode}
              disabled={submitting}
            >
              Already have an account?{' '}
              <span className="font-semibold" style={{ color: 'var(--primary-accent)' }}>
                Sign in →
              </span>
            </button>
          ) : (
            <Link
              to="/signup"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              New to clbhouz?{' '}
              <span className="font-semibold" style={{ color: 'var(--primary-accent)' }}>
                Sign up →
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
