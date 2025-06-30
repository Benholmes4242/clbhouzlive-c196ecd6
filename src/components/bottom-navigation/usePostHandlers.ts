
import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export const usePostHandlers = () => {
  const handleCaptionInput = (
    e: React.FormEvent<HTMLDivElement>,
    caption: string,
    setCaption: (caption: string) => void,
    cursorPosition: number,
    setCursorPosition: (position: number) => void,
    setShowSuggestions: (show: boolean) => void,
    setMentionSuggestions: (suggestions: TaggableEntity[]) => void
  ) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    setCaption(text);

    // Get cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setCursorPosition(range.startOffset);
    }

    // Check for mentions
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setShowSuggestions(true);
      // Here you would typically fetch mention suggestions
    } else {
      setShowSuggestions(false);
    }
  };

  const selectMention = (
    entity: TaggableEntity,
    caption: string,
    setCaption: (caption: string) => void,
    cursorPosition: number,
    selectedTags: TaggableEntity[],
    setSelectedTags: (tags: TaggableEntity[]) => void,
    captionInputRef: React.RefObject<HTMLDivElement>,
    setShowSuggestions: (show: boolean) => void,
    setMentionSuggestions: (suggestions: TaggableEntity[]) => void
  ) => {
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    
    if (words[lastWordIndex].startsWith('@')) {
      words[lastWordIndex] = `@${entity.username || entity.name}`;
      const newCaption = words.join(' ') + ' ';
      setCaption(newCaption);
      
      // Add to selected tags if not already present
      if (!selectedTags.find(tag => tag.id === entity.id)) {
        setSelectedTags([...selectedTags, entity]);
      }
    }
    
    setShowSuggestions(false);
    setMentionSuggestions([]);
    
    // Focus back to input
    if (captionInputRef.current) {
      captionInputRef.current.focus();
    }
  };

  return {
    handleCaptionInput,
    selectMention
  };
};
