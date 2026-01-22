// MentionBottomSheet - Touch-friendly bottom sheet for @mentions
// Matches wizard design language with subtle borders and proper mobile UX

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Building2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
}

export function MentionBottomSheet({ 
  open, 
  onOpenChange, 
  query, 
  onSelect 
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-2xl max-h-[50vh] px-4 pb-safe bg-white border-t border-border/40"
      >
        {/* Handle bar */}
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />
        
        {/* Search context */}
        <p className="text-sm text-muted-foreground mb-3">
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
          <div className="space-y-2 overflow-y-auto max-h-[35vh] pb-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => {
                  onSelect(suggestion);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-3 
                  bg-white border border-border/40 rounded-xl
                  hover:bg-muted/30 active:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <SquircleAvatar
                  src={suggestion.avatar_url}
                  alt={suggestion.name}
                  size="sm"
                  fallback={suggestion.name.charAt(0).toUpperCase()}
                  hideRing
                />
                
                {/* Name & username */}
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{suggestion.username || suggestion.name}
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
      </SheetContent>
    </Sheet>
  );
}

export default MentionBottomSheet;
