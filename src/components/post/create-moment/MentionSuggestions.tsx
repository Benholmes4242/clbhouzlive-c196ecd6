import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Building2 } from "lucide-react";

interface MentionSuggestion {
  id: string;  // taggable_entities.id for consistent post_tags insertion
  entity_id: string;  // the underlying entity (user_id or business_id)
  entity_type: 'user' | 'business';
  name: string;
  username: string | null;
  avatar_url?: string;
}

interface MentionSuggestionsProps {
  query: string;
  onSelect: (mention: MentionSuggestion) => void;
  onClose: () => void;
}

export default function MentionSuggestions({ query, onSelect, onClose }: MentionSuggestionsProps) {
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
        // Search from taggable_entities to get correct IDs for post_tags
        const { data: entities, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, profile_image_url')
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .in('entity_type', ['user', 'business'])
          .limit(8);

        if (error) throw error;

        const suggestions: MentionSuggestion[] = (entities || []).map(entity => ({
          id: entity.id,  // taggable_entities.id - this is what post_tags needs
          entity_id: entity.entity_id,
          entity_type: entity.entity_type as 'user' | 'business',
          name: entity.name || 'Unknown',
          username: entity.username,
          avatar_url: entity.profile_image_url || undefined,
        }));

        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching mention suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div 
      className="rounded-xl overflow-hidden z-50 bg-white border border-border/60 shadow-lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover:bg-muted/50"
              onClick={() => onSelect(suggestion)}
            >
              {/* Avatar */}
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-muted"
              >
                {suggestion.avatar_url ? (
                  <img 
                    src={suggestion.avatar_url} 
                    alt={suggestion.name}
                    className="w-full h-full object-cover"
                  />
                ) : suggestion.entity_type === 'business' ? (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              {/* Name & username */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">
                  {suggestion.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  @{suggestion.username || suggestion.name}
                </div>
              </div>

              {/* Entity type badge */}
              {suggestion.entity_type === 'business' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Business
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
