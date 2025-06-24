
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
  content: string;
  onContentChange: (content: string) => void;
  onTagsChange: (tags: TaggableEntity[]) => void;
}

const TagInput = ({ content, onContentChange, onTagsChange }: TagInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [caretPosition, setCaretPosition] = useState(0);
  const [selectedTags, setSelectedTags] = useState<TaggableEntity[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onContentChange(newContent);
    setCaretPosition(cursorPos);

    // Check if user is typing a tag
    const beforeCursor = newContent.substring(0, cursorPos);
    const tagMatch = beforeCursor.match(/@(\w*)$/);
    
    if (tagMatch) {
      const query = tagMatch[1];
      setCurrentQuery(query);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setCurrentQuery('');
    }
  };

  const handleTagSelect = (entity: TaggableEntity) => {
    const beforeCursor = content.substring(0, caretPosition);
    const afterCursor = content.substring(caretPosition);
    const tagMatch = beforeCursor.match(/@(\w*)$/);
    
    if (tagMatch) {
      const tagStart = beforeCursor.lastIndexOf('@');
      const newContent = 
        content.substring(0, tagStart) + 
        `@${entity.username || entity.name} ` + 
        afterCursor;
      
      onContentChange(newContent);
      setSelectedTags(prev => [...prev.filter(t => t.id !== entity.id), entity]);
      onTagsChange([...selectedTags.filter(t => t.id !== entity.id), entity]);
      setShowSuggestions(false);
      
      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = tagStart + `@${entity.username || entity.name} `.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
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
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="What's on your mind? Use @ to tag people, golf clubs, or businesses..."
        className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
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
  );
};

export default TagInput;
