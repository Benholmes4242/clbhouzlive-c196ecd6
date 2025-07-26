import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import BottomNavigation from '@/components/BottomNavigation';
import { useProfileData } from '@/hooks/useProfileData';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, MapPin, Star, Calendar, TrendingUp } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  
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
            <span className="text-destructive text-base">Error loading profile</span>
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

  const displayName = profile?.display_name || profile?.full_name || user?.user_metadata?.full_name || 'User';
  const username = profile?.username || 'username';
  const handicap = profile?.handicap_index || '4.0';
  const homeClub = profile?.home_club || 'Golf Club';

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-full">
          {/* Stats Bar */}
          <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3 mt-16">
            <div className="flex justify-between items-center text-white text-sm">
              <span>Handicap {handicap}</span>
              <span>142 Posts</span>
              <span>Rated 32 Courses</span>
              <span>Avg. 8.6 / 10</span>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-4">
              <OptimizedAvatar
                src={profile?.profile_photo_url}
                alt={displayName}
                size={100}
                className="border-4 border-white"
              />
              
              <div className="text-white pb-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <p className="text-white/80">@{username}</p>
                <p className="text-white/80 text-sm">{homeClub}</p>
              </div>
            </div>
            
            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Cards */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-4">
          {/* Activity Card */}
          <Card className="overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <div className="relative h-32">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-3 left-3">
                <h3 className="text-white font-semibold">Activity</h3>
              </div>
            </div>
          </Card>

          {/* Handicap Card */}
          <Card className="overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <div className="relative h-32">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-3 left-3">
                <h3 className="text-white font-semibold">Handicap</h3>
              </div>
              <TrendingUp className="absolute top-3 right-3 h-5 w-5 text-white/80" />
            </div>
          </Card>

          {/* Scottie Card */}
          <Card className="overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <div className="relative h-32">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                }}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-3 left-3">
                <h3 className="text-white font-semibold">Scottie</h3>
              </div>
              <Calendar className="absolute top-3 right-3 h-5 w-5 text-white/80" />
            </div>
          </Card>
        </div>
      </div>

      {/* Top 100 Courses Section */}
      <div className="px-6 mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Top 100 Courses</h2>
        
        {/* Clubhouse Index and Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Clubhouse Index */}
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Clubhouse Index</h3>
                <p className="text-2xl font-bold">32 Ratings</p>
              </div>
            </div>
          </Card>

          {/* Achievement Badges */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Achievements</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium">20 Club</p>
                <p className="text-xs text-muted-foreground">Rated 30</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium">50 Club</p>
                <p className="text-xs text-muted-foreground">Rated 56</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium">75 Club</p>
                <p className="text-xs text-muted-foreground">Rated 25</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-medium">200 Club</p>
                <p className="text-xs text-muted-foreground">Rated 200</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trump Turnberry */}
          <Card className="overflow-hidden">
            <div className="relative h-48">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                }}
              />
              <div className="absolute top-4 right-4">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  9/10
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">Trump Turnberry Resort - Ailsa</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Walton Heath Golf Club</span>
              </div>
            </CardContent>
          </Card>

          {/* Old Head Golf Links */}
          <Card className="overflow-hidden">
            <div className="relative h-48">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')"
                }}
              />
              <div className="absolute top-4 right-4">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  10/10
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">Old Head Golf Links</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Rated all Top 100 courses</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;