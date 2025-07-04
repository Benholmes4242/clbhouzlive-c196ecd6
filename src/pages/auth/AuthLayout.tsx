
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
      <img
        src={currentLogo?.file_url || "/lovable-uploads/181fd40d-ced5-420c-bff8-27c2ef146377.png"}
        alt="clbhouz Logo"
        className="mb-6"
        style={{ width: 250, maxWidth: "80%" }}
      />
      {children}
      <button
        className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:underline"
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
