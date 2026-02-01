import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { PageRoot } from '@/components/layout/PageRoot';
import { useRehydrationSafe } from '@/contexts/RehydrationContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { logProfile, createLifecycleLogger, logQueryState, logTabNavigation, profileTiming } from '@/components/profile/debug';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from URL params, default to 'activity'
    return searchParams.get('tab') || 'activity';
  });
  const queryClient = useQueryClient();
  const hasCheckedEditParam = useRef(false);
  
  // Safe area bleed: transparent status bar with white icons for hero image
  useMedianStatusBar("dark", "transparent", true, false);
  
  // Debug: Lifecycle tracking
  const lifecycle = useRef(createLifecycleLogger('ProfilePage'));
  
  // Debug: Track page mount
  useEffect(() => {
    profileTiming.start('ProfilePage:fullLoad');
    lifecycle.current.onMount({ initialTab: activeSection });
    return () => {
      lifecycle.current.onUnmount();
    };
  }, []);
  
  // Rehydration state - show skeleton when app is rehydrating after background
  const { isRehydrating } = useRehydrationSafe();
  
  // Get current user
  const { user, loading: authLoading } = useSupabaseSession();
  
  // Fetch profile using shared hook
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    isFetching: profileFetching,
    isStale: profileStale,
    dataUpdatedAt: profileDataUpdatedAt,
    fetchStatus: profileFetchStatus,
    refetch: refreshProfile
  } = useUserProfile(user?.id);
  
  // Debug: Log query states
  useEffect(() => {
    logQueryState('useUserProfile', {
      isLoading: profileLoading,
      isFetching: profileFetching,
      isStale: profileStale,
      isSuccess: !!profile,
      isError: profileError,
      dataUpdatedAt: profileDataUpdatedAt,
      fetchStatus: profileFetchStatus,
    });
  }, [profileLoading, profileFetching, profileStale, profile, profileError, profileDataUpdatedAt, profileFetchStatus]);
  
  // Debug: Track when profile data arrives
  useEffect(() => {
    if (profile && !profileLoading) {
      profileTiming.end('ProfilePage:fullLoad');
      logProfile('data', 'ProfilePage', '✅ Profile data ready', {
        userId: profile.id,
        username: profile.username,
        hasAvatar: !!profile.profile_photo_url,
        hasCover: !!profile.cover_photo_url,
      });
    }
  }, [profile, profileLoading]);

  // Redirect to auth page if user is not logged in
  // CRITICAL: Must check authLoading, not profileLoading, to avoid redirect during initial auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);
  
  // Redirect legacy ?edit=business or ?edit=profile to /edit-profile
  useEffect(() => {
    if (hasCheckedEditParam.current) return;
    
    const editMode = searchParams.get('edit');
    if (editMode && user) {
      hasCheckedEditParam.current = true;
      navigate('/edit-profile', { replace: true });
    }
  }, [searchParams, user, navigate]);

  // Loading state handled by route-level Suspense with ProfileSkeleton
  // Auth check still returns early - wait for both auth and profile to load
  // Also show skeleton during rehydration
  if (authLoading || profileLoading || isRehydrating) {
    return <ProfileSkeleton />;
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
    // Debug: Log tab navigation
    logTabNavigation(activeSection, section, { source: 'ProfilePage' });
    profileTiming.start(`TabTransition:${activeSection}→${section}`);
    
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
  
  return (
    <PageRoot className="min-h-screen bg-background">
      <HeroProfileHeader
        profile={profile ?? null}
        isOwnProfile={true}
        onProfileUpdate={() => refreshProfile()}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
    </PageRoot>
  );
};

export default ProfilePage;
