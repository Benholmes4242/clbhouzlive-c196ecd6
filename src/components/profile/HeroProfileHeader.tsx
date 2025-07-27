import React, { useState, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { useStaggeredInView } from '@/hooks/useInViewAnimation';

interface Course {
  id: string;
  name: string;
  thumbnail_image?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
}

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  background_image_url?: string;
  bio?: string;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
}

interface HeroProfileHeaderProps {
  profile: UserProfile | null;
  onProfileUpdate: () => void;
}

const HeroProfileHeader = ({ 
  profile, 
  onProfileUpdate
}: HeroProfileHeaderProps) => {
  const { user } = useSupabaseSession();
  const [uploading, setUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(Date.now()); // Add cache-busting key
  
  // Derived values
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'No Club';
  const backgroundImage = profile?.background_image_url;
  const postsCount = 0; // This would be fetched from actual data
  
  // Animation hook for badges
  const badgesAnimation = useStaggeredInView(5, { threshold: 0.1, staggerDelay: 100 });
  
  // Update avatar key when profile photo URL changes to force re-render
  useEffect(() => {
    setAvatarKey(Date.now());
  }, [profile?.profile_photo_url]);

  const handlePhotoUpload = async (file: File) => {
    if (!user || uploading) return;

    console.log('Starting photo upload process:', file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading to storage path:', filePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      // Update user profile with new photo URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully');

      // Force avatar to refresh by updating the key
      setAvatarKey(Date.now());
      
      console.log('Photo upload successful, refreshing profile data...');
      
      // Refresh the profile data
      onProfileUpdate();
      
      toast({
        title: "Success", 
        description: "Profile photo updated successfully!",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload Failed", 
        description: "Failed to upload photo: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Simple refs for animation (removed complex animation hooks)
  const activityRef = React.useRef<HTMLDivElement>(null);
  const top100Ref = React.useRef<HTMLDivElement>(null);
  const badgesRef = React.useRef<HTMLDivElement>(null);

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  return (
    <>
      <div 
        className="relative w-full min-h-screen bg-gradient-to-br from-primary to-primary/80 overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        
        {/* Content Container - Top Section */}
        <div className="relative flex items-start justify-between px-6 py-8 pt-16">
          
          {/* Left Side - Profile Info */}
          <div className="text-white flex-1">
            {/* Profile Photo */}
            <div className="w-24 h-24 mb-4">
              {isOwnProfile ? (
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => {
                    if (uploading) return;
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        console.log('Photo selected for upload:', file);
                        handlePhotoUpload(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <OptimizedAvatar
                    key={avatarKey} // Force re-render with cache busting
                    src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                    alt={displayName}
                    size={96}
                    fallback={displayName.charAt(0)}
                    className="shadow-lg group-hover:opacity-80 transition-opacity"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <span className="text-white text-xs font-medium">Edit</span>
                  </div>
                </div>
              ) : (
                <OptimizedAvatar
                  key={avatarKey} // Force re-render with cache busting
                  src={profile?.profile_photo_url ? `${profile.profile_photo_url}?t=${avatarKey}` : undefined}
                  alt={displayName}
                  size={96}
                  fallback={displayName.charAt(0)}
                  className="shadow-lg"
                />
              )}
            </div>
            
            {/* Text Info */}
            <div className="mb-4">
              <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
                {displayName}
              </h1>
              {username && (
                <p className="text-xl text-white/90 mb-1 drop-shadow">
                  @{username}
                </p>
              )}
              <p className="text-lg text-white/80 drop-shadow">
                {homeClub}
              </p>
            </div>

            {/* Stats Bar - Full Width with 8px rounded corners */}
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center justify-center space-x-8 text-white">
                <div className="text-center">
                  <div className="font-bold text-lg drop-shadow">4.0</div>
                  <div className="text-xs text-white/80 drop-shadow">Handicap</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg drop-shadow">{postsCount}</div>
                  <div className="text-xs text-white/80 drop-shadow">Posts</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg drop-shadow">32</div>
                  <div className="text-xs text-white/80 drop-shadow">Rated Courses</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg drop-shadow">8.6/10</div>
                  <div className="text-xs text-white/80 drop-shadow">Avg. Rating</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Edit Profile Button (only for own profile) */}
          {isOwnProfile && (
            <div className="ml-4">
              <button 
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors text-sm"
                onClick={() => window.location.href = '/settings'}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
        
        {/* Highlight Reel Section Container - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {/* Activity Section */}
          <div 
            id="activity"
            className="grid grid-cols-1 md:grid-cols-2 gap-0 h-[400px]"
            ref={activityRef}
          >
            {/* Activity Card */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex flex-col justify-end text-white"
              ref={null}
              onClick={() => scrollToSection('recent-activity')}
            >
              {/* Activity Pattern Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), 
                    linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%)
                  `,
                  backgroundSize: '100% 100%, 100% 100%, 40px 40px, 40px 40px'
                }}>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M3 3v5h5"/>
                      <path d="M6 5 3 8"/>
                      <path d="M3 19v-5h5"/>
                      <path d="M6 19l-3-3"/>
                      <path d="M15 3h5v5"/>
                      <path d="M18 3 21 6"/>
                      <path d="M21 19v-5h-5"/>
                      <path d="M18 19l3-3"/>
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">Activity</h3>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">View your recent golf moments, rounds played, and course discoveries.</p>
              </div>
            </div>

            {/* Handicap Card */}
            <div 
              className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col justify-end text-white"
              ref={null}
              onClick={() => scrollToSection('handicap-tracker')}
            >
              {/* Handicap Pattern Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg, transparent 60deg, rgba(255,255,255,0.1) 120deg, transparent 180deg, rgba(255,255,255,0.1) 240deg, transparent 300deg),
                    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)
                  `,
                  backgroundSize: '80px 80px, 100% 100%'
                }}>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                      <path d="M12 2v2"/>
                      <path d="M12 20v2"/>
                      <path d="M4.93 4.93l1.41 1.41"/>
                      <path d="M17.66 17.66l1.41 1.41"/>
                      <path d="M2 12h2"/>
                      <path d="M20 12h2"/>
                      <path d="M6.34 17.66l-1.41 1.41"/>
                      <path d="M19.07 4.93l-1.41 1.41"/>
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">Handicap</h3>
                </div>
                <p className="text-white/80 text-lg leading-relaxed">Track your progress and handicap development over time.</p>
              </div>
            </div>
          </div>

          {/* Top 100 Section */}
          <div 
            id="top100" 
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-white"
            ref={top100Ref}
            onClick={() => scrollToSection('top100-courses')}
          >
            {/* Top 100 Pattern Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px),
                  radial-gradient(circle at 25% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)
                `,
                backgroundSize: '20px 20px, 20px 20px, 100% 100%'
              }}>
              </div>
            </div>
            
            {/* Content */}
            <div className="relative p-8 cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                    <path d="M6 9h8"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                    <path d="M18 9v6"/>
                    <path d="M6 15v-6"/>
                  </svg>
                </div>
                <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">Top 100</h3>
              </div>
              <p className="text-white/80 text-lg leading-relaxed mb-6">Discover and track the world's greatest golf courses from our curated Top 100 lists.</p>
              
              {/* Top 100 Preview Grid */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((rank, index) => (
                  <div 
                    key={rank}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20"
                    ref={null}
                  >
                    <div className="text-lg font-bold text-amber-200">#{rank}</div>
                    <div className="text-xs text-white/70 mt-1">Course</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of content sections would continue here... */}
      {/* Badges & Achievements Section Heading */}
      <div className="w-full bg-background py-6" ref={badgesAnimation.ref}>
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Badges & Achievements</h2>
          
          {/* Top 100 Badge Tracker */}
          <div className="space-y-4">
            
            {/* 20 Club Badge - Bronze */}
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-amber-600/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">20 Club</h3>
                    <p className="text-sm text-muted-foreground">Also earned by @Tom, @Sarah, @Mike</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">32/20</div>
                  <div className="w-24 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 50 Club Badge - Silver */}
            <div 
              className={`bg-card rounded-lg p-6 border border-border shadow-sm transition-all duration-500 ease-out ${
                badgesAnimation.visibleItems[1] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-400/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">50 Club</h3>
                    <p className="text-sm text-muted-foreground">Also earned by @Jessica, @David</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">32/50</div>
                  <div className="w-24 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: '64%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 75 Club Badge - Gold */}
            <div 
              className={`bg-card rounded-lg p-6 border border-border shadow-sm opacity-75 transition-all duration-500 ease-out ${
                badgesAnimation.visibleItems[2] 
                  ? 'opacity-75 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-1">75 Club</h3>
                    <p className="text-sm text-muted-foreground">Also earned by @Alex, @Rachel</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-muted-foreground">32/75</div>
                  <div className="w-24 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '43%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 100 Club Badge - Platinum */}
            <div 
              className={`bg-card rounded-lg p-6 border border-border shadow-sm opacity-50 transition-all duration-500 ease-out ${
                badgesAnimation.visibleItems[3] 
                  ? 'opacity-50 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-1">100 Club</h3>
                    <p className="text-sm text-muted-foreground">Also earned by @Chris</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-muted-foreground">32/100</div>
                  <div className="w-24 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clubhouse Global Finisher Badge - Diamond */}
            <div 
              className={`bg-card rounded-lg p-6 border border-border shadow-sm opacity-30 transition-all duration-500 ease-out ${
                badgesAnimation.visibleItems[4] 
                  ? 'opacity-30 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-muted-foreground mb-1">Clubhouse Global Finisher</h3>
                    <p className="text-sm text-muted-foreground">Also earned by @Legend</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-muted-foreground">32/500</div>
                  <div className="w-24 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroProfileHeader;
