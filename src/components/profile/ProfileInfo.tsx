
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, MapPin, Check, X } from 'lucide-react';
import FollowerStats from './FollowerStats';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useSupabaseSession();
  const isOwnProfile = user?.id === profile?.id;
  const [editingClub, setEditingClub] = useState(false);
  const [clubInput, setClubInput] = useState(profile?.home_club || '');
  const [saving, setSaving] = useState(false);

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

  const handleEditClub = () => {
    setEditingClub(true);
    setClubInput(homeClub);
  };

  const handleSaveClub = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const updateData: any = { 
        home_club: clubInput.trim() === '' || clubInput.toLowerCase() === 'not applicable' ? null : clubInput.trim()
      };
      
      await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);
      
      setEditingClub(false);
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating home club:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingClub(false);
    setClubInput(homeClub);
  };

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
        
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          {(homeClub || isOwnProfile) && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {editingClub ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={clubInput}
                      onChange={(e) => setClubInput(e.target.value)}
                      placeholder="Enter home club or 'Not applicable'"
                      className="h-8 text-sm w-48"
                      disabled={saving}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveClub}
                      disabled={saving}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{homeClub || 'No home club set'}</span>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEditClub}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show follower stats for all profiles */}
      {profile?.id && (
        <FollowerStats userId={profile.id} />
      )}
    </div>
  );
};

export default ProfileInfo;
