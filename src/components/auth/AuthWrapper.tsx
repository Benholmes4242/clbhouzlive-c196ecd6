import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocation, Navigate } from 'react-router-dom';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();

  // Show loading while checking authentication - temporarily disabled
  // The session seems to be stuck in loading state, so we'll bypass this for now
  console.log('AuthWrapper: loading =', loading, 'user =', !!user);
  
  if (loading) {
    // Add a timeout to prevent infinite loading
    setTimeout(() => {
      console.log('AuthWrapper: Force ending loading state after timeout');
    }, 3000);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
            style={{ borderBottomColor: '#f7931e' }}
          ></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not on auth page, redirect to auth
  if (!user && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated and on auth page, redirect to main site
  if (user && location.pathname === '/auth') {
    return <Navigate to="/explore" replace />;
  }

  return <>{children}</>;
};

export default AuthWrapper;