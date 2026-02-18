// MentionBottomSheet - Touch-friendly bottom sheet for @mentions
// Uses simple positioned div instead of Sheet to avoid focus stealing

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User } from "lucide-react";
import { SquircleAvatar } from "@/components/ui/SquircleAvatar";

export interface MentionSuggestion {
  id: string;
  entity_id: string;
  entity_type: 'user' | 'business';
  name: string;
  username: string | null;
  avatar_url?: string;
}

interface MentionBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onSelect: (mention: MentionSuggestion) => void;
  zIndex?: number;       // Optional override for stacking contexts (e.g. inside portals)
  bottomOffset?: number; // Pixels to lift the sheet above the bottom (e.g. above input bar)
}

export function MentionBottomSheet({ 
  open, 
  onOpenChange, 
  query, 
  onSelect,
  zIndex,
  bottomOffset = 0,
}: MentionBottomSheetProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 1) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data: entities, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, profile_image_url')
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .in('entity_type', ['user', 'business'])
          .limit(8);

        if (error) throw error;

        const results: MentionSuggestion[] = (entities || []).map(entity => ({
          id: entity.id,
          entity_id: entity.entity_id,
          entity_type: entity.entity_type as 'user' | 'business',
          name: entity.name || 'Unknown',
          username: entity.username,
          avatar_url: entity.profile_image_url || undefined,
        }));

        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching mention suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      const debounceTimer = setTimeout(fetchSuggestions, 200);
      return () => clearTimeout(debounceTimer);
    }
  }, [query, open]);

  if (!open) return null;

  const resolvedZ = zIndex ?? 50;

  return (
    /*
     * Outer wrapper: fixed full-viewport at resolvedZ, anchored at bottomOffset.
     * Taps on the wrapper itself (i.e. outside the sheet panel) close the sheet.
     * Taps on the sheet panel bubble normally — stopPropagation on the inner div
     * prevents them from reaching the wrapper's onClick.
     */
    <div
      className="fixed inset-0"
      style={{ zIndex: resolvedZ, bottom: bottomOffset }}
      onClick={(e) => {
        // Only close if the tap landed directly on this wrapper, not on a child
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      {/* Sheet panel — stopPropagation so taps here don't trigger the wrapper's close */}
      <div
        className="absolute inset-x-0 bottom-0 bg-background rounded-t-2xl
          shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-border/40
          max-h-[50vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />

        {/* Search context */}
        <p className="text-sm text-muted-foreground px-4 mb-3">
          {query ? `Searching for "@${query}"` : 'Type to search people and businesses'}
        </p>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && suggestions.length === 0 && query.length > 0 && (
          <div className="text-center py-8">
            <User className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No results for "@{query}"</p>
          </div>
        )}

        {/* Results list */}
        {!isLoading && suggestions.length > 0 && (
          <div className="px-4 pb-4 space-y-2 overflow-y-auto max-h-[calc(50vh-80px)]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(e) => {
                  // Prevent input blur on desktop without killing click synthesis
                  e.preventDefault();
                }}
                onTouchEnd={(e) => {
                  // Primary tap handler for iOS WKWebView.
                  // preventDefault here cancels ghost mouse events — does NOT suppress click.
                  e.preventDefault();
                  onSelect(suggestion);
                  onOpenChange(false);
                }}
                onClick={() => {
                  // Desktop / non-touch fallback
                  onSelect(suggestion);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-3
                  bg-muted/20 border border-border/40 rounded-xl
                  hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
              >
                {/* Avatar */}
                <SquircleAvatar
                  src={suggestion.avatar_url}
                  alt={suggestion.name}
                  size="sm"
                  fallback={suggestion.name.charAt(0).toUpperCase()}
                  hideRing
                />

                {/* Name & username — show the slug that will actually be inserted */}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{(suggestion.username || suggestion.name)
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^\w]/g, '')}
                  </p>
                </div>

                {/* Entity type badge */}
                {suggestion.entity_type === 'business' && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                    Business
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MentionBottomSheet;
