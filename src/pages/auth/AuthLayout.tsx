
import React from "react";

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
}) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="bg-muted rounded-lg shadow-md p-6 w-full max-w-md mx-auto flex flex-col items-center">
      <img
        src="/lovable-uploads/b3fc8551-2b91-49af-b2ef-1dd493276207.png"
        alt="clbhouz Logo"
        className="mb-6"
        style={{ width: 200, maxWidth: "80%" }}
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

export default AuthLayout;
