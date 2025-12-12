import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompactHeader from '@/components/header/CompactHeader';
import UserAccountInfo from '@/components/profile/UserAccountInfo';
import EmailChangeSection from '@/components/profile/EmailChangeSection';
import NotificationSettings from '@/components/settings/NotificationSettings';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useProfileData } from '@/hooks/useProfileData';
import { NearbyTestToolsPanel } from '@/features/nearby/components/NearbyTestToolsPanel';
import { PageRoot } from '@/components/layout/PageRoot';

const Settings = () => {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading,
    error,
    fetchProfile
  } = useProfileData();

  // Redirect to auth page if user is not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleProfileUpdate = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <PageRoot className="min-h-screen bg-background safe-top">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#6e9277' }}
            ></div>
            <span className="text-muted-foreground text-base">Loading...</span>
          </div>
        </div>
      </PageRoot>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <PageRoot className="min-h-screen bg-background pb-28 safe-top">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-destructive text-base">Error loading settings</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
      </PageRoot>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <PageRoot className="min-h-screen bg-background pb-28">
      <CompactHeader />
      <div className="max-w-2xl mx-auto px-4 py-section space-y-section compact-header-offset">
        <h1 className="font-display text-2xl font-bold mb-section">Settings</h1>
        
        <NotificationSettings />
        
        <ThemeToggle />
        
        <NearbyTestToolsPanel />
        
        <EmailChangeSection currentEmail={user?.email} />

        <UserAccountInfo
          profile={profile || { id: user.id }}
          userEmail={user?.email}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </PageRoot>
  );
};

export default Settings;