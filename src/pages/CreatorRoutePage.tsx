import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { useDefaultCreatorPage } from '@/hooks/useCreatorPageBySlug';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';

/**
 * Determines if a string is a valid UUID v4
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * CreatorLegacyRedirect - Handles legacy /creator/:userId routes
 * Redirects UUID-based routes to canonical /creator/:slug routes
 * 
 * For slug-based routes, render nothing (handled by parent route config)
 */
export default function CreatorLegacyRedirect() {
  const { userId: param } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  
  const isLegacyRoute = param ? isUUID(param) : false;
  
  // Only fetch if this is a UUID route
  const { 
    data: defaultSlug, 
    isLoading: loading,
  } = useDefaultCreatorPage(isLegacyRoute ? param : undefined);
  
  // Handle legacy redirect
  useEffect(() => {
    if (isLegacyRoute && defaultSlug && !loading) {
      // Redirect to canonical slug route
      navigate(`/creator/${defaultSlug}`, { replace: true });
    }
  }, [isLegacyRoute, defaultSlug, loading, navigate]);
  
  // If not a UUID route, this component shouldn't be rendered
  // (the route should match the slug pattern instead)
  if (!isLegacyRoute) {
    return null;
  }
  
  // Loading state
  if (loading) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageRoot>
    );
  }
  
  // User has no creator page
  if (!defaultSlug) {
    const isOwnPage = user?.id === param;
    
    return (
      <PageRoot className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-5 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Creator not found
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isOwnPage 
              ? "You haven't created a creator page yet. Start building your creator presence!"
              : "This creator page doesn't exist or has been removed."
            }
          </p>
          {isOwnPage ? (
            <Link to="/creators/manage">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create creator page
              </Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go back
            </Button>
          )}
        </div>
      </PageRoot>
    );
  }
  
  // Redirecting...
  return (
    <PageRoot className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </PageRoot>
  );
}
