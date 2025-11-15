import React from 'react';
import { Squircle } from '@/components/ui/squircle';
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

  // Limit to 6 suggestions maximum
  const limitedEntities = entities.slice(0, 6);

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 mt-1">
      {loading ? (
        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Searching...
        </div>
      ) : limitedEntities.length === 0 ? (
        <div className="px-4 py-3 text-sm text-gray-500">
          No users, clubs, or businesses found
        </div>
      ) : (
        <>
          {limitedEntities.map((entity, index) => (
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
                <Squircle width={56} height={56}>
                  {entity.profile_image_url ? (
                    <img src={entity.profile_image_url} alt={entity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
                      {entity.name.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getEntityIcon(entity.entity_type)}
                      </div>
                    </div>
                  )}
                </Squircle>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate text-sm">
                    {getDisplayName(entity)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {getSubtitle(entity)}
                </div>
              </div>
            </div>
          ))}
          {entities.length > 6 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
              {entities.length - 6} more results...
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TagAutocomplete;