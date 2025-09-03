import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface HighlightData {
  id: string;
  content: string | null;
  created_at: string;
  post_media: {
    id: string;
    media_type: string;
    media_url: string;
  }[];
  golf_course: {
    id: string;
    name: string;
    country: string;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
  };
}

interface UseHighlightsModalProps {
  highlights: HighlightData[];
  userId: string;
}

export const useHighlightsModal = ({ highlights, userId }: UseHighlightsModalProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState<HighlightData | null>(null);

  // Check for URL param on mount and param changes
  useEffect(() => {
    const highlightPostId = searchParams.get('highlightPost');
    if (highlightPostId && highlights.length > 0 && !isOpen) {
      const highlight = highlights.find(h => h.id === highlightPostId);
      if (highlight && highlight.id !== currentHighlight?.id) {
        setCurrentHighlight(highlight);
        setIsOpen(true);
      }
    }
  }, [searchParams, highlights.length, isOpen]);

  const openModal = useCallback((postId: string) => {
    const highlight = highlights.find(h => h.id === postId);
    if (!highlight) return;

    setCurrentHighlight(highlight);
    setIsOpen(true);
    
    // Add URL param for deep linking
    const newParams = new URLSearchParams(searchParams);
    newParams.set('highlightPost', postId);
    setSearchParams(newParams, { replace: true });
  }, [highlights, setSearchParams]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentHighlight(null);
    
    // Remove URL param
    const newParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'highlightPost') {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    isOpen,
    currentHighlight,
    openModal,
    closeModal
  };
};