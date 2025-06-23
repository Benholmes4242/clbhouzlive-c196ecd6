

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, MapPin, Check, X, Building, Phone, Globe } from 'lucide-react';
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

  const userType = profile?.user_type || 'individual';
  const isIndividual = userType === 'individual';
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
        {/* Add more spacing for business profiles */}
        <div className={isIndividual ? "mt-0" : "mt-6"}>
          <h1 className="text-2xl font-bold">{displayName}</h1>
        </div>
        
        {/* Only show username for individual users */}
        {isIndividual && username && (
          <p className="text-muted-foreground text-lg">{username}</p>
        )}
        
        {/* Show follower stats under name for non-individual users */}
        {!isIndividual && profile?.id && (
          <FollowerStats userId={profile.id} userType={userType} />
        )}
        
        {/* Bio - Only show for individual users here */}
        {isIndividual && bio && (
          <p className="text-sm max-w-md mx-auto">{bio}</p>
        )}
        
        {/* Home Club - Only show for individual users */}
        {isIndividual && (homeClub || isOwnProfile) && (
          <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
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
          </div>
        )}

        {/* Business Information Section - Only show for non-individual users */}
        {!isIndividual && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-3">Business Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {profile?.business_name && (
                <div className="flex items-center justify-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{profile.business_name}</span>
                </div>
              )}
              {profile?.phone && (
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.website_url && (
                <div className="flex items-center justify-center gap-2">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={profile.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.website_url}
                  </a>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {/* About Us section for business profiles */}
              {bio && (
                <div className="mt-4">
                  <h4 className="text-base font-semibold mb-2 text-foreground">About Us</h4>
                  <p className="text-sm max-w-md mx-auto text-center">{bio}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Show follower stats for individual profiles only */}
      {isIndividual && profile?.id && (
        <FollowerStats userId={profile.id} userType={userType} />
      )}
    </div>
  );
};

export default ProfileInfo;

