
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import UserAccountInfo from '@/components/profile/UserAccountInfo';
import EmailChangeSection from '@/components/profile/EmailChangeSection';
import NotificationSettings from '@/components/settings/NotificationSettings';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useProfileData } from '@/hooks/useProfileData';

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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
              style={{ borderBottomColor: '#6e9277' }}
            ></div>
            <span className="text-muted-foreground text-base">Loading...</span>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Show error if there's an issue
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header />
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
        <BottomNavigation />
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <NotificationSettings />
        
        <ThemeToggle />
        
        <EmailChangeSection currentEmail={user?.email} />

        <UserAccountInfo
          profile={profile || { id: user.id }}
          userEmail={user?.email}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Settings;
