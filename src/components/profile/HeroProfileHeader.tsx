import React from 'react';
import { Button } from '@/components/ui/button';
import ProfilePhotoManager from './ProfilePhotoManager';
import ProfileEditDialog from './ProfileEditDialog';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface HeroProfileHeaderProps {
  profile: any;
  currentUser: any;
  onProfileUpdate?: () => void;
}

const HeroProfileHeader: React.FC<HeroProfileHeaderProps> = ({
  profile,
  currentUser,
  onProfileUpdate
}) => {
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const displayName = profile?.display_name || profile?.username || 'User';
  const username = profile?.username;
  const homeClub = profile?.home_club || 'Golf Club';
  const backgroundImage = profile?.background_image_url;

  return (
    <>
      <div 
        className="relative w-full h-80 bg-gradient-to-br from-primary to-primary/80 overflow-hidden"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content Container */}
        <div className="relative h-full flex items-center justify-between px-6 py-8">
          
          {/* Left Side - Profile Info */}
          <div className="flex items-center space-x-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                <ProfilePhotoManager
                  user={isOwnProfile ? user : null}
                  profile={profile}
                  onProfileUpdate={(updatedProfile) => {
                    if (onProfileUpdate) {
                      onProfileUpdate();
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Text Info */}
            <div className="text-white">
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
          </div>
          
          {/* Right Side - Edit Profile Button */}
          {isOwnProfile && user && (
            <div className="flex-shrink-0">
              <ProfileEditDialog
                profile={profile}
                userId={user.id}
                onProfileUpdate={() => {
                  if (onProfileUpdate) {
                    onProfileUpdate();
                  }
                }}
              />
            </div>
          )}
        </div>
        
        {/* Floating Stats Bar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg">
            <div className="flex items-center justify-center space-x-8 text-white">
              <div className="text-center">
                <div className="font-bold text-lg">4.0</div>
                <div className="text-xs text-white/80">Handicap</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">142</div>
                <div className="text-xs text-white/80">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">32</div>
                <div className="text-xs text-white/80">Rated Courses</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">8.6/10</div>
                <div className="text-xs text-white/80">Avg. Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 3-Section Grid with Square Cards */}
      <div className="w-full bg-background py-6">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4">
            
            {/* Activity Card */}
            <div className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-scale">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=400&fit=crop)`
                }}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-xl font-bold drop-shadow-lg">Activity</h3>
              </div>
            </div>
            
            {/* Handicap Card */}
            <div className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-scale">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1438565434616-3ef039228b15?w=400&h=400&fit=crop)`
                }}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-xl font-bold drop-shadow-lg">Handicap</h3>
              </div>
            </div>
            
            {/* Top 100 Card */}
            <div className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover-scale">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=400&fit=crop)`
                }}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-white text-xl font-bold drop-shadow-lg">Top 100</h3>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Activity Section Heading */}
      <div className="w-full bg-background py-6">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Activity</h2>
          
          {/* 2-Column Activity Grid */}
          <div className="grid grid-cols-2 gap-6">
            
            {/* Left Box - User Playing Golf */}
            <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1486312338219?w=600&h=400&fit=crop)`
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
              
              {/* Handicap Label */}
              <div className="absolute top-4 left-4">
                <span className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Handicap
                </span>
              </div>
              
              {/* Mini Video Thumbnails */}
              <div className="absolute bottom-4 left-4 flex space-x-2">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                </div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                </div>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                </div>
              </div>
            </div>
            
            {/* Right Box - Dark Overlay Card */}
            <div className="bg-black/90 backdrop-blur-sm rounded-lg p-6 aspect-[4/3] flex flex-col justify-center">
              <h3 className="text-white text-2xl font-bold mb-6">Handicap: 4.0</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Posts</span>
                  <span className="text-white font-semibold">1142</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Courses Played</span>
                  <span className="text-white font-semibold">32</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Tips Shared</span>
                  <span className="text-white font-semibold">12</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Top 100 Courses Played Section Heading */}
      <div className="w-full bg-background py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Top 100 Courses Played</h2>
          
          {/* Clubhouse Index Badge Card and Course Map Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Clubhouse Index Badge Card */}
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800/30">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 dark:text-purple-400">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                      <path d="M6 9h8"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                      <path d="M18 9v6"/>
                      <path d="M6 15v6"/>
                      <path d="M18 15v6"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Clubhouse Index
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    You've contributed 32 ratings to the Clubhouse Index.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Course Map Container */}
            <div className="bg-muted/50 rounded-lg p-6 border border-muted-foreground/20 relative overflow-hidden">
              {/* Placeholder Map Background */}
              <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop)`
                }}
              />
              <div className="absolute inset-0 bg-muted/80" />
              
              {/* Content */}
              <div className="relative z-10 flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-muted-foreground/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Interactive map coming soon
                  </h3>
                  <p className="text-sm text-muted-foreground/80">
                    View courses you've rated worldwide.
                  </p>
                </div>
              </div>
              
              {/* Coming Soon Badge */}
              <div className="absolute top-4 right-4">
                <span className="bg-muted-foreground/20 text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
          
          {/* Individual Rated Course Cards */}
          <div className="mt-8 space-y-4">
            
            {/* Course Card 1 */}
            <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex">
                {/* Course Image */}
                <div className="w-32 h-24 flex-shrink-0">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop)`
                    }}
                  />
                </div>
                
                {/* Course Details */}
                <div className="flex-1 p-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground text-lg mb-1">
                        Pebble Beach Golf Links
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        Pebble Beach, California
                      </p>
                    </div>
                    
                    {/* Score Pill */}
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      9.5/10
                    </div>
                  </div>
                  
                  {/* Optional Tag */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                        <path d="M6 9h8"/>
                        <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                        <path d="M18 9v6"/>
                        <path d="M6 15v6"/>
                        <path d="M18 15v6"/>
                      </svg>
                      <span>Top 100 Course</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Card 2 */}
            <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex">
                {/* Course Image */}
                <div className="w-32 h-24 flex-shrink-0">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-1486312338219?w=400&h=300&fit=crop)`
                    }}
                  />
                </div>
                
                {/* Course Details */}
                <div className="flex-1 p-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground text-lg mb-1">
                        Augusta National Golf Club
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        Augusta, Georgia
                      </p>
                    </div>
                    
                    {/* Score Pill */}
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      10/10
                    </div>
                  </div>
                  
                  {/* Optional Tag */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                        <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"/>
                        <path d="M6 9h8"/>
                        <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                        <path d="M18 9v6"/>
                        <path d="M6 15v6"/>
                        <path d="M18 15v6"/>
                      </svg>
                      <span>Top 100 Course</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Course Card 3 */}
            <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex">
                {/* Course Image */}
                <div className="w-32 h-24 flex-shrink-0">
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-1587174486073?w=400&h=300&fit=crop)`
                    }}
                  />
                </div>
                
                {/* Course Details */}
                <div className="flex-1 p-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground text-lg mb-1">
                        Old Head Golf Links
                      </h4>
                      <p className="text-muted-foreground text-sm mb-2">
                        Kinsale, Ireland
                      </p>
                    </div>
                    
                    {/* Score Pill */}
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      8.5/10
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Badges & Achievements Section Heading */}
      <div className="w-full bg-background py-6">
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
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
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
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm opacity-75">
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
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M14 9h1.5a2.5 2.5 0 0 1 0-5H14"/>
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
            <div className="bg-card rounded-lg p-6 border border-border shadow-sm opacity-30">
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