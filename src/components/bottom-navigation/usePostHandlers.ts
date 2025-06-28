
import { TaggableEntity } from './types';
import { usePostSubmission } from '@/hooks/usePostSubmission';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';

export const usePostHandlers = () => {
  const { submitPost } = usePostSubmission();
  const { entities, searchEntities } = useTaggableEntities();

  const handleCaptionInput = async (
    e: React.FormEvent<HTMLDivElement>,
    caption: string,
    setCaption: (caption: string) => void,
    cursorPosition: number,
    setCursorPosition: (pos: number) => void,
    setShowSuggestions: (show: boolean) => void,
    setMentionSuggestions: (suggestions: TaggableEntity[]) => void
  ) => {
    const target = e.target as HTMLDivElement;
    const text = target.innerText;
    setCaption(text);

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setCursorPosition(selection.getRangeAt(0).startOffset);
    }

    const words = text.split(/(\s+)/);
    let currentPosition = 0;
    let mentionWord = '';
    
    for (const word of words) {
      if (currentPosition <= cursorPosition && cursorPosition <= currentPosition + word.length) {
        if (word.startsWith('@') && word.length > 1) {
          mentionWord = word;
          break;
        }
      }
      currentPosition += word.length;
    }

    if (mentionWord && mentionWord.length > 1) {
      const query = mentionWord.slice(1);
      await searchEntities(query);
      
      const uniqueEntities = entities.reduce((acc, entity) => {
        const identifier = `${entity.entity_type}-${entity.entity_id}-${entity.username || entity.name}`;
        if (!acc.find(item => 
          `${item.entity_type}-${item.entity_id}-${item.username || item.name}` === identifier
        )) {
          acc.push(entity);
        }
        return acc;
      }, [] as TaggableEntity[]);
      
      setMentionSuggestions(uniqueEntities);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setMentionSuggestions([]);
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
    const displayName = entity.username || entity.name;
    
    if (!selectedTags.find(tag => tag.id === entity.id)) {
      const newTags = [...selectedTags, entity];
      setSelectedTags(newTags);
    }

    const words = caption.split(/(\s+)/);
    let currentPosition = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (currentPosition <= cursorPosition && cursorPosition <= currentPosition + word.length) {
        if (word.startsWith('@')) {
          words[i] = `@${displayName}`;
          break;
        }
      }
      currentPosition += word.length;
    }
    
    const newCaption = words.join('');
    setCaption(newCaption);
    
    if (captionInputRef.current) {
      captionInputRef.current.innerText = newCaption;
    }

    setShowSuggestions(false);
    setMentionSuggestions([]);
  };

  const handleSubmitPost = async (
    selectedFile: File | null,
    user: any,
    caption: string,
    selectedTags: TaggableEntity[],
    closeModal: () => void,
    setIsSubmitting: (submitting: boolean) => void
  ) => {
    if (!selectedFile || !user) return;

    setIsSubmitting(true);
    
    try {
      await submitPost({
        user,
        content: caption,
        mediaFiles: [selectedFile],
        selectedTags,
        onSuccess: () => {
          closeModal();
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error submitting post:', error);
      setIsSubmitting(false);
    }
  };

  return {
    handleCaptionInput,
    selectMention,
    handleSubmitPost
  };
};
