import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useLocation, Navigate } from 'react-router-dom';
import ClubhouzLoading from '@/components/ClubhouzLoading';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading } = useSupabaseSession();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return <ClubhouzLoading />;
  }

  // If user is not authenticated and not on auth page, redirect to auth
  // But only redirect after loading is complete to avoid race conditions
  if (!loading && !user && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated and on auth page, redirect to main site
  // But only redirect after loading is complete to avoid race conditions
  if (!loading && user && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthWrapper;