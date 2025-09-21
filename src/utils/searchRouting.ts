/**
 * Search routing utilities for consistent navigation from search results
 */

import { NavigateFunction } from 'react-router-dom';

export interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  slug?: string;
}

export class SearchRouter {
  constructor(private navigate: NavigateFunction) {}

  /**
   * Navigate to the appropriate route based on search result type
   */
  navigateToResult(result: SearchResult) {
    switch (result.type) {
      case 'user':
        // Navigate to user profile using username if available, otherwise use ID
        const userPath = result.username ? `/profile/${result.username}` : `/profile/${result.id}`;
        this.navigate(userPath);
        break;
        
      case 'course':
        // Navigate to course detail page using slug if available, otherwise use ID
        const coursePath = result.slug ? `/courses/${result.slug}` : `/courses/${result.id}`;
        this.navigate(coursePath);
        break;
        
      default:
        console.warn('Unknown search result type:', result.type);
        break;
    }
  }

  /**
   * Get the URL for a search result without navigating
   */
  getResultUrl(result: SearchResult): string {
    switch (result.type) {
      case 'user':
        return result.username ? `/profile/${result.username}` : `/profile/${result.id}`;
      case 'course':
        return result.slug ? `/courses/${result.slug}` : `/courses/${result.id}`;
      default:
        return '/';
    }
  }
}

/**
 * Create a search router instance
 */
export const createSearchRouter = (navigate: NavigateFunction) => {
  return new SearchRouter(navigate);
};