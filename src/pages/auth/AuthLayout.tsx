
import React from "react";
import { useAppLogo } from "@/hooks/useAppLogo";

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
  
  return (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="bg-muted rounded-lg shadow-md p-6 w-full max-w-md mx-auto flex flex-col items-center">
      <div className="flex justify-center items-center gap-4 mb-6">
        <img
          src="/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png"
          alt="Logo Mark"
          className="w-auto h-16 object-contain"
        />
        <img
          src={currentLogo?.file_url || "/lovable-uploads/4e825850-f4fd-4fed-90ac-429e1b988009.png"}
          alt="clbhouz Logo"
          className="w-auto max-h-20 object-contain"
        />
      </div>
      {children}
      <button
        className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
        onClick={toggleAuthMode}
        disabled={submitting}
      >
        {isSignUp
          ? "Already have an account? Sign in"
          : "New to clbhouz? Sign up"}
      </button>
    </div>
  </div>
  );
};

export default AuthLayout;
