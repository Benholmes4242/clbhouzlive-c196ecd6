// Discover page analytics utilities

export const discoverAnalytics = {
  suggestedImpression: (visiblePercentage: number) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discover_suggested_impression', {
        event_category: 'discover',
        visible_percentage: visiblePercentage,
        timestamp: Date.now()
      });
    }
  },

  suggestedInteraction: (action: 'follow' | 'dismiss' | 'details', userId: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discover_suggested_interaction', {
        event_category: 'discover',
        action,
        user_id: userId,
        timestamp: Date.now()
      });
    }
  },

  dividerSearchUsed: (queryLength: number, acceptedSuggestion: boolean) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discover_divider_search_used', {
        event_category: 'discover',
        query_length: queryLength,
        accepted_suggestion: acceptedSuggestion,
        timestamp: Date.now()
      });
    }
  },

  filterChanged: (mainPill: string, previousPill?: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discover_filter_changed', {
        event_category: 'discover',
        main_pill: mainPill,
        previous_pill: previousPill,
        timestamp: Date.now()
      });
    }
  },

  hashtagClicked: (tag: string, isSelected: boolean) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'discover_hashtag_clicked', {
        event_category: 'discover',
        tag,
        action: isSelected ? 'selected' : 'deselected',
        timestamp: Date.now()
      });
    }
  }
};