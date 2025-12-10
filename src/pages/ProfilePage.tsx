import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { PageRoot } from '@/components/layout/PageRoot';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from URL params, default to 'activity'
    return searchParams.get('tab') || 'activity';
  });
  const queryClient = useQueryClient();
  
  // Edit dialog state for business mode
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [forceBusinessMode, setForceBusinessMode] = useState(false);
  const hasCheckedEditParam = useRef(false);
  
  // Get current user
  const { user, loading: authLoading } = useSupabaseSession();
  
  // Fetch profile using shared hook
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refreshProfile
  } = useUserProfile(user?.id);

  // Redirect to auth page if user is not logged in
  // CRITICAL: Must check authLoading, not profileLoading, to avoid redirect during initial auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  // Auto-open edit dialog in business mode when ?edit=business is present
  useEffect(() => {
    if (hasCheckedEditParam.current) return;
    
    const editMode = searchParams.get('edit');
    if (editMode === 'business' && profile && user) {
      hasCheckedEditParam.current = true;
      setForceBusinessMode(true);
      setEditDialogOpen(true);
      
      // Clear the query param to avoid reopening on navigation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('edit');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, profile, user, setSearchParams]);

  // Loading state handled by route-level Suspense with ProfileSkeleton
  // Auth check still returns early - wait for both auth and profile to load
  if (authLoading || profileLoading) {
    return null;
  }

  // Show error if there's an issue
  if (profileError) {
    return (
      <div className="min-h-screen bg-background page-with-header">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-destructive text-base">Error loading profile</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle section changes with URL sync
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    
    // Update URL without full page reload
    const newSearchParams = new URLSearchParams(searchParams);
    if (section === 'activity') {
      // Remove tab param for default tab
      newSearchParams.delete('tab');
    } else {
      newSearchParams.set('tab', section);
    }
    
    // Use replace to avoid adding to browser history for each tab change
    setSearchParams(newSearchParams, { replace: true });
  };

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Handle closing the edit dialog
  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setForceBusinessMode(false);
    }
  };
  
  return (
    <PageRoot className="min-h-screen bg-background safe-top">
      <HeroProfileHeader
        profile={profile ?? null}
        isOwnProfile={true}
        onProfileUpdate={() => refreshProfile()}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Business mode edit dialog - triggered by ?edit=business */}
      {user && profile && (
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
          userId={user.id}
          profile={profile}
          onProfileUpdate={() => refreshProfile()}
          forceBusinessMode={forceBusinessMode}
        />
      )}
    </PageRoot>
  );
};

export default ProfilePage;
