
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

const MentionSuggestions = ({ suggestions, onSelect, isVisible }: MentionSuggestionsProps) => {
  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto z-50 mt-1">
      {suggestions.map((entity) => (
        <div
          key={entity.id}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
          onClick={() => onSelect(entity)}
        >
          <div className="flex flex-col">
            <span className="font-medium">@{entity.username || entity.name}</span>
            <span className="text-xs text-gray-500 capitalize">{entity.entity_type}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionSuggestions;
