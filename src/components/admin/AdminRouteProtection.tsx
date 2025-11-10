import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useAdmin } from '@/hooks/useAdmin';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminRouteProtectionProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'limited_admin';
}

const AdminRouteProtection: React.FC<AdminRouteProtectionProps> = ({ 
  children, 
  requiredRole = 'limited_admin' 
}) => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { isAdmin, isLimitedAdmin, loading: adminLoading, hasAdminAccess } = useAdmin();
  const location = useLocation();

  // Show loading while checking authentication and authorization
  if (sessionLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    console.log('User not authenticated, redirecting to auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access
  const hasRequiredAccess = () => {
    if (requiredRole === 'admin') {
      return isAdmin; // Only full admins
    }
    if (requiredRole === 'limited_admin') {
      return isAdmin || isLimitedAdmin; // Both full and limited admins can access
    }
    return false;
  };

  if (!hasRequiredAccess()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                You don't have permission to access this admin area.
              </p>
              <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">
                  Required role: <span className="font-medium">{requiredRole}</span>
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                Go Back
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="default"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              If you believe this is an error, please contact the system administrator.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has required access, render children
  return <>{children}</>;
};

export default AdminRouteProtection;