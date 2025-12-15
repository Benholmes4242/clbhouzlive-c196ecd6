import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Building2 } from "lucide-react";

interface MentionSuggestion {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  type: 'user' | 'business';
}

interface MentionSuggestionsProps {
  query: string;
  onSelect: (mention: { id: string; name: string; username: string }) => void;
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
        // Search users
        const { data: users, error: usersError } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .eq('is_public', true)
          .limit(6);

        if (usersError) throw usersError;

        const formattedSuggestions: MentionSuggestion[] = (users || []).map(user => ({
          id: user.id,
          name: user.display_name || user.username || 'Unknown',
          username: user.username || '',
          avatar_url: user.profile_photo_url,
          type: 'user' as const
        }));

        setSuggestions(formattedSuggestions);
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
      className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
      style={{
        background: 'rgba(30, 30, 35, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
              onClick={() => onSelect(suggestion)}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {suggestion.avatar_url ? (
                  <img 
                    src={suggestion.avatar_url} 
                    alt={suggestion.name}
                    className="w-full h-full object-cover"
                  />
                ) : suggestion.type === 'business' ? (
                  <Building2 className="w-4 h-4 text-white/60" />
                ) : (
                  <User className="w-4 h-4 text-white/60" />
                )}
              </div>
              
              {/* Name & username */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {suggestion.name}
                </div>
                <div className="text-xs text-white/50 truncate">
                  @{suggestion.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
