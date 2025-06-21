
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Calendar } from 'lucide-react';
import ProfileEditDialog from './ProfileEditDialog';
import FollowerStats from './FollowerStats';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface ProfileInfoProps {
  profile: any;
  userEmail?: string;
  userId?: string;
  onProfileUpdate: () => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  userEmail,
  userId,
  onProfileUpdate
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;

  if (!profile && !userEmail) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profile information available</p>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.username || userEmail?.split('@')[0] || 'User';
  const username = profile?.username ? `@${profile.username}` : '';
  const bio = profile?.bio || '';
  const homeClub = profile?.home_club || '';
  const joinedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{displayName}</h1>
        {username && (
          <p className="text-muted-foreground text-lg">{username}</p>
        )}
        {bio && (
          <p className="text-sm max-w-md mx-auto">{bio}</p>
        )}
        
        <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
          {homeClub && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{homeClub}</span>
            </div>
          )}
          {joinedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {joinedDate}</span>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="mt-2"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Show follower stats for all profiles */}
      {profile?.id && (
        <FollowerStats userId={profile.id} />
      )}

      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        profile={profile}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
};

export default ProfileInfo;
