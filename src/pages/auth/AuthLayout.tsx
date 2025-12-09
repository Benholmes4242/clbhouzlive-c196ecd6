
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ 
        backgroundColor: '#0e0e0e',
      }}
    >
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
      
      {/* Optional: Subtle golf texture watermark */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Container with fade-in animation */}
      <div 
        className={cn(
          "relative z-10 w-full max-w-[380px] mx-auto flex flex-col items-center",
          "px-6 py-8",
          "rounded-[24px]",
          "transition-all duration-500 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset',
        }}
      >
        {/* Logo section - reduced size, centered vertically */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <img
            src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
            alt="Logo Mark"
            className="w-auto h-12 object-contain"
            style={{ filter: 'brightness(1.1)' }}
          />
          <img
            src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
            alt="clbhouz Logo"
            className="w-auto max-h-14 object-contain"
            style={{ filter: 'brightness(1.1)' }}
          />
        </div>

        {children}

        {/* Footer links */}
        <div className="mt-6 w-full text-center">
          {isSignUp ? (
            <button
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onClick={toggleAuthMode}
              disabled={submitting}
            >
              Already have an account? <span className="font-medium" style={{ color: '#6e9277' }}>Sign in →</span>
            </button>
          ) : (
            <Link
              to="/signup"
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              New to clbhouz? <span className="font-medium" style={{ color: '#6e9277' }}>Sign up →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
