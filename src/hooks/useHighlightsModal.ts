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
    if (highlightPostId && highlights.length > 0) {
      const highlight = highlights.find(h => h.id === highlightPostId);
      if (highlight) {
        openModal(highlight.id);
      }
    }
  }, [searchParams, highlights.length, highlights]);

  const openModal = useCallback((postId: string) => {
    const highlight = highlights.find(h => h.id === postId);
    if (!highlight) return;

    setCurrentHighlight(highlight);
    setIsOpen(true);
    
    // Add URL param for deep linking
    const newParams = new URLSearchParams(searchParams);
    newParams.set('highlightPost', postId);
    setSearchParams(newParams, { replace: true });
  }, [highlights, searchParams, setSearchParams]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setCurrentHighlight(null);
    
    // Remove URL param
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('highlightPost');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    isOpen,
    currentHighlight,
    openModal,
    closeModal
  };
};