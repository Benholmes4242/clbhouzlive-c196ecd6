
export const usePostHandlers = () => {
  const handleCaptionInput = (
    e: React.FormEvent<HTMLDivElement>,
    caption: string,
    setCaption: (caption: string) => void,
    cursorPosition: number,
    setCursorPosition: (position: number) => void,
    setShowSuggestions: (show: boolean) => void,
    setMentionSuggestions: (suggestions: any[]) => void
  ) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    setCaption(text);
    
    // Handle mention detection logic here
    const mentionRegex = /@(\w+)$/;
    const words = text.split(' ');
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setShowSuggestions(true);
      // You can add logic to fetch mention suggestions here
    } else {
      setShowSuggestions(false);
    }
  };

  const selectMention = (
    entity: any,
    caption: string,
    setCaption: (caption: string) => void,
    cursorPosition: number,
    selectedTags: any[],
    setSelectedTags: (tags: any[]) => void,
    captionInputRef: React.RefObject<HTMLDivElement>,
    setShowSuggestions: (show: boolean) => void,
    setMentionSuggestions: (suggestions: any[]) => void
  ) => {
    // Handle mention selection logic
    const words = caption.split(' ');
    const lastWordIndex = words.length - 1;
    
    if (words[lastWordIndex].startsWith('@')) {
      const displayName = entity.username || entity.name;
      words[lastWordIndex] = `@${displayName}`;
      const newCaption = words.join(' ') + ' ';
      
      if (captionInputRef.current) {
        captionInputRef.current.textContent = newCaption;
        setCaption(newCaption);
      }
      
      setSelectedTags([...selectedTags, entity]);
    }
    
    setShowSuggestions(false);
  };

  return {
    handleCaptionInput,
    selectMention
  };
};
