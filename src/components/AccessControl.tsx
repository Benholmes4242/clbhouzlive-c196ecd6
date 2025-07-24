import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Navigate, useLocation } from 'react-router-dom';

interface AccessControlProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const AccessControl: React.FC<AccessControlProps> = ({ 
  children, 
  requireAuth = false 
}) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Render children if access is granted
  return <>{children}</>;
};

export default AccessControl;