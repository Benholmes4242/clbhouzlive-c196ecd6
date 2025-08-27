
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ClubhouzLoading from '@/components/ClubhouzLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <ClubhouzLoading />;
  }

  // If user is not authenticated, redirect to landing page
  if (!user) {
    console.log('User not authenticated, redirecting to landing page');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
