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
    </>
  );
};

export default HeroProfileHeader;