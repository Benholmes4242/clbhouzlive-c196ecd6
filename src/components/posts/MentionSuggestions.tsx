
import React from 'react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface MentionSuggestionsProps {
  suggestions: TaggableEntity[];
  onSelect: (entity: TaggableEntity) => void;
  isVisible: boolean;
}

// Human-readable labels for entity types
const getEntityTypeLabel = (type: string): string => {
  switch (type) {
    case 'user':
      return 'Person';
    case 'business':
      return 'Business';
    case 'golf_club':
      return 'Course listing';
    default:
      return type;
  }
};

const MentionSuggestions = ({ suggestions, onSelect, isVisible }: MentionSuggestionsProps) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-sq-sm shadow-lg max-h-48 overflow-y-auto z-50 mt-1">
      {suggestions.map((entity) => (
        <div
          key={entity.id}
          className="px-3 py-2.5 hover:bg-muted cursor-pointer flex items-center gap-3"
          onClick={() => onSelect(entity)}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">@{entity.username || entity.name}</span>
            <span className="text-xs text-muted-foreground">{getEntityTypeLabel(entity.entity_type)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionSuggestions;
