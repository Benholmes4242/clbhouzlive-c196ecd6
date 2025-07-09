
import React, { useState, useRef, useEffect } from 'react';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building, MapPin, Plus } from 'lucide-react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface TagInputProps {
  onTagsChange: (tags: TaggableEntity[]) => void;
  selectedTags: TaggableEntity[];
}

const TagInput = ({ onTagsChange, selectedTags }: TagInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const { entities, loading, searchEntities, createGolfClubEntity, createBusinessEntity } = useTaggableEntities();
  
  // Debounce the current query to reduce API calls
  const debouncedQuery = useDebounce(currentQuery, 300);

  // Search entities when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchEntities(debouncedQuery);
    }
  }, [debouncedQuery, searchEntities]);

  // Deduplicate entities by entity_id and username/name combination
  const uniqueEntities = entities.reduce((acc, entity) => {
    const identifier = `${entity.entity_type}-${entity.entity_id}-${entity.username || entity.name}`;
    if (!acc.find(item => 
      `${item.entity_type}-${item.entity_id}-${item.username || item.name}` === identifier
    )) {
      acc.push(entity);
    }
    return acc;
  }, [] as TaggableEntity[]);

  const handleTagSelect = (entity: TaggableEntity) => {
    const newTags = [...selectedTags.filter(t => t.id !== entity.id), entity];
    onTagsChange(newTags);
    setShowSuggestions(false);
    setCurrentQuery('');
  };

  const handleCreateNew = async (type: 'golf_club' | 'business') => {
    let entity;
    if (type === 'golf_club') {
      entity = await createGolfClubEntity(currentQuery);
    } else {
      entity = await createBusinessEntity(currentQuery);
    }
    
    if (entity) {
      handleTagSelect(entity);
    }
  };

  const handleRemoveTag = (tagToRemove: TaggableEntity) => {
    const newTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
    onTagsChange(newTags);
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'golf_club':
        return <MapPin className="h-4 w-4" />;
      case 'business':
        return <Building className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
            >
              {getEntityIcon(tag.entity_type)}
              <span>@{tag.username || tag.name}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={currentQuery}
          onChange={(e) => {
            setCurrentQuery(e.target.value);
            setShowSuggestions(e.target.value.length >= 2);
          }}
          placeholder="Type to search people, golf clubs, or businesses..."
          className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {showSuggestions && (
          <Card className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto">
            <div className="p-2">
              {loading ? (
                <div className="p-2 text-sm text-muted-foreground">Searching...</div>
              ) : (
                <>
                  {uniqueEntities.map((entity) => (
                    <Button
                      key={entity.id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto"
                      onClick={() => handleTagSelect(entity)}
                    >
                      <div className="flex items-center space-x-2">
                        {getEntityIcon(entity.entity_type)}
                        <div className="text-left">
                          <div className="font-medium">{entity.name}</div>
                          {entity.username && (
                            <div className="text-xs text-muted-foreground">@{entity.username}</div>
                          )}
                          <div className="text-xs text-muted-foreground capitalize">
                            {entity.entity_type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                  
                  {currentQuery.length >= 2 && uniqueEntities.length === 0 && !loading && (
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto"
                        onClick={() => handleCreateNew('golf_club')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Add "{currentQuery}" as Golf Club</div>
                          <div className="text-xs text-muted-foreground">Create new golf club</div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto"
                        onClick={() => handleCreateNew('business')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        <div className="text-left">
                          <div className="font-medium">Add "{currentQuery}" as Business</div>
                          <div className="text-xs text-muted-foreground">Create new business</div>
                        </div>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TagInput;
