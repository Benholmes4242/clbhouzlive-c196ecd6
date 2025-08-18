import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Settings } from 'lucide-react';

interface GlassProfileCardProps {
  profile: {
    id: string;
    display_name?: string;
    username?: string;
    profile_photo_url?: string;
    home_club?: string;
  };
  isOwnProfile: boolean;
  onEditProfile?: () => void;
}

const GlassProfileCard: React.FC<GlassProfileCardProps> = ({
  profile,
  isOwnProfile,
  onEditProfile
}) => {
  const glassmorphicStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
  };

  return (
    <div 
      className="relative mx-4 mt-[-3rem] mb-8 rounded-2xl p-6 pt-10 text-center"
      style={glassmorphicStyle}
    >
      {/* Profile Photo - overlapping the top */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
        <Avatar className="w-16 h-16 ring-4 ring-white/30">
          <AvatarImage 
            src={profile.profile_photo_url} 
            alt={profile.display_name || profile.username || 'User'} 
          />
          <AvatarFallback className="bg-white/20 text-white font-bold text-xl">
            {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Profile Info */}
      <div className="mt-4 space-y-2">
        <h2 className="text-2xl font-bold text-white">
          {profile.display_name || profile.username || 'User'}
        </h2>
        
        {profile.username && (
          <p className="text-white/80 text-lg">
            @{profile.username}
          </p>
        )}

        {profile.home_club && (
          <div className="flex items-center justify-center gap-2 text-white/70">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{profile.home_club}</span>
          </div>
        )}

        {/* Edit Profile Button */}
        {isOwnProfile && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassProfileCard;