
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X, Trophy, MapPin, Users } from 'lucide-react';

interface ProfileStatusSectionProps {
  statusTagline?: string | null;
  badges: Array<{
    id: string;
    type: 'club_member' | 'top100_player' | 'low_handicap' | 'achievement';
    label: string;
    icon: React.ReactNode;
  }>;
  isOwnProfile: boolean;
  onStatusUpdate: (status: string) => void;
}

const ProfileStatusSection: React.FC<ProfileStatusSectionProps> = ({
  statusTagline,
  badges,
  isOwnProfile,
  onStatusUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(statusTagline || '');

  const handleSave = () => {
    onStatusUpdate(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(statusTagline || '');
    setIsEditing(false);
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Status/Tagline */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Links lover | 5 handicap | Playing 50 before 50"
              className="flex-1"
              maxLength={100}
            />
            <Button size="sm" onClick={handleSave} disabled={!editValue.trim()}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <p className="text-gray-600 italic">
              {statusTagline || (isOwnProfile ? 'Add a status to tell your golf story...' : '')}
            </p>
            {isOwnProfile && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsEditing(true)}
                className="text-[#b66b41] hover:text-[#9a5a37]"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge 
              key={badge.id} 
              variant="secondary" 
              className="bg-[#b66b41]/10 text-[#b66b41] border-[#b66b41]/20 hover:bg-[#b66b41]/20 transition-colors"
            >
              {badge.icon}
              <span className="ml-1">{badge.label}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileStatusSection;
