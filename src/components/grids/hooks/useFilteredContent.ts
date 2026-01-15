/**
 * useFilteredContent - Filters posts by content type
 * Handles long-form (≥4 min), shorts (<4 min), and images
 */

import { useMemo } from 'react';
import { ContentFilter, GridPost } from '../types';

// 4 minutes in seconds - boundary between shorts and long-form
const LONG_FORM_THRESHOLD = 240;

export function useFilteredContent(posts: GridPost[], filter: ContentFilter): GridPost[] {
  return useMemo(() => {
    if (filter === 'all') return posts;
    
    return posts.filter(post => {
      const media = post.post_media?.[0];
      if (!media) return false;
      
      switch (filter) {
        case 'longform':
          return (
            media.media_type === 'video' &&
            media.duration_seconds != null &&
            media.duration_seconds >= LONG_FORM_THRESHOLD
          );
        
        case 'shorts':
          return (
            media.media_type === 'video' &&
            media.duration_seconds != null &&
            media.duration_seconds > 0 &&
            media.duration_seconds < LONG_FORM_THRESHOLD
          );
        
        case 'images':
          return media.media_type === 'image';
        
        default:
          return true;
      }
    });
  }, [posts, filter]);
}
