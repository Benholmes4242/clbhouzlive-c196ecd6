import React from 'react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  username: string;
  homeClub: string;
  avatar: string;
  coverImage: string;
  handicap: number;
  postsCount: number;
  ratedCoursesCount: number;
  averageRating: number;
}

interface ProfileHeaderRedesignProps {
  user: User;
  isOwnProfile: boolean;
}

const ProfileHeaderRedesign: React.FC<ProfileHeaderRedesignProps> = ({ user, isOwnProfile }) => {
  return (
    <div className="relative w-full h-80 md:h-96 overflow-hidden">
      {/* Cover Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${user.coverImage})`,
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />
      </div>
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="flex items-end justify-between">
          {/* Left: Profile Info */}
          <div className="flex items-end space-x-4">
            {/* Profile Image */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                }}
              />
            </div>
            
            {/* Text Info */}
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user.name}
              </h1>
              <p className="text-white/80 text-sm mb-1">
                @{user.username}
              </p>
              <p className="text-white/70 text-sm">
                {user.homeClub}
              </p>
            </div>
          </div>
          
          {/* Right: Edit Profile Button */}
          {isOwnProfile && (
            <Button
              variant="outline"
              className="bg-black/30 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderRedesign;