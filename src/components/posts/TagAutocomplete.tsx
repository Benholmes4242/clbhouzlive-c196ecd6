import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, MapPin, User } from 'lucide-react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  profile_image_url?: string | null;
}

interface TagAutocompleteProps {
  entities: TaggableEntity[];
  isVisible: boolean;
  onSelect: (entity: TaggableEntity) => void;
  selectedIndex: number;
  loading?: boolean;
}

const TagAutocomplete: React.FC<TagAutocompleteProps> = ({
  entities,
  isVisible,
  onSelect,
  selectedIndex,
  loading = false
}) => {
  if (!isVisible) return null;

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'user':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'golf_club':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'business':
        return <Building2 className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'user':
        return 'User';
      case 'golf_club':
        return 'Golf Club';
      case 'business':
        return 'Business';
      default:
        return 'Entity';
    }
  };

  const getDisplayName = (entity: TaggableEntity) => {
    return entity.name;
  };

  const getSubtitle = (entity: TaggableEntity) => {
    if (entity.username) {
      return `@${entity.username} • ${getEntityTypeLabel(entity.entity_type)}`;
    }
    return getEntityTypeLabel(entity.entity_type);
  };

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
      {loading ? (
        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Searching...
        </div>
      ) : entities.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">
          No users, clubs, or businesses found
        </div>
      ) : (
        entities.map((entity, index) => (
          <div
            key={`${entity.entity_type}-${entity.entity_id}`}
            className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
              index === selectedIndex
                ? 'bg-blue-50 border-l-2 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelect(entity)}
            onMouseDown={(e) => e.preventDefault()} // Prevent input blur
          >
            <div className="flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={entity.profile_image_url || ''} 
                  alt={entity.name}
                />
                <AvatarFallback className="text-xs">
                  {getEntityIcon(entity.entity_type)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">
                  {getDisplayName(entity)}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {getSubtitle(entity)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TagAutocomplete;