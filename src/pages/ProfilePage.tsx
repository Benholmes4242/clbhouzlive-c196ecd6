import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import HeroProfileHeader from '@/components/profile/HeroProfileHeader';
import { useProfileData } from '@/hooks/useProfileData';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { LoadoutModal } from '@/components/cosmetics/LoadoutModal';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(() => {
    // Initialize from URL params, default to 'activity'
    return searchParams.get('tab') || 'activity';
  });
  const queryClient = useQueryClient();
  const [loadoutModalOpen, setLoadoutModalOpen] = useState(false);
  
  // Phase 1 Perf: Removed forced cache invalidation - rely on staleTime instead
  // React Query's built-in caching with 5min staleTime (from perfTuning) is sufficient
  
  const {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    refreshProfile,
    updateProfileField
  } = useProfileData();

  // Redirect to auth page if user is not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Loading state handled by route-level Suspense with ProfileSkeleton
  // Auth check still returns early
  if (loading) {
    return null;
  }

  // Show error if there's an issue
  if (error) {
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

  return (
    <div className="min-h-screen bg-background page-with-header relative">
      {/* Floating Customise Look Button */}
      <Button
        onClick={() => setLoadoutModalOpen(true)}
        className="fixed bottom-24 right-4 z-40 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Customise Look
      </Button>

      <LoadoutModal
        open={loadoutModalOpen}
        onOpenChange={setLoadoutModalOpen}
        userId={user?.id}
      />

      <ClubhouseHeaderNew />
      
      {/* Add spacing for fixed header */}
      <div className="h-16 md:h-18" />
      
      <HeroProfileHeader
        profile={profile}
        isOwnProfile={true} // This is always the user's own profile on this route
        onProfileUpdate={refreshProfile}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      {/* Activity content is now handled by ActivityFeed within HeroProfileHeader */}
    </div>
  );
};

export default ProfilePage;
