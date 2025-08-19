
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, MapPin, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HomeClubSectionProps {
  homeClub: string;
  isOwnProfile: boolean;
  userId?: string;
  onProfileUpdate: () => void;
  userType?: string;
}

const HomeClubSection: React.FC<HomeClubSectionProps> = ({
  homeClub,
  isOwnProfile,
  userId,
  onProfileUpdate,
  userType
}) => {
  const [editingClub, setEditingClub] = useState(false);
  const [clubInput, setClubInput] = useState(homeClub || '');
  const [saving, setSaving] = useState(false);

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
  );
};

export default HomeClubSection;
