/**
 * Search analytics utilities for tracking user search behavior
 */

export interface SearchAnalyticsEvent {
  search_opened?: { source: string };
  search_query_changed?: { query: string; query_length: number };
  search_result_selected?: { type: string; id: string; position: number; query: string };
  search_no_results?: { query: string };
  search_recent_clicked?: { query: string; position: number };
}

class SearchAnalytics {
  private isEnabled = true;

  // Log search analytics events
  private log(eventName: keyof SearchAnalyticsEvent, data: any) {
    if (!this.isEnabled) return;
    
    try {
      console.log('Search Analytics:', eventName, data);
      
      // Here you could integrate with analytics services like:
      // - Google Analytics
      // - Mixpanel
      // - PostHog
      // - Custom analytics endpoint
      
      // Example with a hypothetical analytics service:
      // analytics.track(eventName, { ...data, timestamp: Date.now() });
    } catch (error) {
      console.warn('Failed to log search analytics:', error);
    }
  }

  searchOpened(source: string = 'header') {
    this.log('search_opened', { source });
  }

  searchQueryChanged(query: string) {
    this.log('search_query_changed', { 
      query, 
      query_length: query.length 
    });
  }

  searchResultSelected(type: string, id: string, position: number, query: string) {
    this.log('search_result_selected', { 
      type, 
      id, 
      position, 
      query 
    });
  }

  searchNoResults(query: string) {
    this.log('search_no_results', { query });
  }

  searchRecentClicked(query: string, position: number) {
    this.log('search_recent_clicked', { 
      query, 
      position 
    });
  }

  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }
}

export const searchAnalytics = new SearchAnalytics();